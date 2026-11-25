import { HeroSection }          from "@/components/sections/landing/HeroSection";
import { LiveDemoStrip }        from "@/components/sections/landing/LiveDemoStrip";
import { CredibilityBar }       from "@/components/sections/landing/CredibilityBar";
import { ProblemStatement }     from "@/components/sections/landing/ProblemStatement";
import { SelfSelectionCards }   from "@/components/sections/landing/SelfSelectionCards";
import { FeatureWalkthrough }   from "@/components/sections/landing/FeatureWalkthrough";
import { HowItWorks }           from "@/components/sections/landing/HowItWorks";
import { ExtensionSpotlight }   from "@/components/sections/landing/ExtensionSpotlight";
import { McpSpotlight }         from "@/components/sections/landing/McpSpotlight";
import { FreeTierTransparency } from "@/components/sections/landing/FreeTierTransparency";
import { FinalCTA }             from "@/components/sections/landing/FinalCTA";
import { SiteFooter }           from "@/components/sections/landing/SiteFooter";

// ─────────────────────────────────────────────────────────────────────────────
// Landing page
//
// Section order (layered belief system — awareness → conversion):
//   1. HeroSection        — value prop + analyze form (full viewport)
//   2. LiveDemoStrip      — concrete mock output ("show, don't tell")
//   3. CredibilityBar     — integration logos + key stats
//   4. ProblemStatement   — empathy: the pain of unfamiliar codebases
//   5. SelfSelectionCards — persona cards (new hire / OSS / reviewer)
//   6. FeatureWalkthrough — tabbed product capability deep-dive
//   7. HowItWorks         — 3-step process (anchor: #how-it-works)
//   8. ExtensionSpotlight — VS Code extension CTA (anchor: #extension)
//   8b. McpSpotlight      — personal MCP link for Claude / Cursor (anchor: #mcp)
//   9. FreeTierTransparency— explicit free-tier details (trust signal)
//  10. FinalCTA           — repeat analyze form for late converters
//  11. SiteFooter         — links + legal
//
// DO NOT add data fetching, API calls, or hooks to this file.
// All behavioral logic lives inside individual section components.
// ─────────────────────────────────────────────────────────────────────────────

export default function Home() {
  return (
    <>
      <HeroSection />
      <LiveDemoStrip />
      <CredibilityBar />
      <ProblemStatement />
      <SelfSelectionCards />
      <FeatureWalkthrough />
      <HowItWorks />
      <ExtensionSpotlight />
      <McpSpotlight />
      <FreeTierTransparency />
      <FinalCTA />
      <SiteFooter />
    </>
  );
}
