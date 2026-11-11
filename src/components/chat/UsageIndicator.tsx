"use client";

import { useState } from "react";
import { Zap } from "lucide-react";
import { UsageModal } from "./UsageModal";

export function UsageIndicator() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-5 left-5 z-30 flex items-center gap-2 rounded-lg border border-fg/15 bg-canvas/90 backdrop-blur-xl px-3 py-2 text-xs shadow-lg gf-transition hover:border-tomato-jam/40 hover:bg-canvas/95 hover:shadow-tomato-jam/10"
        title="View usage statistics"
      >
        <Zap className="h-3.5 w-3.5 text-tomato-jam" />
        <span className="font-semibold text-fg">Usage</span>
      </button>
      <UsageModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
}
