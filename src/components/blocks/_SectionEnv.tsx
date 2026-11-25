/**
 * _SectionEnv — internal utility, NOT exported from blocks/index.ts
 *
 * Picks the correct section environment wrapper (Dark / Light / Neutral)
 * based on the `environment` prop. This avoids repeating the conditional
 * in every block component.
 */

import * as React from "react";
import { DarkSection }       from "@/components/sections/DarkSection";
import { LightSection }      from "@/components/sections/LightSection";
import { NeutralSection }    from "@/components/sections/NeutralSection";
import type { SectionSpacing, SectionTag } from "@/components/sections/DarkSection";

export type BlockEnvironment = "dark" | "light" | "neutral";

export interface SectionEnvProps {
  environment?: BlockEnvironment;
  spacing?:     SectionSpacing;
  as?:          SectionTag;
  /** Light sections only: soft brand-tint blobs */
  atmosphere?:  boolean;
  fullBleed?:   boolean;
  id?:          string;
  className?:   string;
  /** Passed through to the section tag via {...props} — use to override inline styles */
  style?:       React.CSSProperties;
  children:     React.ReactNode;
}

export function SectionEnv({
  environment = "dark",
  spacing,
  as,
  atmosphere,
  fullBleed,
  id,
  className,
  style,
  children,
}: SectionEnvProps) {
  const shared = { spacing, as, fullBleed, id, className, style };

  // No section-level fade-in: sections appearing one by one made the page feel
  // segmented. Elements inside still use Reveal where a block wants it.
  if (environment === "light") {
    return <LightSection {...shared} atmosphere={atmosphere}>{children}</LightSection>;
  }
  if (environment === "neutral") {
    return <NeutralSection {...shared}>{children}</NeutralSection>;
  }
  return <DarkSection {...shared}>{children}</DarkSection>;
}
