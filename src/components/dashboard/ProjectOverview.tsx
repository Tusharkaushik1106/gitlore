"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useRepoContext } from "@/context/RepoContext";
import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import { MermaidDiagram } from "@/components/diagrams/MermaidDiagram";
import { Maximize2, X, Component, ArrowRight } from "lucide-react";
import { Badge, Button } from "@/components/ui";

interface ProjectAnalysis {
  overview: string;
  architecture: string;
  keyComponents: string[];
  dataFlow: string;
  techStack: string[];
  dependencies: string[];
  mermaidArchitecture?: string;
  mermaidDataFlow?: string;
}

export function ProjectOverview() {
  const { analysis } = useRepoContext();
  const [projectAnalysis, setProjectAnalysis] = useState<ProjectAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fullScreenArch, setFullScreenArch] = useState(false);
  const [fullScreenDataFlow, setFullScreenDataFlow] = useState(false);
  const [archRenderError, setArchRenderError] = useState<string | null>(null);
  const [dataRenderError, setDataRenderError] = useState<string | null>(null);
  const [showArchRaw, setShowArchRaw] = useState(false);
  const [showDataRaw, setShowDataRaw] = useState(false);

  useEffect(() => {
    if (!analysis?.owner || !analysis?.name) {
      setLoading(false);
      return;
    }

    async function fetchProjectAnalysis() {
      if (!analysis) return;
      try {
        setLoading(true);
        setError(null);
        const res = await fetch("/api/project-overview", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            owner: analysis.owner,
            name: analysis.name,
            repoUrl: analysis.repoUrl,
            sampleCode: analysis.sampleCode,
            fileTree: analysis.fullFileTree || analysis.sampleFileTree,
          }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          if (res.status === 429) {
            throw new Error(data.error || `Rate limit exceeded. Please wait and try again later.`);
          }
          throw new Error(data.error || "Failed to load project analysis.");
        }

        const data = await res.json();
        setProjectAnalysis(data);
        window.dispatchEvent(new CustomEvent("usage-updated"));
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Unexpected error loading project analysis.";
        setError(message);
      } finally {
        setLoading(false);
      }
    }

    fetchProjectAnalysis();
  }, [analysis]);

  /* ── Loading ── */
  if (loading) {
    return (
      <div className="h-full overflow-y-auto px-4 py-6">
        <div className="mx-auto max-w-5xl space-y-4">

          {/* Live indicator */}
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-2 flex items-center gap-2"
          >
            <div className="flex items-center gap-2 rounded-full border border-tomato-jam/20 bg-tomato-jam/5 px-3 py-1.5">
              <motion.span
                className="h-1.5 w-1.5 rounded-full bg-tomato-jam"
                animate={{ opacity: [1, 0.25, 1] }}
                transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
              />
              <span className="text-xs font-medium text-tomato-jam/70">
                Analyzing project structure…
              </span>
            </div>
          </motion.div>

          {/* Skeleton cards — mirror real card layout */}
          {[
            { titleW: "w-36", lines: [100, 90, 78, 65] },
            { titleW: "w-48", lines: [100, 100, 88, 72, 50] },
            { titleW: "w-40", lines: [100, 82, 68] },
            { titleW: "w-32", lines: [100, 76] },
          ].map((card, i) => (
            <motion.div
              key={i}
              className="gf-card overflow-hidden p-6"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
            >
              {/* Card title */}
              <div
                className={`mb-5 h-4 rounded-full bg-fg/8 animate-pulse ${card.titleW}`}
              />
              {/* Content lines */}
              <div className="space-y-2.5">
                {card.lines.map((w, j) => (
                  <div
                    key={j}
                    className="h-2.5 rounded-full bg-fg/5 animate-pulse"
                    style={{ width: `${w}%` }}
                  />
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    );
  }

  /* ── Error ── */
  if (error) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="rounded-2xl border border-tomato-jam/30 bg-tomato-jam/5 p-4 max-w-md">
          <p className="font-medium mb-1 text-tomato-jam/80">Error loading analysis</p>
          <p className="text-sm text-tomato-jam/60">{error}</p>
        </div>
      </div>
    );
  }

  /* ── No data ── */
  if (!projectAnalysis) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-fg/40">No project analysis available.</p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto px-4 py-6 transform-gpu scrollbar-thin">
      <div className="mx-auto max-w-5xl space-y-6">

        {/* Overview */}
        <motion.section
          className="gf-card overflow-hidden p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h2 className="mb-4 text-lg font-semibold text-fg">
            Project Overview
          </h2>
          <div className="markdown-body text-fg/80 leading-relaxed">
            <ReactMarkdown>{projectAnalysis.overview}</ReactMarkdown>
          </div>
        </motion.section>

        {/* Architecture Diagram */}
        {projectAnalysis.mermaidArchitecture && (
          <motion.section
            className="gf-card overflow-hidden p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-fg">
                Architecture Diagram
              </h2>
              <Button
                variant="ghost"
                size="xs"
                leftIcon={<Maximize2 className="h-3.5 w-3.5" />}
                onClick={() => setFullScreenArch(true)}
              >
                Fullscreen
              </Button>
            </div>
            <div className="rounded-xl border border-fg/10 bg-canvas/50 p-4 space-y-2">
              {archRenderError && (
                <div className="rounded-lg border border-metallic-gold/40 bg-metallic-gold/5 px-3 py-2 text-xs text-metallic-gold/80">
                  {archRenderError}{" "}
                  <button
                    type="button"
                    onClick={() => setShowArchRaw((s) => !s)}
                    className="underline decoration-dotted underline-offset-4 text-metallic-gold hover:text-metallic-gold/80 ml-1"
                  >
                    {showArchRaw ? "Hide raw code" : "Show raw code"}
                  </button>
                </div>
              )}
              <MermaidDiagram
                key={`arch-${projectAnalysis.mermaidArchitecture?.slice(0, 50)}`}
                code={projectAnalysis.mermaidArchitecture}
                id="project-architecture"
                onError={(msg) => setArchRenderError(msg)}
              />
              {showArchRaw && (
                <pre className="whitespace-pre-wrap break-words rounded-xl bg-canvas p-3 text-[11px] text-fg/70 border border-fg/10">
                  {projectAnalysis.mermaidArchitecture}
                </pre>
              )}
            </div>
          </motion.section>
        )}

        {/* Key Components */}
        {projectAnalysis.keyComponents && projectAnalysis.keyComponents.length > 0 && (
          <motion.section
            className="gf-card overflow-hidden p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="mb-6 flex items-center gap-2">
              <Component className="h-5 w-5 text-tomato-jam" />
              <h2 className="text-lg font-semibold text-fg">
                Key Components
              </h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2">
              {projectAnalysis.keyComponents.map((component, index) => {
                let cleaned = component
                  .replace(/\*\*/g, "")
                  .replace(/`([^`]+)`/g, "$1")
                  .trim();

                const filePathMatch = cleaned.match(/[\(`]([^`\)]+)[\)`]/);
                let filePath: string | null = null;
                if (filePathMatch && filePathMatch[1].includes("/")) {
                  filePath = filePathMatch[1];
                  cleaned = cleaned.replace(/[\(`][^`\)]+[\)`]/g, "").trim();
                }
                const parts = cleaned
                  .split(/[:–—\-]\s+/)
                  .map((p) => p.trim())
                  .filter((p) => p.length > 0);

                const title = parts.length > 1 ? parts[0] : parts[0] || cleaned;
                const description = parts.length > 1
                  ? parts.slice(1).join(": ").trim()
                  : null;

                return (
                  <motion.div
                    key={index}
                    className="group relative overflow-hidden rounded-2xl border border-fg/10 bg-gradient-to-br from-canvas/80 to-canvas/60 p-4 transition-all hover:border-tomato-jam/30 hover:shadow-lg hover:shadow-tomato-jam/10"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 + index * 0.05 }}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-tomato-jam/10 ring-1 ring-tomato-jam/20">
                        <span className="text-sm font-bold text-tomato-jam">
                          {index + 1}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="mb-1.5 text-sm font-semibold text-fg group-hover:text-fg/90 transition-colors">
                          {title}
                        </h3>
                        {filePath && (
                          <div className="mb-2 inline-flex items-center gap-1.5 rounded-md bg-fg/5 px-2 py-0.5">
                            <span className="text-[10px] font-mono text-fg/40">
                              {filePath}
                            </span>
                          </div>
                        )}
                        {description && (
                          <p className="text-sm leading-relaxed text-fg/70">
                            {description}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="absolute bottom-0 right-0 h-px w-0 bg-gradient-to-r from-transparent via-tomato-jam/40 to-transparent transition-all group-hover:w-full" />
                  </motion.div>
                );
              })}
            </div>
          </motion.section>
        )}

        {/* Data Flow */}
        {projectAnalysis.mermaidDataFlow && (
          <motion.section
            className="gf-card overflow-hidden p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-fg">
                Data Flow
              </h2>
              <Button
                variant="ghost"
                size="xs"
                leftIcon={<Maximize2 className="h-3.5 w-3.5" />}
                onClick={() => setFullScreenDataFlow(true)}
              >
                Fullscreen
              </Button>
            </div>
            <div className="rounded-xl border border-fg/10 bg-canvas/50 p-4 space-y-2">
              {dataRenderError && (
                <div className="rounded-lg border border-metallic-gold/40 bg-metallic-gold/5 px-3 py-2 text-xs text-metallic-gold/80">
                  {dataRenderError}{" "}
                  <button
                    type="button"
                    onClick={() => setShowDataRaw((s) => !s)}
                    className="underline decoration-dotted underline-offset-4 text-metallic-gold hover:text-metallic-gold/80 ml-1"
                  >
                    {showDataRaw ? "Hide raw code" : "Show raw code"}
                  </button>
                </div>
              )}
              <MermaidDiagram
                code={projectAnalysis.mermaidDataFlow}
                id="project-dataflow"
                onError={(msg) => setDataRenderError(msg)}
              />
              {showDataRaw && (
                <pre className="whitespace-pre-wrap break-words rounded-xl bg-canvas p-3 text-[11px] text-fg/70 border border-fg/10">
                  {projectAnalysis.mermaidDataFlow}
                </pre>
              )}
            </div>
            {projectAnalysis.dataFlow && (
              <div className="mt-4 text-sm text-fg/70">
                <ReactMarkdown>{projectAnalysis.dataFlow}</ReactMarkdown>
              </div>
            )}
          </motion.section>
        )}

        {/* Tech Stack */}
        {projectAnalysis.techStack && projectAnalysis.techStack.length > 0 && (
          <motion.section
            className="gf-card overflow-hidden p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <h2 className="mb-4 text-lg font-semibold text-fg">
              Technology Stack
            </h2>
            <div className="flex flex-wrap gap-2">
              {projectAnalysis.techStack.map((tech, index) => (
                <Badge key={index} variant="default">{tech}</Badge>
              ))}
            </div>
          </motion.section>
        )}

        {/* Dependencies */}
        {projectAnalysis.dependencies && projectAnalysis.dependencies.length > 0 && (
          <motion.section
            className="gf-card overflow-hidden p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <h2 className="mb-4 text-lg font-semibold text-fg">
              Key Dependencies
            </h2>
            <ul className="space-y-2">
              {projectAnalysis.dependencies.map((dep, index) => (
                <li
                  key={index}
                  className="flex items-center gap-2 text-sm text-fg/70"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-tomato-jam/70" />
                  <span className="font-mono">{dep}</span>
                </li>
              ))}
            </ul>
          </motion.section>
        )}
      </div>

      {/* Fullscreen — Architecture */}
      <AnimatePresence>
        {fullScreenArch && projectAnalysis.mermaidArchitecture && (
          <>
            <motion.div
              key="arch-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setFullScreenArch(false)}
              className="fixed inset-0 z-[49] bg-canvas/95 backdrop-blur-xl"
              aria-hidden
            />
            <motion.div
              key="arch-panel"
              initial={{ opacity: 0, scale: 0.96, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 16 }}
              transition={{ duration: 0.28, ease: [0, 0, 0.2, 1] }}
              className="fixed inset-0 z-50 flex items-center justify-center p-6"
            >
              <div className="relative h-[85vh] w-full max-w-6xl rounded-3xl border border-tomato-jam/40 bg-canvas/95 p-4 shadow-2xl shadow-tomato-jam/20">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-tomato-jam">
                    Architecture Diagram – Fullscreen
                  </p>
                  <button
                    type="button"
                    onClick={() => setFullScreenArch(false)}
                    className="inline-flex items-center justify-center h-8 w-8 rounded-xl bg-fg/5 text-fg/70 gf-transition-fast hover:bg-fg/10 hover:text-fg"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div
                  className="h-[calc(100%-3rem)] w-full overflow-auto rounded-2xl bg-canvas/90 p-4"
                  style={{ willChange: "scroll-position", transform: "translateZ(0)" }}
                >
                  <MermaidDiagram
                    key={`arch-fullscreen-${projectAnalysis.mermaidArchitecture?.slice(0, 50)}`}
                    code={projectAnalysis.mermaidArchitecture}
                    id="project-architecture-fullscreen"
                    onError={(msg) => setArchRenderError(msg)}
                  />
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Fullscreen — Data Flow */}
      <AnimatePresence>
        {fullScreenDataFlow && projectAnalysis.mermaidDataFlow && (
          <>
            <motion.div
              key="dataflow-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setFullScreenDataFlow(false)}
              className="fixed inset-0 z-[49] bg-canvas/95 backdrop-blur-xl"
              aria-hidden
            />
            <motion.div
              key="dataflow-panel"
              initial={{ opacity: 0, scale: 0.96, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 16 }}
              transition={{ duration: 0.28, ease: [0, 0, 0.2, 1] }}
              className="fixed inset-0 z-50 flex items-center justify-center p-6"
            >
              <div className="relative h-[85vh] w-full max-w-6xl rounded-3xl border border-metallic-gold/40 bg-canvas/95 p-4 shadow-2xl shadow-metallic-gold/20">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-metallic-gold">
                    Data Flow Diagram – Fullscreen
                  </p>
                  <button
                    type="button"
                    onClick={() => setFullScreenDataFlow(false)}
                    className="inline-flex items-center justify-center h-8 w-8 rounded-xl bg-fg/5 text-fg/70 gf-transition-fast hover:bg-fg/10 hover:text-fg"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div
                  className="h-[calc(100%-3rem)] w-full overflow-auto rounded-2xl bg-canvas/90 p-4"
                  style={{ willChange: "scroll-position", transform: "translateZ(0)" }}
                >
                  <MermaidDiagram
                    key={`dataflow-fullscreen-${projectAnalysis.mermaidDataFlow?.slice(0, 50)}`}
                    code={projectAnalysis.mermaidDataFlow}
                    id="project-dataflow-fullscreen"
                    onError={(msg) => setDataRenderError(msg)}
                  />
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
