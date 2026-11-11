"use client";

import { GithubIcon, Sparkles, Lock } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useRepoContext } from "@/context/RepoContext";
import { Button } from "@/components/ui";

// ─────────────────────────────────────────────────────────────────────────────
// RepoAnalyzeForm
//
// Shared form component used in HeroSection and FinalCTA.
// All hooks and handleAnalyze logic are preserved exactly from HeroLanding.tsx.
// DO NOT modify handleAnalyze, useRepoContext usage, or routing behavior.
// ─────────────────────────────────────────────────────────────────────────────

export function RepoAnalyzeForm() {
  const router = useRouter();
  const { startAnalysis } = useRepoContext();
  const [input, setInput] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = input.trim().length > 0;

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || submitting) return;

    setSubmitting(true);
    startAnalysis(input.trim());
    router.push("/loading");
  };

  return (
    <form onSubmit={handleAnalyze} className="w-full">
      {/* Single-bar input */}
      <div className="flex items-center gap-2 rounded-2xl border border-fg/10 bg-fg/[0.04] p-1.5 pl-4 transition-all duration-200 focus-within:border-tomato-jam/35 focus-within:bg-fg/[0.06] focus-within:shadow-[0_0_0_4px_rgba(192,57,43,0.08)]">
        <span
          aria-hidden
          className="shrink-0 h-1.5 w-1.5 rounded-full bg-tomato-jam/60 shadow-[0_0_6px_2px_rgba(192,57,43,0.35)]"
        />
        <input
          className="flex-1 min-w-0 bg-transparent py-2.5 text-sm text-fg placeholder:text-fg/30 outline-none"
          placeholder="github.com/owner/repository"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          aria-label="GitHub repository URL"
        />
        <Button
          type="submit"
          variant="primary"
          size="sm"
          disabled={!canSubmit || submitting}
          loading={submitting}
          loadingText="Analyzing…"
          rightIcon={<Sparkles className="h-4 w-4" />}
        >
          Analyze
        </Button>
      </div>

      {/* Trust row */}
      <div className="mt-3.5 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-[11px] text-fg/30">
        <span className="inline-flex items-center gap-1.5">
          <GithubIcon className="h-3 w-3 text-fg/40" />
          No sign-up
        </span>
        <span aria-hidden className="text-fg/15">·</span>
        <span className="inline-flex items-center gap-1.5">
          <Lock className="h-3 w-3 text-fg/35" />
          No credit card
        </span>
        <span aria-hidden className="text-fg/15">·</span>
        <span>Runs server-side</span>
      </div>
    </form>
  );
}
