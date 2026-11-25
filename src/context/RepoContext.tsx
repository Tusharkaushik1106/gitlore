"use client";

import { createContext, useContext, useState, ReactNode } from "react";

export interface StackRadarPoint {
  subject: string;
  value: number;
}

export interface HotspotEntry {
  path: string;
  complexity: number;
}

export interface RepoAnalysis {
  repoId: string;
  repoUrl: string;
  owner: string;
  name: string;
  elevatorPitch: string;
  stackRadar: StackRadarPoint[];
  hotspots: HotspotEntry[];
  insights?: {
    totalFiles: number;
    sourceFiles: number;
    testFiles: number;
    languages: { name: string; share: number }[];
    topFolders: { name: string; files: number }[];
  };
  sampleFileTree: { path: string; language: string; complexity: "green" | "yellow" | "red" }[];
  fullFileTree?: Array<{
    path: string;
    type: "file" | "folder";
    language: string;
    complexity: "green" | "yellow" | "red";
  }>;
  sampleCode: string;
}

type AnalysisStatus = "idle" | "running" | "done" | "error";

interface RepoContextValue {
  analysis?: RepoAnalysis;
  status: AnalysisStatus;
  error?: string;
  startAnalysis: (repoUrl: string) => void;
  finishAnalysis: (analysis: RepoAnalysis) => void;
  failAnalysis: (message: string) => void;
}

const RepoContext = createContext<RepoContextValue | undefined>(undefined);

export function RepoProvider({ children }: { children: ReactNode }) {
  const [analysis, setAnalysis] = useState<RepoAnalysis>();
  const [status, setStatus] = useState<AnalysisStatus>("idle");
  const [error, setError] = useState<string>();

  const value: RepoContextValue = {
    analysis,
    status,
    error,
    startAnalysis: (repoUrl) => {
      setStatus("running");
      setError(undefined);
      setAnalysis((prev) =>
        prev
          ? {
              ...prev,
              repoUrl,
              repoId: prev.repoId,
            }
          : {
              repoId: "",
              repoUrl,
              owner: "",
              name: "",
              elevatorPitch: "",
              stackRadar: [],
              hotspots: [],
              sampleFileTree: [],
              fullFileTree: [],
              sampleCode: "",
            },
      );
    },
    finishAnalysis: (next) => {
      setAnalysis(next);
      setStatus("done");
    },
    failAnalysis: (message) => {
      setError(message);
      setStatus("error");
    },
  };

  return <RepoContext.Provider value={value}>{children}</RepoContext.Provider>;
}

export function useRepoContext(): RepoContextValue {
  const ctx = useContext(RepoContext);
  if (!ctx) {
    throw new Error("useRepoContext must be used within RepoProvider");
  }
  return ctx;
}


