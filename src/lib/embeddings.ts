import { GoogleGenerativeAI } from "@google/generative-ai";

const EMBEDDING_MODEL = "text-embedding-005";

function getEmbeddingClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured");
  }
  const client = new GoogleGenerativeAI(apiKey);
  
  return client.getGenerativeModel({ model: EMBEDDING_MODEL });
}

export async function embedText(text: string): Promise<number[]> {
  const model = getEmbeddingClient();
  
  const result = await model.embedContent(text);
  const values = result.embedding?.values;
  if (!values || !Array.isArray(values)) {
    throw new Error("Failed to compute embeddings with Gemini");
  }
  return values as number[];
}


