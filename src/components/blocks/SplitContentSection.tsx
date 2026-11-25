import * as React from "react";
import Link from "next/link";
import { Check, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { SectionEnv } from "./_SectionEnv";
import { Reveal } from "@/components/motion/Reveal";
import type { SectionEnvProps } from "./_SectionEnv";
import type { SectionSpacing } from "@/components/sections/DarkSection";

// ─────────────────────────────────────────────────────────────────────────────
// SplitContentSection block
//
// Two-column layout: left side has copy + optional check-list + CTA,
// right side is a slot for any panel (editor mockup, card, image, etc.)
//
// reversed=true flips the columns (right content on the left visually).
// No hardcoded text — all content is passed as props.
// ─────────────────────────────────────────────────────────────────────────────

export interface SplitContentSectionProps {
  /** Small pill badge above the headline */
  eyebrow?:     string;
  /** Icon inside the eyebrow badge */
  eyebrowIcon?: React.ComponentType<{ className?: string }>;
  /** Primary headline — accepts ReactNode for gradient spans */
  headline:     React.ReactNode;
  subheadline?: string;
  /** Descriptive paragraph below the subheadline */
  body?:        string;
  /** Check-mark list items */
  checkList?:   string[];
  /** Primary CTA link */
  cta?:         { label: string; href: string; external?: boolean };
  /** Icon rendered left of the CTA label */
  ctaIcon?:     React.ComponentType<{ className?: string }>;
  /** Right panel — editor mockup, screenshot, trust card, etc. */
  rightPanel:   React.ReactNode;
  /**
   * Extra content rendered in the left column below body/checkList,
   * above the CTA. Use when the left side needs richer markup than
   * plain strings (e.g. an annotated list with inline notes).
   */
  leftSlot?:    React.ReactNode;
  /** When true, the right panel renders first (on the left visually) */
  reversed?:    boolean;
  environment?: SectionEnvProps["environment"];
  spacing?:     SectionSpacing;
  id?:          string;
}

export function SplitContentSection({
  eyebrow,
  eyebrowIcon: EyebrowIcon,
  headline,
  subheadline,
  body,
  checkList,
  cta,
  ctaIcon: CtaIcon,
  rightPanel,
  leftSlot,
  reversed    = false,
  environment = "dark",
  spacing     = "lg",
  id,
}: SplitContentSectionProps) {
  return (
    <SectionEnv environment={environment} spacing={spacing} id={id}>
      <div
        className={cn(
          "grid gap-12 lg:grid-cols-2 items-center",
          reversed && "lg:[&>*:first-child]:order-2 lg:[&>*:last-child]:order-1",
        )}
      >
        {/* ── Left: copy ──────────────────────────────────── */}
        <Reveal variant="blurUp">
          {/* Eyebrow badge */}
          {(eyebrow || EyebrowIcon) && (
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-fg/10 bg-fg/[0.04] px-3 py-1">
              {EyebrowIcon ? (
                <EyebrowIcon className="h-3.5 w-3.5 text-metallic-gold/80" />
              ) : (
                <span className="h-1.5 w-1.5 rounded-full bg-tomato-jam shadow-[0_0_8px_2px_rgba(192,57,43,0.6)]" />
              )}
              {eyebrow && (
                <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-fg/55">{eyebrow}</span>
              )}
            </div>
          )}

          {/* Headline */}
          <div className="mb-5 text-balance text-3xl font-semibold tracking-tight text-fg sm:text-[2.6rem] sm:leading-[1.1]">
            {headline}
          </div>

          {/* Subheadline */}
          {subheadline && (
            <p className="text-base font-medium text-fg/70 mb-3">{subheadline}</p>
          )}

          {/* Body */}
          {body && (
            <p className="text-sm text-fg/55 leading-relaxed mb-8 max-w-md">{body}</p>
          )}

          {/* Check list */}
          {checkList && checkList.length > 0 && (
            <ul className="space-y-2.5 mb-8">
              {checkList.map((feat) => (
                <li key={feat} className="flex items-start gap-3 text-sm text-fg/65">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#e2553e] to-[#f2cb66] shadow-[0_0_12px_rgba(234,122,59,0.35)]">
                    <Check className="h-3 w-3 text-[#1a1210]" strokeWidth={3} />
                  </span>
                  {feat}
                </li>
              ))}
            </ul>
          )}

          {/* Extra left-side slot (custom content) */}
          {leftSlot}

          {/* CTA */}
          {cta && (
            cta.external ? (
              <a
                href={cta.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl border border-fg/15 bg-fg/8 px-5 py-2.5 text-sm font-semibold text-fg/80 gf-transition hover:border-fg/30 hover:bg-fg/12 hover:text-fg"
              >
                {CtaIcon
                  ? <CtaIcon className="h-4 w-4" />
                  : <ExternalLink className="h-4 w-4" />
                }
                {cta.label}
              </a>
            ) : (
              <Link
                href={cta.href}
                className="inline-flex items-center gap-2 rounded-xl bg-tomato-jam px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-tomato-jam/25 gf-transition hover:bg-tomato-jam/85"
              >
                {CtaIcon && <CtaIcon className="h-4 w-4" />}
                {cta.label}
              </Link>
            )
          )}
        </Reveal>

        {/* ── Right: panel slot ───────────────────────────── */}
        <Reveal variant="blurUp" delay={0.12}>
          <div className="relative">
            <div
              aria-hidden
              className="pointer-events-none absolute -inset-10 rounded-[48px] bg-[radial-gradient(ellipse_at_center,rgba(192,57,43,0.15),transparent_65%)] blur-2xl"
            />
            <div className="relative">{rightPanel}</div>
          </div>
        </Reveal>
      </div>
    </SectionEnv>
  );
}
