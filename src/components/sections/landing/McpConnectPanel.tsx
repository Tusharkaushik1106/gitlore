"use client";

import { useEffect, useState } from "react";
import { Check, Copy, KeyRound, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "gitlore-mcp-key";

type Client = "claude" | "claude-code" | "cursor";

const CLIENTS: { id: Client; label: string }[] = [
  { id: "claude", label: "Claude app" },
  { id: "claude-code", label: "Claude Code" },
  { id: "cursor", label: "Cursor" },
];

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      aria-label={label}
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className="shrink-0 rounded-md p-1.5 text-fg/45 transition-colors hover:bg-fg/10 hover:text-fg"
    >
      {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  );
}

function CodeLine({ text, label }: { text: string; label: string }) {
  return (
    <div className="flex items-start gap-2 rounded-lg border border-fg/10 bg-canvas/70 px-3 py-2">
      <code className="min-w-0 flex-1 break-all font-mono text-[11px] leading-relaxed text-fg/75">{text}</code>
      <CopyButton text={text} label={label} />
    </div>
  );
}

/** Gets the visitor a personal MCP link and shows how to add it to their client. */
export function McpConnectPanel() {
  const [key, setKey] = useState<string | null>(null);
  const [origin, setOrigin] = useState("https://gitlore.app");
  const [client, setClient] = useState<Client>("claude");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const url = key ? `${origin}/api/mcp/${key}` : "";

  return (
    <div className="gf-card rounded-2xl p-5 shadow-[0_20px_60px_rgba(0,0,0,0.5)] sm:p-6">
      <div className="mb-4 flex items-center gap-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-metallic-gold/10 ring-1 ring-metallic-gold/20">
          <KeyRound className="h-4 w-4 text-metallic-gold" />
        </div>
        <div>
          <p className="text-sm font-semibold text-fg">Your connection link</p>
          <p className="text-[11px] text-fg/50">Free, no sign-up. It works as your personal key.</p>
        </div>
      </div>

      {!key ? (
        <div className="space-y-3">
          <Button variant="primary" size="md" onClick={getLink} disabled={loading} className="w-full">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Get my connection link"}
          </Button>
          {error && (
            <p role="alert" className="text-xs text-tomato-jam">
              {error}
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="space-y-1.5">
            <CodeLine text={url} label="Copy connection link" />
            <p className="text-[11px] text-fg/45">
              Keep it private: anyone with this link uses your daily allowance. It&apos;s saved in this browser.
            </p>
          </div>

          <div>
            <div role="tablist" aria-label="Where to connect" className="mb-3 flex gap-1 rounded-lg bg-fg/5 p-1">
              {CLIENTS.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  role="tab"
                  aria-selected={client === c.id}
                  onClick={() => setClient(c.id)}
                  className={cn(
                    "flex-1 rounded-md px-2 py-1.5 text-xs font-medium transition-colors",
                    client === c.id ? "bg-fg/10 text-fg" : "text-fg/50 hover:text-fg/80",
                  )}
                >
                  {c.label}
                </button>
              ))}
            </div>

            <div role="tabpanel" className="space-y-2 text-xs leading-relaxed text-fg/65">
              {client === "claude" && (
                <ol className="list-decimal space-y-1.5 pl-4">
                  <li>
                    In Claude (web or desktop), open <span className="text-fg/85">Settings → Connectors</span>.
                  </li>
                  <li>
                    Choose <span className="text-fg/85">Add custom connector</span>.
                  </li>
                  <li>
                    Name it <span className="font-mono text-fg/85">gitlore</span>, paste your link as the URL, and add it.
                  </li>
                  <li>In a chat, paste some code and ask Claude to check it with gitlore.</li>
                </ol>
              )}
              {client === "claude-code" && (
                <>
                  <p>Run this in your terminal, then check it with /mcp inside Claude Code:</p>
                  <CodeLine text={`claude mcp add --transport http gitlore ${url}`} label="Copy Claude Code command" />
                </>
              )}
              {client === "cursor" && (
                <>
                  <p>
                    Add this to <span className="font-mono text-fg/85">~/.cursor/mcp.json</span>:
                  </p>
                  <CodeLine
                    text={JSON.stringify({ mcpServers: { gitlore: { url } } })}
                    label="Copy Cursor config"
                  />
                </>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              window.localStorage.removeItem(STORAGE_KEY);
              setKey(null);
            }}
            className="text-[11px] text-fg/40 underline decoration-dotted underline-offset-4 hover:text-fg/70"
          >
            Make a new link
          </button>
        </div>
      )}
    </div>
  );
}
