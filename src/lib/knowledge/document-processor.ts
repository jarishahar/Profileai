import { pgDb } from "lib/db/pg/db.pg";
import { document, embedding } from "lib/db/pg/schema.pg";
import { eq } from "drizzle-orm";
import * as mammoth from "mammoth";
import * as XLSX from "xlsx";
import { generateEmbeddings } from "./embedding-service"; // ✅ always LOCAL
import { generateUUID } from "lib/utils";

export interface ChunkingConfig {
  minSize: number;
  maxSize: number;
  overlap: number;
}

export interface ProcessResult {
  documentId: string;
  fileName: string;
  totalChunks: number;
  totalTokens: number;
}

type ProgressCallback = (
  status: string,
  progress: number,
  message?: string
) => Promise<void> | void;

type CancellationCheck = () => void | Promise<void>;

// -------------------------------------------------------------
// GLOBAL RATE LIMITER
// -------------------------------------------------------------
class RateLimiter {
  private active = 0;
  private queue: (() => void)[] = [];
  constructor(private maxConcurrent: number, private delayMs: number) {}
  async run<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      const exec = async () => {
        this.active++;
        try {
          const res = await fn();
          await new Promise((r) => setTimeout(r, this.delayMs));
          resolve(res);
        } catch (err) {
          reject(err);
        } finally {
          this.active--;
          const next = this.queue.shift();
          if (next) next();
        }
      };
      if (this.active < this.maxConcurrent) exec();
      else this.queue.push(exec);
    });
  }
}
const globalLimiter = new RateLimiter(10, 100);

// -------------------------------------------------------------
// STORAGE + CHUNKING + EMBEDDING PIPELINE
// -------------------------------------------------------------
export class DocumentStorageOperations {
  /**
   * Process multiple documents
   */
  async processAndStoreDocuments(
    files: File[],
    knowledgeBaseId: string,
    config: ChunkingConfig,
    progressCallback?: ProgressCallback,
    cancellationCheck?: CancellationCheck
  ): Promise<ProcessResult[]> {
    const results: ProcessResult[] = [];

    const queue = [...files];
    const concurrency = 5;
    let processed = 0;

    const worker = async () => {
      while (queue.length > 0) {
        const file = queue.shift();
        if (!file) break;

        try {
          const res = await this._processSingleDocument(
            file,
            knowledgeBaseId,
            config,
            progressCallback,
            cancellationCheck
          );
          results.push(res);

          processed++;
          if (progressCallback) {
            await progressCallback(
              "processing",
              Math.round((processed / files.length) * 100),
              `Processed ${file.name} (${processed}/${files.length})`
            );
          }
        } catch (err) {
          console.error("❌ Failed to process file:", file.name, err);
          if (progressCallback)
            await progressCallback(
              "error",
              0,
              `Failed to process ${file.name}`
            );
        }
      }
    };

    await Promise.all(Array.from({ length: concurrency }, worker));

    if (progressCallback)
      await progressCallback(
        "completed",
        100,
        "All documents processed successfully"
      );

    return results;
  }

  /* -------------------------------------------------------------- */
  private async _processSingleDocument(
    file: File,
    knowledgeBaseId: string,
    config: ChunkingConfig,
    progressCallback?: ProgressCallback,
    cancellationCheck?: CancellationCheck
  ): Promise<ProcessResult> {
    const documentId = generateUUID();

    // 🎯 Extract text
    if (progressCallback)
      await progressCallback("extracting", 5, `Extracting ${file.name}`);

    const text = await this._extractTextFromFile(file);

    // 🎯 Chunk text
    if (progressCallback)
      await progressCallback("chunking", 15, `Chunking ${file.name}`);

    const chunks = this._chunkTextSmart(text, config);

    const totalTokens = chunks.reduce(
      (sum, chunk) => sum + this._estimateTokens(chunk),
      0
    );

    // Save document metadata
    await pgDb.insert(document).values({
      id: documentId,
      knowledgeBaseId,
      filename: file.name,
      fileUrl: "",
      fileSize: file.size,
      mimeType: file.type || "text/plain",
      chunkCount: chunks.length,
      tokenCount: totalTokens,
      characterCount: text.length,
      processingStatus: "processing",
    });

    // 🎯 Generate embeddings
    if (progressCallback)
      await progressCallback(
        "embedding",
        40,
        `Generating embeddings for ${file.name}`
      );
   
    const vectors: number[][] = [];
    for (let i = 0; i < chunks.length; i += 200) {
      const slice = chunks.slice(i, i + 200);

      const batch = await globalLimiter.run(() =>
        generateEmbeddings(slice, {
          dimensions: 256, // LOCAL HASH EMBEDDINGS ONLY
        })
      );

      vectors.push(...batch);
    }

    // 🎯 Store chunks + embeddings
    if (progressCallback)
      await progressCallback(
        "storing",
        70,
        `Storing embeddings for ${file.name}`
      );

    await this._storeEmbeddings(documentId, knowledgeBaseId, chunks, vectors);

    await pgDb
      .update(document)
      .set({ processingStatus: "completed", processingCompletedAt: new Date() })
      .where(eq(document.id, documentId));

    if (progressCallback)
      await progressCallback("done", 100, `${file.name} stored successfully`);

    return {
      documentId,
      fileName: file.name,
      totalChunks: chunks.length,
      totalTokens,
    };
  }

  /* -------------------------------------------------------------- */
  private async _extractTextFromFile(file: File): Promise<string> {
    const name = file.name.toLowerCase();

    if (/\.(txt|md|csv)$/.test(name)) return await file.text();

    if (name.endsWith(".json")) {
      try {
        return JSON.stringify(JSON.parse(await file.text()), null, 2);
      } catch {
        return await file.text();
      }
    }

    if (name.endsWith(".html"))
      return (await file.text())
        .replace(/<[^>]*>/g, " ")
        .replace(/\s+/g, " ")
        .trim();

    if (name.endsWith(".pdf")) {
      const pdfjsLib: any = await import("pdfjs-dist/legacy/build/pdf.mjs");
      const data = new Uint8Array(await file.arrayBuffer());
      const pdf = await pdfjsLib.getDocument({ data, disableWorker: true })
        .promise;

      let text = "";
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        text += content.items.map((it: any) => it.str || "").join(" ") + "\n";
      }
      return text.trim();
    }

    if (name.endsWith(".docx")) {
      const { value } = await mammoth.extractRawText({
        buffer: Buffer.from(await file.arrayBuffer()),
      });
      return value.trim();
    }

    if (/\.(xlsx|xls)$/.test(name)) {
      const workbook = XLSX.read(await file.arrayBuffer(), { type: "array" });
      return workbook.SheetNames.map(
        (sheet) =>
          `\n\n=== Sheet: ${sheet} ===\n\n${XLSX.utils.sheet_to_csv(
            workbook.Sheets[sheet]
          )}`
      ).join("\n\n");
    }

    throw new Error(`Unsupported file: ${name}`);
  }

  /* -------------------------------------------------------------- */
  private _chunkTextSmart(text: string, config: ChunkingConfig): string[] {
    const { minSize, maxSize, overlap } = config;

    const words = text.split(/\s+/);
    const chunks: string[] = [];

    let current: string[] = [];

    for (const word of words) {
      current.push(word);
      if (current.join(" ").length >= maxSize) {
        chunks.push(current.join(" ").trim());
        const overlapWords = current.slice(-Math.floor(overlap / 5));
        current = [...overlapWords];
      }
    }

    if (current.length > 0) {
      const last = current.join(" ").trim();
      if (last.length >= minSize) chunks.push(last);
      else if (chunks.length > 0) chunks[chunks.length - 1] += " " + last;
      else chunks.push(last);
    }

    return chunks;
  }

  private _estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }

  /* -------------------------------------------------------------- */
  private async _storeEmbeddings(
    documentId: string,
    knowledgeBaseId: string,
    chunks: string[],
    vectors: number[][]
  ) {
    const records = chunks.map((chunk, i) => ({
      id: generateUUID(),
      knowledgeBaseId,
      documentId,
      chunkIndex: i,
      chunkHash: `${documentId}-${i}`,
      content: chunk,
      contentLength: chunk.length,
      tokenCount: this._estimateTokens(chunk),
      startOffset: 0,
      endOffset: chunk.length,
      embedding: vectors[i], // MUST MATCH 256-dim
      enabled: true,
    }));

    const BATCH = 100;
    for (let i = 0; i < records.length; i += BATCH) {
      await pgDb.insert(embedding).values(records.slice(i, i + BATCH));
    }
  }
}
