import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { SectionEnv } from "./_SectionEnv";
import { Reveal } from "@/components/motion/Reveal";
import type { SectionEnvProps } from "./_SectionEnv";
import type { SectionSpacing } from "@/components/sections/DarkSection";

// ─────────────────────────────────────────────────────────────────────────────
// CTASection block
//
// Centred conversion section with optional form slot or fallback CTA button.
// Use `form` prop for the primary form (e.g. RepoAnalyzeForm).
// Use `primaryCTA` as a simple href button when no form is provided.
//
// No hardcoded text — all content is passed as props.
// ─────────────────────────────────────────────────────────────────────────────

export interface CTASectionProps {
  /** Small eyebrow badge above the headline — accepts ReactNode for icons */
  eyebrow?:     React.ReactNode;
  /** Icon rendered inside the eyebrow badge */
  eyebrowIcon?: React.ComponentType<{ className?: string }>;
  /** Primary headline — accepts ReactNode for gradient spans */
  headline:     React.ReactNode;
  subheadline?: string;
  /** Primary conversion slot — RepoAnalyzeForm or any form */
  form?:        React.ReactNode;
  /** Fallback CTA button shown when `form` is not provided */
  primaryCTA?:  { label: string; href: string };
  environment?: SectionEnvProps["environment"];
  spacing?:     SectionSpacing;
  id?:          string;
}

export function CTASection({
  eyebrow,
  eyebrowIcon: EyebrowIcon,
  headline,
  subheadline,
  form,
  primaryCTA,
  environment = "dark",
  spacing     = "lg",
  id,
}: CTASectionProps) {
  return (
    <SectionEnv environment={environment} spacing={spacing} id={id}>
      <Reveal variant="blurUp">
        <div className="relative mx-auto max-w-4xl overflow-hidden rounded-[2rem] border border-fg/10 bg-[#141110]/70 px-6 py-16 text-center shadow-[0_40px_120px_-40px_rgba(0,0,0,0.9)] backdrop-blur-xl sm:px-12 sm:py-20">
          {/* Light running around the frame, a fine grid, and a warm glow from below */}
          <div aria-hidden className="hero-beam" />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(231,215,193,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(231,215,193,0.05)_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:radial-gradient(ellipse_70%_70%_at_50%_50%,black,transparent)]"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-40 left-1/2 h-80 w-[36rem] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(192,57,43,0.35),rgba(212,175,55,0.12)_45%,transparent_70%)] blur-2xl"
          />

          <div className="relative mx-auto max-w-2xl">
            {(eyebrow || EyebrowIcon) && (
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-tomato-jam/25 bg-tomato-jam/[0.08] px-3.5 py-1">
                {EyebrowIcon && <EyebrowIcon className="h-3.5 w-3.5 text-[#ea7a3b]" />}
                {eyebrow && (
                  <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#ea7a3b]">{eyebrow}</span>
                )}
              </div>
            )}

            <div className="mb-4 text-balance text-3xl font-semibold tracking-tight text-fg sm:text-5xl sm:leading-[1.08]">
              {headline}
            </div>

            {subheadline && (
              <p className="mx-auto mb-10 max-w-lg text-sm leading-relaxed text-fg/55 sm:text-base">{subheadline}</p>
            )}

            {form && <div className={cn("mx-auto max-w-xl", !subheadline && "mt-10")}>{form}</div>}

            {!form && primaryCTA && (
              <Link
                href={primaryCTA.href}
                className="inline-flex items-center gap-2 rounded-xl bg-tomato-jam px-6 py-3 text-sm font-semibold text-white shadow-md shadow-tomato-jam/25 gf-transition hover:bg-tomato-jam/85 hover:shadow-lg hover:shadow-tomato-jam/35"
              >
                {primaryCTA.label}
              </Link>
            )}
          </div>
        </div>
      </Reveal>
    </SectionEnv>
  );
}
