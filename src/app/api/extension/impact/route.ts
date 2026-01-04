import { NextRequest } from "next/server";
import { geminiAdapter } from "@/lib/gemini_adapter";
import type { NarrationMessage } from "@/lib/types";

export const runtime = "nodejs";

function calculateComplexityScore(codeSnippet: string): number {
  const length = codeSnippet.length;
  const importMatches = codeSnippet.match(/^import\s+/gm) || [];
  const importCount = importMatches.length;

  // Base score from length (0-60 points, normalized for typical code snippets)
  const lengthScore = Math.min(60, (length / 1000) * 60);

  // Import complexity (0-40 points, with diminishing returns)
  const importScore = Math.min(40, importCount * 8);

  const totalScore = Math.min(100, Math.round(lengthScore + importScore));
  return totalScore;
}

export async function POST(req: NextRequest) {
  try {
    const extensionKey = req.headers.get("x-gitlore-extension-key");
    const expectedKey = process.env.EXTENSION_SECRET;

    if (!extensionKey || extensionKey !== expectedKey) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { codeSnippet }: { codeSnippet?: string } = await req.json();

    if (!codeSnippet || typeof codeSnippet !== "string") {
      return Response.json({ error: "Missing codeSnippet" }, { status: 400 });
    }

    const complexityScore = calculateComplexityScore(codeSnippet);

    const messages: NarrationMessage[] = [
      {
        id: "impact-prompt",
        role: "user",
        content: `Analyze this code snippet. Identify specific risks: PII, Auth, External APIs, or Database Writes. Return a JSON object with: riskLabel (string), riskColor (hex string), summary (string). Keep it concise.\n\n\`\`\`\n${codeSnippet}\n\`\`\`\n\nReturn only valid JSON, no markdown formatting.`,
        createdAt: new Date().toISOString(),
      },
    ];

    const completion = await geminiAdapter.chat({
      messages,
      config: {
        model: "gemini-2.5-flash",
        maxTokens: 150,
        streaming: false,
      },
    });

    // Parse JSON response from Gemini
    let riskData: { riskLabel: string; riskColor: string; summary: string };
    try {
      const jsonMatch = completion.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        riskData = JSON.parse(jsonMatch[0]);
      } else {
        // Fallback if JSON parsing fails
        riskData = {
          riskLabel: "Unknown",
          riskColor: "#888888",
          summary: completion.content,
        };
      }
    } catch (parseError) {
      // Fallback if JSON parsing fails
      riskData = {
        riskLabel: "Unknown",
        riskColor: "#888888",
        summary: completion.content,
      };
    }

    return Response.json({
      riskLabel: riskData.riskLabel,
      riskColor: riskData.riskColor,
      summary: riskData.summary,
      score: complexityScore,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Impact endpoint error:", errorMessage);
    return Response.json(
      { error: errorMessage || "Internal server error" },
      { status: 500 }
    );
  }
}

