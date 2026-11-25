import * as React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { SectionEnv } from "./_SectionEnv";
import { Reveal } from "@/components/motion/Reveal";
import { Stagger, StaggerItem } from "@/components/motion/Stagger";
import { DrawnLine, SectionHeading, SpotlightCard } from "@/components/motion/fx";
import type { SectionEnvProps } from "./_SectionEnv";
import type { SectionSpacing } from "@/components/sections/DarkSection";
import type { FeatureItem } from "@/data/landing";

// ─────────────────────────────────────────────────────────────────────────────
// FeatureGrid block
//
// Generic grid of feature / pain-point / persona / step cards.
// Supports three visual variants detected from item shape:
//
//   "card"   — default: icon + title + body + optional CTA link
//   "persona"— when item.eyebrow is present: adds sub-label above title
//   "step"   — when item.step is present: a timeline that draws itself, with numbered nodes
//
// Cards light up around the pointer (SpotlightCard) and blur in one after another.
// No hardcoded text — all content is passed as props.
// ─────────────────────────────────────────────────────────────────────────────

export interface FeatureGridProps {
  eyebrow?:     string;
  headline:     React.ReactNode;
  subheadline?: string;
  /** Array of feature/step/persona items */
  items:        FeatureItem[];
  /** Grid column count — default: 3 */
  columns?:     2 | 3 | 4;
  /** Italic footnote rendered below the grid */
  footnote?:    string;
  environment?: SectionEnvProps["environment"];
  spacing?:     SectionSpacing;
  id?:          string;
}

const COLUMN_CLASSES: Record<number, string> = {
  2: "sm:grid-cols-2",
  3: "md:grid-cols-3",
  4: "sm:grid-cols-2 lg:grid-cols-4",
};

/** Pointer-glow colour per card, picked from the card's own accent. */
function glowFor(item: FeatureItem): string {
  const accent = `${item.iconColor ?? ""} ${item.iconBg ?? ""}`;
  if (accent.includes("metallic-gold")) return "212,175,55";
  if (accent.includes("tomato-jam")) return "192,57,43";
  return "231,215,193";
}

export function FeatureGrid({
  eyebrow,
  headline,
  subheadline,
  items,
  columns = 3,
  footnote,
  environment = "dark",
  spacing = "lg",
  id,
}: FeatureGridProps) {
  const isStepVariant = items.some((i) => i.step !== undefined);

  return (
    <SectionEnv environment={environment} spacing={spacing} id={id}>
      <SectionHeading eyebrow={eyebrow} title={headline} sub={subheadline} />

      {isStepVariant ? (
        <StepTimeline items={items} />
      ) : (
        <Stagger className={cn("grid gap-4", COLUMN_CLASSES[columns] ?? COLUMN_CLASSES[3])} stagger="md">
          {items.map((item) => (
            <StaggerItem key={item.title} variant="blurUp" className="h-full">
              <FeatureCard item={item} />
            </StaggerItem>
          ))}
        </Stagger>
      )}

      {footnote && (
        <Reveal variant="blurUp" className="mt-12 text-center">
          <p className="mx-auto inline-flex max-w-xl items-center gap-3 text-sm italic text-fg/45">
            <span aria-hidden className="h-px w-8 bg-gradient-to-r from-transparent to-fg/25" />
            {footnote}
            <span aria-hidden className="h-px w-8 bg-gradient-to-l from-transparent to-fg/25" />
          </p>
        </Reveal>
      )}
    </SectionEnv>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Internal renderers
// ─────────────────────────────────────────────────────────────────────────────

function IconTile({ item, size = "md" }: { item: FeatureItem; size?: "md" | "lg" }) {
  const { icon: Icon, iconBg, iconColor } = item;
  return (
    <div
      className={cn(
        "relative inline-flex items-center justify-center rounded-xl ring-1 ring-fg/10 transition-transform duration-300 group-hover/spot:-rotate-6 group-hover/spot:scale-110",
        size === "lg" ? "h-12 w-12" : "h-11 w-11",
        iconBg ?? "bg-fg/8",
      )}
    >
      <Icon className={cn("h-5 w-5", iconColor ?? "text-fg/60")} />
    </div>
  );
}

function FeatureCard({ item }: { item: FeatureItem }) {
  const { title, body, eyebrow, cta } = item;
  return (
    <SpotlightCard className="h-full p-6" glow={glowFor(item)}>
      <div className="flex h-full flex-col">
        <IconTile item={item} />
        {eyebrow && (
          <p className="mt-5 text-[10px] font-semibold uppercase tracking-[0.2em] text-fg/40">{eyebrow}</p>
        )}
        <h3 className={cn("text-base font-semibold leading-snug text-fg", eyebrow ? "mt-1.5" : "mt-5")}>{title}</h3>
        <p className="mt-2.5 flex-1 text-sm leading-relaxed text-fg/55">{body}</p>
        {cta && (
          <Link
            href={cta.href}
            className="mt-6 inline-flex items-center gap-1.5 text-xs font-semibold text-[#ea7a3b] transition-colors hover:text-[#f2cb66]"
          >
            {cta.label.replace(/\s*→\s*$/, "")}
            <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover/spot:translate-x-1" />
          </Link>
        )}
      </div>
    </SpotlightCard>
  );
}

function StepTimeline({ items }: { items: FeatureItem[] }) {
  return (
    <div className="relative">
      {/* The line between the numbered nodes draws itself as it scrolls in (desktop). */}
      <DrawnLine className="absolute left-[16.66%] right-[16.66%] top-6 hidden md:block" />
      <Stagger className="relative grid gap-6 md:grid-cols-3" stagger="md">
        {items.map((item, idx) => (
          <StaggerItem key={item.title} variant="blurUp" className="flex flex-col items-center">
            <div className="relative z-10 mb-6 flex h-12 w-12 items-center justify-center rounded-full border border-tomato-jam/40 bg-[#1a1210] shadow-[0_0_30px_rgba(192,57,43,0.35)]">
              <span className="bg-gradient-to-br from-[#e2553e] to-[#f2cb66] bg-clip-text text-base font-semibold text-transparent">
                {String(idx + 1).padStart(2, "0")}
              </span>
            </div>
            <SpotlightCard className="h-full w-full p-6 text-center" glow={idx === 1 ? "212,175,55" : "192,57,43"}>
              <div className="flex h-full flex-col items-center">
                <IconTile item={item} />
                <h3 className="mt-4 text-base font-semibold text-fg">{item.title}</h3>
                <p className="mt-2.5 flex-1 text-sm leading-relaxed text-fg/55">{item.body}</p>
                {item.detail && (
                  <span className="mt-5 rounded-lg border border-fg/10 bg-fg/[0.04] px-3 py-1.5 font-mono text-[11px] text-fg/50">
                    {item.detail}
                  </span>
                )}
              </div>
            </SpotlightCard>
          </StaggerItem>
        ))}
      </Stagger>
    </div>
  );
}
