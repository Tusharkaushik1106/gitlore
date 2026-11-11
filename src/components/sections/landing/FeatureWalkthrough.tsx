"use client";

import { useState } from "react";
import { LayoutDashboard, MessageSquare, GitGraph, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { DarkSection } from "@/components/sections/DarkSection";

// ─────────────────────────────────────────────────────────────────────────────
// FeatureWalkthrough
//
// Tabbed feature showcase — three capability surfaces of the product.
// Uses local useState for active tab; no external state involved.
// Dark environment for visual separation from the light SelfSelectionCards.
// ─────────────────────────────────────────────────────────────────────────────

const TABS = [
  {
    id:     "cockpit",
    icon:   LayoutDashboard,
    label:  "Cockpit Dashboard",
    title:  "Your repository, fully mapped",
    body:   "The Cockpit Dashboard presents every file with an AI-generated summary alongside its module graph. Navigate the codebase like you wrote it. Filter by directory, search by intent, not filename.",
    mockLabel: "Cockpit · file-map",
    mock: (
      <div className="space-y-2 font-mono text-[11px]">
        <div className="flex items-center justify-between border-b border-fg/8 pb-2 text-fg/40">
          <span>File</span>
          <span>Summary</span>
        </div>
        {[
          { file: "route.ts",        summary: "POST endpoint, streaming Claude analysis" },
          { file: "RepoContext.tsx",  summary: "Global repo state via React Context" },
          { file: "claude_adapter.ts",summary: "Streams Claude responses" },
          { file: "AuthButton.tsx",   summary: "Session-aware auth toggle" },
        ].map(({ file, summary }) => (
          <div key={file} className="flex items-start justify-between gap-3 py-1">
            <span className="text-tomato-jam/80 shrink-0">{file}</span>
            <span className="text-fg/40 text-right">{summary}</span>
          </div>
        ))}
      </div>
    ),
  },
  {
    id:     "chat",
    icon:   MessageSquare,
    label:  "AI Chat",
    title:  "Ask anything about the codebase",
    body:   "OmniChat uses RAG over your embedded repository to answer precise questions — no hallucinations about files that don't exist. Ask about architecture, find entry points, trace data flows.",
    mockLabel: "OmniChat · conversation",
    mock: (
      <div className="space-y-3 text-[11px]">
        {[
          { role: "user", text: "How does authentication work in this app?" },
          { role: "ai",   text: "Authentication is handled by NextAuth.js with GitHub and Google OAuth providers. The session is accessed via useSession() from next-auth/react. Protected routes use an AuthGuard component that checks session status and redirects to /api/auth/signin if unauthenticated." },
          { role: "user", text: "Where is the token quota enforced?" },
          { role: "ai",   text: "In src/api/analyze/route.ts via checkQuota(). Limits: 50K tokens/day, 100 requests/day, 10 requests per 60 seconds — all stored in PostgreSQL." },
        ].map(({ role, text }, i) => (
          <div
            key={i}
            className={cn(
              "rounded-xl p-2.5 text-[11px] leading-relaxed",
              role === "user"
                ? "bg-tomato-jam/10 text-fg/70 ml-6"
                : "bg-fg/5 text-fg/60 mr-6 border border-fg/8",
            )}
          >
            <span className={cn("mr-1.5 font-bold text-[10px] uppercase tracking-wide",
              role === "user" ? "text-tomato-jam/70" : "text-metallic-gold/70"
            )}>
              {role === "user" ? "You" : "gitlore"}
            </span>
            {text}
          </div>
        ))}
      </div>
    ),
  },
  {
    id:     "diagrams",
    icon:   GitGraph,
    label:  "Visual Diagrams",
    title:  "See the architecture, not just the code",
    body:   "gitlore generates Mermaid.js architecture diagrams for any module or the full project. Visualise call graphs, component trees, data flows — rendered live in the browser.",
    mockLabel: "Diagrams · architecture",
    mock: (
      <div className="font-mono text-[11px] text-fg/50 space-y-1">
        <p className="text-metallic-gold/70 mb-2">graph TD</p>
        {[
          ["  A[page.tsx]",         "-->|renders|",   "B[HeroSection]"],
          ["  B",                   "-->|uses|",       "C[RepoAnalyzeForm]"],
          ["  C",                   "-->|calls|",      "D[startAnalysis]"],
          ["  D",                   "-->|POST /api/|", "E[analyze/route.ts]"],
          ["  E",                   "-->|streams|",    "F[claude_adapter]"],
        ].map(([from, edge, to], i) => (
          <div key={i} className="flex gap-1 flex-wrap">
            <span className="text-fg/40">{from}</span>
            <span className="text-tomato-jam/60">{edge}</span>
            <span className="text-metallic-gold/70">{to}</span>
          </div>
        ))}
        <div className="mt-3 rounded-lg bg-fg/5 border border-fg/8 p-2 text-[10px] text-fg/35 text-center">
          ↑ Rendered as interactive Mermaid diagram
        </div>
      </div>
    ),
  },
] as const;

export function FeatureWalkthrough() {
  const [active, setActive] = useState<string>(TABS[0].id);
  const activeTab = TABS.find((t) => t.id === active)!;

  return (
    <DarkSection spacing="lg">
      {/* Header */}
      <div className="mb-10 text-center">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-tomato-jam/80">
          Three surfaces, one codebase
        </p>
        <h2 className="text-3xl font-semibold tracking-tight text-fg sm:text-4xl">
          Three ways to understand any repo
        </h2>
      </div>

      {/* Tab bar */}
      <div className="mb-8 flex flex-wrap justify-center gap-2">
        {TABS.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => setActive(id)}
            className={cn(
              "inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium gf-transition",
              active === id
                ? "bg-tomato-jam text-white shadow-md shadow-tomato-jam/30"
                : "text-fg/55 bg-fg/5 hover:bg-fg/10 hover:text-fg",
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </button>
        ))}
      </div>

      {/* Content panel */}
      <div className="grid gap-8 lg:grid-cols-2 items-start">
        {/* Description */}
        <div className="flex flex-col justify-center">
          <h3 className="text-2xl font-semibold text-fg mb-4">{activeTab.title}</h3>
          <p className="text-sm text-fg/55 leading-relaxed mb-6">{activeTab.body}</p>
          <a
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-tomato-jam/80 hover:text-tomato-jam gf-transition"
          >
            Try it yourself <ChevronRight className="h-4 w-4" />
          </a>
        </div>

        {/* Mock preview */}
        <div className="gf-card rounded-2xl overflow-hidden">
          <div className="border-b border-fg/8 px-4 py-3 flex items-center gap-2">
            <div className="flex gap-1.5">
              <div className="h-2 w-2 rounded-full bg-tomato-jam/60" />
              <div className="h-2 w-2 rounded-full bg-metallic-gold/60" />
              <div className="h-2 w-2 rounded-full bg-fg/20" />
            </div>
            <span className="ml-2 text-[11px] font-mono text-fg/30">{activeTab.mockLabel}</span>
          </div>
          <div className="p-4">
            {activeTab.mock}
          </div>
        </div>
      </div>
    </DarkSection>
  );
}
