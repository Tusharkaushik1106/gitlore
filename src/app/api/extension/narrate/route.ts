import { NextRequest } from "next/server";
import { claudeAdapter } from "@/lib/claude_adapter";
import type { NarrationMessage } from "@/lib/types";
import crypto from "crypto";
import { hasExtensionKey, extensionUsageDenied } from "@/lib/extensionAuth";
import { estimateTokens } from "@/lib/tokenUsage";

export const runtime = "nodejs";

// Simple In-Memory Cache (For Production, use Redis)
const responseCache = new Map<string, { summary: { purpose: string; components: string; architecture: string }, timestamp: number }>();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 Hours

// Minify code by stripping comments and collapsing whitespace
function minifyCode(code: string): string {
  return code
    .replace(/\/\*[\s\S]*?\*\//g, '') // Remove block comments
    .replace(/\/\/.*/g, '')            // Remove line comments
    .replace(/\s+/g, ' ')               // Collapse whitespace
    .trim();
}

export async function POST(req: NextRequest) {
  try {
    if (!hasExtensionKey(req)) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: { fileContent?: string; filePath?: string } = await req.json();
    // Bound what gets minified, hashed and placed in the prompt.
    const fileContent =
      typeof body.fileContent === "string" ? body.fileContent.slice(0, 200_000) : undefined;
    const filePath = typeof body.filePath === "string" ? body.filePath.slice(0, 300) : undefined;

    console.log("Analyze Request:", filePath, "Length:", fileContent?.length);

    if (!fileContent || typeof fileContent !== "string") {
      return Response.json({ error: "Missing fileContent" }, { status: 400 });
    }

    // 1. Minify Code (Saves Tokens)
    const cleanCode = minifyCode(fileContent);

    // 2. Generate Hash (Semantic ID)
    const hash = crypto.createHash('sha256').update(cleanCode).digest('hex');
    console.log("Code Hash:", hash.substring(0, 8) + "...");

    // 3. Check Cache (Load Shedding)
    const cached = responseCache.get(hash);
    if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
      console.log("Cache HIT for hash:", hash.substring(0, 8) + "...");
      return Response.json(cached.summary);
    }

    console.log("Cache MISS - calling API for hash:", hash.substring(0, 8) + "...");

    // Truncate minified content to prevent token limit issues
    const truncatedContent = cleanCode.substring(0, 4000);

    const denied = await extensionUsageDenied(req, estimateTokens(truncatedContent) + 500);
    if (denied) {
      return Response.json({ error: denied.reason, retryAfter: denied.retryAfter }, { status: 429 });
    }

    const messages: NarrationMessage[] = [
      {
        id: "narrate-prompt",
        role: "user",
        content: `You are a senior code architect. Analyze this file and return a strictly formatted JSON object.

REQUIRED JSON STRUCTURE:
{
  "purpose": "One clear sentence explaining what this file does.",
  "components": "List of key functions/classes/variables.",
  "architecture": "One sentence on how this fits into the larger system."
}

RULES:
1. Do NOT use Markdown.
2. Do NOT write HTML tags.
3. Keep it concise (under 20 words per section).
4. Return ONLY valid JSON.
5. Ensure each field is a complete sentence.

File: ${filePath || "unknown"}

Code:
${truncatedContent}${cleanCode.length > 4000 ? "\n[... truncated for brevity]" : ""}`,
        createdAt: new Date().toISOString(),
      },
    ];

    const completion = await claudeAdapter.chat({
      messages,
      config: {
        streaming: false,
      },
    });

    const aiResponse = completion.content;
    console.log("AI Response:", aiResponse);

    // Clean and parse JSON response
    let cleanJson = aiResponse.replace(/```json|```/g, '').trim();
    const firstBrace = cleanJson.indexOf('{');
    const lastBrace = cleanJson.lastIndexOf('}');
    
    if (firstBrace !== -1 && lastBrace !== -1) {
      cleanJson = cleanJson.substring(firstBrace, lastBrace + 1);
    }

    const data = JSON.parse(cleanJson);
    
    // Safety check: ensure all fields exist
    const summary = {
      purpose: data.purpose || 'Analysis failed',
      components: data.components || 'None detected',
      architecture: data.architecture || 'Standalone utility'
    };

    // 4. Store in Cache
    responseCache.set(hash, { summary, timestamp: Date.now() });
    
    // Cleanup old cache entries (simple LRU-like cleanup)
    if (responseCache.size > 1000) {
      const now = Date.now();
      for (const [key, value] of responseCache.entries()) {
        if (now - value.timestamp >= CACHE_TTL) {
          responseCache.delete(key);
        }
      }
    }

    return Response.json(summary);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Narrate endpoint error:", errorMessage);
    return Response.json({
      purpose: 'Error analyzing file.',
      components: 'Check server logs.',
      architecture: errorMessage
    });
  }
}

