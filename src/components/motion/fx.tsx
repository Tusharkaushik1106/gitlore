"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Reveal } from "./Reveal";

// ─────────────────────────────────────────────────────────────────────────────
// Shared landing-page effects, so every section moves and glows the same way.
// Pointer effects write CSS variables instead of React state (no re-renders);
// everything respects prefers-reduced-motion.
// ─────────────────────────────────────────────────────────────────────────────

/** True once the element has scrolled into view (and stays true). */
export function useInViewOnce<T extends Element>(ref: React.RefObject<T | null>, threshold = 0.3): boolean {
  const [seen, setSeen] = React.useState(false);
  React.useEffect(() => {
    const el = ref.current;
    if (!el || seen) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setSeen(true);
          io.disconnect();
        }
      },
      { threshold },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [ref, threshold, seen]);
  return seen;
}

function trackPointer(e: React.PointerEvent<HTMLElement>) {
  const el = e.currentTarget;
  const r = el.getBoundingClientRect();
  el.style.setProperty("--sx", `${e.clientX - r.left}px`);
  el.style.setProperty("--sy", `${e.clientY - r.top}px`);
}

/** A card whose border and surface light up around the pointer. `glow` is an "r,g,b" triple. */
export function SpotlightCard({
  children,
  className,
  glow = "192,57,43",
}: {
  children: React.ReactNode;
  className?: string;
  glow?: string;
}) {
  return (
    <div
      onPointerMove={trackPointer}
      className={cn(
        "group/spot relative overflow-hidden rounded-2xl border border-fg/10 bg-[#141110]/70 backdrop-blur-sm transition-[border-color,transform] duration-300 hover:-translate-y-0.5 hover:border-fg/15",
        className,
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover/spot:opacity-100"
        style={{ background: `radial-gradient(420px circle at var(--sx, 50%) var(--sy, 50%), rgba(${glow},0.11), transparent 45%)` }}
      />
      <div
        aria-hidden
        className="fx-spot-border pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 transition-opacity duration-300 group-hover/spot:opacity-100"
        style={{ background: `radial-gradient(260px circle at var(--sx, 50%) var(--sy, 50%), rgba(${glow},0.75), transparent 55%)` }}
      />
      <div className="relative h-full">{children}</div>
    </div>
  );
}

/** Eyebrow pill + headline + subheadline that blur in as they scroll into view. */
export function SectionHeading({
  eyebrow,
  title,
  sub,
  className,
  align = "center",
}: {
  eyebrow?: string;
  title: React.ReactNode;
  sub?: React.ReactNode;
  className?: string;
  align?: "center" | "left";
}) {
  const centered = align === "center";
  return (
    <div className={cn("mb-12 sm:mb-14", centered && "text-center", className)}>
      {eyebrow && (
        <Reveal variant="blurUp">
          <span className="inline-flex items-center gap-2 rounded-full border border-fg/10 bg-fg/[0.04] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-fg/55">
            <span className="h-1.5 w-1.5 rounded-full bg-tomato-jam shadow-[0_0_8px_2px_rgba(192,57,43,0.6)]" />
            {eyebrow}
          </span>
        </Reveal>
      )}
      <Reveal variant="blurUp" delay={0.08}>
        <h2 className="mt-5 text-balance text-3xl font-semibold tracking-tight text-fg sm:text-[2.6rem] sm:leading-[1.1]">
          {title}
        </h2>
      </Reveal>
      {sub && (
        <Reveal variant="blurUp" delay={0.16}>
          <p
            className={cn(
              "mt-4 max-w-2xl text-balance text-sm leading-relaxed text-fg/55 sm:text-base",
              centered && "mx-auto",
            )}
          >
            {sub}
          </p>
        </Reveal>
      )}
    </div>
  );
}

/** The brand gradient on a span of headline text. */
export function GradientText({ children }: { children: React.ReactNode }) {
  return (
    <span className="bg-gradient-to-r from-[#e2553e] via-[#ea7a3b] to-[#f2cb66] bg-clip-text text-transparent">
      {children}
    </span>
  );
}

/** Counts from 0 up to `value` the first time it scrolls into view. */
export function CountUp({
  value,
  decimals = 0,
  prefix = "",
  suffix = "",
  duration = 1.4,
}: {
  value: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
}) {
  const ref = React.useRef<HTMLSpanElement>(null);
  const seen = useInViewOnce(ref, 0.5);
  const [shown, setShown] = React.useState(0);

  React.useEffect(() => {
    if (!seen) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setShown(value);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const step = (now: number) => {
      const p = Math.min(1, (now - start) / (duration * 1000));
      setShown(value * (1 - Math.pow(2, -10 * p))); // ease-out expo
      if (p < 1) raf = requestAnimationFrame(step);
      else setShown(value);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [seen, value, duration]);

  return (
    <span ref={ref} className="tabular-nums">
      {prefix}
      {shown.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}
      {suffix}
    </span>
  );
}

/** An endless horizontal strip; pauses on hover, fades out at both edges. */
export function Marquee({
  children,
  seconds = 30,
  className,
}: {
  children: React.ReactNode;
  seconds?: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "fx-marquee group/marquee relative flex overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)]",
        className,
      )}
      style={{ "--marquee-seconds": `${seconds}s` } as React.CSSProperties}
    >
      {[0, 1].map((copy) => (
        <div key={copy} aria-hidden={copy === 1} className="fx-marquee-track flex shrink-0 items-center gap-10 pr-10">
          {children}
        </div>
      ))}
    </div>
  );
}

/** A horizontal line that draws itself left-to-right once in view, then keeps a light running along it. */
export function DrawnLine({ className }: { className?: string }) {
  const ref = React.useRef<HTMLDivElement>(null);
  const seen = useInViewOnce(ref, 0.6);
  return (
    <div ref={ref} aria-hidden className={cn("pointer-events-none h-px overflow-hidden", className)}>
      <div
        className="relative h-full origin-left bg-gradient-to-r from-tomato-jam/50 via-metallic-gold/50 to-tomato-jam/50 transition-transform duration-[1400ms] ease-out"
        style={{ transform: seen ? "scaleX(1)" : "scaleX(0)" }}
      >
        {seen && <span className="fx-line-runner absolute top-1/2 h-[3px] w-24 -translate-y-1/2 rounded-full" />}
      </div>
    </div>
  );
}
