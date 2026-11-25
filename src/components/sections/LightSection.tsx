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
// LightSection
//
// Sets data-section="light" — canvas → warm parchment (#f5f0e8),
// fg → dark warm brown (#1e1a16). All descendant components automatically
// render in high-contrast dark-on-cream, without any prop changes.
//
// Includes:
//   • Warm paper-like radial gradient background
//   • Extremely subtle vignette (barely perceptible)
//   • Film grain at near-invisible opacity for paper texture
//   • Optional warm ambient hint (atmosphere prop, default: true)
// ─────────────────────────────────────────────────────────────────────────────

export interface LightSectionProps extends React.HTMLAttributes<HTMLElement> {
  spacing?:    SectionSpacing;
  as?:         SectionTag;
  /** Warm brand tint hints at very low opacity (default: true) */
  atmosphere?: boolean;
  /** Remove max-width container — children go full-bleed */
  fullBleed?:  boolean;
}

export function LightSection({
  spacing    = "md",
  as: Tag    = "section",
  atmosphere = true,
  fullBleed  = false,
  className,
  children,
  ...props
}: LightSectionProps) {
  return (
    <Tag
      data-section="light"
      className={cn(
        "relative overflow-hidden",
        spacings[spacing],
        className,
      )}
      style={{ background: "var(--bg-radial)" }}
      {...props}
    >
      {/* Vignette — barely-there edge darkening */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ background: "var(--vignette)" }}
      />

      {/* Paper grain noise — gives warm tactile feel */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[url('/noise.svg')] bg-repeat"
        style={{ opacity: "var(--noise-opacity)" }}
      />

      {/* Warm atmosphere — extremely subtle brand tints */}
      {atmosphere && (
        <>
          {/* Top-left — very faint tomato warmth */}
          <div
            aria-hidden
            className="pointer-events-none absolute -top-24 -left-24 h-[20rem] w-[20rem] rounded-full"
            style={{
              background: "radial-gradient(circle, rgba(192,57,43,0.10) 0%, transparent 70%)",
              opacity: "var(--blob-opacity-1)",
              transform: "translateZ(0)",
            }}
          />
          {/* Bottom-right — faint gold warmth */}
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-24 -right-24 h-[18rem] w-[18rem] rounded-full"
            style={{
              background: "radial-gradient(circle, rgba(212,175,55,0.08) 0%, transparent 70%)",
              opacity: "var(--blob-opacity-2)",
              transform: "translateZ(0)",
            }}
          />
        </>
      )}

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
