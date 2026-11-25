import Link from "next/link";
import { DarkSection } from "@/components/sections/DarkSection";
import { GitHubLogo } from "@/components/ui/BrandLogos";
import { FOOTER_LINKS } from "@/data/landing";

// ─────────────────────────────────────────────────────────────────────────────
// Landing › SiteFooter
//
// Brand + link columns, then a large faded wordmark that the page ends on.
// Navigation data imported from @/data/landing.
// ─────────────────────────────────────────────────────────────────────────────

const REPO_URL = "https://github.com/Tusharkaushik1106/gitlore";

export function SiteFooter() {
  return (
    <footer>
      <DarkSection spacing="none" className="pt-16">
        <div className="relative border-t border-fg/8 pt-12">
          {/* Lit top edge */}
          <div
            aria-hidden
            className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-tomato-jam/40 to-transparent"
          />

          <div className="grid gap-10 sm:grid-cols-[1.4fr_1fr_1fr]">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl ring-1 ring-tomato-jam/25">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/logo.png" alt="gitlore logo" className="h-full w-full object-contain" />
                </div>
                <div className="leading-tight">
                  <p className="text-sm font-bold text-fg">gitlore</p>
                  <p className="text-[9px] font-medium uppercase tracking-widest text-fg/35">speak fluent repository</p>
                </div>
              </div>
              <p className="mt-4 max-w-xs text-sm leading-relaxed text-fg/45">
                Understand any GitHub repository in a minute, in the browser, your editor or your agent.
              </p>
              <a
                href={REPO_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 inline-flex items-center gap-2 rounded-lg border border-fg/10 bg-fg/[0.03] px-3 py-1.5 text-xs text-fg/55 transition-colors hover:border-fg/25 hover:text-fg"
              >
                <GitHubLogo className="h-3.5 w-3.5" />
                Star on GitHub
              </a>
            </div>

            {/* Product */}
            <nav aria-label="Product">
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-fg/35">Product</p>
              <ul className="space-y-2.5">
                {FOOTER_LINKS.map(({ label, href }) => (
                  <li key={href}>
                    <Link href={href} className="text-sm text-fg/50 transition-colors hover:text-fg">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            {/* Use it in */}
            <nav aria-label="Use gitlore in">
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-fg/35">Use it in</p>
              <ul className="space-y-2.5">
                {[
                  { label: "Your agent (MCP)", href: "/#mcp" },
                  { label: "VS Code", href: "/#extension" },
                  { label: "The browser", href: "/#how-it-works" },
                ].map(({ label, href }) => (
                  <li key={href}>
                    <Link href={href} className="text-sm text-fg/50 transition-colors hover:text-fg">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          <div className="mt-12 flex flex-col items-center justify-between gap-2 border-t border-fg/8 py-6 text-[11px] text-fg/30 sm:flex-row">
            <p>© {new Date().getFullYear()} gitlore</p>
            <p>Analysis runs server-side and is not stored.</p>
          </div>
        </div>

        {/* The page ends on the name */}
        <p
          aria-hidden
          className="pointer-events-none -mb-[0.22em] select-none bg-gradient-to-b from-fg/[0.09] to-transparent bg-clip-text text-center text-[clamp(5rem,20vw,16rem)] font-semibold leading-none tracking-tighter text-transparent"
        >
          gitlore
        </p>
      </DarkSection>
    </footer>
  );
}
