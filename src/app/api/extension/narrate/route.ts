import { NextRequest } from "next/server";
import { geminiAdapter } from "@/lib/gemini_adapter";
import type { NarrationMessage } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const extensionKey = req.headers.get("x-gitlore-extension-key");
    const expectedKey = process.env.EXTENSION_SECRET;

    if (!extensionKey || extensionKey !== expectedKey) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { fileContent, filePath }: { fileContent?: string; filePath?: string } =
      await req.json();

    console.log("Analyze Request:", filePath, "Length:", fileContent?.length);

    if (!fileContent || typeof fileContent !== "string") {
      return Response.json({ error: "Missing fileContent" }, { status: 400 });
    }

    const messages: NarrationMessage[] = [
      {
        id: "narrate-prompt",
        role: "user",
        content: `You are an expert code narrator. Summarize this file. Use the following format strictly: <br>• <b>Purpose:</b> [One sentence]<br>• <b>Key Components:</b> [List main functions/classes]<br>• <b>Architecture:</b> [How it fits the system]. Keep it concise.\n\nFile: ${filePath || "unknown"}\n\n\`\`\`\n${fileContent}\n\`\`\``,
        createdAt: new Date().toISOString(),
      },
    ];

    const completion = await geminiAdapter.chat({
      messages,
      config: {
        model: "gemini-2.5-flash",
        maxTokens: 1000,
        streaming: false,
      },
    });

    const summary = completion.content;
    console.log("AI Response:", summary);

    return Response.json({ summary });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Narrate endpoint error:", errorMessage);
    return Response.json(
      { error: errorMessage || "Internal server error" },
      { status: 500 }
    );
  }
}

