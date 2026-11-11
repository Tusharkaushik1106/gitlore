export type DiagramPayload = {
  overview: string;
  architecture: string;
  keyComponents: string[];
  dataFlow: string;
  techStack: string[];
  dependencies: string[];
  mermaidArchitecture: string;
  mermaidDataFlow: string;
};

const diagramCache = new Map<string, DiagramPayload>();

export function getCachedDiagram(key: string): DiagramPayload | undefined {
  return diagramCache.get(key);
}

const DIAGRAM_CACHE_MAX = 200;

export function setCachedDiagram(key: string, payload: DiagramPayload): void {
  // Drop the oldest entry once full so memory use stays bounded.
  if (!diagramCache.has(key) && diagramCache.size >= DIAGRAM_CACHE_MAX) {
    diagramCache.delete(diagramCache.keys().next().value as string);
  }
  diagramCache.set(key, payload);
}

