import { NextRequest } from "next/server";
import { hasExtensionKey } from "@/lib/extensionAuth";
import { getClientId } from "@/lib/usageGuard";
import { explainFile, UsageDeniedError } from "@/lib/codeReview";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    if (!hasExtensionKey(req)) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: { fileContent?: string; filePath?: string } = await req.json();
    const filePath = typeof body.filePath === "string" ? body.filePath.slice(0, 300) : undefined;
    if (!body.fileContent || typeof body.fileContent !== "string") {
      return Response.json({ error: "Missing fileContent" }, { status: 400 });
    }

    const { purpose, components, architecture } = await explainFile(getClientId(req), body.fileContent, filePath);
    return Response.json({ purpose, components, architecture });
  } catch (error: unknown) {
    if (error instanceof UsageDeniedError) {
      return Response.json({ error: error.reason, retryAfter: error.retryAfter }, { status: 429 });
    }
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Narrate endpoint error:", errorMessage);
    return Response.json({
      purpose: "Error analyzing file.",
      components: "Check server logs.",
      architecture: errorMessage,
    });
  }
}
