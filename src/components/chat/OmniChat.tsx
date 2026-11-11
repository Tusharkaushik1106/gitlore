"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Send, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import type { NarrationMessage } from "@/lib/types";
import { useRepoContext } from "@/context/RepoContext";
import { useFileContext } from "@/context/FileContext";

export function OmniChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<NarrationMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { analysis } = useRepoContext();
  const { currentFile } = useFileContext();

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingContent, scrollToBottom]);

  // Close panel on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const content = draft.trim();
    if (!content || sending) return;

    const userMessage: NarrationMessage = {
      id: `${Date.now()}-user`,
      role: "user",
      content,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setDraft("");
    setSending(true);
    setStreamingContent("");

    try {
      const context = currentFile?.path
        ? {
            type: "file" as const,
            path: currentFile.path,
            language: currentFile.language,
          }
        : undefined;

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: content,
          repoId:
            analysis && analysis.owner && analysis.name
              ? `${analysis.owner}/${analysis.name}`
              : undefined,
          context,
          fileContent: currentFile?.content || undefined,
        }),
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      window.dispatchEvent(new CustomEvent("usage-updated"));

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let accumulatedText = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          accumulatedText += chunk;
          setStreamingContent(accumulatedText);
        }
      }

      const assistantMessage: NarrationMessage = {
        id: `${Date.now()}-assistant`,
        role: "assistant",
        content: accumulatedText,
        createdAt: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setStreamingContent("");
    } catch (error) {
      const errorMessage: NarrationMessage = {
        id: `${Date.now()}-assistant-error`,
        role: "assistant",
        content:
          error instanceof Error
            ? `Error: ${error.message}`
            : "I couldn't reach the chat API. Please check your network and ANTHROPIC_API_KEY configuration.",
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setSending(false);
      setStreamingContent("");
    }
  };

  return (
    <>
      {/* Floating action button */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-5 right-5 z-[9999] inline-flex h-12 w-12 items-center justify-center rounded-full bg-tomato-jam text-fg shadow-lg shadow-tomato-jam/40 focus:outline-none transform-gpu transition-transform hover:scale-105 active:scale-95"
        style={{ position: "fixed" }}
      >
        <MessageCircle className="h-5 w-5" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.section
            className="fixed bottom-20 right-5 z-40 w-[420px] max-w-[calc(100vw-2.5rem)] rounded-2xl border border-fg/10 bg-canvas/95 p-4 shadow-2xl shadow-black/80 backdrop-blur-xl"
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.96 }}
            transition={{ duration: 0.25, ease: [0, 0, 0.2, 1] }}
          >
            {/* Header */}
            <header className="mb-3 flex items-center justify-between gap-2 border-b border-fg/8 pb-2">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-tomato-jam">
                  gitlore Chat
                </p>
                <p className="text-[11px] text-fg/40 mt-0.5 truncate">
                  {currentFile?.path
                    ? `Context: ${currentFile.path}`
                    : "Ask about files, flows, or architecture"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-fg/5 text-fg/50 transition-colors hover:bg-fg/10 hover:text-fg"
              >
                <X className="h-4 w-4" />
              </button>
            </header>

            {/* Messages */}
            <div className="mb-3 max-h-[400px] space-y-3 overflow-y-auto rounded-xl bg-canvas/60 p-3 scrollbar-thin scrollbar-thumb-fg scrollbar-track-transparent transform-gpu">
              {messages.length === 0 && !streamingContent && (
                <div className="space-y-2 text-xs text-fg/40">
                  <p className="font-medium text-fg/60">Try asking:</p>
                  <ul className="space-y-1.5 pl-4 list-disc">
                    <li>&ldquo;Explain the authentication flow&rdquo;</li>
                    <li>&ldquo;How does this file work?&rdquo;</li>
                    <li>&ldquo;What are the main components?&rdquo;</li>
                  </ul>
                  {currentFile?.path && (
                    <p className="mt-3 pt-3 border-t border-fg/8 text-tomato-jam/80">
                      💡 I can see you&apos;re viewing:{" "}
                      <code className="text-[10px] bg-canvas px-1.5 py-0.5 rounded text-fg/70">
                        {currentFile.path}
                      </code>
                    </p>
                  )}
                </div>
              )}

              {messages.map((m) => (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={
                    m.role === "user"
                      ? "ml-auto max-w-[85%] rounded-xl bg-tomato-jam/15 border border-tomato-jam/25 px-3 py-2 text-left"
                      : "mr-auto max-w-[85%] rounded-xl bg-fg/[0.03] border border-fg/10 px-3 py-2 text-left"
                  }
                >
                  {m.role === "user" ? (
                    <p className="text-xs text-fg whitespace-pre-wrap break-words">
                      {m.content}
                    </p>
                  ) : (
                    <div className="text-xs text-fg/80 prose prose-invert prose-sm max-w-none">
                      <ReactMarkdown
                        components={{
                          p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
                          h1: ({ children }) => <h1 className="text-sm font-semibold mb-2 text-tomato-jam">{children}</h1>,
                          h2: ({ children }) => <h2 className="text-xs font-semibold mb-1.5 mt-3 text-tomato-jam">{children}</h2>,
                          h3: ({ children }) => <h3 className="text-xs font-medium mb-1 mt-2 text-metallic-gold">{children}</h3>,
                          ul: ({ children }) => <ul className="list-disc pl-4 mb-2 space-y-1">{children}</ul>,
                          ol: ({ children }) => <ol className="list-decimal pl-4 mb-2 space-y-1">{children}</ol>,
                          li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                          code: ({ children, className }) => {
                            const isInline = !className;
                            return isInline ? (
                              <code className="bg-canvas/60 text-tomato-jam px-1.5 py-0.5 rounded text-[10px] font-mono">
                                {children}
                              </code>
                            ) : (
                              <code className="block bg-canvas p-2 rounded-lg text-[10px] font-mono text-fg/70 overflow-x-auto my-2">
                                {children}
                              </code>
                            );
                          },
                          pre: ({ children }) => (
                            <pre className="bg-canvas p-2 rounded-lg text-[10px] font-mono text-fg/70 overflow-x-auto my-2">
                              {children}
                            </pre>
                          ),
                          strong: ({ children }) => <strong className="font-semibold text-fg">{children}</strong>,
                          em: ({ children }) => <em className="italic text-fg/70">{children}</em>,
                          blockquote: ({ children }) => (
                            <blockquote className="border-l-2 border-tomato-jam/40 pl-3 my-2 italic text-fg/60">
                              {children}
                            </blockquote>
                          ),
                        }}
                      >
                        {m.content}
                      </ReactMarkdown>
                    </div>
                  )}
                </motion.div>
              ))}

              {streamingContent && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mr-auto max-w-[85%] rounded-xl bg-fg/[0.03] border border-fg/10 px-3 py-2 text-left"
                >
                  <div className="text-xs text-fg/80 prose prose-invert prose-sm max-w-none">
                    <ReactMarkdown
                      components={{
                        p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
                        code: ({ children }) => (
                          <code className="bg-canvas/60 text-tomato-jam px-1.5 py-0.5 rounded text-[10px] font-mono">
                            {children}
                          </code>
                        ),
                      }}
                    >
                      {streamingContent}
                    </ReactMarkdown>
                  </div>
                  <span className="inline-block w-2 h-3 bg-tomato-jam animate-pulse ml-1" />
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSend} className="flex items-center gap-2">
              <input
                className="flex-1 rounded-lg bg-canvas/90 px-3 py-2 text-xs text-fg placeholder:text-fg/25 outline-none focus:ring-2 focus:ring-tomato-jam/40 transition-all"
                placeholder="Ask about the code..."
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                disabled={sending}
              />
              <button
                type="submit"
                disabled={sending || !draft.trim()}
                className="inline-flex items-center justify-center rounded-lg bg-tomato-jam px-3 py-2 text-xs font-medium text-fg transition-all hover:bg-tomato-jam/80 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Send className="h-3.5 w-3.5" />
                )}
              </button>
            </form>
          </motion.section>
        )}
      </AnimatePresence>
    </>
  );
}
