/**
 * Motion system — global animation configuration
 *
 * All animation values live here. Import constants into motion
 * components and hooks — never hardcode durations or easings inline.
 */

// ─────────────────────────────────────────────────────────────────────────────
// Durations (seconds)
// ─────────────────────────────────────────────────────────────────────────────

export const DURATION = {
  /** UI micro-interactions: button hover, icon spin */
  fast:    0.15,
  /** Component-level transitions: tabs, dropdowns */
  base:    0.25,
  /** Element-level scroll reveals */
  reveal:  0.4,
  /** Section-level viewport entrance */
  section: 0.5,
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// Easing curves
// ─────────────────────────────────────────────────────────────────────────────

export const EASE = {
  /** Exponential ease-out — smooth, snappy entrance */
  enter:  [0.16, 1, 0.3, 1]  as const,
  /** Smooth symmetrical — for transitions that feel balanced */
  smooth: [0.4, 0, 0.2, 1]   as const,
  /** Ease-in — for exits and dismissals */
  exit:   [0.4, 0, 1, 1]     as const,
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// Stagger delays (seconds between each child)
// ─────────────────────────────────────────────────────────────────────────────

export const STAGGER = {
  /** Dense grids: icon rows, tag clouds */
  xs: 0.03,
  /** Standard grids: feature cards, steps */
  sm: 0.05,
  /** Spaced grids: testimonials, large cards */
  md: 0.08,
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// Viewport thresholds (fraction of element visible before trigger)
// Higher threshold = fires later = less jank during fast scrolls
// ─────────────────────────────────────────────────────────────────────────────

export const THRESHOLD = {
  /** Section-level — fires when ~10% enters viewport */
  section: 0.1,
  /** Element-level reveals — fire when ~15% is visible */
  reveal:  0.15,
  /** Stagger containers — fire when ~12% is visible */
  stagger: 0.12,
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// Named animation variants (framer-motion hidden / visible states)
//
// Transforms are kept small — motion should feel like content settling in,
// not a dramatic entrance.
// ─────────────────────────────────────────────────────────────────────────────

export const variants = {
  /** Default: fade + gentle upward slide */
  fadeUp: {
    hidden:  { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0  },
  },
  /** Opacity only — for content where positional shift would feel wrong */
  fade: {
    hidden:  { opacity: 0 },
    visible: { opacity: 1 },
  },
  /** Fade + very subtle scale — for cards and modals */
  fadeScale: {
    hidden:  { opacity: 0, scale: 0.98 },
    visible: { opacity: 1, scale: 1    },
  },
  /** Slide from left — for left-column content in splits */
  slideLeft: {
    hidden:  { opacity: 0, x: -14 },
    visible: { opacity: 1, x: 0   },
  },
  /** Slide from right — for right-column content in splits */
  slideRight: {
    hidden:  { opacity: 0, x: 14 },
    visible: { opacity: 1, x: 0  },
  },
  /**
   * Section-level entrance — barely-there translate + fade.
   */
  sectionEnter: {
    hidden:  { opacity: 0, y: 6 },
    visible: { opacity: 1, y: 0 },
  },
  /** Blur + rise, matching the hero copy — CSS-only (globals.css: gfBlurUp) */
  blurUp: {
    hidden:  { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0  },
  },
} as const;

export type MotionVariant = keyof typeof variants;
