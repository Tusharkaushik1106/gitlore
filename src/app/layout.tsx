import type { Metadata } from "next";
import { Work_Sans, JetBrains_Mono, Shrikhand } from "next/font/google";
import "./globals.css";
import { OmniChat } from "@/components/chat/OmniChat";
import { RepoProvider } from "@/context/RepoContext";
import { FileProvider } from "@/context/FileContext";
import { Header } from "@/components/layout/Header";
import { ThemeProvider, themeScript } from "@/components/providers/ThemeProvider";
import { ParticleCanvas } from "@/components/background/ParticleCanvas";
import { GlobalBackgroundLoader } from "@/components/background/GlobalBackgroundLoader";

const uiFont = Work_Sans({
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-ui",
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

const codeFont = JetBrains_Mono({
  variable: "--font-code",
  subsets: ["latin"],
  display: "swap",
});

const displayFont = Shrikhand({
  weight: "400",
  variable: "--font-display",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "gitlore",
  description: "Speak fluent repository. Claude-powered deep repo explorer.",
  icons: {
    icon:       [{ url: "/icon.png", type: "image/png" }],
    apple:      [{ url: "/icon.png", type: "image/png" }],
    shortcut:   [{ url: "/icon.png", type: "image/png" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      // "dark" is the default; the anti-flash script below may toggle it
      className={`dark ${uiFont.variable} ${codeFont.variable} ${displayFont.variable}`}
      suppressHydrationWarning
    >
      <head>
        {/*
         * Anti-flash script — runs synchronously before the first paint.
         * Reads localStorage and toggles dark/light on <html> immediately,
         * preventing any flash of the wrong theme.
         */}
        {/* eslint-disable-next-line @next/next/no-before-interactive-script-component */}
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="antialiased">
        <ThemeProvider>
            <RepoProvider>
              <FileProvider>
                {/*
                 * ── Global cinematic background system ───────────────────
                 * 6-layer stacking architecture (design spec §9.4).
                 * All decorative layers are `fixed` — they stay put on scroll
                 * and propagate to every page automatically.
                 *
                 * z-[1]  WebGL MeshGradient (animated ink-black → warm-red)
                 * z-[2]  Colour-atmosphere blobs (soft brand tints)
                 * z-[3]  Vignette (edge-darkening pseudo-lens effect)
                 * z-[4]  Film grain noise tile
                 * z-[5]  Floating particles (canvas RAF loop)
                 * z-10   Content
                 * ──────────────────────────────────────────────────────────
                 */}
                <div
                  className="relative min-h-dvh flex flex-col overflow-x-hidden bg-[#101011]"
                >

                  {/* z-[1] — WebGL MeshGradient: animated cinematic base */}
                  <GlobalBackgroundLoader />

                  {/* z-[2] — Colour atmosphere: warm top-left blob */}
                  <div
                    aria-hidden="true"
                    className="pointer-events-none fixed inset-0 z-[2] bg-gradient-to-br from-tomato-jam/14 via-metallic-gold/7 to-transparent"
                    style={{ opacity: "var(--blob-opacity-1, 0.2)", transform: "translateZ(0)" }}
                  />

                  {/* z-[2] — Colour atmosphere: cool bottom-right counter-blob */}
                  <div
                    aria-hidden="true"
                    className="pointer-events-none fixed inset-0 z-[2] bg-gradient-to-tl from-transparent via-fg/4 to-tomato-jam/10"
                    style={{ opacity: "var(--blob-opacity-2, 0.1)", transform: "translateZ(0)" }}
                  />

                  {/* z-[3] — Vignette: edge-darkening radial overlay */}
                  <div
                    aria-hidden="true"
                    className="pointer-events-none fixed inset-0 z-[3]"
                    style={{ background: "var(--vignette)" }}
                  />

                  {/* z-[4] — Film grain: noise tile at near-invisible opacity */}
                  <div
                    aria-hidden="true"
                    className="pointer-events-none fixed inset-0 z-[4] bg-[url('/noise.svg')] bg-repeat"
                    style={{ opacity: "var(--noise-opacity, 0.04)" }}
                  />

                  {/* z-[5] — Floating particles: canvas RAF animation */}
                  <ParticleCanvas />

                  {/* z-10 — Content: always above all background layers */}
                  <div className="relative z-10 flex min-h-dvh flex-col">
                    <Header />
                    {children}
                    <OmniChat />
                  </div>

                </div>
              </FileProvider>
            </RepoProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
