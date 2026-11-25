import { GitFork } from "lucide-react";
import { CTASection } from "@/components/blocks/CTASection";
import { GradientText } from "@/components/motion/fx";
import { RepoAnalyzeForm } from "./RepoAnalyzeForm";
import { HERO_SAMPLE_REPOS } from "@/data/landing";

// ─────────────────────────────────────────────────────────────────────────────
// Landing › FinalCTA
//
// Thin wrapper around CTASection.
// RepoAnalyzeForm passed as the form slot — behavioral logic unchanged.
// ─────────────────────────────────────────────────────────────────────────────

export function FinalCTA() {
  return (
    <CTASection
      environment="dark"
      spacing="lg"
      eyebrow="Ready when you are"
      eyebrowIcon={GitFork}
      headline={
        <>
          Your next repo is{" "}
          <GradientText>one URL away</GradientText>
        </>
      }
      subheadline="Drop any GitHub repository below. No setup, no configuration — just a URL and 60 seconds."
      form={<RepoAnalyzeForm samples={HERO_SAMPLE_REPOS} />}
    />
  );
}
