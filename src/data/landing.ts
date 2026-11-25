/**
 * Landing page data
 *
 * All text content and structured data for the landing page sections.
 * Import constants here and pass them as props to block components —
 * never hardcode strings directly inside layout components.
 *
 * Icon refs are Lucide React component types so this file must be .ts
 * (not .tsx — no JSX here).
 */

import {
  Clock, Users, BookOpen,
  UserPlus, GitMerge, Eye,
  Link2, Cpu, SearchCode,
} from "lucide-react";
import type { ComponentType } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// Shared types (used by block components + landing section wrappers)
// ─────────────────────────────────────────────────────────────────────────────

export interface FeatureItem {
  icon:         ComponentType<{ className?: string }>;
  title:        string;
  body:         string;
  iconBg?:      string;
  iconColor?:   string;
  borderClass?: string;
  /** Sub-label rendered above title (persona-card variant) */
  eyebrow?:     string;
  /** Mono-font tag rendered below body (step variant) */
  detail?:      string;
  /** Ordinal label: "01", "02" … (step variant) */
  step?:        string;
  /** Per-card CTA link */
  cta?:         { label: string; href: string };
}

export interface ProofStat {
  value: string;
  unit:  string;
  label: string;
}

export interface ProofLogo {
  name: string;
  abbr: string;
}

export interface TestimonialItem {
  quote:    string;
  author:   string;
  role:     string;
  company?: string;
}

export interface MockFile {
  name:   string;
  active: boolean;
}

export interface MockQA {
  q: string;
  a: string;
}

export interface FooterLink {
  label: string;
  href:  string;
}

export interface FreeInclude {
  item: string;
  note: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// HeroSection
// ─────────────────────────────────────────────────────────────────────────────

/** Rolls through the end of the headline: "Speak fluent ___". The first is the resting word. */
export const HERO_WORDS: string[] = ["repository", "Next.js", "React", "Rust", "Django", "Go"];

/** One-click examples under the analyze form. */
export const HERO_SAMPLE_REPOS: string[] = ["vercel/next.js", "facebook/react", "expressjs/express"];

/** What the product window in the hero plays through. It cycles through `walkthrough`. */
export const HERO_PREVIEW = {
  repo: "vercel/next.js",
  branch: "canary",
  sourceFiles: "4,085",
  /** File tree; `depth` indents, `id` links a file to its walkthrough step. */
  tree: [
    { name: "packages/next/src", kind: "dir", depth: 0 },
    { name: "server", kind: "dir", depth: 1 },
    { name: "app-render.tsx", kind: "file", depth: 2, id: "app-render" },
    { name: "base-server.ts", kind: "file", depth: 2, id: "base-server" },
    { name: "shared/lib/router", kind: "dir", depth: 1 },
    { name: "router.ts", kind: "file", depth: 2, id: "router" },
    { name: "client", kind: "dir", depth: 1 },
    { name: "index.tsx", kind: "file", depth: 2 },
    { name: "turbopack/crates", kind: "dir", depth: 0 },
  ] as { name: string; kind: "dir" | "file"; depth: number; id?: string }[],
  walkthrough: [
    {
      id: "app-render",
      file: "app-render.tsx",
      summary:
        "Renders an App Router request on the server. It builds the React tree for the matched route, streams HTML as segments resolve, and hands the client the payload it needs to hydrate.",
      flow: ["request", "renderToHTMLOrFlight", "RSC payload", "HTML stream"],
      pieces: ["renderToHTMLOrFlight", "createFlightRouterState"],
      question: "Where does streaming start?",
      answer: "In renderToHTMLOrFlight, as soon as the first segment resolves.",
    },
    {
      id: "base-server",
      file: "base-server.ts",
      summary:
        "The base class every Next.js server extends. It normalizes the incoming request, matches it to a route, and decides whether to serve a static file, a cached page or a fresh render.",
      flow: ["handleRequest", "match route", "cache?", "renderToResponse"],
      pieces: ["handleRequest", "renderToResponse"],
      question: "When is a cached page served?",
      answer: "renderToResponse checks the response cache before rendering again.",
    },
    {
      id: "router",
      file: "router.ts",
      summary:
        "The Pages Router on the client. It turns link clicks into route changes, prefetches pages ahead of time, and keeps the URL, history and rendered page in sync.",
      flow: ["<Link>", "router.push", "change", "render page"],
      pieces: ["push", "prefetch", "change"],
      question: "What happens on a link click?",
      answer: "router.push calls change, which loads the page and updates history.",
    },
  ],
  hotspots: [
    { name: "app-render.tsx", id: "app-render", score: 0.94 },
    { name: "base-server.ts", id: "base-server", score: 0.81 },
    { name: "router.ts", id: "router", score: 0.66 },
    { name: "aggregation_update.rs", id: "", score: 0.52 },
  ],
  languages: [
    { name: "TypeScript", share: 53 },
    { name: "JavaScript", share: 41 },
    { name: "Rust", share: 5 },
  ],
  /** What the agent got back when it checked the visitor's own last change through MCP. */
  risk: {
    score: 8,
    reason: "Builds a SQL query from request input without escaping it.",
    touches: ["Database write", "PII"],
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// ProblemStatement
// ─────────────────────────────────────────────────────────────────────────────

export const PAIN_POINTS: FeatureItem[] = [
  {
    icon:        Clock,
    title:       "Zero docs, 400 files",
    body:        "The README has two lines. The previous engineer is gone. You have a sprint starting Monday.",
    iconBg:      "bg-tomato-jam/10",
    iconColor:   "text-tomato-jam",
    borderClass: "border-tomato-jam/15 bg-tomato-jam/8",
  },
  {
    icon:        Users,
    title:       "Ask the team? They're underwater.",
    body:        "Everyone is shipping. You can ask one question before you become the person who asks too many questions.",
    iconBg:      "bg-metallic-gold/10",
    iconColor:   "text-metallic-gold",
    borderClass: "border-metallic-gold/15 bg-metallic-gold/8",
  },
  {
    icon:        BookOpen,
    title:       "Read every file? There's a deadline.",
    body:        "A complete read-through of a mid-sized repo takes days. Your ticket is due in hours.",
    iconBg:      "bg-fg/8",
    iconColor:   "text-fg/60",
    borderClass: "border-fg/10 bg-fg/5",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// SelfSelectionCards
// ─────────────────────────────────────────────────────────────────────────────

export const PERSONAS: FeatureItem[] = [
  {
    icon:        UserPlus,
    eyebrow:     "New to the team",
    title:       "Onboard in hours, not weeks",
    body:        "Drop the repo URL on day one. gitlore gives you a mental model of the entire codebase before your first standup — file purposes, entry points, key dependencies.",
    iconBg:      "bg-tomato-jam/10",
    iconColor:   "text-tomato-jam",
    borderClass: "border-tomato-jam/20 hover:border-tomato-jam/40",
    cta:         { label: "Analyze your new codebase →", href: "/dashboard" },
  },
  {
    icon:        GitMerge,
    eyebrow:     "OSS contributor",
    title:       "Contribute without the archaeology",
    body:        "Found a bug in an unfamiliar project? Ask gitlore where the relevant code lives, how it's connected, and what tests exist before you touch a single file.",
    iconBg:      "bg-metallic-gold/10",
    iconColor:   "text-metallic-gold",
    borderClass: "border-metallic-gold/20 hover:border-metallic-gold/40",
    cta:         { label: "Try it on any public repo →", href: "/dashboard" },
  },
  {
    icon:        Eye,
    eyebrow:     "Code reviewer",
    title:       "Review PRs with full context",
    body:        "Understand the intent behind every changed file. gitlore maps call graphs and module relationships so you review changes, not just diffs.",
    iconBg:      "bg-fg/8",
    iconColor:   "text-fg/70",
    borderClass: "border-fg/10 hover:border-fg/25",
    cta:         { label: "See the VS Code extension →", href: "/#extension" },
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// CredibilityBar
// ─────────────────────────────────────────────────────────────────────────────

/** Shown in the integrations bar; each count-up figure matches a real limit or count. */
export const PROOF_STATS = [
  { value: 50000, suffix: "", label: "free tokens a day", note: "per visitor, no account" },
  { value: 100, suffix: "", label: "requests a day", note: "per visitor or MCP key" },
  { value: 3, suffix: "", label: "MCP tools", note: "risk, impact, explain" },
];

// ─────────────────────────────────────────────────────────────────────────────
// HowItWorks
// ─────────────────────────────────────────────────────────────────────────────

export const STEPS: FeatureItem[] = [
  {
    icon:   Link2,
    step:   "01",
    title:  "Paste a GitHub URL",
    body:   "Any public GitHub repository. No install, no config files, no account.",
    detail: "github.com/owner/repo",
  },
  {
    icon:   Cpu,
    step:   "02",
    title:  "gitlore reads the repo",
    body:   "It fetches the file tree and README, indexes the source files that matter for search, and works out hotspots and the stack straight from the tree.",
    detail: "Fetch → Index → Summarize",
  },
  {
    icon:   SearchCode,
    step:   "03",
    title:  "Ask, explore, understand",
    body:   "Open the dashboard for the file map and diagrams, ask the chat precise questions, or plug gitlore into your agent over MCP.",
    detail: "Dashboard · Chat · Diagrams · MCP",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// ExtensionSpotlight
// ─────────────────────────────────────────────────────────────────────────────

export const EXTENSION_FEATURES: string[] = [
  "Inline file summaries in the Explorer sidebar",
  "Ask questions about the file you have open",
  "PR review mode — understand any diff in context",
  "Zero login required for public repos",
];

// ─────────────────────────────────────────────────────────────────────────────
// FreeTierTransparency
// ─────────────────────────────────────────────────────────────────────────────

export const FREE_INCLUDES: FreeInclude[] = [
  { item: "50,000 tokens per day",          note: "Enough for a full medium-sized repo"    },
  { item: "100 analysis requests per day",  note: "Rate-limited to 10 per 60 seconds"      },
  { item: "RAG-powered Q&A",                note: "Ask anything, get precise answers"       },
  { item: "Architecture diagrams",          note: "Mermaid.js rendered in-browser"         },
  { item: "Full file-map with AI summaries",note: "Every file, parsed and explained"       },
  { item: "VS Code extension access",       note: "Same token budget, no separate account" },
];

export const TRUST_SIGNALS: string[] = [
  "No credit card required",
  "No account, no password, nothing to sign up for",
  "Tokens never logged or shared",
  "Repos not persisted after session",
];

// ─────────────────────────────────────────────────────────────────────────────
// LiveDemoStrip
// ─────────────────────────────────────────────────────────────────────────────

// gitlore analysing its own repository — real paths and function names.
export const MOCK_FILES: MockFile[] = [
  { name: "src/app/api/analyze/route.ts", active: true  },
  { name: "src/lib/usageGuard.ts",        active: false },
  { name: "src/lib/claude_adapter.ts",    active: false },
  { name: "src/lib/codeReview.ts",        active: false },
  { name: "src/components/dashboard/",    active: false },
];

export const MOCK_SUMMARY = {
  file: "src/app/api/analyze/route.ts",
  text: "POST endpoint that validates a GitHub URL, fetches the repo's metadata, README and file tree, indexes key source files for search, and asks Claude for an elevator pitch. Hotspots and stack stats come straight from the tree.",
  exports: ["POST — analyze handler", "runtime — \"nodejs\""],
};

export const MOCK_QA: MockQA[] = [
  {
    q: "Where are usage limits enforced?",
    a: "In src/lib/usageGuard.ts: reserveUsage() checks the visitor's daily allowance first, then the site-wide budget.",
  },
  {
    q: "Which file streams chat replies?",
    a: "src/app/api/chat/route.ts streams Claude's reply as it arrives, through claude_adapter.ts.",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// SiteFooter
// ─────────────────────────────────────────────────────────────────────────────

export const FOOTER_LINKS: FooterLink[] = [
  { label: "How it works", href: "/#how-it-works" },
  { label: "Extension",    href: "/#extension"    },
  { label: "Changelog",    href: "/changelog"     },
  { label: "Dashboard",    href: "/dashboard"     },
];
