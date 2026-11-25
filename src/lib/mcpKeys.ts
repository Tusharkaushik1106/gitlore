import { createHmac, randomBytes, timingSafeEqual } from "crypto";

/**
 * Self-serve MCP keys: `gl_` + a random id + an HMAC of that id.
 * The signature proves gitlore issued the key, so nothing needs storing.
 * Revoke one key by adding it (or its link) to MCP_REVOKED_KEYS, comma-separated;
 * rotate MCP_SIGNING_SECRET to revoke every key at once.
 */

const KEY_FORMAT = /^gl_([0-9a-f]{32})([0-9a-f]{32})$/;

function sign(id: string, secret: string): string {
  return createHmac("sha256", secret).update(`mcp-key:${id}`).digest("hex").slice(0, 32);
}

function signingSecret(): string | undefined {
  const secret = process.env.MCP_SIGNING_SECRET;
  return secret && secret.length >= 32 ? secret : undefined;
}

export function mcpKeysEnabled(): boolean {
  return Boolean(signingSecret());
}

export function createMcpKey(): string {
  const secret = signingSecret();
  if (!secret) throw new Error("MCP_SIGNING_SECRET is not configured (needs 32+ characters)");
  const id = randomBytes(16).toString("hex");
  return `gl_${id}${sign(id, secret)}`;
}

/** Returns the key's id when gitlore issued it, otherwise null. */
export function verifyMcpKey(key: string | undefined): string | null {
  const secret = signingSecret();
  const match = key?.match(KEY_FORMAT);
  if (!secret || !match) return null;
  const [, id, signature] = match;
  if (!timingSafeEqual(Buffer.from(signature), Buffer.from(sign(id, secret)))) return null;
  return revokedIds().has(id) ? null : id;
}

/** Ids of keys listed in MCP_REVOKED_KEYS; entries may be keys, links, or bare ids. */
function revokedIds(): Set<string> {
  const ids = (process.env.MCP_REVOKED_KEYS ?? "").match(/[0-9a-f]{64}|[0-9a-f]{32}/g) ?? [];
  return new Set(ids.map((hex) => hex.slice(0, 32)));
}

/**
 * True for a request a browser sent from another site. Browsers label requests with
 * Sec-Fetch-Site (or at least Origin); MCP clients and other tools send neither.
 */
export function isCrossSiteBrowserRequest(req: Request): boolean {
  const fetchSite = req.headers.get("sec-fetch-site");
  if (fetchSite) return fetchSite !== "same-origin" && fetchSite !== "none";
  const origin = req.headers.get("origin");
  if (!origin) return false;
  try {
    return new URL(origin).host !== req.headers.get("host");
  } catch {
    return true;
  }
}
