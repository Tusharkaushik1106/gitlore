import { NextRequest } from "next/server";
import { hasExtensionKey } from "@/lib/extensionAuth";
import { getClientId } from "@/lib/usageGuard";
import { checkImpact, UsageDeniedError } from "@/lib/codeReview";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    if (!hasExtensionKey(req)) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: { codeSnippet?: string } = await req.json();
    if (!body.codeSnippet || typeof body.codeSnippet !== "string") {
      return Response.json({ error: "Missing codeSnippet" }, { status: 400 });
    }

    const { riskLabel, riskColor, summary, score } = await checkImpact(getClientId(req), body.codeSnippet);
    return Response.json({ riskLabel, riskColor, summary, score });
  } catch (error: unknown) {
    if (error instanceof UsageDeniedError) {
      return Response.json({ error: error.reason, retryAfter: error.retryAfter }, { status: 429 });
    }
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Impact endpoint error:", errorMessage);
    return Response.json({ error: errorMessage || "Internal server error" }, { status: 500 });
  }
}
