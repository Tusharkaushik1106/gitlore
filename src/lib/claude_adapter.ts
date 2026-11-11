import { randomUUID } from "crypto";
import Anthropic from "@anthropic-ai/sdk";
import type { LLMAdapter } from "./llm_adapter";

const DEFAULT_MODEL = "claude-haiku-5-5";

// Models that accept the server-side refusal fallback parameter.
const SUPPORTS_FALLBACKS = /^claude-(opus-5|fable-5|sonnet-5-5)/;

const SYSTEM_PROMPT =
  "You are gitlore, an expert software explainer. " +
  "You explain repositories in multiple levels of abstraction, " +
  "and you always ground explanations in the provided code context when available.";

let client: Anthropic | undefined;

// One client per server process, so requests reuse its connections.
function createClient(): Anthropic {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY is not configured");
  }
  // The SDK retries 429 / 5xx / connection errors with backoff on its own.
  client ??= new Anthropic({ maxRetries: 3 });
  return client;
}

export const claudeAdapter: LLMAdapter = {
  async chat({ messages, context, config, onChunk }) {
    const client = createClient();
    const model = config?.model ?? process.env.ANTHROPIC_MODEL ?? DEFAULT_MODEL;

    const contextString = context
      ? `Context:\n- type: ${context.type}\n- path: ${context.path ?? "n/a"}\n- symbol: ${
          context.symbolName ?? "n/a"
        }\n\n`
      : "";

    // Callers pass instructions and retrieved context as extra messages, not a
    // real back-and-forth, so everything goes to Claude as one user turn.
    const prompt = contextString + messages.map((m) => m.content).join("\n\n");

    const stream = client.beta.messages.stream({
      model,
      // Thinking shares this budget, so small caps would truncate the answer.
      max_tokens: config?.maxTokens ?? 16000,
      // Low effort keeps thinking short; these are summaries, not hard reasoning.
      output_config: { effort: "low" },
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: prompt }],
      ...(SUPPORTS_FALLBACKS.test(model)
        ? { betas: ["server-side-fallback-2026-07-01"], fallbacks: "default" as const }
        : {}),
    });

    if (onChunk && (config?.streaming ?? true)) {
      stream.on("text", (text) => onChunk({ text, done: false }));
    }

    try {
      const message = await stream.finalMessage();

      if (message.stop_reason === "refusal") {
        throw new Error("Claude declined to answer this request.");
      }

      const content = message.content
        .map((block) => (block.type === "text" ? block.text : ""))
        .join("");

      onChunk?.({ text: "", done: true });

      return {
        id: randomUUID(),
        role: "assistant",
        content,
        createdAt: new Date().toISOString(),
      };
    } catch (error: unknown) {
      if (error instanceof Anthropic.AuthenticationError) {
        throw new Error("Claude rejected the API key. Check ANTHROPIC_API_KEY in .env.local.");
      }
      if (error instanceof Anthropic.NotFoundError) {
        throw new Error(`Model "${model}" not found. Check ANTHROPIC_MODEL in .env.local.`);
      }
      // RateLimitError and the rest keep their `status`, which the routes read.
      throw error;
    }
  },
};
