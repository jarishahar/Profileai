// lib/knowledge/search-service.ts
import { pgDb } from "lib/db/pg/db.pg";
import { embedding, knowledgeBase } from "lib/db/pg/schema.pg";
import { eq, and, sql, desc } from "drizzle-orm";
import { generateEmbedding } from "./embedding-service";

export interface SearchResult {
  id: string;
  content: string;
  documentId: string;
  knowledgeBaseId: string;
  chunkIndex: number;
  tokenCount: number;
  similarity: number;
  metadata?: {
    tags?: string[];
    documentName?: string;
  };
}

export interface SearchOptions {
  limit?: number;
  enabledOnly?: boolean;
}

export async function searchKnowledge(
  knowledgeBaseId: string,
  query: string,
  options: SearchOptions = {}
): Promise<SearchResult[]> {
  const { limit = 10, enabledOnly = true } = options;

  try {
    // 1) Load KB
    const [kb] = await pgDb
      .select()
      .from(knowledgeBase)
      .where(eq(knowledgeBase.id, knowledgeBaseId));

    if (!kb) throw new Error("Knowledge base not found");

    const expectedDim = kb.embeddingDimension ?? 256;

    console.log(
      `Searching KB "${kb.name}" (${kb.id}), expected dim: ${expectedDim}`
    );

    // 2) AI embedding for the query
    const queryEmbedding = await generateEmbedding(query, {
      dimensions: expectedDim,
    });

    if (queryEmbedding.length !== expectedDim) {
      throw new Error(
        `Embedding dimension mismatch. Expected ${expectedDim}, got ${queryEmbedding.length}`
      );
    }

    console.log("Generated query embedding:", queryEmbedding.length);

    const embeddingVector = `[${queryEmbedding.join(",")}]`;

    const similarityExpr = sql<number>`
      1 - (${embedding.embedding} <=> ${embeddingVector}::vector)
    `;

    const conditions: any[] = [eq(embedding.knowledgeBaseId, knowledgeBaseId)];
    if (enabledOnly) conditions.push(eq(embedding.enabled, true));

    // 3) Vector similarity search in Postgres
    const rows = await pgDb
      .select({
        id: embedding.id,
        content: embedding.content,
        documentId: embedding.documentId,
        knowledgeBaseId: embedding.knowledgeBaseId,
        chunkIndex: embedding.chunkIndex,
        tokenCount: embedding.tokenCount,
        tag1: embedding.tag1,
        tag2: embedding.tag2,
        tag3: embedding.tag3,
        tag4: embedding.tag4,
        tag5: embedding.tag5,
        tag6: embedding.tag6,
        tag7: embedding.tag7,
        similarity: similarityExpr,
      })
      .from(embedding)
      .where(and(...conditions))
      .orderBy(desc(similarityExpr))
      .limit(limit);

    console.log(`Returning ${rows.length} rows (top ${limit} by similarity)`);

    // 4) Map into SearchResult
    return rows.map((r) => ({
      id: r.id,
      content: r.content,
      documentId: r.documentId,
      knowledgeBaseId: r.knowledgeBaseId,
      chunkIndex: r.chunkIndex,
      tokenCount: r.tokenCount,
      similarity: r.similarity,
      metadata: {
        tags: [r.tag1, r.tag2, r.tag3, r.tag4, r.tag5, r.tag6, r.tag7].filter(
          (t): t is string => typeof t === "string"
        ),
      },
    }));
  } catch (err) {
    console.error("Error searching knowledge:", err);
    throw new Error(
      `Failed to search knowledge base: ${
        err instanceof Error ? err.message : "Unknown error"
      }`
    );
  }
}
