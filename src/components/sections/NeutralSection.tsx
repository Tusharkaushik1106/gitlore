import * as React from "react";
import { cn } from "@/lib/utils";
import type { SectionSpacing, SectionTag } from "./DarkSection";

const spacings: Record<SectionSpacing, string> = {
  none: "",
  sm:   "py-12 md:py-16",
  md:   "py-16 md:py-24",
  lg:   "py-16 md:py-24",
  xl:   "py-24 md:py-40",
};

// ─────────────────────────────────────────────────────────────────────────────
// NeutralSection
//
// Sets data-section="neutral" — canvas → soft warm gray (#f4f3f1),
// fg → near-black warm (#2c2a28). Intentionally minimal — no blobs,
// no vignette, barely-there noise. Optimised for long-form reading,
// forms, and data-dense content where visual distraction must be zero.
//
// Includes:
//   • Soft warm-gray gradient background
//   • Minimal film grain (threshold of perception)
// ─────────────────────────────────────────────────────────────────────────────

export interface NeutralSectionProps extends React.HTMLAttributes<HTMLElement> {
  spacing?:   SectionSpacing;
  as?:        SectionTag;
  /** Remove max-width container — children go full-bleed */
  fullBleed?: boolean;
}

export function NeutralSection({
  spacing   = "md",
  as: Tag   = "section",
  fullBleed = false,
  className,
  children,
  ...props
}: NeutralSectionProps) {
  return (
    <Tag
      data-section="neutral"
      className={cn(
        "relative overflow-hidden",
        spacings[spacing],
        className,
      )}
      style={{ background: "var(--bg-radial)" }}
      {...props}
    >
      {/* Threshold-level grain — barely perceptible paper texture */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[url('/noise.svg')] bg-repeat"
        style={{ opacity: "var(--noise-opacity)" }}
      />

      {/* Content */}
      <div
        className={cn(
          "relative z-10",
          !fullBleed && "mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8",
        )}
      >
        {children}
      </div>
    </Tag>
  );
}
