// src/lib/knowledge/embedding-service.ts

export interface EmbeddingConfig {
  dimensions?: number; // default 256
}

function hashTokenToIndex(token: string, dimensions: number): number {
  let hash = 0;
  for (let i = 0; i < token.length; i++) hash = (hash * 31 + token.charCodeAt(i)) | 0;
  return Math.abs(hash) % dimensions;
}

function localEmbed(text: string, dimensions: number): number[] {
  const vec = new Array(dimensions).fill(0);
  const tokens = text.toLowerCase().split(/[\s\W_]+/).filter(Boolean);

  if (tokens.length === 0) return vec;

  for (const token of tokens) {
    vec[hashTokenToIndex(token, dimensions)]++;
  }

  // L2 normalize
  let sum = 0;
  for (const v of vec) sum += v * v;
  const norm = Math.sqrt(sum);
  if (norm !== 0) for (let i = 0; i < dimensions; i++) vec[i] /= norm;

  return vec;
}

export async function generateEmbeddings(
  texts: string[],
  config: EmbeddingConfig = {}
): Promise<number[][]> {
  const dim = config.dimensions ?? 256;
  return texts.map((t) => localEmbed(t, dim));
}

export async function generateEmbedding(
  text: string,
  config: EmbeddingConfig = {}
): Promise<number[]> {
  return localEmbed(text, config.dimensions ?? 256);
}
