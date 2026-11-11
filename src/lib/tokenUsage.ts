import { Pool } from "pg";
import { config } from "@/lib/config";

const databaseUrl = config.database.url;
let pool: Pool | null = null;

function getPool(): Pool | null {
  if (!databaseUrl) return null;
  if (!pool) {
    pool = new Pool({ connectionString: databaseUrl });
  }
  return pool;
}

export function estimateTokens(text: string): number {
  if (!text || text.length === 0) return 0;
  
  const codePattern = /[{}[\]();,=<>]/g;
  const codeMatches = (text.match(codePattern) || []).length;
  const codeRatio = Math.min(codeMatches / text.length, 0.5);
  
  const avgCharsPerToken = 3.5 + (1 - codeRatio) * 1.5;
  
  return Math.ceil(text.length / avgCharsPerToken);
}
export async function recordActualUsage(
  userId: string,
  actualTokens: number
): Promise<void> {
  const client = getPool();
  if (!client) {
    console.warn("No database connection - cannot record actual token usage");
    return;
  }

  try {
    await ensureTable();
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const result = await client.query(
      `SELECT tokens_used, last_reset FROM token_usage WHERE user_id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      await client.query(
        `INSERT INTO token_usage (user_id, tokens_used, request_count, last_reset, rate_limit_window_start) 
         VALUES ($1, $2, 1, $3, $3)`,
        [userId, actualTokens, today]
      );
      return;
    }

    const record = result.rows[0];
    const lastReset = new Date(record.last_reset);

    if (lastReset < today) {
      await client.query(
        `UPDATE token_usage 
         SET tokens_used = $1, request_count = 1, last_reset = $2, rate_limit_window_start = $2, rate_limit_count = 1
         WHERE user_id = $3`,
        [actualTokens, today, userId]
      );
    } else {
      await client.query(
        `UPDATE token_usage 
         SET tokens_used = tokens_used + $1
         WHERE user_id = $2`,
        [actualTokens, userId]
      );
    }
  } catch (error) {
    console.warn("Failed to record actual token usage:", error instanceof Error ? error.message : String(error));
  }
}

interface TokenUsage {
  userId: string;
  tokensUsed: number;
  requestCount: number;
  lastReset: Date;
}

const DAILY_TOKEN_LIMIT = 50000;
const DAILY_REQUEST_LIMIT = 100;
const RATE_LIMIT_WINDOW = 60;
const RATE_LIMIT_REQUESTS = 10;

async function ensureTable(): Promise<void> {
  const client = getPool();
  if (!client) return;
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS token_usage (
        user_id text NOT NULL,
        tokens_used integer NOT NULL DEFAULT 0,
        request_count integer NOT NULL DEFAULT 0,
        last_reset timestamptz NOT NULL DEFAULT now(),
        last_request timestamptz,
        rate_limit_window_start timestamptz,
        rate_limit_count integer NOT NULL DEFAULT 0,
        PRIMARY KEY (user_id)
      );
    `);
  } catch (error) {
    console.warn("Failed to ensure token_usage table:", error instanceof Error ? error.message : String(error));
    throw error;
  }
}

const DENIED_UNAVAILABLE = {
  allowed: false,
  reason: "Usage tracking is unavailable right now. Please try again shortly.",
  retryAfter: 60,
};

/**
 * Reserves `estimatedTokens` against the caller's daily and per-minute limits.
 * The reservation is a single conditional UPDATE, so parallel requests cannot
 * both pass a check that only one of them fits under. If usage cannot be
 * tracked the request is refused, except in local development without a database.
 */
export async function checkAndRecordUsage(
  userId: string,
  estimatedTokens: number,
  limits: { dailyTokens?: number; dailyRequests?: number; perMinute?: number } = {}
): Promise<{ allowed: boolean; reason?: string; retryAfter?: number }> {
  const dailyTokens = limits.dailyTokens ?? DAILY_TOKEN_LIMIT;
  const dailyRequests = limits.dailyRequests ?? DAILY_REQUEST_LIMIT;
  const perMinute = limits.perMinute ?? RATE_LIMIT_REQUESTS;
  const client = getPool();
  if (!client) {
    if (process.env.NODE_ENV === "production") {
      console.error("DATABASE_URL is not set - refusing LLM request because limits cannot be enforced");
      return DENIED_UNAVAILABLE;
    }
    return { allowed: true };
  }

  const tokens = Math.max(0, Math.ceil(estimatedTokens));
  if (!Number.isFinite(tokens) || tokens > dailyTokens) {
    return {
      allowed: false,
      reason: `Request too large. A single request may use at most ${dailyTokens} tokens.`,
    };
  }

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  try {
    await ensureTable();

    await client.query(
      `INSERT INTO token_usage (user_id, last_reset, rate_limit_window_start)
       VALUES ($1, $2, now())
       ON CONFLICT (user_id) DO NOTHING`,
      [userId, today]
    );

    // Roll the daily counters and the per-minute window forward when they have expired.
    await client.query(
      `UPDATE token_usage SET
         tokens_used = CASE WHEN last_reset < $2 THEN 0 ELSE tokens_used END,
         request_count = CASE WHEN last_reset < $2 THEN 0 ELSE request_count END,
         last_reset = GREATEST(last_reset, $2),
         rate_limit_count = CASE
           WHEN rate_limit_window_start IS NULL OR rate_limit_window_start < now() - make_interval(secs => $3)
           THEN 0 ELSE rate_limit_count END,
         rate_limit_window_start = CASE
           WHEN rate_limit_window_start IS NULL OR rate_limit_window_start < now() - make_interval(secs => $3)
           THEN now() ELSE rate_limit_window_start END
       WHERE user_id = $1
         AND (last_reset < $2
              OR rate_limit_window_start IS NULL
              OR rate_limit_window_start < now() - make_interval(secs => $3))`,
      [userId, today, RATE_LIMIT_WINDOW]
    );

    const reserved = await client.query(
      `UPDATE token_usage SET
         tokens_used = tokens_used + $2,
         request_count = request_count + 1,
         last_request = now(),
         rate_limit_count = rate_limit_count + 1
       WHERE user_id = $1
         AND tokens_used + $2 <= $3
         AND request_count < $4
         AND rate_limit_count < $5`,
      [userId, tokens, dailyTokens, dailyRequests, perMinute]
    );

    if (reserved.rowCount) {
      return { allowed: true };
    }

    // Refused: read the counters back only to explain which limit was hit.
    const { rows } = await client.query(
      `SELECT tokens_used, request_count, rate_limit_count,
              EXTRACT(EPOCH FROM (now() - rate_limit_window_start)) AS window_age
       FROM token_usage WHERE user_id = $1`,
      [userId]
    );
    const record = rows[0] ?? {};

    if ((record.rate_limit_count ?? 0) >= perMinute) {
      return {
        allowed: false,
        reason: `Rate limit exceeded. Maximum ${perMinute} requests per ${RATE_LIMIT_WINDOW} seconds.`,
        retryAfter: Math.max(1, Math.ceil(RATE_LIMIT_WINDOW - Number(record.window_age ?? 0))),
      };
    }
    if ((record.request_count ?? 0) >= dailyRequests) {
      return {
        allowed: false,
        reason: `Daily request limit exceeded. You've made ${record.request_count}/${dailyRequests} requests today.`,
      };
    }
    return {
      allowed: false,
      reason: `Daily token limit exceeded. You've used ${record.tokens_used ?? 0}/${dailyTokens} tokens today.`,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (process.env.NODE_ENV !== "production") {
      console.warn("Usage check failed - limits NOT enforced in development:", message);
      return { allowed: true };
    }
    console.error("Usage check failed - refusing request:", message);
    return DENIED_UNAVAILABLE;
  }
}

export async function getUserUsage(userId: string): Promise<{
  tokensUsed: number;
  tokensRemaining: number;
  requestCount: number;
  requestsRemaining: number;
}> {
  const client = getPool();
  if (!client) {
    return {
      tokensUsed: 0,
      tokensRemaining: DAILY_TOKEN_LIMIT,
      requestCount: 0,
      requestsRemaining: DAILY_REQUEST_LIMIT,
    };
  }

  try {
    await ensureTable();

    const result = await client.query(
      `SELECT tokens_used, request_count, last_reset FROM token_usage WHERE user_id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return {
        tokensUsed: 0,
        tokensRemaining: DAILY_TOKEN_LIMIT,
        requestCount: 0,
        requestsRemaining: DAILY_REQUEST_LIMIT,
      };
    }

    const record = result.rows[0];
    const lastReset = new Date(record.last_reset);
    const today = new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());

    if (lastReset < today) {
      return {
        tokensUsed: 0,
        tokensRemaining: DAILY_TOKEN_LIMIT,
        requestCount: 0,
        requestsRemaining: DAILY_REQUEST_LIMIT,
      };
    }

    return {
      tokensUsed: record.tokens_used || 0,
      tokensRemaining: Math.max(0, DAILY_TOKEN_LIMIT - (record.tokens_used || 0)),
      requestCount: record.request_count || 0,
      requestsRemaining: Math.max(0, DAILY_REQUEST_LIMIT - (record.request_count || 0)),
    };
  } catch (error) {
    console.warn("Failed to get user usage:", error instanceof Error ? error.message : String(error));
    return {
      tokensUsed: 0,
      tokensRemaining: DAILY_TOKEN_LIMIT,
      requestCount: 0,
      requestsRemaining: DAILY_REQUEST_LIMIT,
    };
  }
}

