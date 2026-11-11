import { Puzzle, GitPullRequest } from "lucide-react";
import { SplitContentSection } from "@/components/blocks/SplitContentSection";
import { EXTENSION_FEATURES } from "@/data/landing";

// ─────────────────────────────────────────────────────────────────────────────
// Landing › ExtensionSpotlight
//
// Thin wrapper around SplitContentSection.
// id="extension" anchors the "Extension" nav link.
// Data imported from @/data/landing.
// The editor mockup JSX is the rightPanel slot.
// ─────────────────────────────────────────────────────────────────────────────

/** VS Code editor mockup rendered in the right panel slot */
function EditorMockup() {
  return (
    <div className="gf-card rounded-2xl overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.5)]">
      {/* Editor chrome */}
      <div className="border-b border-fg/8 px-4 py-2.5 flex items-center gap-3 bg-fg/3">
        <div className="flex gap-1.5">
          <div className="h-2.5 w-2.5 rounded-full bg-tomato-jam/60" />
          <div className="h-2.5 w-2.5 rounded-full bg-metallic-gold/60" />
          <div className="h-2.5 w-2.5 rounded-full bg-fg/20" />
        </div>
        <div className="flex-1 flex items-center gap-2">
          <span className="text-[11px] font-mono text-fg/30">route.ts</span>
          <span className="text-[10px] text-fg/20">·</span>
          <span className="text-[11px] text-fg/20">EXPLORER</span>
        </div>
        <div className="flex items-center gap-1">
          <GitPullRequest className="h-3.5 w-3.5 text-tomato-jam/60" />
          <span className="text-[10px] font-medium text-tomato-jam/60">PR #47</span>
        </div>
      </div>

      {/* Code area */}
      <div className="p-4 font-mono text-[11px] space-y-1">
        <div className="flex gap-3 text-fg/20">
          <span className="w-4 text-right shrink-0">1</span>
          <span className="text-fg/30">export async function POST(req: Request) {"{"}</span>
        </div>
        <div className="flex gap-3 text-fg/20">
          <span className="w-4 text-right shrink-0">2</span>
          <span className="text-fg/30 pl-4">const quota = await checkQuota(userId);</span>
        </div>
        <div className="flex gap-3 bg-tomato-jam/8 -mx-4 px-4 rounded">
          <span className="w-4 text-right shrink-0 text-fg/30">3</span>
          <span className="text-tomato-jam/80 pl-4">if (!quota.ok) return new Response(...);</span>
        </div>
        <div className="flex gap-3 text-fg/20">
          <span className="w-4 text-right shrink-0">4</span>
          <span className="text-fg/30 pl-4">const stream = await analyzeRepo(url);</span>
        </div>
        <div className="flex gap-3 text-fg/20">
          <span className="w-4 text-right shrink-0">5</span>
          <span className="text-fg/30">{"}"}</span>
        </div>
      </div>

      {/* gitlore inline annotation */}
      <div className="border-t border-fg/8 bg-fg/3 p-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="h-1.5 w-1.5 rounded-full bg-tomato-jam animate-pulse" />
          <span className="text-[10px] font-semibold uppercase tracking-widest text-tomato-jam/70">
            gitlore · line 3
          </span>
        </div>
        <p className="text-[11px] text-fg/55 leading-relaxed">
          Early-return guard. If the user has exceeded their daily or rate-limit
          quota (checked via{" "}
          <span className="text-tomato-jam/80 font-mono">checkQuota()</span>),
          returns a 429 before any Claude call is made — keeping costs bounded.
        </p>
      </div>
    </div>
  );
}

export function ExtensionSpotlight() {
  return (
    <SplitContentSection
      environment="dark"
      spacing="lg"
      id="extension"
      eyebrow="VS Code Extension"
      eyebrowIcon={Puzzle}
      headline={
        <>
          Review PRs without
          <br />
          <span className="bg-gradient-to-r from-tomato-jam to-metallic-gold bg-clip-text text-transparent">
            leaving your editor
          </span>
        </>
      }
      body="The gitlore VS Code extension brings repository intelligence directly into your editor. Get AI summaries, ask questions about the code you're reading, and review PRs with full architectural context."
      checkList={EXTENSION_FEATURES}
      cta={{ label: "Install from VS Code Marketplace", href: "https://marketplace.visualstudio.com/items?itemName=TusharKaushik.gitlore-hologram", external: true }}
      rightPanel={<EditorMockup />}
    />
  );
}
