import * as React from "react";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────────────────────
// Shared types
// ─────────────────────────────────────────────────────────────────────────────

export type SectionSpacing = "none" | "sm" | "md" | "lg" | "xl";
export type SectionTag     = "section" | "div" | "article" | "main" | "aside";

const spacings: Record<SectionSpacing, string> = {
  none: "",
  sm:   "py-12 md:py-16",
  md:   "py-16 md:py-24",
  lg:   "py-16 md:py-24",
  xl:   "py-24 md:py-40",
};

// ─────────────────────────────────────────────────────────────────────────────
// DarkSection
//
// Sets data-section="dark" which triggers all CSS variable overrides in
// globals.css — canvas → near-black warm, fg → almond cream.
// Every child component using text-fg, bg-canvas, bg-[var(--surface-gradient)]
// etc. automatically renders in the dark cinematic palette.
//
// Paints no background of its own: the fixed page background in app/layout.tsx
// (gradient, atmosphere, grain) shows through, so stacked sections read as one
// continuous page instead of separate panels.
// ─────────────────────────────────────────────────────────────────────────────

export interface DarkSectionProps extends React.HTMLAttributes<HTMLElement> {
  spacing?:       SectionSpacing;
  as?:            SectionTag;
  /** Remove max-width container — children go full-bleed */
  fullBleed?:     boolean;
}

export function DarkSection({
  spacing     = "md",
  as: Tag     = "section",
  fullBleed   = false,
  className,
  children,
  ...props
}: DarkSectionProps) {
  return (
    <Tag
      data-section="dark"
      className={cn(
        "relative overflow-hidden",
        spacings[spacing],
        className,
      )}
      {...props}
    >
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
