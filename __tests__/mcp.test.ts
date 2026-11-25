/**
 * @jest-environment node
 */
import { POST } from "@/app/api/mcp/[[...key]]/route";
import { POST as createKey } from "@/app/api/mcp-key/route";
import { extractJson, InvalidModelOutputError } from "@/lib/codeReview";
import { createMcpKey, verifyMcpKey } from "@/lib/mcpKeys";

const chat = jest.fn();
jest.mock("@/lib/claude_adapter", () => ({ claudeAdapter: { chat: (...args: unknown[]) => chat(...args) } }));

process.env.MCP_SIGNING_SECRET = "s".repeat(40);

let nextId = 1;
type Auth = { key?: string; via?: "url" | "header"; ip?: string };

async function rpc(method: string, params: Record<string, unknown> = {}, auth: Auth = {}) {
  const key = "key" in auth ? auth.key : KEY;
  const headers: Record<string, string> = {
    "content-type": "application/json",
    accept: "application/json, text/event-stream",
    "mcp-protocol-version": "2025-06-18",
    "x-real-ip": auth.ip ?? `10.0.${nextId}.1`,
  };
  const viaUrl = auth.via !== "header";
  if (key && !viaUrl) headers.authorization = `Bearer ${key}`;
  const res = await POST(
    new Request(`http://localhost/api/mcp${key && viaUrl ? `/${key}` : ""}`, {
      method: "POST",
      headers,
      body: JSON.stringify({ jsonrpc: "2.0", id: nextId++, method, params }),
    }),
    { params: Promise.resolve({ key: key && viaUrl ? [key] : undefined }) },
  );
  const text = await res.text();
  // Streamable HTTP may answer as JSON or as one SSE event.
  const json = text.startsWith("{") ? text : text.split("\n").find((l: string) => l.startsWith("data: "))?.slice(6);
  return { status: res.status, body: json ? JSON.parse(json) : text };
}

let KEY: string;
beforeEach(() => {
  chat.mockReset();
  KEY = createMcpKey(); // fresh key per test, so per-key limits don't leak between tests
});

describe("keys", () => {
  test("only keys gitlore signed are accepted", () => {
    expect(verifyMcpKey(KEY)).toMatch(/^[0-9a-f]{32}$/);
    const forged = KEY.slice(0, -1) + (KEY.endsWith("0") ? "1" : "0");
    expect(verifyMcpKey(forged)).toBeNull();
    expect(verifyMcpKey("gl_nope")).toBeNull();
    expect(verifyMcpKey(undefined)).toBeNull();
  });

  test("the key endpoint issues working keys and caps how many one visitor mints", async () => {
    const mint = () => createKey(new Request("http://localhost/api/mcp-key", { method: "POST", headers: { "x-real-ip": "203.0.113.9" } }));
    const first = await mint();
    expect(first.status).toBe(200);
    expect(verifyMcpKey((await first.json()).key)).not.toBeNull();
    const statuses = [];
    for (let i = 0; i < 6; i++) statuses.push((await mint()).status);
    expect(statuses).toContain(429);
  });

  test("the key endpoint is off when no signing secret is set", async () => {
    const saved = process.env.MCP_SIGNING_SECRET;
    delete process.env.MCP_SIGNING_SECRET;
    try {
      expect((await createKey(new Request("http://localhost/api/mcp-key", { method: "POST" }))).status).toBe(503);
      expect((await rpc("tools/list")).status).toBe(401);
    } finally {
      process.env.MCP_SIGNING_SECRET = saved;
    }
  });
});

describe("auth", () => {
  test("refuses requests without a valid key", async () => {
    expect((await rpc("tools/list", {}, { key: undefined })).status).toBe(401);
    expect((await rpc("tools/list", {}, { key: "gl_" + "0".repeat(64) })).status).toBe(401);
  });

  test("accepts the key in the URL or as a bearer header", async () => {
    for (const via of ["url", "header"] as const) {
      const { status, body } = await rpc("tools/list", {}, { via });
      expect(status).toBe(200);
      expect(body.result.tools.map((t: { name: string }) => t.name).sort()).toEqual(["check_impact", "explain_file", "score_risk"]);
    }
  });

  test("usage is metered per key, not per IP", async () => {
    chat.mockResolvedValue({ content: '{"score": 3, "reason": "ok"}' });
    const results = [];
    // Same key from a different IP each time, as claude.ai connector traffic would look.
    for (let i = 0; i < 12; i++) {
      const { body } = await rpc("tools/call", { name: "score_risk", arguments: { code: "f()" } }, { ip: `198.51.100.${i}` });
      results.push(Boolean(body.result.isError));
    }
    expect(results.slice(0, 10).every((isError) => !isError)).toBe(true);
    expect(results.slice(10).every((isError) => isError)).toBe(true);
  });
});

describe("tools", () => {
  test("score_risk clamps and rounds the model's score", async () => {
    chat.mockResolvedValue({ content: '```json\n{"score": 12.4, "reason": "Writes to the DB without validation"}\n```' });
    const { body } = await rpc("tools/call", { name: "score_risk", arguments: { code: "function f() {}" } });
    expect(body.result.isError).toBeFalsy();
    expect(body.result.structuredContent).toEqual({ score: 10, reason: "Writes to the DB without validation" });
  });

  test("check_impact keeps only known areas", async () => {
    chat.mockResolvedValue({
      content: '{"riskLabel":"High","riskColor":"#f00","summary":"Stores emails","touches":["PII","Database write","Lasers"]}',
    });
    const { body } = await rpc("tools/call", { name: "check_impact", arguments: { code: "import a from 'b'\ndb.insert(email)" } });
    expect(body.result.structuredContent).toMatchObject({ riskLabel: "High", touches: ["PII", "Database write"] });
  });

  test("a garbled model reply comes back as a tool error, not a fake score", async () => {
    chat.mockResolvedValue({ content: "I think this is fine." });
    jest.spyOn(console, "error").mockImplementationOnce(() => {});
    const { body } = await rpc("tools/call", { name: "score_risk", arguments: { code: "x()" } });
    expect(body.result.isError).toBe(true);
  });

  test("oversized input is rejected before reaching the model", async () => {
    const { body } = await rpc("tools/call", { name: "score_risk", arguments: { code: "x".repeat(5001) } });
    expect(body.error ?? body.result?.isError).toBeTruthy();
    expect(chat).not.toHaveBeenCalled();
  });

  test("extractJson finds the object inside prose and fences", () => {
    expect(extractJson('Sure!\n```json\n{"a":1}\n```')).toEqual({ a: 1 });
    expect(() => extractJson("no json")).toThrow(InvalidModelOutputError);
  });
});
