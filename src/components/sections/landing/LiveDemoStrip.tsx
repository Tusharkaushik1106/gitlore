"use client";

import { useEffect, useRef, useState } from "react";
import { BrainCircuit, FileCode, FolderTree, MessageCircle, Sparkles } from "lucide-react";
import { DarkSection } from "@/components/sections/DarkSection";
import { GradientText, SectionHeading, SpotlightCard, useInViewOnce } from "@/components/motion/fx";
import { Reveal } from "@/components/motion/Reveal";
import { useMotionPreference } from "@/hooks/useMotionPreference";
import { MOCK_FILES, MOCK_QA, MOCK_SUMMARY } from "@/data/landing";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────────────────────
// Landing › LiveDemoStrip
//
// gitlore analysing its own repository, as three cards that play once they
// scroll into view: the file map gets scanned, the summary types itself, and
// the chat answers two questions. Everything shows finished for reduced motion.
// ─────────────────────────────────────────────────────────────────────────────

const d = (seconds: number) => ({ "--d": `${seconds}s` }) as React.CSSProperties;

/** Counts up through `beats` (seconds after start), returning how many have passed. */
function useBeats(start: boolean, beats: number[], instant: boolean): number {
  const [passed, setPassed] = useState(0);
  useEffect(() => {
    if (!start || instant) return;
    const timers = beats.map((at, i) => setTimeout(() => setPassed(i + 1), at * 1000));
    return () => timers.forEach(clearTimeout);
  }, [start, instant, beats]);
  return instant ? beats.length : passed;
}

function useTyped(text: string, start: boolean, instant: boolean, delay = 0): string {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!start || instant) return;
    let id: ReturnType<typeof setInterval> | undefined;
    const t = setTimeout(() => {
      id = setInterval(() => setN((c) => (c >= text.length ? c : c + 2)), 22);
    }, delay * 1000);
    return () => {
      clearTimeout(t);
      if (id) clearInterval(id);
    };
  }, [text, start, instant, delay]);
  return instant ? text : text.slice(0, n);
}

const CHAT_BEATS = [0.6, 1.5, 2.6, 3.5];

function CardHeader({ icon: Icon, title, tint }: { icon: React.ComponentType<{ className?: string }>; title: string; tint: string }) {
  return (
    <div className="flex items-center gap-2.5 border-b border-fg/8 px-5 py-3.5">
      <span className={cn("flex h-7 w-7 items-center justify-center rounded-lg ring-1 ring-fg/10", tint)}>
        <Icon className="h-3.5 w-3.5" />
      </span>
      <span className="text-sm font-semibold text-fg/85">{title}</span>
    </div>
  );
}

export function LiveDemoStrip() {
  const { isReduced } = useMotionPreference();
  const ref = useRef<HTMLDivElement>(null);
  const seen = useInViewOnce(ref, 0.3);
  const summary = useTyped(MOCK_SUMMARY.text, seen, isReduced, 0.5);
  const chat = useBeats(seen, CHAT_BEATS, isReduced);

  return (
    <DarkSection spacing="lg">
      <SectionHeading
        eyebrow="See it in action"
        title={
          <>
            What you get in <GradientText>60 seconds</GradientText>
          </>
        }
        sub="Here's gitlore reading its own repository: a map of every file, a plain-English summary of each one, and a chat that knows where things live."
      />

      <div ref={ref} className="grid gap-4 md:grid-cols-3">
        {/* File map */}
        <Reveal variant="blurUp">
          <SpotlightCard className="h-full">
            <CardHeader icon={FolderTree} title="File map" tint="bg-tomato-jam/10 text-tomato-jam" />
            <div className="relative overflow-hidden p-4">
              {seen && !isReduced && (
                <div
                  aria-hidden
                  className="hero-scan pointer-events-none absolute inset-x-0 top-0 z-10 h-10 bg-gradient-to-b from-transparent via-metallic-gold/[0.14] to-transparent"
                  style={d(0.2)}
                >
                  <div className="absolute inset-x-0 top-1/2 h-px bg-metallic-gold/40" />
                </div>
              )}
              <ul className="space-y-1">
                {MOCK_FILES.map(({ name, active }, i) => (
                  <li
                    key={name}
                    className={cn(
                      "flex items-center gap-2.5 rounded-lg px-2.5 py-2 font-mono text-[11px]",
                      active ? "bg-tomato-jam/10 text-fg ring-1 ring-tomato-jam/25" : "text-fg/50",
                    )}
                  >
                    <FileCode className={cn("h-3.5 w-3.5 shrink-0", active ? "text-tomato-jam" : "text-fg/30")} />
                    <span className="truncate">{name}</span>
                    <span
                      className={cn("ml-auto h-1.5 w-1.5 shrink-0 rounded-full bg-fg/15", seen && "hero-resolve")}
                      style={d(0.5 + i * 0.25)}
                    />
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-center text-[11px] text-fg/35">Every file in the tree, ranked and linked</p>
            </div>
          </SpotlightCard>
        </Reveal>

        {/* AI summary */}
        <Reveal variant="blurUp" delay={0.1}>
          <SpotlightCard className="h-full" glow="212,175,55">
            <CardHeader icon={BrainCircuit} title="AI summary" tint="bg-metallic-gold/10 text-metallic-gold" />
            <div className="p-5">
              <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.15em] text-[#ea7a3b]/80">{MOCK_SUMMARY.file}</p>
              <p className="min-h-[110px] text-[13px] leading-relaxed text-fg/70">
                {summary}
                {seen && summary.length < MOCK_SUMMARY.text.length && (
                  <span className="hero-caret ml-0.5 inline-block h-3.5 w-[2px] translate-y-0.5 bg-tomato-jam" />
                )}
              </p>
              <div className="mt-4 rounded-xl border border-fg/8 bg-fg/[0.03] p-3">
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-fg/40">Exports</p>
                <ul className="space-y-1.5">
                  {MOCK_SUMMARY.exports.map((e, i) => (
                    <li
                      key={e}
                      className={cn(
                        "flex items-center gap-2 font-mono text-[11px] text-fg/60 transition-all duration-500",
                        summary.length >= MOCK_SUMMARY.text.length ? "translate-x-0 opacity-100" : "-translate-x-2 opacity-0",
                      )}
                      style={{ transitionDelay: `${i * 120}ms` }}
                    >
                      <span className="h-1 w-1 shrink-0 rounded-full bg-metallic-gold/70" />
                      {e}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </SpotlightCard>
        </Reveal>

        {/* Chat */}
        <Reveal variant="blurUp" delay={0.2}>
          <SpotlightCard className="h-full" glow="231,215,193">
            <CardHeader icon={MessageCircle} title="Chat with the repo" tint="bg-fg/8 text-fg/70" />
            <div className="flex min-h-[288px] flex-col gap-2.5 p-4">
              {MOCK_QA.flatMap(({ q, a }, i) => [
                chat > i * 2 && (
                  <div
                    key={q}
                    className="hero-pop ml-8 rounded-xl rounded-tr-sm bg-tomato-jam/[0.12] px-3 py-2 text-[12px] text-fg/80"
                  >
                    {q}
                  </div>
                ),
                chat > i * 2 + 1 ? (
                  <div
                    key={a}
                    className="hero-pop mr-4 flex gap-2 rounded-xl rounded-tl-sm border border-fg/8 bg-fg/[0.04] px-3 py-2 text-[12px] leading-relaxed text-fg/65"
                  >
                    <Sparkles className="mt-0.5 h-3 w-3 shrink-0 text-metallic-gold" />
                    {a}
                  </div>
                ) : (
                  chat === i * 2 + 1 && (
                    <div key={`${a}-typing`} className="mr-auto flex gap-1 rounded-xl bg-fg/[0.04] px-3 py-2.5" aria-hidden>
                      {[0, 1, 2].map((dot) => (
                        <span
                          key={dot}
                          className="h-1.5 w-1.5 animate-bounce rounded-full bg-fg/40"
                          style={{ animationDelay: `${dot * 120}ms` }}
                        />
                      ))}
                    </div>
                  )
                ),
              ])}
              <div className="mt-auto rounded-lg border border-fg/10 bg-canvas/50 px-3 py-2 text-[12px] text-fg/30">
                Ask anything about this codebase…
              </div>
            </div>
          </SpotlightCard>
        </Reveal>
      </div>
    </DarkSection>
  );
}
