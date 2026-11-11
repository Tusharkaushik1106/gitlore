export const config = {
  anthropic: {
    apiKey: process.env.ANTHROPIC_API_KEY,
    model: process.env.ANTHROPIC_MODEL ?? "claude-haiku-5-5",
  },
  github: {
    clientId: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    
  },
  database: {
    url: process.env.DATABASE_URL,
  },
  vectorStore: {
    url: process.env.VECTOR_DB_URL,
    apiKey: process.env.VECTOR_DB_KEY,
    provider: process.env.VECTOR_DB_PROVIDER,
  },
};


