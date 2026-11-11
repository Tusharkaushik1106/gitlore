"use client";

import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from "recharts";
import { motion } from "framer-motion";
import { useRepoContext } from "@/context/RepoContext";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ProjectOverview } from "./ProjectOverview";
import { Sparkles, FileCode, AlertTriangle, TrendingUp, GitBranch, Code2, FileText, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

export function CockpitDashboard() {
  const { analysis } = useRepoContext();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"overview" | "project">("overview");

  const radarData =
    analysis?.stackRadar?.length
      ? analysis.stackRadar.map((p) => ({ subject: p.subject, A: p.value }))
      : [];

  const hotspots = analysis?.hotspots?.length
    ? analysis.hotspots.map((h) => ({
        path: h.path,
        complexity: h.complexity / 100,
        fileName: h.path.split("/").pop() || h.path,
        directory: h.path.split("/").slice(0, -1).join("/") || "root",
        extension: h.path.split(".").pop()?.toLowerCase() || "",
      }))
    : [];

  const getFileIcon = (extension: string) => {
    const iconMap: Record<string, typeof FileCode> = {
      ts: FileCode,
      tsx: FileCode,
      js: FileCode,
      jsx: FileCode,
      py: Code2,
      java: Code2,
      go: Code2,
      rs: Code2,
      cpp: Code2,
      c: Code2,
      md: FileText,
      json: FileText,
      yml: FileText,
      yaml: FileText,
    };
    return iconMap[extension] || FileCode;
  };

  const getComplexityColor = (complexity: number) => {
    if (complexity >= 0.8) return "from-tomato-jam to-red-700";
    if (complexity >= 0.6) return "from-metallic-gold to-yellow-600";
    return "from-emerald-500 to-green-600";
  };

  const getComplexityLabel = (complexity: number) => {
    if (complexity >= 0.8) return "Critical";
    if (complexity >= 0.6) return "High";
    return "Moderate";
  };

  return (
    <main className="flex h-screen flex-col overflow-hidden">

      {/* ── Tab strip ── */}
      <div className="px-4 pt-4 pb-2 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-6xl">
          <div className="inline-flex items-center gap-1 rounded-xl border border-fg/10 bg-fg/[0.04] p-1">
            {(["overview", "project"] as const).map((tab) => {
              const isActive = activeTab === tab;
              const label = tab === "overview" ? "Overview" : "Project Details";
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    "relative rounded-lg px-4 py-1.5 text-sm font-medium transition-all duration-150",
                    isActive
                      ? "text-fg"
                      : "text-fg/40 hover:text-fg/70",
                  )}
                >
                  {isActive && (
                    <motion.span
                      layoutId="tab-bg"
                      className="absolute inset-0 rounded-lg bg-canvas/70 shadow-sm border border-fg/8"
                      transition={{ type: "spring", stiffness: 500, damping: 35 }}
                    />
                  )}
                  <span className="relative">{label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Content area ── */}
      <div className="flex-1 overflow-hidden">
        {activeTab === "overview" ? (
          <div className="h-full overflow-y-auto px-3 py-2 sm:px-4 lg:px-6 scrollbar-thin scrollbar-thumb-fg scrollbar-track-canvas/50 transform-gpu">
            <div className="mx-auto max-w-6xl space-y-3 pb-4">

              {/* ── Top row: Elevator Pitch + Stack Radar ── */}
              <section className="grid grid-cols-[minmax(0,2.3fr)_minmax(0,1.2fr)] gap-3">

                {/* Elevator Pitch */}
                <motion.article
                  className="gf-card relative flex flex-col overflow-hidden p-4 sm:p-5"
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ type: "spring", stiffness: 90, damping: 18 }}
                >
                  <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_0%_0%,rgba(192,57,43,0.06),transparent_60%),radial-gradient(circle_at_100%_100%,rgba(212,175,55,0.06),transparent_60%)] opacity-60" />

                  <header className="relative z-10 mb-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-tomato-jam/10 ring-1 ring-tomato-jam/20">
                        <Zap className="h-3.5 w-3.5 text-tomato-jam" />
                      </div>
                      <div>
                        <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-fg/40">
                          Elevator pitch
                        </p>
                        <h2 className="mt-0.5 text-base font-semibold text-fg">
                          {analysis?.name
                            ? `${analysis.name} in one breath`
                            : "Repository in one breath"}
                        </h2>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 rounded-full bg-fg/5 px-2.5 py-1 text-[10px] text-fg/50 ring-1 ring-fg/10">
                      <Sparkles className="h-2.5 w-2.5 text-tomato-jam" />
                      <span>Claude · <span className="text-tomato-jam/80 font-medium">claude-haiku-5-5</span></span>
                    </div>
                  </header>

                  <div className="relative z-10 space-y-2.5 max-w-2xl text-sm leading-relaxed">
                    <div className="rounded-xl bg-fg/[0.03] p-3 ring-1 ring-fg/10">
                      <p className="text-sm text-fg/80 leading-relaxed">
                        {analysis?.elevatorPitch ? (
                          analysis.elevatorPitch
                        ) : (
                          <>
                            <span className="font-semibold text-tomato-jam">gitlore</span>{" "}
                            is a Claude-powered cockpit for understanding large codebases. Paste a GitHub URL from the home screen to see a live elevator pitch for that repository here.
                          </>
                        )}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="rounded-xl bg-tomato-jam/8 p-2.5 ring-1 ring-tomato-jam/15">
                        <p className="text-[10px] font-semibold text-tomato-jam mb-1">Architecture</p>
                        <p className="text-[11px] text-fg/60 leading-relaxed">
                          <span className="text-fg/80">Diagrams, call-flow charts,</span> and file dependency maps via Mermaid and React Flow
                        </p>
                      </div>
                      <div className="rounded-xl bg-metallic-gold/8 p-2.5 ring-1 ring-metallic-gold/15">
                        <p className="text-[10px] font-semibold text-metallic-gold mb-1">Intelligence</p>
                        <p className="text-[11px] text-fg/60 leading-relaxed">
                          <span className="text-fg/80">RAG-backed Q&A</span> over code and docs from workbench and chat
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-fg/40">
                      <GitBranch className="h-3 w-3" />
                      <span>
                        Highlights <span className="text-tomato-jam">hotspots & complexity</span>, surfaces{" "}
                        <span className="text-metallic-gold">stack balance</span> in radar view
                      </span>
                    </div>
                  </div>
                </motion.article>

                {/* Stack Radar */}
                <motion.aside
                  className="gf-card relative flex flex-col overflow-hidden p-3 sm:p-4"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.06, type: "spring", stiffness: 95 }}
                >
                  <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(212,175,55,0.08),transparent_70%)] opacity-50" />

                  <header className="relative z-10 mb-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-metallic-gold/10 ring-1 ring-metallic-gold/20">
                        <TrendingUp className="h-3.5 w-3.5 text-metallic-gold" />
                      </div>
                      <div>
                        <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-fg/40">
                          Stack radar
                        </p>
                        <p className="text-[11px] text-fg/60">
                          Balance between surfaces in this repo.
                        </p>
                      </div>
                    </div>
                  </header>

                  <div className="relative z-10 h-44 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={radarData ?? []}>
                        <PolarGrid
                          stroke="#2a1f1a"
                          strokeWidth={1}
                          radialLines={false}
                          gridType="circle"
                        />
                        <PolarAngleAxis
                          dataKey="subject"
                          tick={{ fill: "#e7d7c1", fontSize: 11, fontWeight: 500 }}
                        />
                        <PolarRadiusAxis
                          tick={false}
                          axisLine={false}
                          tickCount={4}
                        />
                        <Radar
                          dataKey="A"
                          stroke="#c0392b"
                          fill="url(#radarFill)"
                          strokeWidth={2.5}
                          fillOpacity={0.6}
                          dot={{ fill: "#c0392b", r: 4 }}
                          activeDot={{ r: 6, fill: "#d4af37" }}
                        />
                        <defs>
                          <linearGradient id="radarFill" x1="0" y1="0" x2="1" y2="1">
                            <stop offset="0%"   stopColor="#c0392b" stopOpacity={0.6} />
                            <stop offset="50%"  stopColor="#d4af37" stopOpacity={0.5} />
                            <stop offset="100%" stopColor="#e7d7c1" stopOpacity={0.3} />
                          </linearGradient>
                        </defs>
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>

                  {radarData && radarData.length > 0 && (
                    <div className="relative z-10 mt-2 flex flex-wrap gap-1.5">
                      {radarData.map((point) => (
                        <div
                          key={point.subject}
                          className="flex items-center gap-1 rounded-full bg-fg/5 px-2 py-0.5 text-[9px] ring-1 ring-fg/10"
                        >
                          <div className="h-1.5 w-1.5 rounded-full bg-gradient-to-r from-tomato-jam to-metallic-gold" />
                          <span className="text-fg/60">{point.subject}</span>
                          <span className="font-semibold text-tomato-jam">{point.A}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.aside>
              </section>

              {/* ── Bottom row: Hotspots + Mini-map ── */}
              <section className="grid grid-cols-1 gap-3">

                {/* Hotspots */}
                <motion.section
                  className="gf-card relative flex flex-col overflow-hidden p-3 sm:p-4"
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.12, type: "spring", stiffness: 95 }}
                >
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-tomato-jam/5 via-transparent to-metallic-gold/3 opacity-50" />

                  <header className="relative z-10 mb-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-tomato-jam/10 ring-1 ring-tomato-jam/20">
                        <AlertTriangle className="h-3.5 w-3.5 text-tomato-jam" />
                      </div>
                      <div>
                        <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-fg/40">
                          Hotspots
                        </p>
                        <p className="text-[11px] text-fg/60">
                          Files with notable complexity or branching.
                        </p>
                      </div>
                    </div>
                    {hotspots.length > 0 && (
                      <div className="flex items-center gap-1 rounded-full bg-fg/5 px-2 py-0.5 text-[9px] text-fg/40 ring-1 ring-fg/10">
                        <TrendingUp className="h-2.5 w-2.5" />
                        <span>{hotspots.length} files</span>
                      </div>
                    )}
                  </header>

                  {hotspots.length === 0 ? (
                    <div className="relative z-10 flex flex-col items-center justify-center py-6 text-center">
                      <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-fg/5 ring-1 ring-fg/10">
                        <FileCode className="h-5 w-5 text-fg/30" />
                      </div>
                      <p className="text-xs font-medium text-fg/40">No hotspots detected</p>
                      <p className="mt-0.5 text-[10px] text-fg/25">All files are within normal complexity ranges</p>
                    </div>
                  ) : (
                    <div className="relative z-10 flex-1 min-h-0 overflow-hidden">
                      <div className="h-full overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-fg scrollbar-track-canvas/50 transform-gpu">
                        <ul className="space-y-2">
                          {hotspots.map((file, index) => {
                            const FileIcon = getFileIcon(file.extension);
                            const complexityPercent = Math.round(file.complexity * 100);

                            return (
                              <motion.li
                                key={file.path}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.12 + index * 0.05 }}
                                className="group relative overflow-hidden rounded-xl border border-fg/10 bg-gradient-to-br from-canvas/80 to-canvas/60 p-2.5 transition-all hover:border-tomato-jam/20 hover:shadow-lg hover:shadow-tomato-jam/10"
                              >
                                <div className="flex items-start gap-2.5">
                                  <div className={cn(
                                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ring-1",
                                    file.complexity >= 0.8
                                      ? "ring-tomato-jam/30 from-tomato-jam/20 to-red-700/20"
                                      : file.complexity >= 0.6
                                        ? "ring-metallic-gold/30 from-metallic-gold/20 to-yellow-600/20"
                                        : "ring-emerald-500/30 from-emerald-500/20 to-green-600/20"
                                  )}>
                                    <FileIcon className={cn(
                                      "h-3.5 w-3.5",
                                      file.complexity >= 0.8 ? "text-tomato-jam" : file.complexity >= 0.6 ? "text-metallic-gold" : "text-emerald-400"
                                    )} />
                                  </div>

                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-2 mb-1">
                                      <div className="flex-1 min-w-0">
                                        <p className="text-[11px] font-semibold text-fg/80 truncate group-hover:text-fg transition-colors">
                                          {file.fileName}
                                        </p>
                                        <p className="text-[9px] text-fg/30 truncate mt-0.5 font-mono">
                                          {file.directory || "root"}
                                        </p>
                                      </div>

                                      <div className="flex items-center gap-1.5 shrink-0">
                                        <div className="flex flex-col items-end gap-0.5">
                                          <div className="flex items-center gap-1">
                                            <span className="text-[9px] font-medium text-fg/40">
                                              {getComplexityLabel(file.complexity)}
                                            </span>
                                            <span className={cn(
                                              "text-[11px] font-bold",
                                              file.complexity >= 0.8 ? "text-tomato-jam" : file.complexity >= 0.6 ? "text-metallic-gold" : "text-emerald-400"
                                            )}>
                                              {complexityPercent}
                                            </span>
                                          </div>
                                          <div className="h-1 w-14 rounded-full bg-fg/10 overflow-hidden">
                                            <div
                                              className={cn(
                                                "h-full rounded-full bg-gradient-to-r transition-all",
                                                getComplexityColor(file.complexity)
                                              )}
                                              style={{ width: `${complexityPercent}%` }}
                                            />
                                          </div>
                                        </div>
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-2 mt-1.5">
                                      <div className="flex items-center gap-1 rounded-full bg-fg/5 px-1.5 py-0.5">
                                        <Code2 className="h-2.5 w-2.5 text-fg/30" />
                                        <span className="text-[9px] font-mono text-fg/40 uppercase">
                                          {file.extension || "file"}
                                        </span>
                                      </div>
                                      {file.complexity >= 0.8 && (
                                        <div className="flex items-center gap-1 rounded-full bg-tomato-jam/10 px-1.5 py-0.5">
                                          <AlertTriangle className="h-2.5 w-2.5 text-tomato-jam" />
                                          <span className="text-[9px] text-tomato-jam/80">Review needed</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-fg/20 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                              </motion.li>
                            );
                          })}
                        </ul>
                      </div>
                    </div>
                  )}
                </motion.section>

                {/* Mini-map */}
                <motion.section
                  className="gf-card flex items-center justify-between overflow-hidden px-3 py-2.5 sm:px-4 sm:py-3"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.18, type: "spring", stiffness: 95 }}
                >
                  <div>
                    <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-fg/40">
                      Repo mini-map
                    </p>
                    <p className="mt-0.5 text-[11px] text-fg/60">
                      Scaled-down flow of modules and entrypoints.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => router.push("/workbench")}
                    className="rounded-full border border-tomato-jam/40 bg-canvas/60 px-3 py-1.5 text-[11px] font-medium text-tomato-jam transition hover:bg-canvas/80 focus:outline-none"
                  >
                    Explore in workbench
                  </button>
                </motion.section>
              </section>
            </div>
          </div>
        ) : (
          <ProjectOverview />
        )}
      </div>
    </main>
  );
}
