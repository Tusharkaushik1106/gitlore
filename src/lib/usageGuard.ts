import { createHash } from "crypto";
import { checkAndRecordUsage } from "@/lib/tokenUsage";

// There are no accounts, so one visitor can look like many by rotating IPs.
// This site-wide budget is the hard ceiling on what a day of traffic can spend.
const GLOBAL_LIMITS = {
  dailyTokens: Number(process.env.GLOBAL_DAILY_TOKEN_LIMIT) || 2_000_000,
  dailyRequests: 20_000,
  perMinute: 120,
};

/**
 * Stable anonymous id for the caller, derived from their IP address.
 * The address is hashed so raw IPs are never kept, even in memory.
 */
export function getClientId(req: Request): string {
  // ponytail: trusts the proxy's headers. Vercel overwrites both, so they cannot
  // be spoofed there; behind any other host, confirm the proxy does the same.
  const raw =
    req.headers.get("x-real-ip") ||
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown";
  // An IPv6 user controls a whole /64, so meter the prefix rather than the address.
  const ip = raw.includes(":") ? raw.split(":").slice(0, 4).join(":") : raw;
  const hash = createHash("sha256")
    .update(`${process.env.USAGE_SALT ?? ""}:${ip}`)
    .digest("hex")
    .slice(0, 32);
  return `anon:${hash}`;
}

/** Reserves tokens against the caller's own limits, then the site-wide budget. */
export async function reserveUsage(
  req: Request,
  estimatedTokens: number,
): Promise<{ allowed: boolean; reason?: string; retryAfter?: number }> {
  const own = await checkAndRecordUsage(getClientId(req), estimatedTokens);
  if (!own.allowed) return own;

  const site = await checkAndRecordUsage("global", estimatedTokens, GLOBAL_LIMITS);
  if (!site.allowed) {
    return {
      allowed: false,
      reason: "gitlore has reached its shared capacity for now. Please try again later.",
      retryAfter: site.retryAfter,
    };
  }
  return { allowed: true };
}
