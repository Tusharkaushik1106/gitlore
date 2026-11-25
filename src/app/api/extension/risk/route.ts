import { NextRequest } from "next/server";
import { hasExtensionKey } from "@/lib/extensionAuth";
import { getClientId } from "@/lib/usageGuard";
import { scoreRisk, UsageDeniedError, InvalidModelOutputError } from "@/lib/codeReview";

export const runtime = "nodejs";

// The extension renders whatever score and reason come back, so failures answer 200 with a readable reason.
export async function POST(req: NextRequest) {
  if (!hasExtensionKey(req)) {
    return Response.json({ score: 0, reason: "Unauthorized access." }, { status: 401 });
  }

  let functionCode: unknown;
  try {
    functionCode = (await req.json())?.functionCode;
  } catch {
    return Response.json({ score: 0, reason: "Invalid request body." });
  }
  if (!functionCode || typeof functionCode !== "string") {
    return Response.json({ score: 0, reason: "No code selected." });
  }

  try {
    return Response.json(await scoreRisk(getClientId(req), functionCode));
  } catch (error: unknown) {
    if (error instanceof UsageDeniedError) {
      return Response.json({ score: 0, reason: error.reason }, { status: 429 });
    }
    if (error instanceof InvalidModelOutputError) {
      console.error("Risk endpoint: unparseable model reply:", error.message);
      return Response.json({ score: 5, reason: "AI returned invalid format. Check server logs." });
    }
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Risk endpoint error:", error);
    return Response.json({ score: 0, reason: `AI service error: ${message}` });
  }
}
