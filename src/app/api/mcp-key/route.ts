import { createMcpKey, mcpKeysEnabled, isCrossSiteBrowserRequest } from "@/lib/mcpKeys";
import { getClientId } from "@/lib/usageGuard";
import { checkAndRecordUsage } from "@/lib/tokenUsage";

export const runtime = "nodejs";

const NO_STORE = { "Cache-Control": "no-store" };

function reply(body: Record<string, string>, status = 200): Response {
  return Response.json(body, { status, headers: NO_STORE });
}

/**
 * Issues a personal MCP key. Each key is metered on its own, so the number of keys
 * is capped per visitor and site-wide, and only gitlore's own page may ask for one.
 */
export async function POST(req: Request) {
  // Refuse other sites' pages, so they can't spend a visitor's link allowance.
  if (isCrossSiteBrowserRequest(req)) {
    return reply({ error: "Connection links can only be created on gitlore itself." }, 403);
  }

  if (!mcpKeysEnabled()) {
    return reply({ error: "The gitlore MCP server isn't switched on yet." }, 503);
  }

  const visitor = await checkAndRecordUsage(`mcp-key:${getClientId(req)}`, 0, { dailyRequests: 5, perMinute: 3 });
  if (!visitor.allowed) {
    return reply(
      { error: "You've created several connection links today. Reuse one of those, or try again tomorrow." },
      429,
    );
  }

  const site = await checkAndRecordUsage("mcp-key:global", 0, { dailyRequests: 1_000, perMinute: 30 });
  if (!site.allowed) {
    return reply({ error: "Too many connection links are being created right now. Try again in a little while." }, 429);
  }

  return reply({ key: createMcpKey() });
}
