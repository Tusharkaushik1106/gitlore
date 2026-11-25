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
  GitFork, Network, MessageSquare, Zap,
  Clock, Users, BookOpen,
  UserPlus, GitMerge, Eye,
  Link2, Cpu, SearchCode,
} from "lucide-react";
import type { ComponentType } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// Shared types (used by block components + landing section wrappers)
// ─────────────────────────────────────────────────────────────────────────────

export interface CapabilityItem {
  icon:  ComponentType<{ className?: string }>;
  label: string;
  color: string;
}

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

export const PREVIEW_CAPABILITIES: CapabilityItem[] = [
  { icon: GitFork,       label: "File-tree AST",  color: "text-tomato-jam/80"    },
  { icon: Network,       label: "Call graphs",     color: "text-metallic-gold/80" },
  { icon: MessageSquare, label: "RAG Q&A",         color: "text-fg/55"            },
  { icon: Zap,           label: "60-second scan",  color: "text-tomato-jam/80"    },
];

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

export const INTEGRATIONS: ProofLogo[] = [
  { name: "GitHub",        abbr: "GH"  },
  { name: "VS Code",       abbr: "VSC" },
  { name: "Claude",        abbr: "CLD" },
  { name: "PostgreSQL",    abbr: "PG"  },
];

export const STATS: ProofStat[] = [
  { value: "50K",  unit: "tokens/day",  label: "Context window per analysis"    },
  { value: "RAG",  unit: "powered",     label: "Semantic search over your repo" },
  { value: "100%", unit: "server-side", label: "Nothing stored client-side"     },
];

// ─────────────────────────────────────────────────────────────────────────────
// HowItWorks
// ─────────────────────────────────────────────────────────────────────────────

export const STEPS: FeatureItem[] = [
  {
    icon:   Link2,
    step:   "01",
    title:  "Drop a URL or ZIP",
    body:   "Paste any public GitHub URL or upload a repository ZIP. gitlore accepts both — no installation, no config files, no CLI.",
    detail: "github.com/owner/repo or repo.zip",
  },
  {
    icon:   Cpu,
    step:   "02",
    title:  "Watch it parse and embed",
    body:   "gitlore clones, walks every file, builds ASTs, extracts exports and call graphs, then embeds everything into a searchable vector store. Takes about 60 seconds.",
    detail: "Clone → Parse → Embed → Index",
  },
  {
    icon:   SearchCode,
    step:   "03",
    title:  "Ask, explore, and understand",
    body:   "Open the Cockpit Dashboard for the full file map, use OmniChat to ask precise questions, or generate architecture diagrams for any module.",
    detail: "Dashboard · Chat · Diagrams",
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

export const MOCK_FILES: MockFile[] = [
  { name: "src/api/analyze/route.ts",   active: true  },
  { name: "src/context/RepoContext.tsx", active: false },
  { name: "src/lib/claude_adapter.ts",  active: false },
  { name: "src/components/chat/",       active: false },
  { name: "src/middleware.ts",          active: false },
];

export const MOCK_QA: MockQA[] = [
  {
    q: "Where is rate-limiting enforced?",
    a: "In src/api/analyze/route.ts via the checkQuota() helper — 10 req/60 s per user, 100 req/day.",
  },
  {
    q: "Which files own the streaming logic?",
    a: "claude_adapter.ts emits chunks; the route handler pipes them through a TransformStream to the client.",
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
