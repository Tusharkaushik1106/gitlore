"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Zap, X, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface UsageStats {
  tokensUsed: number;
  tokensRemaining: number;
  requestCount: number;
  requestsRemaining: number;
}

interface UsageModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function UsageModal({ isOpen, onClose }: UsageModalProps) {
  const [usage, setUsage] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const fetchUsage = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true);
    try {
      const res = await fetch(`/api/usage?t=${Date.now()}`);
      if (res.ok) {
        const data = await res.json();
        setUsage(data);
      }
    } catch (error) {
      console.error("Failed to fetch usage:", error);
    } finally {
      setLoading(false);
      if (showRefreshing) setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    fetchUsage();
    const interval = setInterval(() => fetchUsage(), 5000);
    return () => clearInterval(interval);
  }, [isOpen, fetchUsage]);

  useEffect(() => {
    if (!isOpen) return;
    const handleUsageUpdate = () => fetchUsage(true);
    window.addEventListener("usage-updated", handleUsageUpdate);
    return () => window.removeEventListener("usage-updated", handleUsageUpdate);
  }, [isOpen, fetchUsage]);

  // Escape key to close
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  // Scroll lock
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  // Focus close button when modal opens
  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => closeButtonRef.current?.focus());
    }
  }, [isOpen]);

  const tokenPercent  = usage ? (usage.tokensUsed   / 50000) * 100 : 0;
  const requestPercent = usage ? (usage.requestCount / 100)   * 100 : 0;

  const barColor = (pct: number) =>
    pct > 90
      ? "bg-gradient-to-r from-tomato-jam to-tomato-jam/70"
      : pct > 70
      ? "bg-gradient-to-r from-metallic-gold to-metallic-gold/70"
      : "bg-gradient-to-r from-tomato-jam/60 to-metallic-gold/60";

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* ── Backdrop ── */}
          <motion.div
            key="usage-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-[9000] bg-canvas/75 backdrop-blur-sm"
            aria-hidden
          />

          {/* ── Panel ── */}
          <div className="fixed inset-0 z-[9001] flex items-center justify-center px-4">
            <motion.div
              key="usage-panel"
              role="dialog"
              aria-modal
              aria-labelledby="usage-modal-title"
              initial={{ opacity: 0, scale: 0.94, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 16 }}
              transition={{ duration: 0.28, ease: [0, 0, 0.2, 1] }}
              className={cn(
                "relative w-full max-w-md overflow-hidden rounded-3xl",
                "border border-fg/10",
                "bg-[linear-gradient(135deg,rgba(16,16,17,0.97),rgba(16,16,17,0.93))]",
                "backdrop-blur-xl",
                "shadow-[0_24px_64px_rgba(0,0,0,0.7)]",
              )}
            >
              {/* Corner gradient decoration */}
              <span
                aria-hidden
                className="pointer-events-none absolute inset-0 opacity-40"
                style={{
                  background:
                    "radial-gradient(circle at 0% 0%, rgba(192,57,43,0.08), transparent 50%), radial-gradient(circle at 100% 100%, rgba(212,175,55,0.06), transparent 50%)",
                }}
              />

              {/* ── Header ── */}
              <div className="relative z-10 flex items-start justify-between gap-4 border-b border-fg/10 px-6 py-5">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-tomato-jam/10 ring-1 ring-tomato-jam/20 text-tomato-jam">
                    <Zap className="h-4 w-4" />
                  </div>
                  <div>
                    <h2 id="usage-modal-title" className="text-base font-semibold text-fg leading-tight">
                      Usage Statistics
                    </h2>
                    <p className="mt-0.5 text-xs text-fg/45 leading-relaxed">
                      Daily limits reset at midnight UTC
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => fetchUsage(true)}
                    disabled={refreshing}
                    title="Refresh"
                    className={cn(
                      "shrink-0 rounded-xl p-1.5",
                      "text-fg/40",
                      "gf-transition-fast",
                      "hover:bg-fg/8 hover:text-fg",
                      "gf-focus-ring focus-visible:ring-2 focus-visible:ring-tomato-jam/50",
                      "focus-visible:ring-offset-2 focus-visible:ring-offset-canvas",
                      "disabled:opacity-40 disabled:pointer-events-none",
                    )}
                  >
                    <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
                  </button>
                  <button
                    ref={closeButtonRef}
                    type="button"
                    onClick={onClose}
                    aria-label="Close"
                    className={cn(
                      "shrink-0 rounded-xl p-1.5",
                      "text-fg/40",
                      "gf-transition-fast",
                      "hover:bg-fg/8 hover:text-fg",
                      "gf-focus-ring focus-visible:ring-2 focus-visible:ring-tomato-jam/50",
                      "focus-visible:ring-offset-2 focus-visible:ring-offset-canvas",
                    )}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* ── Body ── */}
              <div className="relative z-10 px-6 py-5">
                {loading && !usage ? (
                  <div className="flex items-center justify-center py-8">
                    <span className="gf-spinner gf-spinner-lg" />
                  </div>
                ) : usage ? (
                  <div className="space-y-5">
                    {/* Tokens */}
                    <div>
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-xs font-medium uppercase tracking-[0.15em] text-fg/50">
                          Tokens
                        </span>
                        <span className="text-sm tabular-nums text-fg/60">
                          {usage.tokensUsed.toLocaleString()} / 50,000
                        </span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-fg/8">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(tokenPercent, 100)}%` }}
                          transition={{ duration: 0.5, ease: [0, 0, 0.2, 1] }}
                          className={cn("h-full rounded-full", barColor(tokenPercent))}
                        />
                      </div>
                      <p className="mt-1.5 text-[11px] text-fg/40">
                        {usage.tokensRemaining.toLocaleString()} remaining
                      </p>
                    </div>

                    {/* Requests */}
                    <div>
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-xs font-medium uppercase tracking-[0.15em] text-fg/50">
                          Requests
                        </span>
                        <span className="text-sm tabular-nums text-fg/60">
                          {usage.requestCount} / 100
                        </span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-fg/8">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(requestPercent, 100)}%` }}
                          transition={{ duration: 0.5, ease: [0, 0, 0.2, 1] }}
                          className={cn("h-full rounded-full", barColor(requestPercent))}
                        />
                      </div>
                      <p className="mt-1.5 text-[11px] text-fg/40">
                        {usage.requestsRemaining} remaining
                      </p>
                    </div>

                    {/* Note */}
                    <div className="rounded-2xl border border-fg/8 bg-fg/[0.03] p-4">
                      <p className="text-xs text-fg/50 leading-relaxed">
                        <span className="font-semibold text-fg/70">Note:</span>{" "}
                        Usage limits help manage API costs and ensure fair access. Limits reset daily
                        at midnight UTC. Token counts include both input and response tokens.
                      </p>
                    </div>

                    {/* Footer meta */}
                    <div className="flex items-center justify-between text-[10px] text-fg/30">
                      <span>Updated {new Date().toLocaleTimeString()}</span>
                      <span className="flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-tomato-jam animate-pulse" />
                        Live tracking
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="py-8 text-center text-sm text-fg/40">
                    Unable to load usage statistics
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
