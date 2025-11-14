"use server";

import { getSession } from "auth/server";
import { getKnowledgeBase } from "./actions";
import {
  DocumentStorageOperations,
  type ChunkingConfig,
} from "lib/knowledge/document-processor";
import { pgDb } from "lib/db/pg/db.pg";
import { knowledgeBase } from "lib/db/pg/schema.pg";
import { eq } from "drizzle-orm";
import * as cheerio from "cheerio";

/* ============================================================================
   Helper Types
============================================================================ */
type UploadLinksResult = {
  success: boolean;
  results?: any[];
  skipped?: Array<{ url: string; reason: string }>;
  error?: string;
};

type FileLikeShim = {
  name: string;
  type: string;
  size: number;
  arrayBuffer: () => Promise<ArrayBuffer>;
};

/* ============================================================================
   Basic Helpers
============================================================================ */
function bufferToArrayBuffer(buf: Buffer): ArrayBuffer {
  const ab = new ArrayBuffer(buf.length);
  new Uint8Array(ab).set(buf);
  return ab;
}

function toFileLike(
  buf: Buffer,
  filename: string,
  mime: string
): File | FileLikeShim {
  const HasFile = typeof File !== "undefined";
  if (HasFile) {
    // @ts-ignore
    return new File([buf], filename, { type: mime });
  }
  return {
    name: filename,
    type: mime,
    size: buf.length,
    arrayBuffer: async () => bufferToArrayBuffer(buf),
  };
}

function sanitizeFilenamePart(s: string) {
  return s.replace(/[^a-z0-9\-\._]+/gi, "_").slice(0, 80);
}

/**
 * Build a deterministic filename from a URL.
 * If `ext` is provided, it is used.
 * If not, we try to infer an extension from the URL; fallback ".txt".
 */
function buildFilenameFromUrl(url: string, ext?: string) {
  try {
    const u = new URL(url);
    const host = sanitizeFilenamePart(u.hostname);
    const lastRaw = u.pathname.split("/").pop() || "index";

    let finalExt = ext;
    let baseName = lastRaw;

    if (!finalExt) {
      const m = lastRaw.match(/\.[a-zA-Z0-9]{1,8}$/);
      if (m) {
        finalExt = m[0];
        baseName = lastRaw.slice(0, -finalExt.length);
      } else {
        finalExt = ".txt";
      }
    }

    return `${host}__${sanitizeFilenamePart(baseName)}${finalExt}`;
  } catch {
    return `unknown${ext || ".txt"}`;
  }
}

/**
 * Ensure URLs are absolute (add https:// if missing).
 */
function normalizeUrl(url: string): string {
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `https://${url}`;
}

/* ============================================================================
   Rate Limiter (Website crawling)
============================================================================ */
class RateLimiter {
  private active = 0;
  constructor(private max: number, private delay: number) {}

  async run<T>(fn: () => Promise<T>): Promise<T> {
    while (this.active >= this.max) {
      await new Promise((r) => setTimeout(r, this.delay));
    }
    this.active++;
    try {
      return await fn();
    } finally {
      this.active--;
    }
  }
}

const limiter = new RateLimiter(5, 300);

/* ============================================================================
   1) DOCUMENT (FILE) UPLOAD
============================================================================ */
export async function uploadDocuments(
  knowledgeBaseId: string,
  formData: FormData
) {
  try {
    const session = await getSession();
    if (!session?.user) return { success: false, error: "Unauthorized" };

    const kb = await getKnowledgeBase(knowledgeBaseId);
    if (!kb) return { success: false, error: "Knowledge base not found" };

    const chunkingConfig: ChunkingConfig =
      typeof kb.chunkingConfig === "string"
        ? JSON.parse(kb.chunkingConfig)
        : kb.chunkingConfig || { minSize: 300, maxSize: 2500, overlap: 150 };

    const files: File[] = [];
    for (const [key, val] of formData.entries()) {
      if (key.startsWith("file-") && val instanceof File) files.push(val);
    }

    if (!files.length) return { success: false, error: "No files provided" };

    const storage = new DocumentStorageOperations();
    const results = await storage.processAndStoreDocuments(
      files,
      knowledgeBaseId,
      chunkingConfig,
      () => {},
      async () => {}
    );

    const totalTokens = results.reduce(
      (acc, r) => acc + (r.totalTokens || 0),
      0
    );
    await pgDb
      .update(knowledgeBase)
      .set({ tokenCount: totalTokens })
      .where(eq(knowledgeBase.id, knowledgeBaseId));

    return { success: true, results };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/* ============================================================================
   2) LINKEDIN DEEP EXTRACTOR (.TXT OUTPUT)
============================================================================ */
async function extractLinkedInDeep(url: string): Promise<string> {
  const res = await fetch(url, {
    redirect: "follow",
    headers: { "User-Agent": "Mozilla/5.0" },
  });
  if (!res.ok) throw new Error(`LinkedIn HTTP ${res.status}`);

  const html = await res.text();
  const $ = cheerio.load(html);

  let output = "";

  /* Name */
  const name =
    $("title").text().replace(" | LinkedIn", "").trim() ||
    $("h1").first().text().trim() ||
    "";
  if (name) output += `Name: ${name}\n`;

  /* Headline */
  const headline =
    $("meta[property='og:description']").attr("content") ||
    $("h2").first().text().trim() ||
    "";
  if (headline) output += `Headline: ${headline}\n\n`;

  /* About */
  const about = $("section:contains('About')").next().find("p").text().trim();
  if (about) output += `About:\n${about}\n\n`;

  /* Experience */
  output += `Experience:\n`;
  $("section:contains('Experience')")
    .next()
    .find("li")
    .each((_, el) => {
      const role = $(el).find("h3").text().trim();
      const company = $(el).find("p").first().text().trim();
      const duration = $(el)
        .find("span:contains('mo'), span:contains('yr')")
        .text()
        .trim();
      if (role) output += `- ${role} @ ${company} (${duration})\n`;
    });
  output += `\n`;

  /* Education */
  output += `Education:\n`;
  $("section:contains('Education')")
    .next()
    .find("li")
    .each((_, el) => {
      const school = $(el).find("h3").text().trim();
      const degree = $(el).find("span:contains('degree')").text().trim();
      const years = $(el).find("time").text().trim();
      if (school) output += `- ${school} — ${degree} (${years})\n`;
    });
  output += `\n`;

  /* Skills */
  const skills = new Set<string>();
  $("span:contains('endorsements')").each((_, el) => {
    const skill = $(el).prev().text().trim();
    if (skill) skills.add(skill);
  });

  if (skills.size) {
    output += `Skills:\n`;
    skills.forEach((s) => (output += `- ${s}\n`));
  }

  const trimmed = output.trim();
  return trimmed || "No public data found.";
}

/* ============================================================================
   3) GITHUB DEEP EXTRACTOR (.TXT OUTPUT)
============================================================================ */
async function extractGithubDeep(url: string): Promise<string> {
  const res = await fetch(url, {
    redirect: "follow",
    headers: { "User-Agent": "Mozilla/5.0" },
  });
  if (!res.ok) throw new Error(`GitHub HTTP ${res.status}`);

  const html = await res.text();
  const $ = cheerio.load(html);

  let output = "";

  /* Name */
  const name = $("span.p-name").text().trim();
  if (name) output += `Name: ${name}\n`;

  /* Bio */
  const bio = $("div.p-note").text().trim();
  if (bio) output += `Bio: ${bio}\n\n`;

  /* Followers / Following */
  const followers = $("a[href$='?tab=followers'] .text-bold").text().trim();
  const following = $("a[href$='?tab=following'] .text-bold").text().trim();
  output += `Followers: ${followers}\nFollowing: ${following}\n\n`;

  /* Repositories */
  output += `Top Repositories:\n`;
  $("li.public").each((_, el) => {
    const repo = $(el)
      .find("a[data-hovercard-type='repository']")
      .text()
      .trim();
    const stars = $(el).find("a[href$='/stargazers']").text().trim();
    const lang = $(el)
      .find("span[itemprop='programmingLanguage']")
      .text()
      .trim();
    if (repo) output += `- ${repo} | ⭐ ${stars} | ${lang}\n`;
  });

  const trimmed = output.trim();
  return trimmed || "No public GitHub data found.";
}

/* ============================================================================
   4) WEBSITE CRAWLING HELPERS
============================================================================ */
async function fetchSitemapUrls(domain: string): Promise<string[]> {
  try {
    const sitemapUrl = `${domain.replace(/\/$/, "")}/sitemap.xml`;
    const res = await fetch(sitemapUrl);
    if (!res.ok) throw new Error();
    const xml = await res.text();

    return (xml.match(/<loc>(.*?)<\/loc>/g) || []).map((m) =>
      m.replace(/<\/?loc>/g, "").trim()
    );
  } catch {
    return [];
  }
}

async function extractTextFromPage(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
    if (!res.ok) return null;

    const html = await res.text();
    const $ = cheerio.load(html);
    $("script, style, nav, footer, header").remove();

    const text = $("body *")
      .map((_, el) => $(el).text().trim())
      .get()
      .filter(Boolean)
      .join("\n\n");

    return text.length > 50 ? text : null;
  } catch {
    return null;
  }
}

/* ============================================================================
   5) LINK INGESTION (FINAL)
============================================================================ */
export async function uploadLinks(
  knowledgeBaseId: string,
  urls: string[]
): Promise<UploadLinksResult> {
  try {
    const session = await getSession();
    if (!session?.user) return { success: false, error: "Unauthorized" };

    const kb = await getKnowledgeBase(knowledgeBaseId);
    if (!kb) return { success: false, error: "Knowledge base not found" };

    const fetched: Array<{ url: string; fileLike?: File; reason?: string }> =
      [];

    for (const originalUrl of urls) {
      try {
        const normalizedUrl = normalizeUrl(originalUrl);
        const clean = normalizedUrl.toLowerCase();

        /* ------------------------------------------------------
           SPECIAL: LinkedIn deep extraction → TXT with fallback
        ------------------------------------------------------ */
        if (clean.includes("linkedin.com/")) {
          let text: string | null = null;

          try {
            text = await extractLinkedInDeep(normalizedUrl);
          } catch (err: any) {
            // Fallback to generic page extraction if deep extractor fails
            const fallbackText = await extractTextFromPage(normalizedUrl);
            text = fallbackText;
            if (!fallbackText) {
              fetched.push({
                url: originalUrl,
                reason:
                  err?.message ||
                  "LinkedIn extraction failed and no readable fallback content",
              });
              continue;
            }
          }

          if (
            !text ||
            text.trim().length < 50 ||
            text === "No public data found."
          ) {
            fetched.push({
              url: originalUrl,
              reason: "No sufficient public LinkedIn content to ingest",
            });
            continue;
          }

          const buf = Buffer.from(text, "utf-8");
          fetched.push({
            url: originalUrl,
            fileLike: toFileLike(
              buf,
              buildFilenameFromUrl(normalizedUrl, ".txt"),
              "text/plain"
            ) as File,
          });
          continue;
        }

        /* ------------------------------------------------------
           SPECIAL: GitHub deep extraction → TXT
        ------------------------------------------------------ */
        if (clean.includes("github.com/")) {
          try {
            const text = await extractGithubDeep(normalizedUrl);
            if (!text || text.trim().length < 10) {
              fetched.push({
                url: originalUrl,
                reason: "No sufficient public GitHub data to ingest",
              });
              continue;
            }

            const buf = Buffer.from(text, "utf-8");
            fetched.push({
              url: originalUrl,
              fileLike: toFileLike(
                buf,
                buildFilenameFromUrl(normalizedUrl, ".txt"),
                "text/plain"
              ) as File,
            });
            continue;
          } catch (err: any) {
            fetched.push({
              url: originalUrl,
              reason: err?.message || "GitHub extraction failed",
            });
            continue;
          }
        }

        /* ------------------------------------------------------
           WEBSITE CRAWLING
        ------------------------------------------------------ */
        const isWebsite =
          clean.startsWith("http") &&
          !clean.match(/\.(pdf|doc|docx|txt|json|csv|xlsx|pptx|ppt|xls)$/i);

        if (isWebsite) {
          const domain = new URL(normalizedUrl).origin;
          const sitemapUrls = await fetchSitemapUrls(domain);
          const pages = Array.from(
            new Set(sitemapUrls.length ? sitemapUrls : [normalizedUrl])
          ).slice(0, 40);

          const crawlResults = await Promise.all(
            pages.map((page) =>
              limiter.run(async () => {
                const text = await extractTextFromPage(page);
                if (!text) return { url: page, reason: "No readable text" };
                const buf = Buffer.from(text, "utf-8");
                return {
                  url: page,
                  fileLike: toFileLike(
                    buf,
                    buildFilenameFromUrl(page, ".txt"),
                    "text/plain"
                  ) as File,
                };
              })
            )
          );

          fetched.push(...crawlResults);
          continue;
        }

        /* ------------------------------------------------------
           DIRECT FILE DOWNLOAD
        ------------------------------------------------------ */
        const res = await fetch(normalizedUrl);
        if (!res.ok) {
          fetched.push({
            url: originalUrl,
            reason: `HTTP ${res.status}`,
          });
          continue;
        }

        const buf = Buffer.from(await res.arrayBuffer());
        fetched.push({
          url: originalUrl,
          fileLike: toFileLike(
            buf,
            buildFilenameFromUrl(normalizedUrl),
            res.headers.get("content-type") || "application/octet-stream"
          ) as File,
        });
      } catch (err: any) {
        fetched.push({ url: originalUrl, reason: err?.message || "Error" });
      }
    }

    const files = fetched
      .filter((f) => f.fileLike)
      .map((f) => f.fileLike!) as File[];
    const skipped = fetched
      .filter((f) => !f.fileLike)
      .map((f) => ({ url: f.url, reason: f.reason || "Unknown" }));

    if (!files.length)
      return { success: false, skipped, error: "No valid content" };

    /* ------------------------------------------------------
       CHUNKING & STORAGE
    ------------------------------------------------------ */
    const chunkConfig: ChunkingConfig =
      typeof kb.chunkingConfig === "string"
        ? JSON.parse(kb.chunkingConfig)
        : kb.chunkingConfig || { minSize: 300, maxSize: 2500, overlap: 150 };

    const storage = new DocumentStorageOperations();
    const results = await storage.processAndStoreDocuments(
      files,
      knowledgeBaseId,
      chunkConfig,
      () => {},
      async () => {}
    );

    const totalTokens = results.reduce((a, r) => a + (r.totalTokens || 0), 0);
    await pgDb
      .update(knowledgeBase)
      .set({ tokenCount: totalTokens })
      .where(eq(knowledgeBase.id, knowledgeBaseId));

    return { success: true, results, skipped };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
