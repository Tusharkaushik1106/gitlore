import { NextRequest } from "next/server";
import { getUserUsage } from "@/lib/tokenUsage";
import { getClientId } from "@/lib/usageGuard";

// Always reports the caller's own usage; there is no way to ask about anyone else.
export async function GET(req: NextRequest) {
  const usage = await getUserUsage(getClientId(req));
  return Response.json(usage, { headers: { "Cache-Control": "no-store" } });
}
