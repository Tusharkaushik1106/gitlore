import { Check, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { SplitContentSection } from "@/components/blocks/SplitContentSection";
import { FREE_INCLUDES, TRUST_SIGNALS } from "@/data/landing";

// ─────────────────────────────────────────────────────────────────────────────
// Landing › FreeTierTransparency
//
// Thin wrapper around SplitContentSection.
// Data imported from @/data/landing.
// Trust card JSX is the rightPanel slot.
// IncludesBody is the leftSlot (annotated list with per-item notes).
// ─────────────────────────────────────────────────────────────────────────────

/** Privacy / trust card rendered in the right panel slot */
function TrustCard() {
  return (
    <div className="gf-card rounded-2xl p-6 border border-fg/8">
      <div className="mb-6 flex items-center gap-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-tomato-jam/10">
          <ShieldCheck className="h-5 w-5 text-tomato-jam/80" />
        </div>
        <div>
          <p className="text-sm font-semibold text-fg">Privacy-first by default</p>
          <p className="text-xs text-fg/45">Your code never leaves the analysis pipeline</p>
        </div>
      </div>

      <ul className="space-y-3">
        {TRUST_SIGNALS.map((signal) => (
          <li key={signal} className="flex items-center gap-3 rounded-xl bg-fg/4 border border-fg/8 px-4 py-3">
            <Check className="h-4 w-4 text-tomato-jam/70 shrink-0" />
            <span className="text-sm text-fg/65">{signal}</span>
          </li>
        ))}
      </ul>

      <div className="mt-6 rounded-xl bg-fg/5 border border-fg/8 px-4 py-3">
        <p className="text-xs text-fg/40 leading-relaxed">
          Usage resets daily at midnight UTC. Token counts reflect the
          Claude tokenizer (estimated). High-usage plans coming soon.
        </p>
      </div>
    </div>
  );
}

/** Annotated check list with per-item notes — injected via leftSlot */
function IncludesBody() {
  return (
    <>
      <ul className="space-y-3 mb-8">
        {FREE_INCLUDES.map(({ item, note }) => (
          <li key={item} className="flex items-start gap-3">
            <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-tomato-jam/10">
              <Check className="h-3 w-3 text-tomato-jam/80" />
            </div>
            <div>
              <span className="text-sm font-medium text-fg">{item}</span>
              <span className="ml-2 text-xs text-fg/40">{note}</span>
            </div>
          </li>
        ))}
      </ul>
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 rounded-xl bg-tomato-jam px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-tomato-jam/25 gf-transition hover:bg-tomato-jam/85 hover:shadow-lg hover:shadow-tomato-jam/35"
      >
        Start for free — no card needed
      </Link>
    </>
  );
}

export function FreeTierTransparency() {
  return (
    <SplitContentSection
      environment="dark"
      spacing="lg"
      eyebrow="Pricing"
      headline={
        <>
          Free to try.{" "}
          <span className="text-tomato-jam">Really.</span>
        </>
      }
      body="No wizard. No trial expiry countdown. Paste a repo URL and start analyzing immediately — here is exactly what you get:"
      leftSlot={<IncludesBody />}
      rightPanel={<TrustCard />}
    />
  );
}
