import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { claudeAdapter } from "@/lib/claude_adapter";
import type { NarrationMessage, NarrationContext, LLMResponseChunk } from "@/lib/types";
import { inMemoryVectorStoreAdapter } from "@/lib/vector_store_adapter";
import { checkAndRecordUsage, estimateTokens, recordActualUsage } from "@/lib/tokenUsage";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const session = (await getServerSession(authConfig)) as
    | { user?: { email?: string | null; id?: string | null } }
    | null;
  const userId = session?.user?.email || session?.user?.id;

  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body: { question: string; repoId?: string; context?: NarrationContext; fileContent?: string } =
    await req.json();
  const { question } = body;
  const repoId = typeof body.repoId === "string" ? body.repoId.slice(0, 201) : undefined;
  const fileContent = typeof body.fileContent === "string" ? body.fileContent : undefined;
  const clip = (value: unknown) => (typeof value === "string" ? value.slice(0, 300) : undefined);
  const context: NarrationContext | undefined =
    body.context && ["file", "symbol", "repo"].includes(body.context.type)
      ? {
          type: body.context.type,
          path: clip(body.context.path),
          symbolName: clip(body.context.symbolName),
          language: clip(body.context.language)?.slice(0, 30),
        }
      : undefined;

  if (!question || typeof question !== "string") {
    return Response.json({ error: "Missing question" }, { status: 400 });
  }

  if (question.length > 2000) {
    return Response.json({ error: "Question too long. Maximum 2000 characters." }, { status: 400 });
  }

  const optimizedFileContent = fileContent 
    ? fileContent.slice(0, 3000)
    : null;

  const messages: NarrationMessage[] = [
    {
      id: "style",
      role: "assistant",
      content: "Answer in markdown. Use bullet points and short sections.",
      createdAt: new Date().toISOString(),
    },
  ];

  if (context?.type === "file" && context.path && optimizedFileContent) {
    messages.push({
      id: "file-context",
      role: "assistant",
      content: `File: ${context.path}\n\`\`\`${context.language || ""}\n${optimizedFileContent}\n\`\`\``,
      createdAt: new Date().toISOString(),
    });
  }

  messages.push({
    id: "user-question",
    role: "user",
    content: question,
    createdAt: new Date().toISOString(),
  });

  let retrievedContext = "";

  if (repoId) {
    try {
      const matches = await inMemoryVectorStoreAdapter.query({
        repoId,
        query: question,
        topK: 5,
      });

      if (matches.length) {
        retrievedContext =
          "Relevant snippets:\n" +
          matches
            .slice(0, 5)
            .map(
              (m, idx) =>
                `${idx + 1}. ${m.path}:${m.startLine ?? "?"}\n${(m.snippet || "").slice(0, 500)}`,
            )
            .join("\n\n");

        messages.unshift({
          id: "rag-context",
          role: "assistant",
          content: retrievedContext,
          createdAt: new Date().toISOString(),
        });
      }
    } catch (embeddingError) {
      console.warn("RAG query failed, continuing without context:", embeddingError);
    }
  }

  const promptText = messages.map(m => m.content).join("\n");
  const estimatedInputTokens = estimateTokens(promptText);
  const estimatedTokens = estimatedInputTokens + 1000;

  const usageCheck = await checkAndRecordUsage(userId, estimatedTokens);
  if (!usageCheck.allowed) {
    return Response.json(
      {
        error: usageCheck.reason || "Usage limit exceeded",
        retryAfter: usageCheck.retryAfter,
      },
      { status: 429 }
    );
  }

  const stream = new TransformStream();
  const writer = stream.writable.getWriter();
  const encoder = new TextEncoder();
  let responseText = "";

  (async () => {
    try {
      await claudeAdapter.chat({
        messages,
        context,
        config: { streaming: true },
        onChunk: async (chunk: LLMResponseChunk) => {
          if (!chunk.text) return;
          responseText += chunk.text;
          await writer.write(encoder.encode(chunk.text));
        },
      });
      
      const actualResponseTokens = estimateTokens(responseText);
      const actualTotalTokens = estimatedInputTokens + actualResponseTokens;
      const tokenDifference = actualTotalTokens - estimatedTokens;
      if (tokenDifference !== 0) {
        await recordActualUsage(userId, tokenDifference);
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      let userMessage = "\n\n[gitlore] Sorry, something went wrong while talking to Claude.";
      
      
      if (errorMessage.includes("429") || errorMessage.includes("quota") || errorMessage.includes("rate limit")) {
        userMessage = 
          "\n\n[gitlore] ⚠️ Rate limit exceeded. " +
          "The Claude API is busy or your rate limit was hit. " +
          "Please wait ~60 seconds and try again.";
      }
      
      await writer.write(encoder.encode(userMessage));
    } finally {
      await writer.close();
    }
  })();

  return new Response(stream.readable, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}


