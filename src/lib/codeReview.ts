import crypto from "crypto";
import { claudeAdapter } from "@/lib/claude_adapter";
import { reserveUsageFor } from "@/lib/usageGuard";
import { estimateTokens } from "@/lib/tokenUsage";
import type { NarrationMessage } from "@/lib/types";

/**
 * Code review checks shared by the VS Code extension routes and the MCP server:
 * explain a file, score a function's risk, and flag what a snippet touches.
 */

export const MAX_SNIPPET_CHARS = 5000;
export const MAX_FILE_CHARS = 200_000;
const FILE_PROMPT_CHARS = 4000;

export class UsageDeniedError extends Error {
  constructor(public reason: string, public retryAfter?: number) {
    super(reason);
  }
}

export class InvalidModelOutputError extends Error {}

/**
 * Every check takes a `callerId`: the id usage is metered against
 * (getClientId(req) for the website and extension, a key id for MCP).
 */
async function reserve(callerId: string, promptText: string, overhead: number): Promise<void> {
  const usage = await reserveUsageFor(callerId, estimateTokens(promptText) + overhead);
  if (!usage.allowed) {
    throw new UsageDeniedError(usage.reason || "Usage limit exceeded", usage.retryAfter);
  }
}

async function ask(id: string, content: string): Promise<string> {
  const messages: NarrationMessage[] = [
    { id, role: "user", content, createdAt: new Date().toISOString() },
  ];
  const completion = await claudeAdapter.chat({ messages, config: { streaming: false } });
  return completion.content ?? "";
}

/** Pulls the JSON object out of a model reply that may carry code fences or extra prose. */
export function extractJson(text: string): Record<string, unknown> {
  const stripped = text.replace(/```json|```/g, "").trim();
  const first = stripped.indexOf("{");
  const last = stripped.lastIndexOf("}");
  if (first === -1 || last <= first) throw new InvalidModelOutputError("No JSON object in model reply");
  try {
    return JSON.parse(stripped.slice(first, last + 1));
  } catch {
    throw new InvalidModelOutputError("Model reply was not valid JSON");
  }
}

// ── explain a file ──────────────────────────────────────────────────────────

export type FileExplanation = { purpose: string; components: string; architecture: string };

const explanationCache = new Map<string, { summary: FileExplanation; timestamp: number }>();
const CACHE_TTL = 24 * 60 * 60 * 1000;

// Strips comments and collapses whitespace so more code fits in the prompt.
function minifyCode(code: string): string {
  return code
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\/\/.*/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export async function explainFile(
  callerId: string,
  fileContent: string,
  filePath?: string,
): Promise<FileExplanation & { truncated: boolean }> {
  const cleanCode = minifyCode(fileContent.slice(0, MAX_FILE_CHARS));
  const truncated = cleanCode.length > FILE_PROMPT_CHARS;
  const hash = crypto.createHash("sha256").update(cleanCode).digest("hex");

  const cached = explanationCache.get(hash);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) return { ...cached.summary, truncated };

  const promptCode = cleanCode.substring(0, FILE_PROMPT_CHARS);
  await reserve(callerId, promptCode, 500);

  const reply = await ask(
    "narrate-prompt",
    `You are a senior code architect. Analyze this file and return a strictly formatted JSON object.

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
${promptCode}${truncated ? "\n[... truncated for brevity]" : ""}`,
  );

  const data = extractJson(reply);
  const summary: FileExplanation = {
    purpose: typeof data.purpose === "string" && data.purpose ? data.purpose : "Analysis failed",
    components: typeof data.components === "string" && data.components ? data.components : "None detected",
    architecture:
      typeof data.architecture === "string" && data.architecture ? data.architecture : "Standalone utility",
  };

  explanationCache.set(hash, { summary, timestamp: Date.now() });
  if (explanationCache.size > 1000) {
    const now = Date.now();
    for (const [key, value] of explanationCache) {
      if (now - value.timestamp >= CACHE_TTL) explanationCache.delete(key);
    }
  }
  return { ...summary, truncated };
}

// ── score a function's risk ─────────────────────────────────────────────────

export type RiskScore = { score: number; reason: string };

export async function scoreRisk(callerId: string, code: string): Promise<RiskScore> {
  const functionCode = code.slice(0, MAX_SNIPPET_CHARS);
  await reserve(callerId, functionCode, 500);

  const reply = await ask(
    "risk-prompt",
    `You are a senior code auditor. Analyze the following function.
Return a JSON object with this exact structure: { "score": number, "reason": "string" }.
Score is 1-10 (10 is high risk). Keep reason under 20 words.
Do NOT use Markdown blocks. Just raw JSON.

Code:
\`\`\`
${functionCode}
\`\`\``,
  );

  const data = extractJson(reply);
  if (typeof data.score !== "number" || typeof data.reason !== "string") {
    throw new InvalidModelOutputError("Model reply was missing score or reason");
  }
  return { score: Math.max(1, Math.min(10, Math.round(data.score))), reason: data.reason };
}

// ── flag what a snippet touches ─────────────────────────────────────────────

export const IMPACT_AREAS = ["PII", "Auth", "External API", "Database write"] as const;
export type ImpactArea = (typeof IMPACT_AREAS)[number];

export type ImpactReport = {
  riskLabel: string;
  riskColor: string;
  summary: string;
  touches: ImpactArea[];
  /** 0-100 from length and import count; computed locally, not by the model. */
  score: number;
};

function complexityScore(codeSnippet: string): number {
  const lengthScore = Math.min(60, (codeSnippet.length / 1000) * 60);
  const importScore = Math.min(40, (codeSnippet.match(/^import\s+/gm) || []).length * 8);
  return Math.min(100, Math.round(lengthScore + importScore));
}

export async function checkImpact(callerId: string, code: string): Promise<ImpactReport> {
  const codeSnippet = code.slice(0, MAX_SNIPPET_CHARS);
  await reserve(callerId, codeSnippet, 500);

  const reply = await ask(
    "impact-prompt",
    `Analyze this code snippet. Identify specific risks: PII, Auth, External APIs, or Database Writes. Return a JSON object with: riskLabel (string), riskColor (hex string), summary (string), touches (array containing only the values ${IMPACT_AREAS.map((a) => `"${a}"`).join(", ")} that the code actually involves; empty array if none). Keep it concise.\n\n\`\`\`\n${codeSnippet}\n\`\`\`\n\nReturn only valid JSON, no markdown formatting.`,
  );

  const score = complexityScore(codeSnippet);
  try {
    const data = extractJson(reply);
    const touches = Array.isArray(data.touches)
      ? IMPACT_AREAS.filter((area) => (data.touches as unknown[]).includes(area))
      : [];
    return {
      riskLabel: typeof data.riskLabel === "string" ? data.riskLabel : "Unknown",
      riskColor: typeof data.riskColor === "string" ? data.riskColor : "#888888",
      summary: typeof data.summary === "string" ? data.summary : reply,
      touches,
      score,
    };
  } catch (error) {
    if (!(error instanceof InvalidModelOutputError)) throw error;
    // The prose reply is still useful to a reader, so keep it rather than fail.
    return { riskLabel: "Unknown", riskColor: "#888888", summary: reply, touches: [], score };
  }
}
