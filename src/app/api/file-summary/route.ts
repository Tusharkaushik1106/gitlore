import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { fetchRawFile } from "@/lib/github";
import { geminiAdapter } from "@/lib/gemini_adapter";
import type { NarrationMessage } from "@/lib/types";
import { checkAndRecordUsage, estimateTokens, recordActualUsage } from "@/lib/tokenUsage";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const session = (await getServerSession(authConfig)) as
      | { user?: { email?: string | null; id?: string | null } }
      | null;
    const userId = session?.user?.email || session?.user?.id;

    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const {
      owner,
      name,
      path,
    }: { owner?: string; name?: string; path?: string } = await req.json();

    if (!owner || !name || !path) {
      return Response.json(
        { error: "Missing owner, name, or path" },
        { status: 400 },
      );
    }

    let fileContent = "";
    try {
      fileContent = await fetchRawFile(owner, name, path);
    } catch {
      return Response.json(
        { error: "Failed to fetch file content from GitHub." },
        { status: 400 },
      );
    }

    const optimizedContent = fileContent.slice(0, 2500);

    const prompt = [
      "Analyze this file and return JSON:",
      '{ "summary": "markdown overview (3-6 bullets)", "mermaid": "flowchart TD or sequenceDiagram" }',
      "Mermaid rules: valid syntax only, quote labels with spaces, max 8 nodes.",
      `File: ${path}`,
      `Content:\n${optimizedContent}`,
    ].join("\n");

    const messages: NarrationMessage[] = [
      {
        id: "file-summary",
        role: "user",
        content: prompt,
        createdAt: new Date().toISOString(),
      },
    ];

    const estimatedInputTokens = estimateTokens(prompt);
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

    let completion;
    try {
      completion = await geminiAdapter.chat({
        messages,
        config: { streaming: false },
      });
      
      const actualResponseTokens = estimateTokens(completion.content);
      const actualTotalTokens = estimatedInputTokens + actualResponseTokens;
      const tokenDifference = actualTotalTokens - estimatedTokens;
      if (tokenDifference !== 0) {
        await recordActualUsage(userId, tokenDifference);
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      const isRateLimit = 
        (error && typeof error === "object" && "status" in error && error.status === 429) ||
        errorMessage.includes("rate limit") || 
        errorMessage.includes("quota") ||
        errorMessage.includes("429") ||
        errorMessage.includes("Too Many Requests");
      
      if (isRateLimit) {
        return Response.json(
          {
            error: errorMessage || "Gemini API rate limit exceeded. The free tier allows 20 requests per day.",
            retryAfter: 60,
          },
          { status: 429 },
        );
      }
      
      return Response.json(
        {
          error: errorMessage || "Failed to generate file summary from Gemini API.",
        },
        { status: 500 },
      );
    }

    let parsed: {
      summary: string;
      mermaid: string;
    };

    try {
      const start = completion.content.indexOf("{");
      const end = completion.content.lastIndexOf("}");
      const jsonSlice = completion.content.slice(start, end + 1);
      parsed = JSON.parse(jsonSlice);
      
      if (parsed.mermaid) {
        parsed.mermaid = parsed.mermaid
          .replace(/^```[a-zA-Z]*\s*/, "")
          .replace(/```$/gm, "")
          .trim();
      }
    } catch {
      parsed = {
        summary:
          "gitlore could not parse a structured response, but this file participates in the repository's behavior as shown in the code.",
        mermaid: "",
      };
    }

    return Response.json({
      path,
      code:
        fileContent.length > 16000
          ? `${fileContent.slice(0, 16000)}\n// … truncated`
          : fileContent,
      summary: parsed.summary,
      mermaid: parsed.mermaid,
    });
  } catch (error: unknown) {
    
    const errorMessage = error instanceof Error ? error.message : String(error);
    const isRateLimit = 
      (error && typeof error === "object" && "status" in error && error.status === 429) ||
      errorMessage.includes("rate limit") || 
      errorMessage.includes("quota") ||
      errorMessage.includes("429") ||
      errorMessage.includes("Too Many Requests");
    
    if (isRateLimit) {
      return Response.json(
        {
          error: errorMessage || "Gemini API rate limit exceeded. The free tier allows 20 requests per day.",
          retryAfter: 60,
        },
        { status: 429 },
      );
    }
    
    console.error("Error in /api/file-summary:", error);
    return Response.json(
      {
        error: errorMessage || "An unexpected error occurred while generating file summary.",
      },
      { status: 500 },
    );
  }
}


