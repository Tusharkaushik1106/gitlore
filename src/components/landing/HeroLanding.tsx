"use client";

import { motion } from "framer-motion";
import { GithubIcon, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useRepoContext } from "@/context/RepoContext";
import { Button, Eyebrow } from "@/components/ui";

export function HeroLanding() {
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
    <main className="relative min-h-dvh w-full overflow-hidden transform-gpu">
      <div className="relative z-10 flex min-h-dvh items-center justify-center px-4 pt-24 pb-10 sm:px-8 lg:px-16">
        <motion.div
          className="gf-card relative w-full max-w-5xl px-6 py-8 sm:px-10 sm:py-10 lg:px-14 lg:py-12"
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="relative z-10 grid gap-10 lg:grid-cols-[3fr,2fr] lg:items-center">
            {/* Left — copy + form */}
            <section>
              <Eyebrow>
                <Sparkles className="h-3 w-3" />
                Clarity through bioluminescence
              </Eyebrow>

              <h1 className="mt-5 text-balance text-4xl font-semibold tracking-tight text-fg sm:text-5xl lg:text-6xl">
                Speak{" "}
                <span className="bg-gradient-to-r from-tomato-jam to-metallic-gold bg-clip-text text-transparent">
                  fluent repository
                </span>
                .
              </h1>

              <p className="mt-5 max-w-xl text-balance text-sm leading-relaxed text-fg/60 sm:text-base">
                Drop your github repository and watch{" "}
                <span className="font-semibold bg-gradient-to-r from-tomato-jam to-metallic-gold bg-clip-text text-transparent">
                  gitlore
                </span>{" "}
                summarize every file, function, and dependency like a{" "}
                <span className="font-semibold text-metallic-gold">loyal one</span>.
              </p>

              <form
                onSubmit={handleAnalyze}
                className="mt-8 space-y-4 rounded-2xl bg-fg/[0.03] p-3 ring-1 ring-fg/10"
              >
                <label className="block text-xs font-medium uppercase tracking-[0.2em] text-fg/40">
                  Input Hub
                </label>

                <div
                  className={[
                    "relative flex flex-col gap-3 rounded-2xl bg-canvas/60 p-3 sm:flex-row sm:items-center sm:p-3.5 transition-shadow duration-300",
                    "focus-within:ring-2 focus-within:ring-tomato-jam/60 focus-within:ring-offset-0",
                    canSubmit
                      ? "shadow-[0_0_20px_0_rgba(192,57,43,0.35)]"
                      : "shadow-[0_0_10px_0_rgba(15,23,42,0.5)]",
                  ].join(" ")}
                >
                  {/* Rotating border */}
                  <div
                    className="pointer-events-none absolute inset-[-2px] rounded-[1.4rem] opacity-70"
                    style={{
                      background: "conic-gradient(from 120deg at 50% 50%, rgba(192,57,43,0.9), rgba(212,175,55,0.9), rgba(231,215,193,0.5), rgba(192,57,43,0.9))",
                      animation: "rotate-gradient 22s linear infinite",
                      willChange: "transform",
                      transform: "translateZ(0)",
                      WebkitBackfaceVisibility: "hidden",
                      backfaceVisibility: "hidden",
                    }}
                  />

                  <div className="relative flex-1 rounded-2xl bg-canvas/90 px-4 py-2.5">
                    <input
                      className="w-full bg-transparent text-sm text-fg placeholder:text-fg/25 outline-none focus:outline-none"
                      placeholder="Paste GitHub URL or drop a repo.zip"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                    />
                  </div>

                  <div className="relative flex gap-2 sm:w-auto sm:justify-end">
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
                </div>

                <div className="flex flex-wrap items-center gap-3 text-[11px] text-fg/50">
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-fg/5 px-2.5 py-1">
                    <GithubIcon className="h-3.5 w-3.5 text-fg/60" />
                    <span>Public GitHub repos – no account needed</span>
                  </div>
                  <span className="text-fg/20">or</span>
                  <span>Drop a .zip – processed entirely server-side</span>
                </div>
              </form>
            </section>

            {/* Right — feature preview panel */}
            <section className="relative">
              <motion.div
                className="gf-card relative h-full min-h-[260px]"
                initial={{ opacity: 0, y: 20, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: 0.15, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              >
                <div className="relative z-10 flex h-full flex-col justify-between p-5">
                  <div className="space-y-1.5">
                    <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-tomato-jam/90">
                      Neural Loading Bay
                    </p>
                    <p className="text-xs text-fg/60">
                      gitlore will:
                    </p>
                  </div>

                  <ol className="mt-4 space-y-2 text-xs text-fg/70">
                    <li className="flex items-start gap-2">
                      <span className="mt-[3px] h-1.5 w-10 rounded-full bg-tomato-jam/80" />
                      <span>Clone / unpack your repository.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-[3px] h-1.5 w-10 rounded-full bg-gradient-to-r from-tomato-jam/70 to-metallic-gold/60" />
                      <span>Parse files &amp; build ASTs and call graphs.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-[3px] h-1.5 w-10 rounded-full bg-metallic-gold/80" />
                      <span>Embed, summarize, and illuminate hotspots.</span>
                    </li>
                  </ol>

                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <div className="inline-flex items-center gap-1.5 rounded-full bg-tomato-jam/10 px-3 py-1.5 border border-tomato-jam/20">
                      <div className="h-1.5 w-1.5 rounded-full bg-tomato-jam animate-pulse" />
                      <span className="text-[10px] font-medium text-tomato-jam/90">Real-time Analysis</span>
                    </div>
                    <div className="inline-flex items-center gap-1.5 rounded-full bg-metallic-gold/10 px-3 py-1.5 border border-metallic-gold/20">
                      <div className="h-1.5 w-1.5 rounded-full bg-metallic-gold animate-pulse" />
                      <span className="text-[10px] font-medium text-metallic-gold/90">Smart Diagrams</span>
                    </div>
                    <div className="inline-flex items-center gap-1.5 rounded-full bg-fg/8 px-3 py-1.5 border border-fg/15">
                      <div className="h-1.5 w-1.5 rounded-full bg-fg/60 animate-pulse" />
                      <span className="text-[10px] font-medium text-fg/60">RAG-Powered Q&A</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            </section>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
