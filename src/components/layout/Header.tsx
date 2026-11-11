"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { LayoutDashboard, Code2, GitFork, ArrowRight, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────
// Shared brand mark
// ─────────────────────────────────────────────────────────────

function Brand() {
  return (
    <Link href="/" className="group inline-flex items-center gap-2.5 transition-opacity duration-150 hover:opacity-85">
      <Image
        src="/logo.png"
        alt="gitlore"
        width={36}
        height={36}
        className="shrink-0 rounded-xl"
        priority
      />
      <div className="flex flex-col leading-none gap-[3px]">
        <span className="text-[15px] font-semibold tracking-tight text-fg/90 group-hover:text-fg transition-colors duration-150">
          gitlore
        </span>
        <span className="text-[8px] font-medium tracking-[0.16em] uppercase text-fg/50 group-hover:text-fg/70 transition-colors duration-150">
          speak fluent repository
        </span>
      </div>
    </Link>
  );
}

// ─────────────────────────────────────────────────────────────
// MarketingNav — floating pill
// ─────────────────────────────────────────────────────────────

const MARKETING_LINKS = [
  { label: "How it works", href: "/#how-it-works" },
  { label: "Extension",    href: "/#extension"    },
  { label: "Changelog",    href: "/changelog"     },
];

function MarketingNav() {
  const pathname = usePathname();
  const [scrolled,   setScrolled]   = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);

  React.useEffect(() => {
    let rafPending = false;
    const handler = () => {
      if (rafPending) return;
      rafPending = true;
      requestAnimationFrame(() => {
        setScrolled(window.scrollY > 40);
        rafPending = false;
      });
    };
    handler();
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  React.useEffect(() => { setMobileOpen(false); }, [pathname]);

  React.useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  return (
    <>
      {/* Floating pill — pointer-events-none on the header so content scrolls freely */}
      <header className="sticky top-0 z-50 flex justify-center px-4 pt-3 pb-1 pointer-events-none">
        <nav
          aria-label="Main navigation"
          className={cn(
            "pointer-events-auto relative flex items-center gap-1 rounded-2xl px-3 py-2",
            "border backdrop-blur-xl transition-[background-color,border-color,box-shadow] duration-300 ease-in-out",
            scrolled
              ? "bg-canvas/88 border-fg/12 shadow-[0_8px_40px_rgba(0,0,0,0.55)]"
              : "bg-canvas/45 border-fg/8  shadow-[0_4px_20px_rgba(0,0,0,0.25)]",
          )}
        >
          {/* Top accent shimmer */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-tomato-jam/45 to-transparent"
          />

          {/* Brand */}
          <div className="shrink-0 px-1">
            <Brand />
          </div>

          <div className="hidden md:block mx-2 h-4 w-px shrink-0 bg-fg/10" />

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-0.5">
            {MARKETING_LINKS.map(({ label, href }) => {
              const isActive =
                href === "/" ? pathname === "/" : pathname?.startsWith(href) ?? false;
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "relative inline-flex items-center rounded-xl px-3.5 py-1.5",
                    "text-sm font-medium transition-colors duration-150",
                    isActive
                      ? "text-tomato-jam"
                      : "text-fg/50 hover:text-fg hover:bg-fg/6",
                  )}
                >
                  {isActive && (
                    <motion.span
                      layoutId="mkt-active-bg"
                      className="absolute inset-0 rounded-xl bg-tomato-jam/8"
                      transition={{ type: "spring", stiffness: 500, damping: 35 }}
                    />
                  )}
                  <span className="relative">{label}</span>
                </Link>
              );
            })}
          </div>


          {/* Primary CTA */}
          <Link
            href="/dashboard"
            className={cn(
              "hidden md:inline-flex items-center gap-2 rounded-xl px-4 py-2 ml-1.5",
              "text-sm font-semibold text-white",
              "bg-tomato-jam shadow-md shadow-tomato-jam/25",
              "transition-all duration-150",
              "hover:bg-tomato-jam/85 hover:shadow-lg hover:shadow-tomato-jam/35",
            )}
            aria-label="Go to dashboard"
          >
            <GitFork className="h-3.5 w-3.5" />
            <span>Get started</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>

          {/* Mobile hamburger */}
          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            className={cn(
              "md:hidden ml-1 inline-flex h-9 w-9 items-center justify-center rounded-xl",
              "text-fg/60 transition-colors hover:bg-fg/8 hover:text-fg",
              "outline-none focus-visible:ring-2 focus-visible:ring-tomato-jam/50",
            )}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </nav>
      </header>

      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            key="mobile-overlay"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            className="fixed inset-0 z-[9998] flex flex-col bg-canvas/97 backdrop-blur-2xl md:hidden"
          >
            <div className="flex h-16 shrink-0 items-center justify-between border-b border-fg/8 px-4">
              <Brand />
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-fg/60 transition-colors hover:bg-fg/8 hover:text-fg"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex flex-1 flex-col overflow-y-auto px-4 py-6 gap-1">
              {MARKETING_LINKS.map(({ label, href }, i) => (
                <motion.div
                  key={href}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.04 + i * 0.05, duration: 0.18 }}
                >
                  <Link
                    href={href}
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 rounded-2xl px-5 py-4 text-base font-semibold text-fg/70 transition-colors hover:bg-fg/5 hover:text-fg"
                  >
                    {label}
                  </Link>
                </motion.div>
              ))}
            </div>
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.18, duration: 0.2 }}
              className="shrink-0 border-t border-fg/8 px-4 py-5 flex flex-col gap-3"
            >
              <Link
                href="/dashboard"
                onClick={() => setMobileOpen(false)}
                className="flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white bg-tomato-jam"
              >
                <GitFork className="h-4 w-4" />
                Get started
              </Link>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// AppNav — floating pill, for /dashboard and /workbench
// ─────────────────────────────────────────────────────────────

const APP_LINKS = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Workbench", href: "/workbench", icon: Code2 },
];

function AppNav() {
  const pathname  = usePathname();
  const [mobileOpen, setMobileOpen] = React.useState(false);

  React.useEffect(() => { setMobileOpen(false); }, [pathname]);

  React.useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  return (
    <>
      <header className="sticky top-0 z-50 flex justify-center px-4 pt-3 pb-1 pointer-events-none">
        <nav
          aria-label="App navigation"
          className={cn(
            "pointer-events-auto relative flex items-center gap-1 rounded-2xl px-3 py-2",
            "border backdrop-blur-xl",
            "bg-canvas/88 border-fg/12 shadow-[0_8px_40px_rgba(0,0,0,0.55)]",
          )}
        >
          {/* Top accent shimmer */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-tomato-jam/45 to-transparent"
          />

          {/* Brand */}
          <div className="shrink-0 px-1">
            <Brand />
          </div>

          <div className="hidden md:block mx-2 h-4 w-px shrink-0 bg-fg/10" />

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-0.5">
            {APP_LINKS.map(({ label, href, icon: Icon }) => {
              const isActive = pathname?.startsWith(href) ?? false;
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "relative inline-flex items-center gap-2 rounded-xl px-3.5 py-1.5",
                    "text-sm font-medium transition-colors duration-150",
                    isActive
                      ? "text-tomato-jam"
                      : "text-fg/50 hover:text-fg hover:bg-fg/6",
                  )}
                >
                  {isActive && (
                    <motion.span
                      layoutId="app-active-bg"
                      className="absolute inset-0 rounded-xl bg-tomato-jam/8"
                      transition={{ type: "spring", stiffness: 500, damping: 35 }}
                    />
                  )}
                  <Icon className="relative h-3.5 w-3.5 shrink-0" />
                  <span className="relative">{label}</span>
                </Link>
              );
            })}
          </div>


          {/* Mobile hamburger */}
          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            className={cn(
              "md:hidden ml-1 inline-flex h-9 w-9 items-center justify-center rounded-xl",
              "text-fg/60 transition-colors hover:bg-fg/8 hover:text-fg",
              "outline-none focus-visible:ring-2 focus-visible:ring-tomato-jam/50",
            )}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </nav>
      </header>

      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            key="app-mobile-overlay"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            className="fixed inset-0 z-[9998] flex flex-col bg-canvas/97 backdrop-blur-2xl md:hidden"
          >
            <div className="flex h-16 shrink-0 items-center justify-between border-b border-fg/8 px-4">
              <Brand />
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-fg/60 transition-colors hover:bg-fg/8 hover:text-fg"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex flex-1 flex-col overflow-y-auto px-4 py-6 gap-1">
              {APP_LINKS.map(({ label, href, icon: Icon }, i) => (
                <motion.div
                  key={href}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.04 + i * 0.05, duration: 0.18 }}
                >
                  <Link
                    href={href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-2xl px-5 py-4 text-base font-semibold transition-colors",
                      pathname?.startsWith(href)
                        ? "bg-tomato-jam/8 text-tomato-jam"
                        : "text-fg/70 hover:bg-fg/5 hover:text-fg",
                    )}
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                    {label}
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// Header — route-aware dispatcher
// ─────────────────────────────────────────────────────────────

export function Header() {
  const pathname = usePathname();

  if (pathname === "/loading") {
    return null;
  }

  if (
    pathname === "/dashboard" ||
    pathname?.startsWith("/workbench")
  ) {
    return <AppNav />;
  }

  return <MarketingNav />;
}
