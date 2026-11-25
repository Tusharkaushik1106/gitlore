import { createMcpHandler } from "mcp-handler";
import type { AuthInfo } from "@modelcontextprotocol/server";
import { z } from "zod";
import { verifyMcpKey } from "@/lib/mcpKeys";
import {
  explainFile,
  scoreRisk,
  checkImpact,
  IMPACT_AREAS,
  MAX_SNIPPET_CHARS,
  MAX_FILE_CHARS,
  UsageDeniedError,
  InvalidModelOutputError,
} from "@/lib/codeReview";

export const runtime = "nodejs";

const INSTRUCTIONS = `gitlore gives a consistent, second-opinion review signal on code.
Use score_risk and check_impact on functions you wrote or changed before committing or opening a pull request.
Treat a risk score of 7 or more, or any change that touches PII, Auth or Database write, as needing the user's attention: tell them before you commit.
Use explain_file for a short purpose / components / architecture summary of one file.
Send one function or one change per call; each call counts against the caller's daily gitlore allowance.`;

const readOnly = { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false };

type ToolCtx = { http?: { authInfo?: AuthInfo } };

/** Usage is metered per key, since connector traffic (e.g. claude.ai) shares the platform's IPs. */
function callerId(ctx: ToolCtx): string {
  const id = ctx.http?.authInfo?.clientId;
  if (!id) throw new Error("gitlore MCP call arrived without a verified key");
  return id;
}

/** Runs a check and shapes the result, or the failure, the way MCP clients expect. */
async function respond<T extends Record<string, unknown>>(run: () => Promise<T>, summarize: (r: T) => string) {
  try {
    const result = await run();
    return { content: [{ type: "text" as const, text: summarize(result) }], structuredContent: result };
  } catch (error) {
    const text =
      error instanceof UsageDeniedError
        ? `gitlore usage limit reached: ${error.reason}${error.retryAfter ? ` Try again in ${error.retryAfter}s.` : ""}`
        : error instanceof InvalidModelOutputError
          ? "gitlore could not read the model's answer for this code. Try again, or send a smaller snippet."
          : "gitlore failed to analyze this code. Try again shortly.";
    if (!(error instanceof UsageDeniedError)) console.error("MCP tool error:", error);
    return { content: [{ type: "text" as const, text }], isError: true };
  }
}

const codeInput = z.object({
  code: z
    .string()
    .min(1)
    .max(MAX_SNIPPET_CHARS)
    .describe(`One function or one change, up to ${MAX_SNIPPET_CHARS} characters. Split larger changes into several calls.`),
});

const handler = createMcpHandler(
  (server) => {
    server.registerTool(
      "score_risk",
      {
        title: "Score risk",
        description:
          "Rate how risky one function or change is, from 1 (safe) to 10 (high risk), with a one-line reason. Use before committing code you changed; 7 or more means a human should look.",
        inputSchema: codeInput,
        outputSchema: z.object({
          score: z.number().int().min(1).max(10).describe("1 = safe, 10 = high risk"),
          reason: z.string(),
        }),
        annotations: readOnly,
      },
      async ({ code }, ctx) =>
        respond(
          () => scoreRisk(callerId(ctx), code),
          (r) => `Risk ${r.score}/10: ${r.reason}`,
        ),
    );

    server.registerTool(
      "check_impact",
      {
        title: "Check impact",
        description: `Find which sensitive areas a snippet touches (${IMPACT_AREAS.join(", ")}), with a short risk label and summary, plus a 0-100 complexity score from its length and imports.`,
        inputSchema: codeInput,
        outputSchema: z.object({
          riskLabel: z.string(),
          summary: z.string(),
          touches: z.array(z.enum(IMPACT_AREAS)),
          complexity: z.number().int().min(0).max(100),
        }),
        annotations: readOnly,
      },
      async ({ code }, ctx) =>
        respond(
          async () => {
            const r = await checkImpact(callerId(ctx), code);
            return { riskLabel: r.riskLabel, summary: r.summary, touches: r.touches, complexity: r.score };
          },
          (r) =>
            `${r.riskLabel}. Touches: ${r.touches.length ? r.touches.join(", ") : "none of " + IMPACT_AREAS.join(", ")}. ` +
            `Complexity ${r.complexity}/100. ${r.summary}`,
        ),
    );

    server.registerTool(
      "explain_file",
      {
        title: "Explain file",
        description:
          "Summarize one source file: its purpose, key components, and how it fits into the larger system. Answers are cached for 24 hours per file content.",
        inputSchema: z.object({
          path: z.string().max(300).optional().describe("Path of the file in its repo, e.g. src/lib/auth.ts"),
          content: z.string().min(1).max(MAX_FILE_CHARS).describe("Full text of the file"),
        }),
        outputSchema: z.object({
          purpose: z.string(),
          components: z.string(),
          architecture: z.string(),
          truncated: z.boolean().describe("True when only the start of a large file was read"),
        }),
        annotations: readOnly,
      },
      async ({ path, content }, ctx) =>
        respond(
          () => explainFile(callerId(ctx), content, path),
          (r) =>
            `Purpose: ${r.purpose}\nComponents: ${r.components}\nArchitecture: ${r.architecture}` +
            (r.truncated ? "\n(Only the start of this large file was read.)" : ""),
        ),
    );
  },
  { serverInfo: { name: "gitlore", version: "1.0.0" }, instructions: INSTRUCTIONS },
);

function unauthorized(req: Request): Response {
  return Response.json(
    {
      jsonrpc: "2.0",
      error: {
        code: -32001,
        message: `Missing or invalid gitlore key. Get your personal connection link at ${new URL(req.url).origin}/#mcp`,
      },
      id: null,
    },
    { status: 401 },
  );
}

/**
 * Serves /api/mcp (key sent as `Authorization: Bearer <key>`) and /api/mcp/<key>
 * (key in the URL, for clients such as claude.ai connectors that can't send headers).
 */
async function authorized(req: Request, { params }: { params: Promise<{ key?: string[] }> }): Promise<Response> {
  const segments = (await params).key ?? [];
  if (segments.length > 1) return unauthorized(req);
  const key = segments[0] ?? req.headers.get("authorization")?.match(/^Bearer\s+(\S+)$/i)?.[1];
  const keyId = verifyMcpKey(key);
  if (!keyId) return unauthorized(req);

  // mcp-handler hands `req.auth` to tools as ctx.http.authInfo, the same slot withMcpAuth fills.
  (req as Request & { auth?: AuthInfo }).auth = { token: key!, clientId: `mcp:${keyId}`, scopes: [] };
  return handler(req);
}

export { authorized as GET, authorized as POST, authorized as DELETE };
