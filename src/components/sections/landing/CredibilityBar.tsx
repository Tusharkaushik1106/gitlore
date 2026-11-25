import { DarkSection } from "@/components/sections/DarkSection";
import { ClaudeLogo, CursorLogo, GitHubLogo, McpLogo, OpenAILogo, VSCodeLogo } from "@/components/ui/BrandLogos";
import { CountUp, Marquee } from "@/components/motion/fx";
import { Reveal } from "@/components/motion/Reveal";
import { PROOF_STATS } from "@/data/landing";

// ─────────────────────────────────────────────────────────────────────────────
// Landing › CredibilityBar
//
// An endless strip of the tools gitlore works with, then three figures that
// count up as they scroll in. Each figure is a real limit or count (see PROOF_STATS).
// ─────────────────────────────────────────────────────────────────────────────

const WORKS_WITH = [
  { Logo: GitHubLogo, name: "GitHub" },
  { Logo: ClaudeLogo, name: "Claude" },
  { Logo: ClaudeLogo, name: "Claude Code" },
  { Logo: OpenAILogo, name: "Codex" },
  { Logo: CursorLogo, name: "Cursor" },
  { Logo: VSCodeLogo, name: "VS Code" },
  { Logo: McpLogo, name: "Any MCP client" },
];

export function CredibilityBar() {
  return (
    <DarkSection spacing="sm">
      <Reveal variant="blurUp">
        <p className="mb-6 text-center text-[11px] font-semibold uppercase tracking-[0.25em] text-fg/35">
          Works with the tools you already use
        </p>
        <Marquee seconds={32} className="py-2">
          {WORKS_WITH.map(({ Logo, name }) => (
            <span
              key={name}
              className="flex shrink-0 items-center gap-2.5 text-base font-medium text-fg/45 transition-colors hover:text-fg"
            >
              <Logo className="h-6 w-6" />
              {name}
            </span>
          ))}
        </Marquee>
      </Reveal>

      <div className="mx-auto mt-12 grid max-w-4xl grid-cols-1 divide-y divide-fg/8 overflow-hidden rounded-2xl border border-fg/10 bg-[#141110]/60 backdrop-blur-sm sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        {PROOF_STATS.map(({ value, suffix, label, note }, i) => (
          <Reveal key={label} variant="blurUp" delay={i * 0.1} className="px-6 py-6 text-center">
            <p className="bg-gradient-to-br from-[#e2553e] via-[#ea7a3b] to-[#f2cb66] bg-clip-text text-4xl font-semibold tracking-tight text-transparent">
              <CountUp value={value} suffix={suffix} />
            </p>
            <p className="mt-1.5 text-sm font-medium text-fg/75">{label}</p>
            <p className="mt-0.5 text-xs text-fg/40">{note}</p>
          </Reveal>
        ))}
      </div>
    </DarkSection>
  );
}
