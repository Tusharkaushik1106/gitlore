
"use client";

import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import ReactFlow, { Background } from "reactflow";
import "reactflow/dist/style.css";
import Editor from "@monaco-editor/react";
import { motion, AnimatePresence } from "framer-motion";
import { useRepoContext } from "@/context/RepoContext";
import { useFileContext } from "@/context/FileContext";
import { useEffect, useState, useMemo, useCallback, memo, useRef } from "react";
import { MermaidDiagram } from "@/components/diagrams/MermaidDiagram";
import ReactMarkdown from "react-markdown";
import { ChevronRight, ChevronDown, Folder, File, Route, Zap, Sparkles } from "lucide-react";

function cleanMermaidCode(raw: string | null): string | null {
  if (!raw) return null;

  let cleaned = raw.replace(/```mermaid/g, "").replace(/```/g, "");

  cleaned = cleaned.replace(/("[^"]+")([A-Za-z0-9]+)/g, '$1\n$2');

  cleaned = cleaned.trim();

  return cleaned;
}

const initialNodes = [
  {
    id: "1",
    data: { label: "app entry" },
    position: { x: 0, y: 0 },
  },
  {
    id: "2",
    data: { label: "api /chat" },
    position: { x: 160, y: 80 },
  },
  {
    id: "3",
    data: { label: "Claude adapter" },
    position: { x: -120, y: 80 },
  },
];

const initialEdges = [
  { id: "e1-2", source: "1", target: "2", animated: true },
  { id: "e1-3", source: "1", target: "3", animated: true },
];

interface FileTreeItem {
  name: string;
  path: string;
  type: "file" | "folder";
  children?: FileTreeItem[];
  complexity?: "green" | "yellow" | "red";
  language?: string;
  isRoute?: boolean;
  isImportant?: boolean;
}

function buildFileTree(
  entries: Array<{
    path: string;
    type?: "file" | "folder";
    language: string;
    complexity: "green" | "yellow" | "red";
  }>,
): FileTreeItem[] {
  const tree: FileTreeItem[] = [];
  const pathMap = new Map<string, FileTreeItem>();

  const sortedEntries = [...entries].sort((a, b) => {
    const aIsFolder = a.type === "folder";
    const bIsFolder = b.type === "folder";
    if (aIsFolder && !bIsFolder) return -1;
    if (!aIsFolder && bIsFolder) return 1;
    return a.path.localeCompare(b.path);
  });

  for (const entry of sortedEntries) {
    const parts = entry.path.split("/");
    const itemName = parts.pop()!;
    const isFolder = entry.type === "folder";

    let isRoute = false;
    let isImportant = false;

    if (!isFolder) {
      isRoute =
        entry.path.includes("/route.") ||
        entry.path.includes("/api/") ||
        (entry.path.includes("/app/") && (itemName === "page.tsx" || itemName === "page.ts" || itemName === "page.jsx" || itemName === "page.js")) ||
        entry.path.includes("/pages/") ||
        !!itemName.match(/^route\.(ts|tsx|js|jsx)$/);

      isImportant =
        entry.complexity === "red" ||
        entry.complexity === "yellow" ||
        itemName === "package.json" ||
        itemName === "tsconfig.json" ||
        itemName === "next.config.js" ||
        itemName === "next.config.ts" ||
        itemName === "tailwind.config.js" ||
        itemName === "tailwind.config.ts" ||
        itemName === "README.md" ||
        itemName === ".env.example";
    }

    let currentPath = "";
    let currentLevel = tree;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      currentPath = currentPath ? `${currentPath}/${part}` : part;

      if (!pathMap.has(currentPath)) {
        const folder: FileTreeItem = {
          name: part,
          path: currentPath,
          type: "folder",
          children: [],
        };
        pathMap.set(currentPath, folder);
        currentLevel.push(folder);
        currentLevel = folder.children!;
      } else {
        const folder = pathMap.get(currentPath)!;
        currentLevel = folder.children!;
      }
    }

    if (isFolder) {
      if (!pathMap.has(entry.path)) {
        const folder: FileTreeItem = {
          name: itemName,
          path: entry.path,
          type: "folder",
          children: [],
        };
        pathMap.set(entry.path, folder);
        currentLevel.push(folder);
      }
    } else {
      const existingFile = currentLevel.find(
        (item) => item.path === entry.path && item.type === "file",
      );
      if (!existingFile) {
        currentLevel.push({
          name: itemName,
          path: entry.path,
          type: "file",
          complexity: entry.complexity,
          language: entry.language,
          isRoute,
          isImportant,
        });
      }
    }
  }

  return tree;
}

const FileTreeItem = memo(
  ({
    item,
    level = 0,
    selectedPath,
    expandedFolders,
    onToggleFolder,
    onSelectFile,
  }: {
    item: FileTreeItem;
    level?: number;
    selectedPath: string | null;
    expandedFolders: Set<string>;
    onToggleFolder: (path: string) => void;
    onSelectFile: (path: string) => void;
  }) => {
    const isExpanded = expandedFolders.has(item.path);
    const isFolder = item.type === "folder";

    const dotColor =
      item.complexity === "red"
        ? "#c0392b"
        : item.complexity === "yellow"
          ? "#d4af37"
          : "#22c55e";

    if (isFolder) {
      return (
        <>
          <li
            className="flex items-center gap-1.5 rounded-lg px-2 py-1 cursor-pointer hover:bg-fg/5 transition-colors"
            style={{ paddingLeft: `${0.5 + level * 0.75}rem` }}
            onClick={() => onToggleFolder(item.path)}
          >
            {isExpanded ? (
              <ChevronDown className="h-3 w-3 text-fg/30 flex-shrink-0" />
            ) : (
              <ChevronRight className="h-3 w-3 text-fg/30 flex-shrink-0" />
            )}
            <Folder className="h-3.5 w-3.5 text-tomato-jam/60 flex-shrink-0" />
            <span className="truncate font-mono text-[11px] text-fg/70">{item.name}</span>
          </li>
          {isExpanded &&
            item.children?.map((child, index) => (
              <FileTreeItem
                key={`${child.path}-${child.type}-${index}`}
                item={child}
                level={level + 1}
                selectedPath={selectedPath}
                expandedFolders={expandedFolders}
                onToggleFolder={onToggleFolder}
                onSelectFile={onSelectFile}
              />
            ))}
        </>
      );
    }

    const fileIsSelected = selectedPath === item.path;

    return (
      <li
        className={`flex items-center gap-1.5 rounded-lg px-2 py-1 cursor-pointer transition-colors ${
          fileIsSelected
            ? "bg-tomato-jam/15 border-l-2 border-tomato-jam"
            : "hover:bg-fg/5"
        }`}
        style={{ paddingLeft: `${0.5 + level * 0.75}rem` }}
        onClick={() => onSelectFile(item.path)}
      >
        <div className="h-3.5 w-3.5 flex-shrink-0 flex items-center justify-center">
          {item.isRoute ? (
            <Route className="h-3 w-3 text-metallic-gold" />
          ) : (
            <File className="h-3 w-3 text-fg/30" />
          )}
        </div>
        <span
          className={`truncate font-mono text-[11px] flex-1 ${
            fileIsSelected ? "text-tomato-jam font-medium" : "text-fg/70"
          }`}
        >
          {item.name}
        </span>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {item.isImportant && (
            <Zap className="h-2.5 w-2.5 text-metallic-gold" fill="currentColor" />
          )}
          {item.complexity && (
            <span
              className="h-2 w-2 rounded-full"
              style={{
                background: dotColor,
                boxShadow: `${dotColor}80 0 0 4px`,
              }}
            />
          )}
        </div>
      </li>
    );
  },
);

FileTreeItem.displayName = "FileTreeItem";

export function DeepDiveExplorer() {
  const { analysis } = useRepoContext();
  const { setCurrentFile } = useFileContext();

  const fileTree = useMemo(() => {
    if (analysis?.fullFileTree && analysis.fullFileTree.length > 0) {
      return analysis.fullFileTree;
    }
    return (analysis?.sampleFileTree ?? []).map((file) => ({
      path: file.path,
      type: "file" as const,
      language: file.language,
      complexity: file.complexity,
    }));
  }, [analysis?.fullFileTree, analysis?.sampleFileTree]);

  const [selectedPath, setSelectedPath] = useState<string | null>(
    fileTree.find((f) => f.type === "file")?.path ?? null,
  );
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

  const treeStructure = useMemo(() => buildFileTree(fileTree), [fileTree]);

  useEffect(() => {
    if (!selectedPath) return;
    const parts = selectedPath.split("/");
    parts.pop();
    const pathsToExpand = new Set<string>();
    let currentPath = "";
    for (const part of parts) {
      currentPath = currentPath ? `${currentPath}/${part}` : part;
      pathsToExpand.add(currentPath);
    }
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      pathsToExpand.forEach((path) => next.add(path));
      return next;
    });
  }, [selectedPath]);

  const handleFileSelect = useCallback((path: string) => {
    setError(null);
    setLoading(false);
    setSelectedPath(path);
  }, []);

  const handleToggleFolder = useCallback((path: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  }, []);

  const defaultEditorValue = useMemo(
    () =>
      analysis?.sampleCode ||
      `// Deep Dive Explorer\n// Paste a GitHub URL on the home screen to see real repo context here.\n`,
    [analysis?.sampleCode],
  );

  const [editorValue, setEditorValue] = useState(defaultEditorValue);
  const [summary, setSummary] = useState<string>(
    "Select a file to see an explanation of its role in the repo.",
  );
  const [mermaid, setMermaid] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fullScreen, setFullScreen] = useState(false);

  const [cache, setCache] = useState<
    Record<string, { code: string; summary: string; mermaid: string | null }>
  >({});
  const activeRequest = useRef<AbortController | null>(null);
  const activeFileFetch = useRef<AbortController | null>(null);

  useEffect(() => {
    const lastApiKeyChange = localStorage.getItem("lastApiKeyChange");
    if (lastApiKeyChange && Date.now() - parseInt(lastApiKeyChange) < 60000) {
      setCache({});
      localStorage.removeItem("lastApiKeyChange");
    }
  }, []);

  const owner = analysis?.owner ?? "";
  const name = analysis?.name ?? "";
  const showGenerateCta = Boolean(selectedPath && !loading && !error && !cache[selectedPath]);
  const canGenerate = Boolean(owner && name && selectedPath);

  useEffect(
    () => () => {
      activeRequest.current?.abort();
      activeFileFetch.current?.abort();
    },
    [],
  );

  useEffect(() => {
    if (!selectedPath) {
      setCurrentFile(null);
      setSummary("Select a file to see an explanation of its role in the repo.");
      setMermaid(null);
      setError(null);
      setLoading(false);
      setEditorValue(defaultEditorValue);
      return;
    }

    const cached = cache[selectedPath];
    if (cached) {
      setEditorValue(cached.code);
      setSummary(typeof cached.summary === "string" ? cached.summary : String(cached.summary || ""));
      setMermaid(cached.mermaid);
      setError(null);
      setCurrentFile({
        path: selectedPath,
        content: cached.code,
        language: selectedPath.split(".").pop() || undefined,
      });
      return;
    }

    if (owner && name && selectedPath) {
      activeFileFetch.current?.abort();
      const controller = new AbortController();
      activeFileFetch.current = controller;

      setLoading(true);
      setError(null);
      setSummary('Loading file content...');
      setMermaid(null);

      fetch(`https://raw.githubusercontent.com/${owner}/${name}/HEAD/${selectedPath}`, {
        headers: { "User-Agent": "gitlore" },
        signal: controller.signal,
      })
        .then(async (res) => {
          if (controller.signal.aborted) return;
          if (!res.ok) {
            throw new Error(`Failed to fetch file: ${selectedPath}`);
          }
          const fileContent: string = await res.text();

          if (controller.signal.aborted) return;

          const codePayload: string =
            fileContent.length > 16000
              ? `${fileContent.slice(0, 16000)}\n// … truncated`
              : fileContent;

          setEditorValue(codePayload);
          setCurrentFile({
            path: selectedPath,
            content: codePayload,
            language: selectedPath.split(".").pop() || undefined,
          });
          setSummary('Click "Generate AI Insight" to analyze this file.');
          setError(null);
          setLoading(false);
        })
        .catch((err) => {
          if (controller.signal.aborted) return;
          const errorMessage = err instanceof Error ? err.message : "Failed to load file content.";
          setError(errorMessage);
          setLoading(false);
          setEditorValue(defaultEditorValue);
          setCurrentFile(null);
          setSummary('Click "Generate AI Insight" to analyze this file.');
        })
        .finally(() => {
          if (activeFileFetch.current === controller) {
            activeFileFetch.current = null;
          }
        });
    } else {
      setSummary('Click "Generate AI Insight" to analyze this file.');
      setMermaid(null);
      setError(null);
      setLoading(false);
      setCurrentFile(null);
      setEditorValue(defaultEditorValue);
    }
  }, [cache, defaultEditorValue, selectedPath, setCurrentFile, owner, name]);

  const handleGenerateSummary = useCallback(async () => {
    if (!selectedPath || !owner || !name) return;

    activeRequest.current?.abort();
    const controller = new AbortController();
    activeRequest.current = controller;

    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/file-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          owner,
          name,
          path: selectedPath,
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));

        if (res.status === 429) {
          const retryAfter = data.retryAfter || 60;
          throw new Error(
            `Rate limit exceeded. ` +
              `Please wait ${retryAfter} seconds or try again later.`,
          );
        }
        throw new Error(data.error || "Failed to load file summary.");
      }

      const data = await res.json();
      window.dispatchEvent(new CustomEvent("usage-updated"));

      const cleanMermaid = cleanMermaidCode((data.mermaid ?? null) as string | null);

      const next = {
        code: data.code as string,
        summary: typeof data.summary === "string" ? data.summary : String(data.summary || ""),
        mermaid: cleanMermaid,
      };

      setEditorValue(next.code);
      setSummary(next.summary);
      setMermaid(next.mermaid);
      setCache((prev) => {
        const newCache = { ...prev };
        if (selectedPath) {
          newCache[selectedPath] = next;
        }
        return newCache;
      });
      setError(null);
      setCurrentFile({
        path: selectedPath,
        content: next.code,
        language: selectedPath.split(".").pop() || undefined,
      });
    } catch (err: unknown) {
      if (controller.signal.aborted) return;
      const message = err instanceof Error ? err.message : "Unexpected error loading file.";
      setError(message);
    } finally {
      if (activeRequest.current === controller) {
        activeRequest.current = null;
      }
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  }, [name, owner, selectedPath, setCurrentFile]);

  return (
    <main className="flex h-screen flex-col overflow-hidden">

      {/* ── Three-panel workbench ── */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <PanelGroup
          direction="horizontal"
          className="gf-card flex h-full w-full overflow-hidden border border-fg/10 bg-canvas/90 m-2"
        >
          {/* ── Panel 1: File tree ── */}
          <Panel defaultSize={22} minSize={16} className="border-r border-fg/8">
            <aside className="flex h-full flex-col bg-canvas/90 min-h-0">
              <header className="border-b border-fg/8 px-3 py-2.5 flex-shrink-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-fg/40">
                  Files
                </p>
              </header>
              <div className="flex-1 min-h-0 overflow-y-auto px-2 py-2.5 text-xs transform-gpu scrollbar-thin">
                <ul className="space-y-0.5">
                  {treeStructure.map((item, index) => (
                    <FileTreeItem
                      key={`${item.path}-${item.type}-${index}`}
                      item={item}
                      selectedPath={selectedPath}
                      expandedFolders={expandedFolders}
                      onToggleFolder={handleToggleFolder}
                      onSelectFile={handleFileSelect}
                    />
                  ))}
                </ul>
              </div>
            </aside>
          </Panel>

          <PanelResizeHandle className="w-[1px] bg-gradient-to-b from-tomato-jam/50 via-fg/10 to-metallic-gold/50" />

          {/* ── Panel 2: Monaco Editor ── */}
          <Panel defaultSize={40} minSize={28} className="border-r border-fg/8">
            <section className="flex h-full flex-col bg-canvas/90 min-h-0">
              <header className="border-b border-fg/8 px-3 py-2.5 flex-shrink-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-fg/40">
                  Code
                </p>
                <p className="text-[11px] text-fg/25">
                  Loaded directly from GitHub for the analyzed repository.
                </p>
              </header>
              <div className="flex-1 min-h-0 overflow-hidden">
                <Editor
                  theme="vs-dark"
                  defaultLanguage="typescript"
                  options={{
                    readOnly: true,
                    fontLigatures: true,
                    fontSize: 13,
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false,
                    smoothScrolling: false,
                    renderWhitespace: "none",
                    renderLineHighlight: "none",
                    codeLens: false,
                  }}
                  value={editorValue}
                  loading={<div className="text-fg/40">Loading editor...</div>}
                />
              </div>
            </section>
          </Panel>

          <PanelResizeHandle className="w-[1px] bg-gradient-to-b from-metallic-gold/50 via-fg/10 to-tomato-jam/50" />

          {/* ── Panel 3: Narrator ── */}
          <Panel defaultSize={38} minSize={26}>
            <section className="flex h-full flex-col bg-canvas/90 min-h-0">
              <header className="border-b border-fg/8 px-3 py-2.5 flex-shrink-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-fg/40">
                  The Narrator
                </p>
                <p className="text-[11px] text-fg/25">
                  Context-aware summaries and sequence diagrams.
                </p>
              </header>
              <div className="grid flex-1 min-h-0 grid-rows-[minmax(0,0.55fr)_minmax(0,0.45fr)] gap-2.5 p-2.5">

                {/* File summary sub-panel */}
                <motion.div
                  className="gf-card relative flex flex-col overflow-hidden border border-tomato-jam/20 bg-canvas/90 px-3 py-2 text-[11px] min-h-0"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-tomato-jam flex-shrink-0">
                    File summary
                  </p>
                  <div className="mt-1 flex-1 min-h-0 overflow-y-auto pr-1 text-fg/80 text-[11px] markdown-body transform-gpu scrollbar-thin">
                    {loading ? (
                      <span className="text-fg/40">Analyzing file with Claude…</span>
                    ) : error ? (
                      <div className="rounded-xl border border-tomato-jam/30 bg-tomato-jam/5 p-2 text-tomato-jam/80">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <p className="font-medium">Error loading summary</p>
                          <button
                            onClick={() => {
                              setError(null);
                              setCache((prev) => {
                                const next = { ...prev };
                                if (selectedPath) {
                                  delete next[selectedPath];
                                }
                                return next;
                              });
                              void handleGenerateSummary();
                            }}
                            className="text-[10px] px-2 py-0.5 rounded border border-tomato-jam/40 hover:bg-tomato-jam/10 transition-colors"
                          >
                            Retry
                          </button>
                        </div>
                        <p className="text-[10px] text-tomato-jam/60 whitespace-pre-wrap">{error}</p>
                        {error.includes("rate limit") && (
                          <p className="text-[10px] text-fg/30 mt-2 italic">
                            Note: The free tier limit is per API key. If you changed your API key, the new key may also be on a restricted quota tier.
                          </p>
                        )}
                      </div>
                    ) : (
                      <>
                        {showGenerateCta && (
                          <button
                            type="button"
                            onClick={() => handleGenerateSummary()}
                            disabled={!canGenerate}
                            className="mb-2 inline-flex items-center gap-1 rounded-lg border border-tomato-jam/30 bg-tomato-jam/8 px-2 py-1 text-[10px] font-medium text-fg transition-colors hover:bg-tomato-jam/15 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            <Sparkles className="h-3 w-3" />
                            Generate AI Insight
                          </button>
                        )}
                        <ReactMarkdown>
                          {typeof summary === "string" ? summary : String(summary || "")}
                        </ReactMarkdown>
                      </>
                    )}
                  </div>
                </motion.div>

                {/* Diagram sub-panel */}
                <div className="gf-card relative flex flex-col overflow-hidden border border-metallic-gold/20 bg-canvas/90 px-3 py-3 text-xs min-h-0">
                  <div className="mb-1 flex items-center justify-between gap-2 flex-shrink-0">
                    <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-metallic-gold">
                      Sequence / architecture diagram
                    </p>
                    <button
                      type="button"
                      onClick={() => setFullScreen(true)}
                      className="rounded-full border border-metallic-gold/40 px-2 py-0.5 text-[10px] font-medium text-metallic-gold/80 hover:bg-metallic-gold/8 transition-colors"
                    >
                      Full screen
                    </button>
                  </div>
                  <div
                    className="mt-1 flex-1 min-h-0 overflow-auto"
                    style={{ willChange: "scroll-position", transform: "translateZ(0)" }}
                  >
                    {loading && !mermaid ? (
                      <div className="flex h-full items-center justify-center text-[11px] text-fg/40">
                        Generating flow chart with Claude…
                      </div>
                    ) : mermaid && mermaid.trim() ? (
                      <div style={{ willChange: "transform", transform: "translateZ(0)", minHeight: "100%" }}>
                        <MermaidDiagram
                          key={`workbench-${selectedPath}-${mermaid?.slice(0, 50)}`}
                          code={mermaid}
                          id="mermaid-panel"
                        />
                      </div>
                    ) : selectedPath ? (
                      <div className="flex h-full items-center justify-center text-[11px] text-fg/40">
                        <div className="text-center">
                          <p>
                            {showGenerateCta
                              ? 'Click "Generate AI Insight" to request a diagram for this file.'
                              : "No diagram available for this file."}
                          </p>
                          {!showGenerateCta && (
                            <p className="text-[10px] text-fg/25 mt-1">
                              Claude did not generate a diagram for this file.
                            </p>
                          )}
                        </div>
                      </div>
                    ) : (
                      <ReactFlow
                        nodes={initialNodes}
                        edges={initialEdges}
                        fitView
                        nodesDraggable={false}
                        nodesConnectable={false}
                        elementsSelectable={false}
                        panOnDrag={false}
                        zoomOnScroll={false}
                        zoomOnPinch={false}
                      >
                        <Background
                          color="rgba(148,163,184,0.3)"
                          gap={16}
                          size={0.75}
                        />
                      </ReactFlow>
                    )}
                  </div>
                </div>
              </div>
            </section>
          </Panel>
        </PanelGroup>
      </div>

      {/* ── Fullscreen diagram modal ── */}
      <AnimatePresence>
        {fullScreen && (
          <>
            <motion.div
              key="dde-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setFullScreen(false)}
              className="fixed inset-0 z-[49] bg-canvas/80 backdrop-blur-xl"
              aria-hidden
            />
            <motion.div
              key="dde-panel"
              initial={{ opacity: 0, scale: 0.96, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 16 }}
              transition={{ duration: 0.28, ease: [0, 0, 0.2, 1] }}
              className="fixed inset-0 z-50 flex items-center justify-center p-6"
            >
              <div className="relative h-[80vh] w-full max-w-5xl rounded-3xl border border-metallic-gold/40 bg-canvas/95 p-4 shadow-2xl shadow-metallic-gold/20">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-metallic-gold">
                    Sequence / architecture diagram – full screen
                  </p>
                  <button
                    type="button"
                    onClick={() => setFullScreen(false)}
                    className="rounded-xl bg-fg/5 px-3 py-1 text-xs text-fg/70 hover:bg-fg/10 gf-transition-fast"
                  >
                    Close
                  </button>
                </div>
                <div
                  className="h-[calc(100%-2.5rem)] w-full overflow-auto rounded-2xl bg-canvas/90 p-3"
                  style={{ willChange: "scroll-position", transform: "translateZ(0)" }}
                >
                  {loading && !mermaid ? (
                    <div className="flex h-full items-center justify-center text-xs text-fg/40">
                      Generating flow chart with Claude…
                    </div>
                  ) : mermaid ? (
                    <div style={{ willChange: "transform", transform: "translateZ(0)", minHeight: "100%" }}>
                      <MermaidDiagram
                        key={`fullscreen-${mermaid?.slice(0, 50)}`}
                        code={mermaid}
                        id="mermaid-fullscreen"
                      />
                    </div>
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs text-fg/40">
                      No Mermaid diagram available for this file.
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </main>
  );
}
