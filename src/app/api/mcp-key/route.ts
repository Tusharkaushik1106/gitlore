import { createMcpKey, mcpKeysEnabled } from "@/lib/mcpKeys";
import { getClientId } from "@/lib/usageGuard";
import { checkAndRecordUsage } from "@/lib/tokenUsage";

export const runtime = "nodejs";

/** Issues a personal MCP key. Each key is metered on its own, so cap how many one visitor can mint. */
export async function POST(req: Request) {
  if (!mcpKeysEnabled()) {
    return Response.json({ error: "The gitlore MCP server isn't switched on yet." }, { status: 503 });
  }

  const quota = await checkAndRecordUsage(`mcp-key:${getClientId(req)}`, 0, { dailyRequests: 5, perMinute: 3 });
  if (!quota.allowed) {
    return Response.json(
      { error: "You've created several connection links today. Reuse one of those, or try again tomorrow." },
      { status: 429 },
    );
  }

  return Response.json({ key: createMcpKey() });
}
