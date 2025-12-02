import { embedText } from "./embeddings";

export interface VectorStoreQueryResult {
  id: string;
  score: number;
  path: string;
  startLine?: number;
  endLine?: number;
  snippet?: string;
  metadata?: Record<string, unknown>;
}

export interface VectorStoreAdapter {
  upsertDocuments: (options: {
    repoId: string;
    documents: Array<{
      id: string;
      text: string;
      path: string;
      startLine?: number;
      endLine?: number;
      metadata?: Record<string, unknown>;
    }>;
  }) => Promise<void>;

  query: (options: {
    repoId: string;
    query: string;
    topK?: number;
  }) => Promise<VectorStoreQueryResult[]>;
}

type StoredVector = {
  id: string;
  path: string;
  startLine?: number;
  endLine?: number;
  snippet?: string;
  embedding: number[];
  metadata?: Record<string, unknown>;
};

// Simple in-memory store for this dev prototype. Not persistent.
const memoryStore = new Map<string, StoredVector[]>();

function cosineSimilarity(a: number[], b: number[]): number {
  const len = Math.min(a.length, b.length);
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < len; i += 1) {
    const va = a[i];
    const vb = b[i];
    dot += va * vb;
    normA += va * va;
    normB += vb * vb;
  }
  if (!normA || !normB) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

export const inMemoryVectorStoreAdapter: VectorStoreAdapter = {
  async upsertDocuments({ repoId, documents }) {
    const existing = memoryStore.get(repoId) ?? [];

    for (const doc of documents) {
      const embedding = await embedText(doc.text);
      const snippet =
        doc.text.length > 800 ? `${doc.text.slice(0, 800)}…` : doc.text;
      const stored: StoredVector = {
        id: doc.id,
        path: doc.path,
        startLine: doc.startLine,
        endLine: doc.endLine,
        snippet,
        embedding,
        metadata: doc.metadata,
      };

      const idx = existing.findIndex(
        (e) => e.id === doc.id && e.path === doc.path,
      );
      if (idx >= 0) {
        existing[idx] = stored;
      } else {
        existing.push(stored);
      }
    }

    memoryStore.set(repoId, existing);
  },

  async query({ repoId, query, topK = 8 }) {
    const vectors = memoryStore.get(repoId) ?? [];
    if (!vectors.length) return [];

    const queryEmbedding = await embedText(query);

    const scored = vectors
      .map((v) => ({
        v,
        score: cosineSimilarity(queryEmbedding, v.embedding),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);

    return scored.map((entry) => ({
      id: entry.v.id,
      score: entry.score,
      path: entry.v.path,
      startLine: entry.v.startLine,
      endLine: entry.v.endLine,
      snippet: entry.v.snippet,
      metadata: entry.v.metadata,
    }));
  },
};


