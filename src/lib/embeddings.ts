const DIMS = 512;

// ponytail: Claude has no embeddings API, so this is a local hashed bag-of-words
// vector (keyword overlap, not semantic similarity). Fine for the <=25 files held
// in memory per repo; swap in a real embedding model if recall matters.
export async function embedText(text: string): Promise<number[]> {
  const counts = new Array<number>(DIMS).fill(0);
  for (const token of text.toLowerCase().match(/[a-z_][a-z0-9_]+/g) ?? []) {
    let hash = 2166136261;
    for (let i = 0; i < token.length; i += 1) {
      hash = Math.imul(hash ^ token.charCodeAt(i), 16777619);
    }
    counts[(hash >>> 0) % DIMS] += 1;
  }
  // Dampen so very frequent tokens don't dominate the cosine score.
  return counts.map(Math.sqrt);
}
