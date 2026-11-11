"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useRepoContext } from "@/context/RepoContext";
import { AlertCircle } from "lucide-react";
import { signIn, useSession } from "next-auth/react";
import { Button } from "@/components/ui";
import { cn } from "@/lib/utils";

const steps = [
  { id: "cloning",      label: "Cloning repository" },
  { id: "parsing",      label: "Parsing & mapping files" },
  { id: "vectorizing",  label: "Vectorizing & summarizing" },
  { id: "architecting", label: "Architecting neural map" },
] as const;

export function NeuralLoadingBay() {
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  const { analysis, status, error, startAnalysis, finishAnalysis, failAnalysis } = useRepoContext();
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  useEffect(() => {
    if (error && (error.toLowerCase().includes("unauthorized") || error.toLowerCase().includes("401"))) {
      const callbackUrl = "/";
      void signIn(undefined, { callbackUrl });
    }
  }, [error, router]);

  useEffect(() => {
    if (sessionStatus === "unauthenticated") {
      const callbackUrl = "/";
      void signIn(undefined, { callbackUrl });
    }
  }, [sessionStatus, router]);

  useEffect(() => {
    if (!analysis?.repoUrl || status === "done" || status === "error") {
      return;
    }

    let cancelled = false;

    async function run() {
      if (!analysis) return;
      try {
        const res = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ repoUrl: analysis.repoUrl }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));

          if (res.status === 429) {
            const retryAfter = data.retryAfter || 60;
            throw new Error(
              `Rate limit exceeded. ` +
              `Please wait ${retryAfter} seconds and try again.`
            );
          }
          throw new Error(data.error || "Failed to analyze repository");
        }

        const json = await res.json();
        if (cancelled) return;

        window.dispatchEvent(new CustomEvent("usage-updated"));

        finishAnalysis(json);
        router.push("/dashboard");
      } catch (err: unknown) {
        if (cancelled) return;
        const message =
          err instanceof Error ? err.message : "Unexpected error while analyzing repo.";
        failAnalysis(message);
      }
    }

    run();

    const stepTimer = setInterval(() => {
      setCurrentStepIndex((prev) => (prev + 1) % steps.length);
    }, 1200);

    return () => {
      cancelled = true;
      clearInterval(stepTimer);
    };
  }, [analysis?.repoUrl, failAnalysis, finishAnalysis, router, status]);

  /* ── Auth redirect splash ── */
  if (status === "error" && error) {
    if (error.toLowerCase().includes("unauthorized") || error.toLowerCase().includes("401")) {
      return (
        <main className="flex min-h-dvh items-center justify-center px-4">
          <p className="text-sm text-fg/40">Redirecting to sign in…</p>
        </main>
      );
    }

    /* ── Error state ── */
    return (
      <main className="flex min-h-dvh items-center justify-center px-6 py-16">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-lg"
        >
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-tomato-jam/12 border border-tomato-jam/20">
              <AlertCircle className="h-4 w-4 text-tomato-jam" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-tomato-jam/70">
                Analysis failed
              </p>
              <h1 className="text-lg font-semibold text-fg">
                Unable to analyze repository
              </h1>
            </div>
          </div>

          <div className="mb-6 rounded-xl border border-tomato-jam/20 bg-tomato-jam/5 p-4">
            <p className="text-xs font-semibold text-tomato-jam/60 mb-1.5">Error</p>
            <p className="text-sm text-fg/65 leading-relaxed whitespace-pre-wrap">{error}</p>
          </div>

          <div className="flex gap-3">
            <Button variant="primary" onClick={() => router.push("/")}>
              Back to Home
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                if (analysis?.repoUrl) {
                  router.push("/");
                  setTimeout(() => {
                    startAnalysis(analysis.repoUrl);
                    router.push("/loading");
                  }, 100);
                }
              }}
            >
              Try Again
            </Button>
          </div>
        </motion.div>
      </main>
    );
  }

  /* ── Loading state ── */
  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden px-6 py-16">

      {/* Atmospheric glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/3 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-tomato-jam/8 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-[300px] w-[300px] rounded-full bg-metallic-gold/5 blur-3xl" />
      </div>

      <div className="relative z-10 flex w-full max-w-xl flex-col items-center">

        {/* Eyebrow */}
        <motion.p
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-5 text-xs font-semibold uppercase tracking-[0.22em] text-tomato-jam/70"
        >
          Neural Loading Bay
        </motion.p>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-2 text-center text-2xl font-semibold tracking-tight text-fg sm:text-3xl"
        >
          Mapping{" "}
          <span className="text-tomato-jam">
            {analysis?.name ?? "your repository"}
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-12 text-center text-sm text-fg/40"
        >
          Cloning, parsing, and lighting up the structure of your codebase.
        </motion.p>

        {/* ── Orb ── */}
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="relative mb-12 flex h-48 w-48 items-center justify-center"
        >
          {/* Outermost breathing ring */}
          <motion.div
            className="absolute inset-0 rounded-full border border-tomato-jam/15"
            animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
          />
          {/* Rotating ring 1 */}
          <motion.div
            className="absolute inset-6 rounded-full border border-tomato-jam/25"
            animate={{ rotate: 360 }}
            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
          />
          {/* Rotating ring 2 (counter) */}
          <motion.div
            className="absolute inset-12 rounded-full border border-metallic-gold/20"
            animate={{ rotate: -360 }}
            transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
          />
          {/* Core glow */}
          <div className="absolute h-20 w-20 rounded-full bg-gradient-to-br from-tomato-jam/40 via-metallic-gold/25 to-transparent blur-2xl" />
          <div className="absolute h-10 w-10 rounded-full bg-gradient-to-br from-tomato-jam/70 to-metallic-gold/40 blur-lg" />
          {/* Orbiting dot — outer */}
          <motion.div
            className="absolute inset-0"
            animate={{ rotate: 360 }}
            transition={{ duration: 7, repeat: Infinity, ease: "linear" }}
          >
            <div className="absolute top-0 left-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1 rounded-full bg-tomato-jam shadow-[0_0_8px_rgba(192,57,43,0.9)]" />
          </motion.div>
          {/* Orbiting dot — inner */}
          <motion.div
            className="absolute inset-8"
            animate={{ rotate: -360 }}
            transition={{ duration: 13, repeat: Infinity, ease: "linear" }}
          >
            <div className="absolute bottom-0 right-0 h-1.5 w-1.5 rounded-full bg-metallic-gold/80 shadow-[0_0_6px_rgba(212,175,55,0.8)]" />
          </motion.div>
        </motion.div>

        {/* ── Step progress ── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-6 w-full"
        >
          <div className="mb-3 grid grid-cols-4 gap-1.5">
            {steps.map((step, index) => {
              const isDone    = index < currentStepIndex;
              const isCurrent = index === currentStepIndex;
              return (
                <div key={step.id} className="flex flex-col items-center gap-1.5">
                  <div className="relative h-0.5 w-full overflow-hidden rounded-full bg-fg/8">
                    <motion.div
                      className="absolute inset-y-0 left-0 rounded-full bg-tomato-jam"
                      animate={{ width: isDone ? "100%" : isCurrent ? "55%" : "0%" }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                    />
                  </div>
                  <span
                    className={cn(
                      "text-[9px] font-semibold uppercase tracking-[0.12em] transition-colors duration-300",
                      isCurrent ? "text-fg/70" : isDone ? "text-tomato-jam/55" : "text-fg/20",
                    )}
                  >
                    {step.id}
                  </span>
                </div>
              );
            })}
          </div>

          <p className="text-center text-sm text-fg/55">
            {steps[currentStepIndex].label}
          </p>
        </motion.div>

        {/* ── Live context facts ── */}
        {analysis?.owner && analysis?.name && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="w-full rounded-2xl border border-fg/8 bg-fg/[0.03] px-5 py-4"
          >
            <p className="mb-2 text-[11px] font-semibold text-fg/45">Live context</p>
            <ul className="space-y-1 text-[11px] text-fg/35">
              <li>· Repo: {analysis.owner}/{analysis.name}</li>
              <li>· Model: claude-haiku-5-5</li>
              <li>· Hotspots: {analysis.hotspots.length || 3} candidate files</li>
            </ul>
          </motion.div>
        )}

      </div>
    </main>
  );
}
