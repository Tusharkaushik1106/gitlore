"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Check, Copy, ExternalLink, FileText, KeyRound, Loader2, Radar, ShieldAlert } from "lucide-react";
import { DarkSection } from "@/components/sections/DarkSection";
import { LogoMark } from "@/components/ui/LogoMark";
import { ClaudeLogo, CursorLogo, McpLogo, OpenAILogo, VSCodeLogo } from "@/components/ui/BrandLogos";
import { GradientText, SectionHeading, SpotlightCard, useInViewOnce } from "@/components/motion/fx";
import { Reveal } from "@/components/motion/Reveal";
import { useMotionPreference } from "@/hooks/useMotionPreference";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────────────────────
// Landing › AgentConnect  (anchor: #mcp — also linked from the MCP server's 401 message)
//
// Hub diagram (pick a client) → three steps → setup panel with one-click installs
// and a typed, highlighted snippet → the three tools the agent gets.
// The link carries the visitor's key, so it is only shown and copied, never sent anywhere.
// ─────────────────────────────────────────────────────────────────────────────

const STORAGE_KEY = "gitlore-mcp-key";
const PLACEHOLDER = "<your-link>";
const USAGE_RULE =
  "Whenever you change code, run gitlore's score_risk and check_impact on it before committing, and tell me about anything that scores 7 or more or touches PII, Auth or Database write.";

type Lang = "shell" | "json" | "url";
type Guide = {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  lang: Lang;
  code: (url: string) => string;
  footnote: string;
  prompt: (url: string) => string;
  /** One-click install link, for clients that support it. */
  install?: { label: string; href: (url: string) => string };
};

const GUIDES: Guide[] = [
  {
    id: "claude-code",
    label: "Claude Code",
    icon: ClaudeLogo,
    title: "Add to Claude Code",
    description: "One command in your terminal. Add -s user to have gitlore in every project.",
    lang: "shell",
    code: (url) => `claude mcp add --transport http gitlore ${url}`,
    footnote: "Then run /mcp inside Claude Code to check that gitlore shows as connected.",
    prompt: (url) =>
      `Set up the gitlore MCP server for me by running: claude mcp add --transport http -s user gitlore ${url}\n${USAGE_RULE}`,
  },
  {
    id: "claude",
    label: "Claude",
    icon: ClaudeLogo,
    title: "Add to Claude on the web or desktop",
    description: "Open Customize → Connectors → Add custom connector, name it gitlore, and paste this URL.",
    lang: "url",
    code: (url) => url,
    footnote: "Free plans can add one custom connector. Team and Enterprise owners add it under Organization settings → Connectors.",
    prompt: () => "Check this code with gitlore: run score_risk and check_impact, then sum up the risks in plain words.\n\n<paste your code here>",
  },
  {
    id: "codex",
    label: "Codex",
    icon: OpenAILogo,
    title: "Add to Codex",
    description: "One command in your terminal.",
    lang: "shell",
    code: (url) => `codex mcp add gitlore --url ${url}`,
    footnote: 'Or add a [mcp_servers.gitlore] table with url = "<your-link>" to ~/.codex/config.toml.',
    prompt: (url) => `Set up the gitlore MCP server for me by running: codex mcp add gitlore --url ${url}\n${USAGE_RULE}`,
  },
  {
    id: "cursor",
    label: "Cursor",
    icon: CursorLogo,
    title: "Add to Cursor",
    description: "One click with the button, or add this to ~/.cursor/mcp.json yourself.",
    lang: "json",
    code: (url) => JSON.stringify({ mcpServers: { gitlore: { url } } }, null, 2),
    footnote: "Cursor shows the server under Settings → MCP once it's added.",
    prompt: (url) =>
      `Add the gitlore MCP server to ~/.cursor/mcp.json under "mcpServers" as "gitlore" with url ${url}, keeping any servers already there.\n${USAGE_RULE}`,
    // cursor.com/docs/context/mcp/install-links: `config` is base64 of the server's JSON config.
    install: {
      label: "Add to Cursor",
      href: (url) => `cursor://anysphere.cursor-deeplink/mcp/install?name=gitlore&config=${btoa(JSON.stringify({ url }))}`,
    },
  },
  {
    id: "vscode",
    label: "VS Code",
    icon: VSCodeLogo,
    title: "Add to VS Code",
    description: "One click with the button, or add this to .vscode/mcp.json and start it from the MCP servers list.",
    lang: "json",
    code: (url) => JSON.stringify({ servers: { gitlore: { type: "http", url } } }, null, 2),
    footnote: 'VS Code uses "servers", not "mcpServers", and needs "type": "http" for remote servers.',
    prompt: (url) =>
      `Add the gitlore MCP server to .vscode/mcp.json under "servers" as "gitlore" with "type": "http" and url ${url}, keeping any servers already there.\n${USAGE_RULE}`,
    // code.visualstudio.com/api/extension-guides/ai/mcp: vscode:mcp/install?{url-encoded JSON}
    install: {
      label: "Install in VS Code",
      href: (url) => `vscode:mcp/install?${encodeURIComponent(JSON.stringify({ name: "gitlore", type: "http", url }))}`,
    },
  },
  {
    id: "other",
    label: "Any client",
    icon: McpLogo,
    title: "Any MCP client",
    description: "gitlore speaks Streamable HTTP. Point your client at this URL.",
    lang: "url",
    code: (url) => url,
    footnote: "If your client can send headers, you can instead use /api/mcp with Authorization: Bearer <key>.",
    prompt: (url) => `Connect to the gitlore MCP server at ${url} (Streamable HTTP).\n${USAGE_RULE}`,
  },
];

// Hub diagram geometry, in the SVG's own units (viewBox 0 0 760 250).
const VIEW = { w: 760, h: 250 };
const HUB = { x: 380, y: 125 };
const NODE_Y = [40, 125, 210];
const nodeAt = (i: number) => ({ x: i < 3 ? 92 : 668, y: NODE_Y[i % 3] });
const beamPath = (i: number) => {
  const { y } = nodeAt(i);
  const left = i < 3;
  const from = left ? 122 : 638;
  const to = left ? HUB.x - 46 : HUB.x + 46;
  const bend = left ? 110 : -110;
  return `M${from} ${y} C ${from + bend} ${y}, ${to - bend} ${HUB.y}, ${to} ${HUB.y}`;
};
const pct = (v: number, of: number) => `${(v / of) * 100}%`;

function useCopy() {
  const [copied, setCopied] = useState<string | null>(null);
  async function copy(id: string, text: string) {
    await navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied((c) => (c === id ? null : c)), 1500);
  }
  return { copied, copy };
}

/** Minimal colouring: shell commands and flags, JSON keys and strings, and the link. */
function Highlighted({ code, lang, url }: { code: string; lang: Lang; url: string }) {
  // While typing, the link is still a prefix of itself; colour it as soon as it starts.
  const isLink = (t: string) =>
    t.length > 0 && (t.startsWith("http") || t.startsWith("<")) && (url.startsWith(t) || PLACEHOLDER.startsWith(t));
  const link = (text: string, key: number) => (
    <span key={key} className={text.startsWith("<") ? "rounded bg-tomato-jam/15 px-1 text-tomato-jam" : "text-[#f2cb66]"}>
      {text}
    </span>
  );

  if (lang === "url") return link(code, 0);

  if (lang === "shell") {
    return (
      <>
        <span className="select-none text-fg/25">$ </span>
        {code.split(/(\s+)/).map((part, i) => {
          if (isLink(part)) return link(part, i);
          const cls = i === 0 ? "text-[#ea7a3b]" : part.startsWith("-") ? "text-fg/40" : "text-fg/80";
          return (
            <span key={i} className={cls}>
              {part}
            </span>
          );
        })}
      </>
    );
  }

  const parts = code.split(/("(?:[^"\\]|\\.)*"?)/);
  return (
    <>
      {parts.map((part, i) => {
        if (!part.startsWith('"')) {
          return (
            <span key={i} className="text-fg/35">
              {part}
            </span>
          );
        }
        const inner = part.slice(1, part.endsWith('"') && part.length > 1 ? -1 : undefined);
        if (isLink(inner)) {
          return (
            <span key={i}>
              <span className="text-fg/35">&quot;</span>
              {link(inner, i)}
              {part.length > 1 && part.endsWith('"') && <span className="text-fg/35">&quot;</span>}
            </span>
          );
        }
        const isKey = (parts[i + 1] ?? "").trimStart().startsWith(":");
        return (
          <span key={i} className={isKey ? "text-[#efa54a]" : "text-fg/80"}>
            {part}
          </span>
        );
      })}
    </>
  );
}

/** Types `text` out quickly whenever it changes (not on first render); instant for reduced motion. */
function useTypedCode(text: string, enabled: boolean): string {
  // Typing progress is tied to the text it belongs to, so a new text starts from zero.
  const [progress, setProgress] = useState({ text, n: text.length });
  useEffect(() => {
    if (!enabled) return;
    const id = setInterval(() => {
      setProgress((prev) => {
        const n = prev.text === text ? prev.n : 0;
        if (n >= text.length) {
          clearInterval(id);
          return prev.text === text ? prev : { text, n };
        }
        return { text, n: Math.min(text.length, n + 4) };
      });
    }, 16);
    return () => clearInterval(id);
  }, [text, enabled]);
  if (!enabled) return text;
  return progress.text === text ? text.slice(0, progress.n) : "";
}

function HubDiagram({ active, onPick }: { active: string; onPick: (id: string) => void }) {
  return (
    <Reveal variant="blurUp" className="relative mx-auto mb-10 aspect-[760/250] w-full max-w-[760px]">
      <svg viewBox={`0 0 ${VIEW.w} ${VIEW.h}`} className="absolute inset-0 h-full w-full" aria-hidden>
        <defs>
          <linearGradient id="mcp-beam-left" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor="#e2553e" stopOpacity="0.2" />
            <stop offset="55%" stopColor="#ea7a3b" />
            <stop offset="100%" stopColor="#f2cb66" />
          </linearGradient>
          <linearGradient id="mcp-beam-right" x1="1" x2="0" y1="0" y2="0">
            <stop offset="0%" stopColor="#e2553e" stopOpacity="0.2" />
            <stop offset="55%" stopColor="#ea7a3b" />
            <stop offset="100%" stopColor="#f2cb66" />
          </linearGradient>
        </defs>
        {GUIDES.map((g, i) => (
          <g key={g.id}>
            <path d={beamPath(i)} fill="none" stroke="rgba(231,215,193,0.10)" strokeWidth="1.25" />
            <path
              d={beamPath(i)}
              fill="none"
              stroke={`url(#mcp-beam-${i < 3 ? "left" : "right"})`}
              strokeWidth={g.id === active ? 2.5 : 1.5}
              strokeLinecap="round"
              className="mcp-beam transition-opacity duration-500"
              style={{ "--d": `${i * 0.45}s`, opacity: g.id === active ? 1 : 0.4 } as React.CSSProperties}
            />
          </g>
        ))}
      </svg>

      {/* Hub */}
      <div
        className="absolute flex -translate-x-1/2 -translate-y-1/2 items-center justify-center"
        style={{ left: pct(HUB.x, VIEW.w), top: pct(HUB.y, VIEW.h) }}
      >
        <span aria-hidden className="mcp-hub-ring absolute h-20 w-20 rounded-3xl sm:h-24 sm:w-24" />
        <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl border border-tomato-jam/30 bg-[#1a1210] shadow-[0_0_44px_rgba(192,57,43,0.4)] sm:h-[4.5rem] sm:w-[4.5rem]">
          <LogoMark className="h-9 w-9 sm:h-11 sm:w-11" />
        </div>
      </div>

      {/* Clients — they double as the client picker */}
      {GUIDES.map((g, i) => {
        const { x, y } = nodeAt(i);
        const Icon = g.icon;
        const selected = g.id === active;
        return (
          <button
            key={g.id}
            type="button"
            onClick={() => onPick(g.id)}
            aria-label={`Show setup for ${g.label}`}
            aria-pressed={selected}
            className="group absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1.5"
            style={{ left: pct(x, VIEW.w), top: pct(y, VIEW.h) }}
          >
            <span
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-full border bg-[#161312] text-fg transition-all duration-300 sm:h-12 sm:w-12",
                selected
                  ? "scale-110 border-metallic-gold/50 shadow-[0_0_24px_rgba(212,175,55,0.35)]"
                  : "border-fg/12 group-hover:border-fg/30",
              )}
            >
              <Icon
                className={cn(
                  "h-5 w-5 transition-opacity sm:h-6 sm:w-6",
                  selected ? "opacity-100" : "opacity-70 group-hover:opacity-100",
                )}
              />
            </span>
            <span
              className={cn(
                "absolute top-full mt-1.5 hidden whitespace-nowrap text-[11px] transition-colors sm:block",
                selected ? "text-fg" : "text-fg/40 group-hover:text-fg/70",
              )}
            >
              {g.label}
            </span>
          </button>
        );
      })}
    </Reveal>
  );
}

function ToolCards() {
  const ref = useRef<HTMLDivElement>(null);
  const seen = useInViewOnce(ref, 0.35);
  const r = 15;
  const c = 2 * Math.PI * r;
  return (
    <div ref={ref} className="mt-16 grid gap-4 md:grid-cols-3">
      <Reveal variant="blurUp">
        <SpotlightCard className="p-5">
          <div className="mb-4 flex h-24 items-center justify-center gap-4 rounded-xl border border-fg/8 bg-canvas/50">
            <svg viewBox="0 0 40 40" className="h-16 w-16 -rotate-90" aria-hidden>
              <circle cx="20" cy="20" r={r} fill="none" stroke="rgba(231,215,193,0.1)" strokeWidth="4" />
              <circle
                cx="20"
                cy="20"
                r={r}
                fill="none"
                stroke="#e2553e"
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray={c}
                strokeDashoffset={seen ? c * 0.2 : c}
                className="transition-[stroke-dashoffset] duration-[1400ms] ease-out"
              />
            </svg>
            <div className="text-left">
              <p className="text-2xl font-semibold tabular-nums text-[#e2553e]">
                8<span className="text-sm text-fg/35">/10</span>
              </p>
              <p className="text-[11px] text-fg/45">needs a human look</p>
            </div>
          </div>
          <p className="flex items-center gap-2 font-mono text-[12px] text-metallic-gold">
            <ShieldAlert className="h-3.5 w-3.5" /> score_risk
          </p>
          <p className="mt-1.5 text-sm leading-relaxed text-fg/60">
            A 1–10 risk score for one function or change, with a one-line reason.
          </p>
        </SpotlightCard>
      </Reveal>

      <Reveal variant="blurUp" delay={0.1}>
        <SpotlightCard className="p-5" glow="212,175,55">
          <div className="mb-4 flex h-24 flex-wrap content-center items-center justify-center gap-1.5 rounded-xl border border-fg/8 bg-canvas/50 px-3">
            {[
              { area: "PII", hit: true },
              { area: "Auth", hit: false },
              { area: "External API", hit: true },
              { area: "Database write", hit: true },
            ].map(({ area, hit }, i) => (
              <span
                key={area}
                className={cn(
                  "rounded-full border px-2.5 py-1 text-[11px] font-medium transition-all duration-500",
                  seen && hit
                    ? "border-tomato-jam/40 bg-tomato-jam/[0.12] text-[#ea7a3b]"
                    : "border-fg/10 bg-fg/[0.03] text-fg/35",
                )}
                style={{ transitionDelay: `${300 + i * 180}ms` }}
              >
                {area}
              </span>
            ))}
          </div>
          <p className="flex items-center gap-2 font-mono text-[12px] text-metallic-gold">
            <Radar className="h-3.5 w-3.5" /> check_impact
          </p>
          <p className="mt-1.5 text-sm leading-relaxed text-fg/60">
            Which sensitive areas a change touches, plus a short summary.
          </p>
        </SpotlightCard>
      </Reveal>

      <Reveal variant="blurUp" delay={0.2}>
        <SpotlightCard className="p-5" glow="231,215,193">
          <div className="mb-4 flex h-24 flex-col justify-center gap-2 rounded-xl border border-fg/8 bg-canvas/50 px-4">
            {[
              { k: "purpose", w: "86%" },
              { k: "components", w: "64%" },
              { k: "architecture", w: "74%" },
            ].map(({ k, w }, i) => (
              <div key={k} className="flex items-center gap-2">
                <span className="w-[74px] shrink-0 font-mono text-[10px] text-fg/40">{k}</span>
                <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-fg/8">
                  <span
                    className="block h-full rounded-full bg-gradient-to-r from-[#ea7a3b]/70 to-[#f2cb66]/60 transition-[width] duration-700 ease-out"
                    style={{ width: seen ? w : "0%", transitionDelay: `${200 + i * 160}ms` }}
                  />
                </span>
              </div>
            ))}
          </div>
          <p className="flex items-center gap-2 font-mono text-[12px] text-metallic-gold">
            <FileText className="h-3.5 w-3.5" /> explain_file
          </p>
          <p className="mt-1.5 text-sm leading-relaxed text-fg/60">
            What a file is for, its key parts, and where it fits. Cached per file.
          </p>
        </SpotlightCard>
      </Reveal>
    </div>
  );
}

export function AgentConnect() {
  const { isReduced } = useMotionPreference();
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
  const shown = useTypedCode(code, !isReduced);
  const GuideIcon = guide.icon;

  const steps = [
    { label: "Get your link", done: Boolean(key) },
    { label: `Add it to ${guide.id === "other" ? "your client" : guide.label}`, done: false },
    { label: "Ask it to check your code", done: false },
  ];

  return (
    <DarkSection id="mcp" spacing="lg" className="scroll-mt-24">
      <div className="mx-auto max-w-4xl">
        <SectionHeading
          eyebrow="MCP server"
          title={
            <>
              Use gitlore in <GradientText>your agent</GradientText>
            </>
          }
          sub="Let Claude, Codex, Cursor or any MCP client check code before it commits: a risk score, the sensitive areas it touches, and what a file is for. Free, no sign-up."
        />

        <HubDiagram active={active} onPick={setActive} />

        {/* ── Steps ─────────────────────────────────────────── */}
        <Reveal variant="blurUp">
          <ol className="mb-5 grid grid-cols-3 gap-2 text-[11px] sm:text-xs">
            {steps.map((s, i) => (
              <li
                key={i}
                className={cn(
                  "flex items-center gap-2 rounded-xl border px-3 py-2.5 transition-colors duration-500",
                  s.done ? "border-emerald-400/25 bg-emerald-400/[0.06]" : "border-fg/10 bg-fg/[0.02]",
                )}
              >
                <span
                  className={cn(
                    "flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold transition-colors duration-500",
                    s.done ? "bg-emerald-400 text-canvas" : "bg-fg/10 text-fg/60",
                  )}
                >
                  {s.done ? <Check className="h-3 w-3" /> : i + 1}
                </span>
                <span className={cn("leading-tight", s.done ? "text-fg/80" : "text-fg/55")}>{s.label}</span>
              </li>
            ))}
          </ol>
        </Reveal>

        {/* ── Setup panel ───────────────────────────────────── */}
        <Reveal variant="blurUp">
          <div className="overflow-hidden rounded-2xl border border-fg/10 bg-[#141110]/80 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.8)] backdrop-blur-xl">
            {/* Tabs */}
            <div role="tablist" aria-label="Choose your client" className="flex gap-1 overflow-x-auto border-b border-fg/8 p-1.5">
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
                      "relative flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors sm:flex-1 sm:justify-center sm:text-[13px]",
                      selected ? "text-fg" : "text-fg/45 hover:text-fg/80",
                    )}
                  >
                    {selected && (
                      <motion.span
                        layoutId="mcp-tab-pill"
                        className="absolute inset-0 rounded-lg bg-fg/[0.07] ring-1 ring-fg/12"
                        transition={{ type: "spring", stiffness: 420, damping: 34 }}
                      />
                    )}
                    <Icon className={cn("relative h-4 w-4", selected ? "opacity-100" : "opacity-60")} />
                    <span className="relative">{g.label}</span>
                  </button>
                );
              })}
            </div>

            <div id="mcp-panel" role="tabpanel" aria-labelledby={`mcp-tab-${guide.id}`} className="p-5 sm:p-6">
              <div className="mb-1.5 flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-base font-semibold text-fg">{guide.title}</h3>
                <button
                  type="button"
                  disabled={!key}
                  title={key ? undefined : "Get your link first"}
                  onClick={() => copy("prompt", guide.prompt(url))}
                  className="flex shrink-0 items-center gap-1.5 text-xs text-fg/50 transition-colors hover:text-fg disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {copied === "prompt" ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied === "prompt" ? "Copied" : "Copy as prompt"}
                </button>
              </div>
              <p className="mb-4 text-sm text-fg/55">{guide.description}</p>

              {guide.install && (
                <a
                  href={key ? guide.install.href(url) : undefined}
                  aria-disabled={!key}
                  title={key ? undefined : "Get your link first"}
                  onClick={(e) => {
                    if (!key) e.preventDefault();
                  }}
                  className={cn(
                    "mb-4 inline-flex items-center gap-2 rounded-lg border px-3.5 py-2 text-sm font-medium transition-colors",
                    key
                      ? "border-fg/15 bg-fg/[0.06] text-fg hover:border-metallic-gold/40 hover:bg-fg/[0.09]"
                      : "cursor-not-allowed border-fg/8 text-fg/35",
                  )}
                >
                  <GuideIcon className="h-4 w-4" />
                  {guide.install.label}
                  <ExternalLink className="h-3.5 w-3.5 opacity-60" />
                </a>
              )}

              {/* Terminal */}
              <div className="overflow-hidden rounded-xl border border-fg/10 bg-[#0d0b0a]">
                <div className="flex items-center gap-2 border-b border-fg/8 px-3 py-2">
                  <span className="h-2 w-2 rounded-full bg-fg/15" />
                  <span className="h-2 w-2 rounded-full bg-fg/15" />
                  <span className="h-2 w-2 rounded-full bg-fg/15" />
                  <span className="ml-2 font-mono text-[10px] text-fg/30">
                    {guide.lang === "shell" ? "terminal" : guide.lang === "json" ? "mcp.json" : "connector URL"}
                  </span>
                  {key && (
                    <button
                      type="button"
                      aria-label="Copy"
                      onClick={() => copy("code", code)}
                      className="ml-auto flex items-center gap-1 rounded-md px-1.5 py-1 text-[11px] text-fg/45 transition-colors hover:bg-fg/10 hover:text-fg"
                    >
                      {copied === "code" ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                      {copied === "code" ? "Copied" : "Copy"}
                    </button>
                  )}
                </div>
                <pre className="min-h-[56px] whitespace-pre-wrap break-all p-4 font-mono text-[12px] leading-relaxed sm:text-[13px]">
                  <Highlighted code={shown} lang={guide.lang} url={url} />
                  {shown.length < code.length && (
                    <span className="hero-caret ml-0.5 inline-block h-3.5 w-[2px] translate-y-0.5 bg-tomato-jam" />
                  )}
                </pre>
              </div>
              <p className="mt-3 text-xs text-fg/40">{guide.footnote}</p>

              {/* Link */}
              <div className="mt-5 flex flex-col items-start gap-3 rounded-xl border border-fg/10 bg-gradient-to-r from-tomato-jam/[0.07] to-transparent p-4 sm:flex-row sm:items-center sm:justify-between">
                {key ? (
                  <>
                    <p className="flex items-center gap-2 text-xs text-fg/55">
                      <KeyRound className="h-4 w-4 shrink-0 text-metallic-gold" />
                      <span>
                        <span className="font-medium text-fg/85">Your link is your key.</span> Keep it private;
                        it&apos;s saved in this browser.
                      </span>
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
                    <p className="flex items-center gap-2 text-xs text-fg/55">
                      <KeyRound className="h-4 w-4 shrink-0 text-metallic-gold" />
                      <span>
                        <span className="font-medium text-fg/85">Get your personal link</span> to fill in{" "}
                        <span className="font-mono text-tomato-jam">{PLACEHOLDER}</span>. Free, no sign-up.
                      </span>
                    </p>
                    <button
                      type="button"
                      onClick={getLink}
                      disabled={loading}
                      className="relative flex shrink-0 items-center gap-2 overflow-hidden rounded-lg bg-tomato-jam px-4 py-2 text-xs font-semibold text-white shadow-[0_8px_24px_-6px_rgba(192,57,43,0.6)] transition-colors hover:bg-tomato-jam/90 disabled:opacity-60"
                    >
                      <span aria-hidden className="hero-shine pointer-events-none absolute inset-0" />
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
        </Reveal>

        <ToolCards />
      </div>
    </DarkSection>
  );
}
