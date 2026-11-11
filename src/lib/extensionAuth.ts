import { createHash, timingSafeEqual } from "crypto";
import { reserveUsage } from "@/lib/usageGuard";

function sha256(value: string): Buffer {
  return createHash("sha256").update(value).digest();
}

/** True when the request carries the shared extension key. */
export function hasExtensionKey(req: Request): boolean {
  const expected = process.env.EXTENSION_SECRET;
  const provided = req.headers.get("x-gitlore-extension-key");
  // Hash both sides so the comparison is constant-time regardless of length.
  return Boolean(expected && provided && timingSafeEqual(sha256(provided), sha256(expected)));
}

/**
 * Reserves usage for an extension caller, from the same per-visitor allowance
 * and site-wide budget the website uses. Resolves to null when the request may
 * proceed, or to the reason it was refused.
 */
export async function extensionUsageDenied(
  req: Request,
  estimatedTokens: number,
): Promise<{ reason: string; retryAfter?: number } | null> {
  const usage = await reserveUsage(req, estimatedTokens);
  if (usage.allowed) return null;
  return { reason: usage.reason || "Usage limit exceeded", retryAfter: usage.retryAfter };
}
