"use client";

import { Fragment, useEffect, useReducer, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  Check,
  CornerDownLeft,
  FileCode2,
  Folder,
  GitBranch,
  Loader2,
  MessageSquare,
  ShieldAlert,
  Sparkles,
  Workflow,
} from "lucide-react";
import { HERO_PREVIEW } from "@/data/landing";
import { ClaudeLogo } from "@/components/ui/BrandLogos";
import { useMotionPreference } from "@/hooks/useMotionPreference";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────────────────────
// Landing › HeroProductWindow
//
// A live-looking gitlore window. On load it plays the intro (window rises, scan
// line sweeps the tree, files resolve, bars fill); then it walks through files:
// the highlight moves, the summary types, a call-flow diagram draws, a question
// types into the chat box and gets answered, and it moves on.
// One clock drives the walkthrough and pauses while the window is off-screen or
// the tab is hidden. Motion classes (hero-*) live in globals.css; --d = delay.
// ─────────────────────────────────────────────────────────────────────────────

/** Seconds after load when the window starts rising. */
const T0 = 0.9;
const SUMMARY_CPS = 95;
const QUESTION_CPS = 32;
const TICK = 0.05;

const d = (seconds: number) => ({ "--d": `${seconds.toFixed(2)}s` }) as React.CSSProperties;
const typed = (text: string, t: number, start: number, cps: number) =>
  text.slice(0, Math.max(0, Math.min(text.length, Math.floor((t - start) * cps))));

type Step = (typeof HERO_PREVIEW.walkthrough)[number];

/** When each beat of a file's story happens, in seconds after the file is shown. */
function timeline(step: Step, firstShow: boolean) {
  const summaryAt = firstShow ? T0 + 1.3 : 0.35;
  const summaryEnd = summaryAt + step.summary.length / SUMMARY_CPS;
  const flowAt = summaryEnd + 0.15;
  const piecesAt = flowAt + 0.25 + step.flow.length * 0.12;
  const questionAt = piecesAt + 0.7;
  const questionEnd = questionAt + step.question.length / QUESTION_CPS;
  const answerAt = questionEnd + 0.45;
  return { summaryAt, flowAt, piecesAt, questionAt, answerAt, end: answerAt + 3.6 };
}

type Clock = { stepIndex: number; firstShow: boolean; t: number };

/** Advances time; once a file's story has played out, moves to the next file. */
function tick(clock: Clock): Clock {
  const steps = HERO_PREVIEW.walkthrough;
  const t = clock.t + TICK;
  if (t < timeline(steps[clock.stepIndex], clock.firstShow).end) return { ...clock, t };
  return { stepIndex: (clock.stepIndex + 1) % steps.length, firstShow: false, t: 0 };
}

export function HeroProductWindow() {
  const { isReduced } = useMotionPreference();
  const { repo, branch, sourceFiles, tree, walkthrough, hotspots, languages, risk } = HERO_PREVIEW;

  const rootRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(true);
  const [{ stepIndex, firstShow, t }, advance] = useReducer(tick, { stepIndex: 0, firstShow: true, t: 0 });

  const step = walkthrough[stepIndex];
  const beat = timeline(step, firstShow);
  // Reduced motion: show the first file's finished state and stay still.
  const now = isReduced ? Number.POSITIVE_INFINITY : t;

  // Pause the clock while the window is off-screen or the tab is in the background.
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    let onScreen = true;
    const update = () => setVisible(onScreen && !document.hidden);
    const io = new IntersectionObserver(([entry]) => {
      onScreen = entry.isIntersecting;
      update();
    });
    io.observe(el);
    document.addEventListener("visibilitychange", update);
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", update);
    };
  }, []);

  useEffect(() => {
    if (isReduced || !visible) return;
    const id = setInterval(advance, TICK * 1000);
    return () => clearInterval(id);
  }, [isReduced, visible]);

  const ready = !firstShow || now > T0 + 2.6;
  const summary = typed(step.summary, now, beat.summaryAt, SUMMARY_CPS);
  const question = typed(step.question, now, beat.questionAt, QUESTION_CPS);
  const typingSummary = now >= beat.summaryAt && summary.length < step.summary.length;
  const typingQuestion = now >= beat.questionAt && question.length < step.question.length;

  return (
    <div ref={rootRef} className="relative mx-auto w-full max-w-5xl" role="img" aria-label="Preview of a gitlore analysis">
      {/* Light flash behind the window as it lands */}
      <div
        aria-hidden
        className="hero-glow-flash pointer-events-none absolute -inset-x-16 -top-16 h-[75%] rounded-[50%] blur-3xl"
        style={{
          ...d(T0 + 0.2),
          background:
            "radial-gradient(ellipse 60% 55% at 50% 40%, rgba(192,57,43,0.28), rgba(212,175,55,0.10) 45%, transparent 70%)",
        }}
      />

      <div
        className="hero-window-in relative rounded-2xl border border-fg/10 bg-[#141110]/85 shadow-[0_40px_120px_-20px_rgba(0,0,0,0.85)] backdrop-blur-xl"
        style={d(T0)}
      >
        <div aria-hidden className="hero-beam" />

        <div className="overflow-hidden rounded-2xl">
          {/* ── Title bar ───────────────────────────────────── */}
          <div className="flex h-11 items-center gap-3 border-b border-fg/8 px-4">
            <div className="flex gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-tomato-jam/70" />
              <span className="h-2.5 w-2.5 rounded-full bg-metallic-gold/70" />
              <span className="h-2.5 w-2.5 rounded-full bg-fg/20" />
            </div>
            <div className="flex min-w-0 items-center gap-1.5 font-mono text-[11px] text-fg/40">
              <span className="text-fg/60">gitlore</span>
              <span>/</span>
              <span className="truncate text-fg/75">{repo}</span>
            </div>
            <div
              className={cn(
                "ml-auto flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-[10px] font-medium transition-colors duration-500",
                ready
                  ? "border-emerald-400/25 bg-emerald-400/10 text-emerald-300"
                  : "border-metallic-gold/25 bg-metallic-gold/10 text-metallic-gold",
              )}
            >
              {ready ? <Check className="h-3 w-3" /> : <Loader2 className="h-3 w-3 animate-spin" />}
              {ready ? (
                <>
                  Mapped<span className="hidden sm:inline"> {sourceFiles} source files</span>
                </>
              ) : (
                "Analyzing…"
              )}
            </div>
          </div>

          {/* ── Body ────────────────────────────────────────── */}
          <div className="grid min-h-[372px] grid-cols-1 lg:min-h-[430px] sm:grid-cols-[210px_1fr] lg:grid-cols-[210px_1fr_240px]">
            {/* File tree + scan */}
            <div className="relative hidden overflow-hidden border-r border-fg/8 px-2 py-3 sm:block">
              <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-fg/30">Explorer</p>
              <div
                aria-hidden
                className="hero-scan pointer-events-none absolute inset-x-0 top-0 z-10 h-10 bg-gradient-to-b from-transparent via-metallic-gold/[0.12] to-transparent"
                style={d(T0 + 0.5)}
              >
                <div className="absolute inset-x-0 top-1/2 h-px bg-metallic-gold/40" />
              </div>
              <ul className="font-mono text-[11px]">
                {tree.map((node, i) => {
                  const active = node.id === step.id;
                  return (
                    <li key={node.name + i} className="relative">
                      {/* Indent guides */}
                      {Array.from({ length: node.depth }).map((_, g) => (
                        <span
                          key={g}
                          aria-hidden
                          className="absolute bottom-0 top-0 w-px bg-fg/8"
                          style={{ left: `${14 + g * 14}px` }}
                        />
                      ))}
                      {active && (
                        <motion.span
                          layoutId="hero-tree-active"
                          className="absolute inset-0 rounded-md bg-tomato-jam/10 ring-1 ring-tomato-jam/30"
                          transition={{ type: "spring", stiffness: 380, damping: 32 }}
                        />
                      )}
                      <div
                        className={cn(
                          "relative flex items-center gap-1.5 rounded-md py-[5px] pr-2",
                          node.kind === "dir" ? "text-fg/45" : active ? "text-fg" : "text-fg/60",
                        )}
                        style={{ paddingLeft: `${8 + node.depth * 14}px` }}
                      >
                        {node.kind === "dir" ? (
                          <Folder className="h-3.5 w-3.5 shrink-0 text-metallic-gold/60" />
                        ) : (
                          <FileCode2 className={cn("h-3.5 w-3.5 shrink-0", active ? "text-tomato-jam" : "text-fg/35")} />
                        )}
                        <span className="truncate">{node.name}</span>
                        {node.kind === "file" && (
                          <span
                            className="hero-resolve ml-auto h-1.5 w-1.5 shrink-0 rounded-full"
                            style={d(T0 + 0.7 + i * 0.16)}
                          />
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* Center: summary, flow, chat */}
            <div className="flex min-w-0 flex-col text-left">
              {/* Tabs */}
              <div className="flex items-center gap-1 border-b border-fg/8 px-3 py-2">
                <span className="flex items-center gap-1.5 rounded-md bg-fg/[0.06] px-2.5 py-1 text-[11px] font-medium text-fg">
                  <Sparkles className="h-3 w-3 text-tomato-jam" />
                  Summary
                </span>
                <span className="hidden items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] text-fg/40 min-[420px]:flex">
                  <Workflow className="h-3 w-3" />
                  Diagram
                </span>
                <span className="hidden items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] text-fg/40 min-[420px]:flex">
                  <MessageSquare className="h-3 w-3" />
                  Chat
                </span>
                <span key={step.file} className="hero-swap ml-auto truncate font-mono text-[11px] text-fg/45">
                  {step.file}
                </span>
              </div>

              <div key={step.id} className="hero-swap flex flex-1 flex-col p-5">
                <p className="min-h-[88px] text-[13px] leading-relaxed text-fg/75">
                  {summary}
                  {typingSummary && (
                    <span className="hero-caret ml-0.5 inline-block h-3.5 w-[2px] translate-y-0.5 bg-tomato-jam" />
                  )}
                </p>

                {/* Call flow */}
                <div className="mt-3 hidden min-h-[30px] items-center sm:flex">
                  {now >= beat.flowAt &&
                    step.flow.map((node, i) => (
                      <Fragment key={node}>
                        {i > 0 && (
                          <span
                            className="hero-pop relative mx-1 h-px min-w-3 flex-1 bg-gradient-to-r from-fg/15 to-fg/25"
                            style={d(Math.max(0, i * 0.12 - 0.06))}
                          >
                            <span
                              className="hero-flow-pulse absolute top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-metallic-gold shadow-[0_0_8px_2px_rgba(212,175,55,0.55)]"
                              style={d(i * 0.3)}
                            />
                          </span>
                        )}
                        <span
                          className={cn(
                            "hero-pop shrink-0 rounded-md border px-2 py-1 font-mono text-[10.5px]",
                            i === 0 || i === step.flow.length - 1
                              ? "border-fg/10 bg-fg/[0.04] text-fg/60"
                              : "border-metallic-gold/30 bg-metallic-gold/[0.08] text-metallic-gold",
                          )}
                          style={d(i * 0.12)}
                        >
                          {node}
                        </span>
                      </Fragment>
                    ))}
                </div>

                {/* Key pieces */}
                <div className="mt-4 flex min-h-[26px] flex-wrap gap-1.5">
                  {now >= beat.piecesAt &&
                    step.pieces.map((piece, i) => (
                      <span
                        key={piece}
                        className="hero-pop rounded-md border border-fg/10 bg-fg/[0.03] px-2 py-1 font-mono text-[11px] text-fg/65"
                        style={d(i * 0.1)}
                      >
                        <span className="text-tomato-jam/80">ƒ</span> {piece}
                      </span>
                    ))}
                </div>

                {/* Chat */}
                <div className="mt-auto space-y-2 pt-4">
                  {now >= beat.answerAt && (
                    <div className="hero-pop flex items-start gap-2 rounded-lg border border-metallic-gold/20 bg-metallic-gold/[0.06] px-3 py-2 text-[12px] leading-snug text-fg/80">
                      <Sparkles className="mt-0.5 h-3 w-3 shrink-0 text-metallic-gold" />
                      {step.answer}
                    </div>
                  )}
                  <div
                    className={cn(
                      "flex items-center gap-2 rounded-lg border bg-canvas/60 px-3 py-2 text-[12px] transition-colors",
                      typingQuestion ? "border-tomato-jam/35" : "border-fg/10",
                    )}
                  >
                    <MessageSquare className="h-3.5 w-3.5 shrink-0 text-fg/35" />
                    {question ? (
                      <span className="text-fg/80">
                        {question}
                        {typingQuestion && (
                          <span className="hero-caret ml-0.5 inline-block h-3 w-[2px] translate-y-0.5 bg-tomato-jam" />
                        )}
                      </span>
                    ) : (
                      <span className="text-fg/30">Ask anything about this file…</span>
                    )}
                    <CornerDownLeft className="ml-auto h-3.5 w-3.5 shrink-0 text-fg/25" />
                  </div>
                </div>
              </div>
            </div>

            {/* Hotspots + stack */}
            <div className="hidden border-l border-fg/8 p-4 text-left lg:block">
              <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-fg/30">Hotspots</p>
              <ul className="space-y-1">
                {hotspots.map((h, i) => {
                  const active = h.id === step.id;
                  return (
                    <li
                      key={h.name}
                      className={cn("rounded-md px-2 py-1.5 transition-colors duration-500", active && "bg-fg/[0.05]")}
                    >
                      <div className="mb-1 flex justify-between font-mono text-[11px]">
                        <span className={cn("truncate transition-colors duration-500", active ? "text-fg" : "text-fg/55")}>
                          {h.name}
                        </span>
                        <span className="tabular-nums text-fg/40">{Math.round(h.score * 100)}</span>
                      </div>
                      <div className="h-1 overflow-hidden rounded-full bg-fg/8">
                        <div
                          className={cn(
                            "hero-bar h-full rounded-full",
                            h.score >= 0.8
                              ? "bg-gradient-to-r from-tomato-jam to-tomato-jam/70"
                              : h.score >= 0.6
                                ? "bg-gradient-to-r from-metallic-gold to-metallic-gold/70"
                                : "bg-fg/35",
                          )}
                          style={{ width: `${h.score * 100}%`, ...d(T0 + 1.1 + i * 0.15) }}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>

              <p className="mb-2 mt-5 px-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-fg/30">Languages</p>
              <div className="mx-2 flex h-1.5 overflow-hidden rounded-full bg-fg/8">
                {languages.map((l, i) => (
                  <div
                    key={l.name}
                    className={cn("hero-bar h-full", ["bg-tomato-jam", "bg-metallic-gold", "bg-fg/40"][i % 3])}
                    style={{ width: `${l.share}%`, ...d(T0 + 1.7 + i * 0.12) }}
                  />
                ))}
              </div>
              <ul className="mt-2 space-y-1 px-2 text-[11px]">
                {languages.map((l, i) => (
                  <li key={l.name} className="flex items-center gap-2 text-fg/55">
                    <span className={cn("h-1.5 w-1.5 rounded-full", ["bg-tomato-jam", "bg-metallic-gold", "bg-fg/40"][i % 3])} />
                    {l.name}
                    <span className="ml-auto tabular-nums text-fg/35">{l.share}%</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* ── Status bar ──────────────────────────────────── */}
          <div className="flex h-8 items-center gap-4 border-t border-fg/8 bg-fg/[0.02] px-4 font-mono text-[10px] text-fg/40">
            <span className="flex items-center gap-1.5">
              <GitBranch className="h-3 w-3" />
              {branch}
            </span>
            <span className="hidden items-center gap-1.5 sm:flex">
              <span className={cn("h-1.5 w-1.5 rounded-full", ready ? "bg-emerald-400" : "animate-pulse bg-metallic-gold")} />
              {ready ? "Indexed" : "Indexing"}
            </span>
            <span className="hidden sm:inline">
              {stepIndex + 1} / {walkthrough.length} files explained
            </span>
            <span className="ml-auto flex items-center gap-1">
              <kbd className="rounded border border-fg/15 px-1 text-[9px] text-fg/50">⌘K</kbd>
              ask gitlore
            </span>
          </div>
        </div>
      </div>

      {/* ── Floating: what the visitor's agent got back over MCP ─── */}
      <RiskCard risk={risk} delay={T0 + 3.4} />
    </div>
  );
}

function RiskCard({ risk, delay }: { risk: typeof HERO_PREVIEW.risk; delay: number }) {
  const radius = 17;
  const circumference = 2 * Math.PI * radius;
  const filled = (risk.score / 10) * circumference;
  return (
    <div
      className="hero-pop relative mx-auto mt-4 w-full max-w-[300px] rounded-xl border border-tomato-jam/25 bg-[#1a1210]/95 p-3.5 text-left shadow-[0_24px_60px_rgba(0,0,0,0.65)] backdrop-blur-md sm:absolute sm:-bottom-16 sm:-right-4 sm:mt-0 sm:w-[300px] lg:-right-10"
      style={d(delay)}
    >
      <div className="flex items-center gap-3">
        <div className="relative h-11 w-11 shrink-0">
          <svg viewBox="0 0 44 44" className="h-11 w-11 -rotate-90" aria-hidden>
            <circle cx="22" cy="22" r={radius} fill="none" stroke="rgba(231,215,193,0.1)" strokeWidth="4" />
            <circle
              className="hero-ring"
              cx="22"
              cy="22"
              r={radius}
              fill="none"
              stroke="#c0392b"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={`${filled} ${circumference}`}
              style={{ "--ring-len": `${filled}`, ...d(delay + 0.2) } as React.CSSProperties}
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-[13px] font-semibold tabular-nums text-tomato-jam">
            {risk.score}
          </span>
        </div>
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 font-mono text-[11px] text-fg/70">
            <ShieldAlert className="h-3.5 w-3.5 text-tomato-jam" />
            score_risk
            <span className="text-fg/35">· your last change</span>
          </p>
          <p className="mt-1 text-[12px] leading-snug text-fg/75">{risk.reason}</p>
        </div>
      </div>
      <div className="mt-2.5 flex flex-wrap gap-1.5">
        {risk.touches.map((area) => (
          <span
            key={area}
            className="rounded-full border border-tomato-jam/30 bg-tomato-jam/10 px-2 py-0.5 text-[10px] font-medium text-tomato-jam"
          >
            {area}
          </span>
        ))}
      </div>
      <div className="mt-2.5 flex items-center gap-1.5 border-t border-fg/8 pt-2 text-[10px] text-fg/40">
        <ClaudeLogo className="h-3 w-3" />
        Claude Code checked this through gitlore&apos;s MCP server
      </div>
    </div>
  );
}
