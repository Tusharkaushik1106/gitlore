"use client";

import { useRef, useState } from "react";
import { ChevronRight, GitGraph, LayoutDashboard, MessageSquare, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { DarkSection } from "@/components/sections/DarkSection";
import { GradientText, SectionHeading, useInViewOnce } from "@/components/motion/fx";
import { Reveal } from "@/components/motion/Reveal";

// ─────────────────────────────────────────────────────────────────────────────
// Landing › FeatureWalkthrough
//
// Three surfaces, shown one at a time. The active item's progress bar runs for
// ADVANCE_SECONDS and its `animationend` moves on to the next item, so there are
// no timers: hovering pauses the bar (and the advance) and reduced motion turns
// auto-advance off. The demo window crossfades between surfaces.
// ─────────────────────────────────────────────────────────────────────────────

const ADVANCE_SECONDS = 7;

function CockpitMock() {
  const rows = [
    { file: "analyze/route.ts", summary: "Validates the URL, reads the repo, asks Claude for a pitch", score: 0.92 },
    { file: "usageGuard.ts", summary: "Per-visitor allowance, then the site-wide budget", score: 0.71 },
    { file: "claude_adapter.ts", summary: "Talks to Claude; streams replies as they arrive", score: 0.64 },
    { file: "codeReview.ts", summary: "Risk, impact and explain checks for MCP and VS Code", score: 0.58 },
  ];
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between px-2 pb-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-fg/35">
        <span>File</span>
        <span>Hotspot</span>
      </div>
      {rows.map((r, i) => (
        <div
          key={r.file}
          className="hero-pop rounded-lg border border-fg/8 bg-fg/[0.03] px-3 py-2.5"
          style={{ "--d": `${0.1 + i * 0.12}s` } as React.CSSProperties}
        >
          <div className="flex items-center justify-between gap-3">
            <span className="font-mono text-[12px] text-[#ea7a3b]">{r.file}</span>
            <span className="h-1 w-16 overflow-hidden rounded-full bg-fg/10">
              <span
                className="hero-bar block h-full rounded-full bg-gradient-to-r from-[#e2553e] to-[#f2cb66]"
                style={{ width: `${r.score * 100}%`, "--d": `${0.4 + i * 0.12}s` } as React.CSSProperties}
              />
            </span>
          </div>
          <p className="mt-1 text-[12px] text-fg/50">{r.summary}</p>
        </div>
      ))}
    </div>
  );
}

function ChatMock() {
  const turns = [
    { role: "user", text: "How does a visitor get rate-limited?" },
    {
      role: "ai",
      text: "reserveUsage() in src/lib/usageGuard.ts checks the visitor's daily allowance first, then the site-wide budget, before any Claude call.",
    },
    { role: "user", text: "Is anything stored in a database?" },
    { role: "ai", text: "No. Usage counters, caches and the search index live in server memory and reset when the server restarts." },
  ];
  return (
    <div className="space-y-2.5">
      {turns.map((t, i) => (
        <div
          key={i}
          className={cn(
            "hero-pop rounded-xl px-3 py-2 text-[12px] leading-relaxed",
            t.role === "user"
              ? "ml-10 rounded-tr-sm bg-tomato-jam/[0.12] text-fg/80"
              : "mr-6 flex gap-2 rounded-tl-sm border border-fg/8 bg-fg/[0.04] text-fg/65",
          )}
          style={{ "--d": `${0.15 + i * 0.35}s` } as React.CSSProperties}
        >
          {t.role === "ai" && <Sparkles className="mt-0.5 h-3 w-3 shrink-0 text-metallic-gold" />}
          {t.text}
        </div>
      ))}
    </div>
  );
}

function DiagramMock() {
  const nodes = ["page.tsx", "RepoAnalyzeForm", "startAnalysis()", "POST /api/analyze", "claude_adapter"];
  return (
    <div className="flex flex-col items-center py-1">
      {nodes.map((n, i) => (
        <div key={n} className="flex flex-col items-center">
          {i > 0 && (
            <span className="relative block h-5 w-px bg-fg/15">
              <span
                className="mcp-drop absolute left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-metallic-gold shadow-[0_0_8px_2px_rgba(242,203,102,0.55)]"
                style={{ "--d": `${i * 0.35}s` } as React.CSSProperties}
              />
            </span>
          )}
          <span
            className={cn(
              "hero-pop rounded-lg border px-3 py-1.5 font-mono text-[12px]",
              i === 0 || i === nodes.length - 1
                ? "border-fg/12 bg-fg/[0.04] text-fg/65"
                : "border-metallic-gold/30 bg-metallic-gold/[0.08] text-metallic-gold",
            )}
            style={{ "--d": `${0.1 + i * 0.12}s` } as React.CSSProperties}
          >
            {n}
          </span>
        </div>
      ))}
      <p className="mt-3 text-[11px] text-fg/35">Drawn from the code, rendered live as a Mermaid diagram</p>
    </div>
  );
}

const TABS = [
  {
    id: "cockpit",
    icon: LayoutDashboard,
    label: "Cockpit dashboard",
    title: "Your repository, fully mapped",
    body: "Every file with an AI summary, the hotspots worth reading first, and the stack at a glance. Navigate the codebase like you wrote it.",
    mockLabel: "cockpit · file map",
    Mock: CockpitMock,
  },
  {
    id: "chat",
    icon: MessageSquare,
    label: "AI chat",
    title: "Ask anything about the codebase",
    body: "Answers grounded in the repository's own files, so it points at real code instead of guessing. Ask about architecture, entry points or data flow.",
    mockLabel: "chat · conversation",
    Mock: ChatMock,
  },
  {
    id: "diagrams",
    icon: GitGraph,
    label: "Visual diagrams",
    title: "See the architecture, not just the code",
    body: "Architecture and data-flow diagrams for the whole project or a single file, laid out in clean tiers and rendered right in the browser.",
    mockLabel: "diagrams · request flow",
    Mock: DiagramMock,
  },
] as const;

export function FeatureWalkthrough() {
  const [active, setActive] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const seen = useInViewOnce(ref, 0.35);
  const tab = TABS[active];
  const Mock = tab.Mock;

  return (
    <DarkSection spacing="lg">
      <SectionHeading
        eyebrow="Three surfaces, one codebase"
        title={
          <>
            Three ways to <GradientText>understand any repo</GradientText>
          </>
        }
      />

      <div ref={ref} className="group/walk grid items-start gap-6 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-10">
        {/* Picker */}
        <Reveal variant="blurUp">
          <div role="tablist" aria-label="gitlore surfaces" className="space-y-2">
            {TABS.map((t, i) => {
              const Icon = t.icon;
              const selected = i === active;
              return (
                <button
                  key={t.id}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  aria-controls="walk-panel"
                  onClick={() => setActive(i)}
                  className={cn(
                    "relative w-full overflow-hidden rounded-2xl border p-5 text-left transition-colors duration-300",
                    selected ? "border-fg/15 bg-[#141110]/80" : "border-transparent hover:bg-fg/[0.03]",
                  )}
                >
                  <span className="flex items-center gap-3">
                    <span
                      className={cn(
                        "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ring-1 transition-colors duration-300",
                        selected ? "bg-tomato-jam/15 text-[#ea7a3b] ring-tomato-jam/30" : "bg-fg/5 text-fg/45 ring-fg/10",
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className={cn("text-base font-semibold transition-colors", selected ? "text-fg" : "text-fg/55")}>
                      {t.label}
                    </span>
                  </span>
                  <span
                    className={cn(
                      "grid transition-[grid-template-rows,opacity] duration-500 ease-out",
                      selected ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
                    )}
                  >
                    <span className="overflow-hidden">
                      <span className="mt-3 block text-lg font-semibold text-fg">{t.title}</span>
                      <span className="mt-1.5 block text-sm leading-relaxed text-fg/55">{t.body}</span>
                    </span>
                  </span>
                  {selected && (
                    <span className="absolute inset-x-0 bottom-0 h-0.5 bg-fg/5">
                      <span
                        key={`${t.id}-${seen}`}
                        className={cn(
                          "walk-progress block h-full origin-left bg-gradient-to-r from-[#e2553e] to-[#f2cb66]",
                          seen ? "walk-progress-run" : "scale-x-0",
                        )}
                        style={{ "--walk-seconds": `${ADVANCE_SECONDS}s` } as React.CSSProperties}
                        onAnimationEnd={() => setActive((a) => (a + 1) % TABS.length)}
                      />
                    </span>
                  )}
                </button>
              );
            })}
            <a
              href="/dashboard"
              className="ml-5 mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-[#ea7a3b] transition-colors hover:text-[#f2cb66]"
            >
              Try it yourself <ChevronRight className="h-4 w-4" />
            </a>
          </div>
        </Reveal>

        {/* Demo window */}
        <Reveal variant="blurUp" delay={0.1}>
          <div className="relative">
            <div
              aria-hidden
              className="pointer-events-none absolute -inset-8 rounded-[40px] bg-[radial-gradient(ellipse_at_center,rgba(192,57,43,0.16),transparent_65%)] blur-2xl"
            />
            <div
              id="walk-panel"
              role="tabpanel"
              className="relative overflow-hidden rounded-2xl border border-fg/10 bg-[#141110]/85 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.8)] backdrop-blur-xl"
            >
              <div aria-hidden className="hero-beam" />
              <div className="flex items-center gap-2 border-b border-fg/8 px-4 py-3">
                <span className="h-2.5 w-2.5 rounded-full bg-tomato-jam/70" />
                <span className="h-2.5 w-2.5 rounded-full bg-metallic-gold/70" />
                <span className="h-2.5 w-2.5 rounded-full bg-fg/20" />
                <span key={tab.mockLabel} className="hero-swap ml-2 font-mono text-[11px] text-fg/40">
                  {tab.mockLabel}
                </span>
              </div>
              <div key={tab.id} className="hero-swap min-h-[330px] p-5">
                <Mock />
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </DarkSection>
  );
}
