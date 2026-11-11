import { FileCode, BrainCircuit, MessageCircle } from "lucide-react";
import { DarkSection } from "@/components/sections/DarkSection";
import { MOCK_FILES, MOCK_QA } from "@/data/landing";

// ─────────────────────────────────────────────────────────────────────────────
// LiveDemoStrip
//
// "Show, don't tell" — three panels: file-tree map, AI file summary, RAG Q&A.
// Kept as a bespoke component: the panel JSX is too specific to genericise
// into a reusable block, but all data is imported from @/data/landing.
// ─────────────────────────────────────────────────────────────────────────────

export function LiveDemoStrip() {
  return (
    <DarkSection spacing="lg">
      {/* Section header */}
      <div className="mb-12 text-center">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-tomato-jam">
          See it in action
        </p>
        <h2 className="text-3xl font-semibold tracking-tight text-fg sm:text-4xl">
          What you get in 60 seconds
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-sm text-fg/55 leading-relaxed">
          gitlore parses your entire repository and produces three artefacts
          immediately — explore any of them from the Cockpit Dashboard.
        </p>
      </div>

      {/* Three demo panels */}
      <div className="grid gap-5 md:grid-cols-3">

        {/* Panel 1: File map */}
        <div className="gf-card rounded-2xl overflow-hidden">
          <div className="border-b border-fg/8 px-4 py-3 flex items-center gap-2.5">
            <FileCode className="h-4 w-4 text-tomato-jam/80 shrink-0" />
            <span className="text-xs font-semibold text-fg/70">File map</span>
          </div>
          <div className="p-4 space-y-1.5">
            {MOCK_FILES.map(({ name, active }) => (
              <div
                key={name}
                className={[
                  "flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-[11px] font-mono",
                  active
                    ? "bg-tomato-jam/10 text-tomato-jam/90 border border-tomato-jam/20"
                    : "text-fg/40 hover:text-fg/60",
                ].join(" ")}
              >
                {active && (
                  <span className="h-1.5 w-1.5 rounded-full bg-tomato-jam shrink-0" />
                )}
                <span className={active ? "" : "pl-4"}>{name}</span>
              </div>
            ))}
            <div className="pt-2 text-[10px] text-fg/30 text-center">
              + 47 more files indexed
            </div>
          </div>
        </div>

        {/* Panel 2: AI summary */}
        <div className="gf-card rounded-2xl overflow-hidden">
          <div className="border-b border-fg/8 px-4 py-3 flex items-center gap-2.5">
            <BrainCircuit className="h-4 w-4 text-metallic-gold/80 shrink-0" />
            <span className="text-xs font-semibold text-fg/70">AI summary</span>
          </div>
          <div className="p-4 space-y-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-tomato-jam/70 mb-1.5">
                src/api/analyze/route.ts
              </p>
              <p className="text-[12px] text-fg/65 leading-relaxed">
                POST endpoint that validates the incoming repository URL or ZIP
                payload, enforces per-user rate and daily quotas via
                <span className="font-mono text-tomato-jam/80"> checkQuota()</span>,
                then streams Claude-generated analysis chunks back to the client
                using a <span className="font-mono text-metallic-gold/80">TransformStream</span>.
              </p>
            </div>
            <div className="rounded-xl bg-fg/5 border border-fg/8 p-3">
              <p className="text-[10px] font-semibold text-fg/50 mb-2">Exports</p>
              <div className="space-y-1">
                {["POST — analyze handler", "GET — quota status"].map((e) => (
                  <div key={e} className="flex items-center gap-2 text-[11px] font-mono text-fg/50">
                    <span className="h-1 w-1 rounded-full bg-metallic-gold/60 shrink-0" />
                    {e}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Panel 3: Q&A */}
        <div className="gf-card rounded-2xl overflow-hidden">
          <div className="border-b border-fg/8 px-4 py-3 flex items-center gap-2.5">
            <MessageCircle className="h-4 w-4 text-fg/55 shrink-0" />
            <span className="text-xs font-semibold text-fg/70">Chat with repo</span>
          </div>
          <div className="p-4 space-y-3">
            {MOCK_QA.map(({ q, a }) => (
              <div key={q} className="space-y-1.5">
                <div className="flex items-start gap-2">
                  <span className="mt-0.5 shrink-0 text-[10px] font-bold text-tomato-jam/70 uppercase tracking-wide">
                    Q
                  </span>
                  <p className="text-[11px] font-medium text-fg/75">{q}</p>
                </div>
                <div className="flex items-start gap-2 pl-4">
                  <span className="mt-0.5 shrink-0 text-[10px] font-bold text-metallic-gold/70 uppercase tracking-wide">
                    A
                  </span>
                  <p className="text-[11px] text-fg/55 leading-relaxed">{a}</p>
                </div>
              </div>
            ))}
            <div className="pt-1 border-t border-fg/8">
              <div className="rounded-lg bg-fg/5 px-3 py-2 text-[11px] text-fg/30 italic">
                Ask anything about your codebase…
              </div>
            </div>
          </div>
        </div>

      </div>
    </DarkSection>
  );
}
