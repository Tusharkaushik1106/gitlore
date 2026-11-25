"use client";

import { useEffect, useState } from "react";
import { Check, Code2, Copy, Loader2, MessageCircle, MousePointer2, Plug, SquareTerminal, Terminal } from "lucide-react";
import { DarkSection } from "@/components/sections/DarkSection";
import { LogoMark } from "@/components/ui/LogoMark";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────────────────────
// Landing › AgentConnect  (anchor: #mcp — also linked from the MCP server's 401 message)
//
// Gets the visitor a personal MCP link and shows how to add it to each client.
// The link carries the visitor's key, so it is only shown and copied, never sent anywhere.
// ─────────────────────────────────────────────────────────────────────────────

const STORAGE_KEY = "gitlore-mcp-key";
const PLACEHOLDER = "<your-link>";
const USAGE_RULE =
  "Whenever you change code, run gitlore's score_risk and check_impact on it before committing, and tell me about anything that scores 7 or more or touches PII, Auth or Database write.";

type Guide = {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  code: (url: string) => string;
  footnote: string;
  prompt: (url: string) => string;
};

const GUIDES: Guide[] = [
  {
    id: "claude-code",
    label: "Claude Code",
    icon: Terminal,
    title: "Add to Claude Code",
    description: "One command in your terminal. Add -s user to have gitlore in every project.",
    code: (url) => `claude mcp add --transport http gitlore ${url}`,
    footnote: "Then run /mcp inside Claude Code to check that gitlore shows as connected.",
    prompt: (url) =>
      `Set up the gitlore MCP server for me by running: claude mcp add --transport http -s user gitlore ${url}\n${USAGE_RULE}`,
  },
  {
    id: "claude",
    label: "Claude",
    icon: MessageCircle,
    title: "Add to Claude on the web or desktop",
    description: "Open Customize → Connectors → Add custom connector, name it gitlore, and paste this URL.",
    code: (url) => url,
    footnote: "Free plans can add one custom connector. Team and Enterprise owners add it under Organization settings → Connectors.",
    prompt: () => "Check this code with gitlore: run score_risk and check_impact, then sum up the risks in plain words.\n\n<paste your code here>",
  },
  {
    id: "codex",
    label: "Codex",
    icon: SquareTerminal,
    title: "Add to Codex",
    description: "One command in your terminal.",
    code: (url) => `codex mcp add gitlore --url ${url}`,
    footnote: 'Or add a [mcp_servers.gitlore] table with url = "<your-link>" to ~/.codex/config.toml.',
    prompt: (url) => `Set up the gitlore MCP server for me by running: codex mcp add gitlore --url ${url}\n${USAGE_RULE}`,
  },
  {
    id: "cursor",
    label: "Cursor",
    icon: MousePointer2,
    title: "Add to Cursor",
    description: "Add this to ~/.cursor/mcp.json, or to .cursor/mcp.json inside one project.",
    code: (url) => JSON.stringify({ mcpServers: { gitlore: { url } } }, null, 2),
    footnote: "Cursor picks the server up from the file; check it under Settings → MCP.",
    prompt: (url) =>
      `Add the gitlore MCP server to ~/.cursor/mcp.json under "mcpServers" as "gitlore" with url ${url}, keeping any servers already there.\n${USAGE_RULE}`,
  },
  {
    id: "vscode",
    label: "VS Code",
    icon: Code2,
    title: "Add to VS Code",
    description: "Add this to .vscode/mcp.json, then start gitlore from the MCP servers list.",
    code: (url) => JSON.stringify({ servers: { gitlore: { type: "http", url } } }, null, 2),
    footnote: 'VS Code uses "servers", not "mcpServers", and needs "type": "http" for remote servers.',
    prompt: (url) =>
      `Add the gitlore MCP server to .vscode/mcp.json under "servers" as "gitlore" with "type": "http" and url ${url}, keeping any servers already there.\n${USAGE_RULE}`,
  },
  {
    id: "other",
    label: "Any client",
    icon: Plug,
    title: "Any MCP client",
    description: "gitlore speaks Streamable HTTP. Point your client at this URL.",
    code: (url) => url,
    footnote: "If your client can send headers, you can instead use /api/mcp with Authorization: Bearer <key>.",
    prompt: (url) => `Connect to the gitlore MCP server at ${url} (Streamable HTTP).\n${USAGE_RULE}`,
  },
];

function useCopy() {
  const [copied, setCopied] = useState<string | null>(null);
  async function copy(id: string, text: string) {
    await navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied((c) => (c === id ? null : c)), 1500);
  }
  return { copied, copy };
}

/** Renders code with the link placeholder highlighted until the visitor has a link. */
function CodeText({ text }: { text: string }) {
  const parts = text.split(PLACEHOLDER);
  return (
    <>
      {parts.map((part, i) => (
        <span key={i}>
          {part}
          {i < parts.length - 1 && <span className="rounded bg-tomato-jam/15 px-1 text-tomato-jam">{PLACEHOLDER}</span>}
        </span>
      ))}
    </>
  );
}

export function AgentConnect() {
  const [key, setKey] = useState<string | null>(null);
  const [origin, setOrigin] = useState("https://gitlore.app");
  const [active, setActive] = useState(GUIDES[0].id);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { copied, copy } = useCopy();

  useEffect(() => {
    setOrigin(window.location.origin);
    setKey(window.localStorage.getItem(STORAGE_KEY));
  }, []);

  async function getLink() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/mcp-key", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.key) throw new Error(data.error || "Couldn't create a link. Try again shortly.");
      window.localStorage.setItem(STORAGE_KEY, data.key);
      setKey(data.key);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't create a link. Try again shortly.");
    } finally {
      setLoading(false);
    }
  }

  const guide = GUIDES.find((g) => g.id === active) ?? GUIDES[0];
  const url = key ? `${origin}/api/mcp/${key}` : PLACEHOLDER;
  const code = guide.code(url);

  return (
    <DarkSection id="mcp" spacing="lg" className="scroll-mt-24">
      <div className="mx-auto max-w-3xl">
        {/* ── Heading ─────────────────────────────────────────── */}
        <div className="mb-10 text-center">
          <div className="mx-auto mb-6 flex w-fit items-center gap-1.5 rounded-full bg-fg/5 p-1.5 ring-1 ring-fg/10">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-canvas ring-1 ring-tomato-jam/30">
              <LogoMark className="h-7 w-7" />
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-fg/85">
              <Plug className="h-5 w-5 text-canvas" />
            </div>
          </div>
          <h2 className="text-3xl font-semibold tracking-tight text-fg sm:text-4xl">
            Use gitlore in{" "}
            <span className="bg-gradient-to-r from-tomato-jam to-metallic-gold bg-clip-text text-transparent">
              your agent
            </span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-fg/55 sm:text-base">
            Let Claude, Codex, Cursor or any MCP client check code before it commits: a risk score, the sensitive
            areas it touches, and what a file is for. Free, no sign-up.
          </p>
        </div>

        {/* ── Tabs ────────────────────────────────────────────── */}
        <div
          role="tablist"
          aria-label="Choose your agent"
          className="grid grid-cols-3 gap-1 rounded-xl border border-fg/10 bg-fg/[0.03] p-1.5 sm:grid-cols-6"
        >
          {GUIDES.map((g) => {
            const Icon = g.icon;
            const selected = g.id === active;
            return (
              <button
                key={g.id}
                type="button"
                role="tab"
                id={`mcp-tab-${g.id}`}
                aria-selected={selected}
                aria-controls="mcp-panel"
                onClick={() => setActive(g.id)}
                className={cn(
                  "flex items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-xs font-medium transition-colors sm:text-[13px]",
                  selected ? "bg-canvas text-fg ring-1 ring-fg/15" : "text-fg/50 hover:text-fg/80",
                )}
              >
                <Icon className={cn("h-3.5 w-3.5", selected ? "text-metallic-gold" : "")} />
                {g.label}
              </button>
            );
          })}
        </div>

        {/* ── Panel ───────────────────────────────────────────── */}
        <div id="mcp-panel" role="tabpanel" aria-labelledby={`mcp-tab-${guide.id}`} className="mt-6">
          <div className="mb-2 flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold text-fg sm:text-base">{guide.title}</h3>
            <button
              type="button"
              disabled={!key}
              title={key ? undefined : "Get your link first"}
              onClick={() => copy("prompt", guide.prompt(url))}
              className="flex shrink-0 items-center gap-1.5 text-xs text-fg/50 transition-colors hover:text-fg disabled:cursor-not-allowed disabled:opacity-40 sm:text-[13px]"
            >
              {copied === "prompt" ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              {copied === "prompt" ? "Copied" : "Copy as prompt"}
            </button>
          </div>
          <p className="mb-4 text-sm text-fg/55">{guide.description}</p>

          <div className="rounded-xl border border-fg/10 bg-fg/[0.03] p-1.5">
            <div className="relative rounded-lg border border-fg/8 bg-canvas/80 p-4 pr-14">
              <pre className="whitespace-pre-wrap break-all font-mono text-[12px] leading-relaxed text-fg/80 sm:text-[13px]">
                <CodeText text={code} />
              </pre>
              {key && (
                <button
                  type="button"
                  aria-label="Copy"
                  onClick={() => copy("code", code)}
                  className="absolute right-3 top-3 rounded-md p-1.5 text-fg/45 transition-colors hover:bg-fg/10 hover:text-fg"
                >
                  {copied === "code" ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                </button>
              )}
            </div>
          </div>
          <p className="mt-3 text-xs text-fg/40">{guide.footnote}</p>

          {/* ── Link ──────────────────────────────────────────── */}
          <div className="mt-6 flex flex-col items-start gap-3 rounded-xl border border-fg/10 bg-fg/[0.03] p-4 sm:flex-row sm:items-center sm:justify-between">
            {key ? (
              <>
                <p className="text-xs text-fg/55">
                  <span className="font-medium text-fg/80">Your link is your key.</span> Keep it private; it&apos;s
                  saved in this browser.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    window.localStorage.removeItem(STORAGE_KEY);
                    setKey(null);
                  }}
                  className="shrink-0 text-xs text-fg/45 underline decoration-dotted underline-offset-4 hover:text-fg/80"
                >
                  Make a new link
                </button>
              </>
            ) : (
              <>
                <p className="text-xs text-fg/55">
                  <span className="font-medium text-fg/80">Get your personal link</span> to fill in{" "}
                  <span className="font-mono text-tomato-jam">{PLACEHOLDER}</span> above.
                </p>
                <button
                  type="button"
                  onClick={getLink}
                  disabled={loading}
                  className="flex shrink-0 items-center gap-2 rounded-lg bg-tomato-jam px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-tomato-jam/90 disabled:opacity-60"
                >
                  {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Get my connection link
                </button>
              </>
            )}
          </div>
          {error && (
            <p role="alert" className="mt-2 text-xs text-tomato-jam">
              {error}
            </p>
          )}
        </div>
      </div>
    </DarkSection>
  );
}
