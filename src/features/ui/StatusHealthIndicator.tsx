"use client";

import React, { useState, useEffect } from "react";
import { useEditorStore } from "../../editor/stores/editorStore";
import { useUiStore } from "../../editor/stores/uiStore";
import { useCloudChapterStore } from "../../editor/stores/cloudChapterStore";
import { Activity, CheckCircle2, ShieldCheck, Zap } from "lucide-react";

export const StatusHealthIndicator: React.FC = () => {
  const [fps, setFps] = useState(60);
  const [frameTimeMs, setFrameTimeMs] = useState(16.6);
  const [isHovered, setIsHovered] = useState(false);
  const { saveStatus } = useUiStore();
  const book = useEditorStore((s) => s.getActiveBook());
  const pageIndex = useEditorStore(s => s.activePageIndex);
  const chapterId = book?.pages[pageIndex]?.chapterId;
  const centralStatus = useCloudChapterStore(s => chapterId ? s.chapters[chapterId]?.state : undefined);
  const elements = useEditorStore((s) => s.elements);

  // Smooth frame rate monitor
  useEffect(() => {
    let frameCount = 0;
    let lastTime = performance.now();
    let animId: number;

    const loop = (now: number) => {
      frameCount++;
      const elapsed = now - lastTime;
      if (elapsed >= 1000) {
        const computedFps = Math.round((frameCount * 1000) / elapsed);
        setFps(Math.min(120, Math.max(20, computedFps)));
        setFrameTimeMs(parseFloat((1000 / computedFps).toFixed(1)));
        frameCount = 0;
        lastTime = now;
      }
      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, []);

  const elementCount = Object.keys(elements).length;
  const isHealthy = fps >= 55;

  return (
    <div
      className="relative flex items-center"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Sleek Minimal Trigger: Small green dot + subtle label */}
      <button
        className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-black/40 hover:bg-black/60 border border-white/10 hover:border-white/20 text-[10px] font-mono transition-all duration-150"
        title="System Performance & Sync Health"
      >
        <span
          className={`w-1.5 h-1.5 rounded-full transition-colors ${
            isHealthy
              ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]"
              : "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]"
          }`}
        />
        <span className="text-slate-400 font-medium hidden sm:inline">
          {fps} FPS
        </span>
      </button>

      {/* Rich Hover Telemetry Popover */}
      {isHovered && (
        <div className="absolute bottom-8 right-0 z-50 w-60 bg-[#0d121e]/95 backdrop-blur-2xl border border-white/15 rounded-xl shadow-2xl p-3 text-xs text-slate-200 animate-in fade-in zoom-in-95 duration-100 font-sans pointer-events-none">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10">
            <span className="font-bold flex items-center gap-1.5 text-slate-100">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Studio Engine Health</span>
            </span>
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
              OPTIMAL
            </span>
          </div>

          <div className="space-y-1.5 font-mono text-[10px]">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 flex items-center gap-1">
                <Activity className="w-3 h-3 text-indigo-400" />
                <span>Render Speed:</span>
              </span>
              <span className="text-slate-200 font-bold">
                {frameTimeMs} ms / frame
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-400 flex items-center gap-1">
                <Zap className="w-3 h-3 text-amber-400" />
                <span>Hardware Target:</span>
              </span>
              <span className="text-slate-200">60 FPS Locked</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-400 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                <span>Document Sync:</span>
              </span>
              <span className="text-emerald-300 font-medium">
                {centralStatus ? `Content: ${centralStatus}` : saveStatus || "Local backup only"}
              </span>
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-white/5">
              <span className="text-slate-500">Live Primitives:</span>
              <span className="text-slate-400">{elementCount} nodes</span>
            </div>

            {book && (
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Total Book Pages:</span>
                <span className="text-slate-400">{book.pages.length} pages</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
