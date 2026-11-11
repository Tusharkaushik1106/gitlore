import { createHash, timingSafeEqual } from "crypto";
import { checkAndRecordUsage } from "@/lib/tokenUsage";

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
 * Reserves usage for an extension caller. Resolves to null when the request
 * may proceed, or to the reason it was refused.
 */
export async function extensionUsageDenied(
  req: Request,
  estimatedTokens: number,
): Promise<{ reason: string; retryAfter?: number } | null> {
  // ponytail: the extension key is shared by every install, so usage is metered
  // per client IP. x-forwarded-for is only trustworthy behind a proxy that sets
  // it (Vercel does); move to per-user extension tokens if abuse shows up.
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const usage = await checkAndRecordUsage(`ext:${ip}`, estimatedTokens);
  if (usage.allowed) return null;
  return { reason: usage.reason || "Usage limit exceeded", retryAfter: usage.retryAfter };
}
