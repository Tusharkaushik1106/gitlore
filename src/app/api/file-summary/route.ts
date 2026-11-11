import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { fetchRawFile } from "@/lib/github";
import { claudeAdapter } from "@/lib/claude_adapter";
import type { NarrationMessage } from "@/lib/types";
import { checkAndRecordUsage, estimateTokens, recordActualUsage } from "@/lib/tokenUsage";
import { createHash } from "crypto";
import { ensureSummaryCacheTable, getDbPool } from "@/lib/db/schema";

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

    const slug = /^[A-Za-z0-9._-]{1,100}$/;
    if (
      typeof owner !== "string" || !slug.test(owner) ||
      typeof name !== "string" || !slug.test(name) ||
      typeof path !== "string" || path.length > 500 || path.split("/").includes("..")
    ) {
      return Response.json({ error: "Invalid owner, name, or path" }, { status: 400 });
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

    const codePayload =
      fileContent.length > 16000
        ? `${fileContent.slice(0, 16000)}\n// … truncated`
        : fileContent;

    const fileHash = createHash("sha256").update("v2:" + fileContent).digest("hex");
    const pool = getDbPool();

    if (pool) {
      try {
        await ensureSummaryCacheTable(pool);
        const cached = await pool.query(
          `SELECT summary_markdown, diagram_code FROM summary_cache WHERE file_hash = $1 LIMIT 1`,
          [fileHash],
        );

        const cachedRow = cached.rows?.[0];
        if (cachedRow) {
          return Response.json({
            path,
            code: codePayload,
            summary: cachedRow.summary_markdown ?? "",
            mermaid: (cachedRow.diagram_code ?? "") as string,
          });
        }
      } catch (cacheError) {
        console.warn(
          "Failed to read summary cache:",
          cacheError instanceof Error ? cacheError.message : String(cacheError),
        );
      }
    }

    const prompt = [
      "Analyze this file and return JSON:",
      '{ "summary": "markdown explanation", "mermaid": "flowchart TD or sequenceDiagram" }',
      "The summary must explain the file well enough that a developer new to the repo understands it without reading the code.",
      "Use these markdown sections in the summary: '## Purpose' (what the file is for and why it exists), '## How it works' (walk through the main flow step by step), '## Key pieces' (each important function, class, component or export and what it does), '## Connections' (what it imports or calls and what is likely to depend on it), '## Worth knowing' (edge cases, side effects, error handling, non-obvious decisions).",
      "Be specific: name real identifiers from the code in backticks. Skip a section only if the file has nothing for it.",
      "Mermaid rules: valid syntax only, quote labels with spaces, max 8 nodes.",
      `File: ${path}`,
      `Content:\n${codePayload}`,
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
      completion = await claudeAdapter.chat({
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
            error: errorMessage || "Claude API rate limit exceeded. Please wait a moment and try again.",
            retryAfter: 60,
          },
          { status: 429 },
        );
      }
      
      return Response.json(
        {
          error: errorMessage || "Failed to generate file summary from Claude API.",
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

    if (pool) {
      try {
        await pool.query(
          `
          INSERT INTO summary_cache (file_hash, summary_markdown, diagram_code)
          VALUES ($1, $2, $3)
          ON CONFLICT (file_hash)
          DO UPDATE SET summary_markdown = EXCLUDED.summary_markdown, diagram_code = EXCLUDED.diagram_code, updated_at = now();
        `,
          [fileHash, parsed.summary, parsed.mermaid ?? ""],
        );
      } catch (cacheError) {
        console.warn(
          "Failed to write summary cache:",
          cacheError instanceof Error ? cacheError.message : String(cacheError),
        );
      }
    }

    return Response.json({
      path,
      code: codePayload,
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
          error: errorMessage || "Claude API rate limit exceeded. Please wait a moment and try again.",
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


