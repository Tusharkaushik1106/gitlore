// Self-check for the usage limiter. Run with: node scripts/check-limits.ts
import assert from "node:assert/strict";
import {
  checkAndRecordUsage,
  getUserUsage,
  recordActualUsage,
  DAILY_TOKEN_LIMIT,
  RATE_LIMIT_REQUESTS,
} from "../src/lib/tokenUsage.ts";

// A burst of parallel requests: only the per-minute allowance gets through.
const burst = await Promise.all(Array.from({ length: 15 }, () => checkAndRecordUsage("a", 100)));
assert.equal(burst.filter((r) => r.allowed).length, RATE_LIMIT_REQUESTS);
assert.ok(burst.find((r) => !r.allowed)?.retryAfter);

// Refused requests are not charged.
assert.equal((await getUserUsage("a")).tokensUsed, RATE_LIMIT_REQUESTS * 100);

// A single oversized request is refused outright.
assert.equal((await checkAndRecordUsage("b", DAILY_TOKEN_LIMIT + 1)).allowed, false);

// The daily token limit holds, and one visitor's usage does not affect another's.
assert.equal((await checkAndRecordUsage("c", 40000)).allowed, true);
assert.equal((await checkAndRecordUsage("c", 20000)).allowed, false);
assert.equal((await checkAndRecordUsage("d", 20000)).allowed, true);

// Corrections after the response never push usage below zero.
await recordActualUsage("d", -999999);
assert.equal((await getUserUsage("d")).tokensUsed, 0);

// Custom limits (used for the site-wide budget) are respected.
assert.equal((await checkAndRecordUsage("site", 600, { dailyTokens: 1000 })).allowed, true);
assert.equal((await checkAndRecordUsage("site", 600, { dailyTokens: 1000 })).allowed, false);

console.log("usage limiter: all checks passed");
