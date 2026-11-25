"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { DarkSection } from "@/components/sections/DarkSection";
import { ClaudeLogo, CursorLogo, OpenAILogo, VSCodeLogo } from "@/components/ui/BrandLogos";
import { useMotionPreference } from "@/hooks/useMotionPreference";
import { HERO_SAMPLE_REPOS, HERO_WORDS } from "@/data/landing";
import { RepoAnalyzeForm } from "./RepoAnalyzeForm";
import { HeroProductWindow } from "./HeroProductWindow";

// ─────────────────────────────────────────────────────────────────────────────
// Landing › HeroSection
//
// Centered hero: announcement pill → headline with a rolling last word →
// analyze form → "works with" row → live product window.
// Copy enters the way linear.app's does (blur + rise, staggered); the rolling
// word follows coderabbit.ai's per-character roll. Text lives in @/data/landing.
// Behavioral logic (form submit, routing) stays in RepoAnalyzeForm.
// ─────────────────────────────────────────────────────────────────────────────

const d = (seconds: number) => ({ "--d": `${seconds}s` }) as React.CSSProperties;

/**
 * One continuous brand gradient across the whole word (tomato → amber → gold), lifted
 * a little so it glows on the dark page. Each letter animates on its own, so each one
 * paints only its slice of the gradient: the image is `count` letters wide and shifted
 * so letter i shows the i-th slice. Assumes roughly even letter widths, which reads fine.
 */
const WORD_GRADIENT = "linear-gradient(90deg, #e2553e 0%, #ea7a3b 40%, #efa54a 70%, #f2cb66 100%)";

function gradientSlice(index: number, count: number): React.CSSProperties {
  return {
    backgroundImage: WORD_GRADIENT,
    backgroundSize: `${count * 100}% 100%`,
    backgroundPosition: `${count > 1 ? (index / (count - 1)) * 100 : 0}% 0`,
    WebkitBackgroundClip: "text",
    backgroundClip: "text",
    color: "transparent",
  };
}

function RollingWord({ words }: { words: string[] }) {
  const { isReduced } = useMotionPreference();
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (isReduced || words.length < 2) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % words.length), 2800);
    return () => clearInterval(id);
  }, [isReduced, words.length]);

  const word = words[index];
  const letters = [...word, "."];
  return (
    <>
      <span className="sr-only">{words[0]}.</span>
      {/* Soft halo sits outside the clipping box so it isn't cut off. */}
      <span aria-hidden className="inline-flex [filter:drop-shadow(0_0_28px_rgba(226,85,62,0.28))]">
        {/* Clips vertically only, so the roll is masked but the blur isn't cut at the sides.
            Bottom padding keeps descenders (g, y, p) inside the clipping box. */}
        <span className="relative -mb-[0.14em] inline-flex overflow-x-visible overflow-y-clip pb-[0.14em]">
          {/* "wait": the old word leaves before the new one enters, so the line never
              has two words of different widths fighting over the same box. */}
          <AnimatePresence mode="wait" initial={false}>
            <motion.span key={word} className="inline-flex">
              {letters.map((char, i) => (
                <motion.span
                  key={i}
                  className="inline-block"
                  style={gradientSlice(i, letters.length)}
                  initial={{ y: "100%", opacity: 0, filter: "blur(6px)" }}
                  animate={{ y: "0%", opacity: 1, filter: "blur(0px)" }}
                  exit={{
                    y: "-100%",
                    opacity: 0,
                    filter: "blur(6px)",
                    transition: { duration: 0.28, ease: [0.4, 0, 1, 1], delay: i * 0.015 },
                  }}
                  transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: i * 0.035 }}
                >
                  {char}
                </motion.span>
              ))}
            </motion.span>
          </AnimatePresence>
        </span>
      </span>
    </>
  );
}

export function HeroSection() {
  // The glow follows the pointer through CSS variables, so moving the mouse never re-renders React.
  function trackPointer(e: React.PointerEvent<HTMLElement>) {
    if (e.pointerType !== "mouse") return;
    const el = e.currentTarget;
    const rect = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${e.clientX - rect.left}px`);
    el.style.setProperty("--my", `${e.clientY - rect.top}px`);
  }

  return (
    <DarkSection as="main" spacing="none" fullBleed onPointerMove={trackPointer}>
      {/* ── Backdrop ─────────────────────────────────────────── */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        {/* Fine grid, faded out toward the edges */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(231,215,193,0.045)_1px,transparent_1px),linear-gradient(to_bottom,rgba(231,215,193,0.045)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_75%_55%_at_50%_25%,black,transparent)]" />
        {/* Gold light from the top */}
        <div className="absolute inset-x-0 top-0 h-[520px] bg-[radial-gradient(ellipse_45%_60%_at_50%_0%,rgba(212,175,55,0.13),transparent_70%)]" />
        {/* Pointer glow */}
        <div
          className="absolute inset-0"
          style={{
            background: "radial-gradient(520px circle at var(--mx, 50%) var(--my, 30%), rgba(192,57,43,0.10), transparent 65%)",
          }}
        />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 pb-36 pt-28 text-center sm:px-6 sm:pt-32 lg:px-8">
        {/* ── Announcement ─────────────────────────────────────── */}
        <a
          href="#mcp"
          className="hero-in group relative inline-flex items-center gap-2 overflow-hidden rounded-full border border-fg/12 bg-fg/[0.04] py-1 pl-1 pr-3 text-xs text-fg/70 transition-colors hover:border-metallic-gold/40 hover:text-fg"
          style={d(0)}
        >
          <span aria-hidden className="hero-shine pointer-events-none absolute inset-0" />
          <span className="rounded-full bg-tomato-jam px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
            New
          </span>
          Use gitlore in your agent with MCP
          <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
        </a>

        {/* ── Headline ─────────────────────────────────────────── */}
        <h1 className="mt-7 text-5xl font-semibold leading-[1.04] tracking-tight text-fg sm:text-6xl lg:text-7xl">
          <span className="hero-in block" style={d(0.1)}>
            Speak fluent
          </span>
          <span className="hero-in block" style={d(0.22)}>
            <RollingWord words={HERO_WORDS} />
          </span>
        </h1>

        <p
          className="hero-in mx-auto mt-6 max-w-2xl text-balance text-base leading-relaxed text-fg/60 sm:text-lg"
          style={d(0.36)}
        >
          Drop in any GitHub repo. gitlore maps every file, explains how it all fits together and flags the risky
          parts, like a teammate who already read the whole codebase.
        </p>

        {/* ── Form ─────────────────────────────────────────────── */}
        <div className="hero-in mx-auto mt-9 max-w-xl" style={d(0.5)}>
          <RepoAnalyzeForm samples={HERO_SAMPLE_REPOS} />
        </div>

        {/* ── Works with ───────────────────────────────────────── */}
        <div
          className="hero-in mt-7 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[11px] text-fg/35"
          style={d(0.64)}
        >
          <span className="uppercase tracking-[0.18em]">Works in</span>
          {[
            { Logo: ClaudeLogo, name: "Claude" },
            { Logo: OpenAILogo, name: "Codex" },
            { Logo: CursorLogo, name: "Cursor" },
            { Logo: VSCodeLogo, name: "VS Code" },
          ].map(({ Logo, name }) => (
            <span key={name} className="inline-flex items-center gap-1.5 text-fg/55">
              <Logo className="h-3.5 w-3.5" />
              {name}
            </span>
          ))}
        </div>

        {/* ── Product ──────────────────────────────────────────── */}
        <div className="mt-14 sm:mt-16">
          <HeroProductWindow />
        </div>
      </div>
    </DarkSection>
  );
}
