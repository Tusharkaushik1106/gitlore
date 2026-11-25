import { Plug } from "lucide-react";
import { SplitContentSection } from "@/components/blocks/SplitContentSection";
import { MCP_FEATURES } from "@/data/landing";
import { McpConnectPanel } from "./McpConnectPanel";

// ─────────────────────────────────────────────────────────────────────────────
// Landing › McpSpotlight
//
// id="mcp" anchors the "MCP" nav link and the link in the MCP server's 401 message.
// The right panel issues the visitor's personal connection link.
// ─────────────────────────────────────────────────────────────────────────────

export function McpSpotlight() {
  return (
    <SplitContentSection
      environment="dark"
      spacing="lg"
      id="mcp"
      reversed
      eyebrow="MCP server"
      eyebrowIcon={Plug}
      headline={
        <>
          A code review check
          <br />
          <span className="bg-gradient-to-r from-tomato-jam to-metallic-gold bg-clip-text text-transparent">
            inside your Claude
          </span>
        </>
      }
      body="Connect gitlore to Claude, Claude Code or Cursor in under a minute. Your assistant can then check code before it commits: how risky a change is, what sensitive areas it touches, and what a file is for."
      checkList={MCP_FEATURES}
      rightPanel={<McpConnectPanel />}
    />
  );
}
