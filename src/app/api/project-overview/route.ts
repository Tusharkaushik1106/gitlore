import { NextRequest } from "next/server";
import { claudeAdapter } from "@/lib/claude_adapter";
import type { NarrationMessage } from "@/lib/types";
import { getCachedDiagram, setCachedDiagram, type DiagramPayload } from "@/lib/diagramCache";
import { estimateTokens, recordActualUsage } from "@/lib/tokenUsage";
import { getClientId, reserveUsage } from "@/lib/usageGuard";
import { cleanMermaidCode } from "@/lib/utils/mermaid-cleaner";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { owner, name, fileTree, forceRefresh = false } = body;
    const sampleCode = typeof body.sampleCode === "string" ? body.sampleCode : "";

    const userId = getClientId(request);

    if (!owner || !name) {
      return Response.json(
        { error: "Missing owner or name" },
        { status: 400 }
      );
    }

    const slug = /^[A-Za-z0-9._-]{1,100}$/;
    if (typeof owner !== "string" || !slug.test(owner) || typeof name !== "string" || !slug.test(name)) {
      return Response.json({ error: "Invalid owner or name" }, { status: 400 });
    }

    const cacheKey = `${userId}:${owner}/${name}`;
    if (!forceRefresh) {
      const cached = getCachedDiagram(cacheKey);
      if (cached) {
        return Response.json(cached);
      }
    }

    let readmeContent = "";
    try {
      const readmeRes = await fetch(
        `https://api.github.com/repos/${owner}/${name}/readme`,
        {
          headers: {
            Accept: "application/vnd.github.v3+json",
          },  
        }
      );
      if (readmeRes.ok) {
        const readmeData = await readmeRes.json();
        const content = Buffer.from(readmeData.content, "base64").toString("utf-8");
        readmeContent = content.slice(0, 2000);
      }
    } catch {
    }

    const fileTreeSummary = Array.isArray(fileTree)
      ? fileTree
          .slice(0, 30)
          .map((f: { path?: unknown; language?: unknown }) =>
            `${String(f?.path ?? "").slice(0, 200)} (${String(f?.language ?? "").slice(0, 20)})`)
          .join("\n")
      : "";

    const repoUrlDisplay = `https://github.com/${owner}/${name}`;

    const prompt = [
      "You are gitlore, analyzing an entire codebase to provide a comprehensive project overview.",
      "",
      "Given the repository information, generate a detailed JSON response with:",
      "",
      '1) "overview": A comprehensive 3-4 paragraph markdown overview of the project, including:',
      "   - What the project does and its main purpose",
      "   - Key features and capabilities",
      "   - Architecture approach and design patterns",
      "   - Target audience or use cases",
      "",
      '2) "architecture": A 2-3 paragraph markdown description of the system architecture, including:',
      "   - High-level architecture patterns",
      "   - Component organization",
      "   - Key architectural decisions",
      "",
      '3) "keyComponents": An array of 5-8 strings, each describing a key component/module in bullet point format.',
      "   Each should be 1-2 sentences explaining what the component does and its role.",
      "",
      '4) "dataFlow": A 2-3 paragraph markdown description of how data flows through the system.',
      "",
      '5) "techStack": An array of 8-12 strings listing the main technologies, frameworks, and libraries used.',
      "",
      '6) "dependencies": An array of 5-8 strings listing the most important npm/pip/etc dependencies.',
      "",
      '7) "mermaidArchitecture": A Mermaid diagram (flowchart or graph) showing the high-level architecture.',
      "   - Direction: graph TD (top-down).",
      "   - Node IDs: SINGLE WORDS (alphanumeric, no spaces). Example: AuthService (NOT \"Auth Service\").",
      '   - Labels: Always quoted. Example: A["User Login"] --> B["Auth API"].',
      "   - Use valid Mermaid syntax ONLY - no markdown, no code fences, no JSON escaping, no prose.",
      "   - Keep it clear: 8-12 nodes max.",
      "   - Ensure every [ has a matching ], every quote is closed, and no trailing semicolons.",
      "",
      '8) "mermaidDataFlow": A Mermaid sequenceDiagram or flowchart showing data flow through the system.',
      "   - If flowchart: still graph TD.",
      "   - Node IDs: SINGLE WORDS (alphanumeric, no spaces).",
      '   - Labels: Always quoted. Example: A["API"] --> B["DB"].',
      "   - Use valid Mermaid syntax ONLY - no markdown, no code fences, no JSON escaping, no prose.",
      "   - Keep it clear: 6-10 steps max.",
      "   - Ensure all quotes and brackets are properly closed; no trailing semicolons.",
      "   - For the mermaidDataFlow diagram, every Mermaid participant and arrow definition MUST be on its own line. Do NOT combine multiple participants or arrows on a single line.",
      "",
      "Repository information:",
      `- Owner: ${owner}`,
      `- Name: ${name}`,
      `- URL: ${repoUrlDisplay}`,
      "",
      "Sample code:",
      sampleCode ? sampleCode.slice(0, 2000) : "No sample code",
      "",
      "Files:",
      fileTreeSummary || "No file tree",
      "",
      readmeContent ? `README:\n${readmeContent.slice(0, 1000)}` : "",
      "",
      "Return ONLY valid JSON with this exact shape:",
      '{',
      '  "overview": string,',
      '  "architecture": string,',
      '  "keyComponents": string[],',
      '  "dataFlow": string,',
      '  "techStack": string[],',
      '  "dependencies": string[],',
      '  "mermaidArchitecture": string,',
      '  "mermaidDataFlow": string',
      '}',
    ].join("\n");

    const messages: NarrationMessage[] = [
      {
        id: "project-overview",
        role: "user",
        content: prompt,
        createdAt: new Date().toISOString(),
      },
    ];

    const estimatedInputTokens = estimateTokens(prompt);
    const estimatedTokens = estimatedInputTokens + 2000; // Buffer for response
    const usageCheck = await reserveUsage(request, estimatedTokens);
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
          { status: 429 }
        );
      }

      return Response.json(
        {
          error: errorMessage || "Failed to generate project overview from Claude API.",
        },
        { status: 500 }
      );
    }

    let parsed: DiagramPayload;

    try {
      const start = completion.content.indexOf("{");
      const end = completion.content.lastIndexOf("}");
      const jsonSlice = completion.content.slice(start, end + 1);
      parsed = JSON.parse(jsonSlice);
    } catch {
      
      parsed = {
        overview: "Unable to parse comprehensive analysis. This repository contains code files that work together to form a functional application.",
        architecture: "The project follows a structured architecture with organized components and modules.",
        keyComponents: [
          "Main application entry point",
          "API routes and endpoints",
          "Core business logic",
          "Data models and schemas",
          "UI components",
        ],
        dataFlow: "Data flows through the application layers from user input to storage and back.",
        techStack: ["JavaScript", "TypeScript", "Node.js"],
        dependencies: [],
        mermaidArchitecture: "flowchart TD\n  A[Entry Point] --> B[Core Logic]\n  B --> C[Data Layer]",
        mermaidDataFlow: "sequenceDiagram\n  A->>B: Request\n  B-->>A: Response",
      };
    }

    if (parsed.mermaidArchitecture) {
      parsed.mermaidArchitecture = cleanMermaidCode(parsed.mermaidArchitecture);
    }

    if (parsed.mermaidDataFlow) {
      parsed.mermaidDataFlow = cleanMermaidCode(parsed.mermaidDataFlow);
    }

    setCachedDiagram(cacheKey, parsed);

    return Response.json(parsed);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return Response.json(
      {
        error: errorMessage || "Failed to generate project overview.",
      },
      { status: 500 }
    );
  }
}

