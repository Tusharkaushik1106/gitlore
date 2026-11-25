import { createHmac, randomBytes, timingSafeEqual } from "crypto";

/**
 * Self-serve MCP keys: `gl_` + a random id + an HMAC of that id.
 * The signature proves gitlore issued the key, so nothing needs storing.
 * shortcut: the only revocation is rotating MCP_SIGNING_SECRET, which revokes every key;
 * add a revoked-id list if single keys ever need revoking.
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
  return timingSafeEqual(Buffer.from(signature), Buffer.from(sign(id, secret))) ? id : null;
}
