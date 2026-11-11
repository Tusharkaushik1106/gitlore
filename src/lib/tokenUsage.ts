// Usage limits, held in server memory. Nothing about visitors is stored anywhere.
//
// ponytail: counters live per server instance and reset when it restarts, so on
// Vercel the effective limit is (limit x number of warm instances). They slow
// abuse down; the hard ceiling on spend is the monthly limit set in the Claude
// Console. Move to a shared store (e.g. Redis) if exact limits ever matter.

export const DAILY_TOKEN_LIMIT = 50000;
export const DAILY_REQUEST_LIMIT = 100;
const RATE_LIMIT_WINDOW = 60;
export const RATE_LIMIT_REQUESTS = 10;

type Counter = { tokens: number; requests: number; windowStart: number; windowCount: number };

const counters = new Map<string, Counter>();
let countersDay = "";

/** Returns the caller's counter, starting everyone afresh when the UTC day changes. */
function counterFor(userId: string): Counter {
  const today = new Date().toISOString().slice(0, 10);
  if (today !== countersDay) {
    counters.clear();
    countersDay = today;
  }
  let counter = counters.get(userId);
  if (!counter) {
    counter = { tokens: 0, requests: 0, windowStart: Date.now(), windowCount: 0 };
    counters.set(userId, counter);
  }
  return counter;
}

export function estimateTokens(text: string): number {
  if (!text || text.length === 0) return 0;

  const codePattern = /[{}[\]();,=<>]/g;
  const codeMatches = (text.match(codePattern) || []).length;
  const codeRatio = Math.min(codeMatches / text.length, 0.5);

  const avgCharsPerToken = 3.5 + (1 - codeRatio) * 1.5;

  return Math.ceil(text.length / avgCharsPerToken);
}

/** Adjusts a reservation once the real size of the response is known. */
export async function recordActualUsage(userId: string, tokenDifference: number): Promise<void> {
  const counter = counterFor(userId);
  counter.tokens = Math.max(0, counter.tokens + tokenDifference);
}

/**
 * Reserves `estimatedTokens` against the caller's daily and per-minute limits.
 * The check and the update happen in one synchronous step, so parallel requests
 * on the same instance cannot both pass a check only one of them fits under.
 */
export async function checkAndRecordUsage(
  userId: string,
  estimatedTokens: number,
  limits: { dailyTokens?: number; dailyRequests?: number; perMinute?: number } = {}
): Promise<{ allowed: boolean; reason?: string; retryAfter?: number }> {
  const dailyTokens = limits.dailyTokens ?? DAILY_TOKEN_LIMIT;
  const dailyRequests = limits.dailyRequests ?? DAILY_REQUEST_LIMIT;
  const perMinute = limits.perMinute ?? RATE_LIMIT_REQUESTS;

  const tokens = Math.max(0, Math.ceil(estimatedTokens));
  if (!Number.isFinite(tokens) || tokens > dailyTokens) {
    return {
      allowed: false,
      reason: `Request too large. A single request may use at most ${dailyTokens} tokens.`,
    };
  }

  const counter = counterFor(userId);
  const now = Date.now();

  const windowAge = (now - counter.windowStart) / 1000;
  if (windowAge > RATE_LIMIT_WINDOW) {
    counter.windowStart = now;
    counter.windowCount = 0;
  } else if (counter.windowCount >= perMinute) {
    return {
      allowed: false,
      reason: `Rate limit exceeded. Maximum ${perMinute} requests per ${RATE_LIMIT_WINDOW} seconds.`,
      retryAfter: Math.max(1, Math.ceil(RATE_LIMIT_WINDOW - windowAge)),
    };
  }

  if (counter.requests >= dailyRequests) {
    return {
      allowed: false,
      reason: `Daily request limit exceeded. You've made ${counter.requests}/${dailyRequests} requests today.`,
    };
  }
  if (counter.tokens + tokens > dailyTokens) {
    return {
      allowed: false,
      reason: `Daily token limit exceeded. You've used ${counter.tokens}/${dailyTokens} tokens today.`,
    };
  }

  counter.tokens += tokens;
  counter.requests += 1;
  counter.windowCount += 1;
  return { allowed: true };
}

export async function getUserUsage(userId: string): Promise<{
  tokensUsed: number;
  tokensRemaining: number;
  requestCount: number;
  requestsRemaining: number;
}> {
  const counter = counterFor(userId);
  return {
    tokensUsed: counter.tokens,
    tokensRemaining: Math.max(0, DAILY_TOKEN_LIMIT - counter.tokens),
    requestCount: counter.requests,
    requestsRemaining: Math.max(0, DAILY_REQUEST_LIMIT - counter.requests),
  };
}
