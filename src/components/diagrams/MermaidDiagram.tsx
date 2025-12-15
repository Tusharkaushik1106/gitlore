"use client";

import { useEffect, useRef, useState } from "react";
import mermaid from "mermaid";

mermaid.initialize({
  startOnLoad: false,
  theme: "dark",
  securityLevel: "loose",
  fontFamily: "inherit",
  fontSize: 14,
  logLevel: "error",
});

interface MermaidDiagramProps {
  code: string;
  id?: string;
}

function sanitizeMermaidCode(code: string): string {
  let cleaned = code.trim();
  
  if (!cleaned) return "";
  
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```[a-zA-Z]*\s*/, "").replace(/```$/gm, "").trim();
  }
  
  cleaned = cleaned
    .replace(/^["']|["']$/g, "")
    .replace(/\\n/g, "\n")
    .replace(/\\"/g, '"')
    .replace(/\\'/g, "'")
    .trim();
  
  const validStarts = [
    "sequenceDiagram",
    "flowchart",
    "graph",
    "classDiagram",
    "stateDiagram",
    "erDiagram",
    "journey",
    "gantt",
    "pie",
    "gitgraph",
  ];
  
  const firstLine = cleaned.split("\n")[0].trim();
  const isValid = validStarts.some((start) => firstLine.startsWith(start));
  
  if (!isValid) {
    if (cleaned.includes("->") || cleaned.includes("-->") || cleaned.includes("participant") || cleaned.includes("->>")) {
      cleaned = `sequenceDiagram\n${cleaned}`;
    } else if (
      cleaned.includes("Node") || 
      cleaned.includes("Start") || 
      cleaned.includes("End") ||
      cleaned.includes("[") ||
      cleaned.includes("-->") ||
      cleaned.match(/[A-Z]\[/)
    ) {
      cleaned = `flowchart TD\n${cleaned}`;
    } else if (cleaned.includes("class ") || cleaned.includes("Class")) {
      cleaned = `classDiagram\n${cleaned}`;
    } else {
      cleaned = `flowchart TD\n${cleaned}`;
    }
  }
  
  if (cleaned.startsWith("flowchart") || cleaned.startsWith("graph")) {
    const lines = cleaned.split("\n");
    const fixedLines = lines.map((line) => {
      let fixed = line.trim();
      if (!fixed || fixed.startsWith("//")) return fixed;
      
      fixed = fixed.replace(/[^\x20-\x7E\n]/g, "");
      
      if (fixed.match(/-->\s*"[^"]*$/)) {
        fixed = fixed + '"';
      }
      
      if (fixed.match(/^[A-Z]\w*\["[^"]*$/)) {
        fixed = fixed + '"]';
      }
      
      if (fixed.match(/^[A-Z]\w*\["[^"]*"$/)) {
        fixed = fixed + "]";
      }
      
      if (fixed.startsWith('"') && !fixed.endsWith('"') && !fixed.includes('"', 1)) {
        const arrowIndex = fixed.indexOf(" -->");
        if (arrowIndex > 0) {
          fixed = fixed.slice(0, arrowIndex) + '"' + fixed.slice(arrowIndex);
        } else {
          fixed = fixed + '"';
        }
      }
      
      fixed = fixed.replace(/([A-Z]\w*)\[([^\]]+)\]/g, (match, nodeId, label) => {
        let cleanLabel = label.replace(/^["']|["']$/g, "").trim();
        cleanLabel = cleanLabel.replace(/[^\x20-\x7E]/g, "");
        
        if (cleanLabel.length === 0) {
          return `${nodeId}["${nodeId}"]`;
        }
        
        const escapedLabel = cleanLabel.replace(/"/g, '\\"').replace(/\n/g, " ").trim();
        return `${nodeId}["${escapedLabel}"]`;
      });
      
      fixed = fixed.replace(/([A-Z]\w*)\{([^}]+)\}/g, (match, nodeId, label) => {
        let cleanLabel = label.replace(/^["']|["']$/g, "").trim();
        cleanLabel = cleanLabel.replace(/[^\x20-\x7E]/g, "");
        
        if (cleanLabel.length === 0) {
          return `${nodeId}["${nodeId}"]`;
        }
        
        const escapedLabel = cleanLabel.replace(/"/g, '\\"').replace(/\n/g, " ").trim();
        return `${nodeId}["${escapedLabel}"]`;
      });
      
      fixed = fixed.replace(/--\s+([^->]+?)\s*-->/g, (match, label) => {
        const trimmedLabel = label.trim().replace(/^["']|["']$/g, "");
        const cleanLabel = trimmedLabel.replace(/[^\x20-\x7E]/g, "");
        if (cleanLabel && cleanLabel.length > 0) {
          const escapedLabel = cleanLabel.replace(/"/g, '\\"');
          return `-- "${escapedLabel}" -->`;
        }
        return match;
      });
      
      fixed = fixed.replace(/^([A-Z]\w*)\s*-->\s*"([^"]*)$/gm, (match, nodeId, label) => {
        const cleanLabel = label.replace(/[^\x20-\x7E]/g, "");
        return `${nodeId} --> "${cleanLabel}"`;
      });
      
      fixed = fixed.replace(/"([^"]+)"\s*-->\s*"([^"]+)"/g, (match, from, to) => {
        const cleanFrom = from.replace(/[^\x20-\x7E]/g, "");
        const cleanTo = to.replace(/[^\x20-\x7E]/g, "");
        return `"${cleanFrom}" --> "${cleanTo}"`;
      });
      
      fixed = fixed.replace(/;\s*$/gm, "");
      fixed = fixed.replace(/\s*-->\s*/g, " --> ");
      fixed = fixed.replace(/\s*--\s+/g, " -- ");
      
      if (fixed.match(/^[A-Z]\w*\s*-->\s*[A-Z]\w*$/)) {
        return fixed;
      }
      
      if (fixed.includes("-->") && !fixed.match(/["\[]/)) {
        const parts = fixed.split("-->");
        if (parts.length === 2) {
          const from = parts[0].trim();
          const to = parts[1].trim();
          if (from.match(/^[A-Z]\w*$/) && to.match(/^[A-Z]\w*$/)) {
            return fixed;
          }
          if (from.match(/^[A-Z]\w*$/) && !to.match(/^[A-Z]\w*$/)) {
            const cleanTo = to.replace(/[^\x20-\x7E]/g, "").trim();
            return `${from} --> "${cleanTo}"`;
          }
        }
      }
      
      return fixed;
    });
    
    cleaned = fixedLines.filter(line => line.trim() && !line.startsWith("//")).join("\n");
    
    const nodeIds = new Set<string>();
    const diagramLines = cleaned.split("\n").slice(1);
    diagramLines.forEach(line => {
      const nodeMatch = line.match(/^([A-Z]\w*)\[/);
      if (nodeMatch) {
        nodeIds.add(nodeMatch[1]);
      }
      const arrowMatch = line.match(/([A-Z]\w*)\s*-->/);
      if (arrowMatch) {
        nodeIds.add(arrowMatch[1]);
      }
      const arrowToMatch = line.match(/-->\s*([A-Z]\w*)/);
      if (arrowToMatch) {
        nodeIds.add(arrowToMatch[1]);
      }
    });
    
    diagramLines.forEach((line, index) => {
      const arrowMatch = line.match(/-->\s*([A-Z]\w*)(?:\s|$)/);
      if (arrowMatch && !nodeIds.has(arrowMatch[1])) {
        const nodeId = arrowMatch[1];
        const nextLineIndex = index + 1;
        if (nextLineIndex < diagramLines.length) {
          diagramLines.splice(nextLineIndex, 0, `${nodeId}["${nodeId}"]`);
          nodeIds.add(nodeId);
        }
      }
    });
    
    const header = cleaned.split("\n")[0];
    cleaned = header + "\n" + diagramLines.filter(line => line.trim()).join("\n");
  }
  
  return cleaned;
}

function createFallbackDiagram(code: string): string {
  const lines = code.split("\n").filter(line => line.trim() && !line.startsWith("//"));
  
  if (lines.length === 0) {
    return 'flowchart TD\n  A["Empty Diagram"]';
  }
  
  const nodePattern = /([A-Z]\w*)\[/;
  const arrowPattern = /([A-Z]\w*)\s*-->\s*([A-Z]\w*)/;
  
  const nodes = new Set<string>();
  const edges: Array<[string, string]> = [];
  
  lines.forEach(line => {
    const nodeMatch = line.match(nodePattern);
    if (nodeMatch) {
      nodes.add(nodeMatch[1]);
    }
    
    const arrowMatch = line.match(arrowPattern);
    if (arrowMatch) {
      nodes.add(arrowMatch[1]);
      nodes.add(arrowMatch[2]);
      edges.push([arrowMatch[1], arrowMatch[2]]);
    }
  });
  
  if (nodes.size === 0) {
    return 'flowchart TD\n  A["Diagram"]';
  }
  
  const nodeArray = Array.from(nodes);
  const nodeDefs = nodeArray.map(node => `  ${node}["${node}"]`).join("\n");
  const edgeDefs = edges.map(([from, to]) => `  ${from} --> ${to}`).join("\n");
  
  if (edgeDefs) {
    return `flowchart TD\n${nodeDefs}\n${edgeDefs}`;
  }
  
  return `flowchart TD\n${nodeDefs}`;
}

export function MermaidDiagram({ code, id = "mermaid-diagram" }: MermaidDiagramProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [isRendering, setIsRendering] = useState(true);
  const renderedCodeRef = useRef<string>("");
  const isRenderingRef = useRef(false);

  useEffect(() => {
    if (!ref.current) return;
    
    const normalizedCode = code.trim().replace(/\s+/g, " ");
    const normalizedRendered = renderedCodeRef.current.trim().replace(/\s+/g, " ");
    
    if (normalizedRendered === normalizedCode && normalizedCode !== "") {
      return;
    }
    
    if (isRenderingRef.current) {
      return;
    }

    setIsRendering(true);
    isRenderingRef.current = true;
    
    const render = async () => {
      let cleaned = code.trim();
      
      if (!cleaned) {
        if (ref.current) {
          ref.current.innerHTML = "";
        }
        return;
      }
      
      try {
        cleaned = sanitizeMermaidCode(cleaned);
        
        if (!cleaned || cleaned.trim().length === 0) {
          throw new Error("Empty diagram after sanitization");
        }
        
        const uniqueId = `${id}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
        const { svg } = await mermaid.render(uniqueId, cleaned);
        
        if (ref.current && isRenderingRef.current) {
          ref.current.innerHTML = svg;
          const svgElement = ref.current.querySelector("svg");
          if (svgElement) {
            svgElement.style.willChange = "transform";
            svgElement.style.transform = "translateZ(0)";
            const elements = svgElement.querySelectorAll("path, text, rect, circle, ellipse, line, polygon, polyline");
            elements.forEach((el) => {
              (el as HTMLElement).style.willChange = "transform";
            });
          }
          renderedCodeRef.current = code.trim();
        }
      } catch (error) {
        try {
          const fallback = createFallbackDiagram(code);
          const uniqueId = `${id}-fallback-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
          const { svg } = await mermaid.render(uniqueId, fallback);
          
          if (ref.current && isRenderingRef.current) {
            ref.current.innerHTML = svg;
            const svgElement = ref.current.querySelector("svg");
            if (svgElement) {
              svgElement.style.willChange = "transform";
              svgElement.style.transform = "translateZ(0)";
            }
            renderedCodeRef.current = code.trim();
          }
        } catch (fallbackError) {
          if (ref.current && isRenderingRef.current) {
            const escapedCode = (cleaned || code)
              .replace(/&/g, "&amp;")
              .replace(/</g, "&lt;")
              .replace(/>/g, "&gt;")
              .replace(/"/g, "&quot;")
              .replace(/'/g, "&#039;");
            
            const errorHtml = `
              <div class="p-3 rounded-lg border border-amber-500/30 bg-amber-950/20">
                <p class="text-xs text-amber-400 font-medium mb-2">Diagram simplified due to syntax issues</p>
                <details class="text-xs">
                  <summary class="text-slate-400 cursor-pointer hover:text-slate-300 mb-1">View original code</summary>
                  <pre class="mt-2 p-2 bg-slate-900/50 rounded text-slate-300 text-[10px] overflow-auto max-h-32 whitespace-pre-wrap">${escapedCode}</pre>
                </details>
              </div>
            `;
            ref.current.innerHTML = errorHtml;
          }
        }
        
        if (process.env.NODE_ENV === "development") {
          console.warn("Mermaid render error:", error);
          console.warn("Mermaid code that failed:", cleaned);
        }
      } finally {
        isRenderingRef.current = false;
        setIsRendering(false);
      }
    };

    render();
    
    return () => {
      isRenderingRef.current = false;
    };
  }, [code, id]);

  return (
    <div
      ref={ref}
      className="w-full text-slate-100"
      style={{
        willChange: "transform",
        transform: "translateZ(0)",
        backfaceVisibility: "hidden",
        WebkitBackfaceVisibility: "hidden",
        perspective: "1000px",
      }}
    />
  );
}
