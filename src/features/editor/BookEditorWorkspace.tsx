"use client";

import React, { useEffect } from "react";
import { useEditorStore } from "../../editor/stores/editorStore";
import { useUiStore, EditorTool, StudioMode } from "../../editor/stores/uiStore";
import { useHistoryStore } from "../../editor/stores/historyStore";
import { hasPendingCloudChanges, retryPendingCloudChanges } from "../../editor/stores/cloudChapterStore";
import { flushPendingPersistence } from "../../editor/core/debouncedPersistence";
import { TopHeader } from "../panels/TopHeader";
import { ContextToolbar } from "../panels/ContextToolbar";
import { ToolRail } from "../panels/ToolRail";
import { LeftSidebar } from "../panels/LeftSidebar";
import { InspectorPanel } from "../inspector/InspectorPanel";
import { BottomPageStrip } from "../panels/BottomPageStrip";
import { PageCanvas } from "../canvas/PageCanvas";
import { CommandPalette } from "../palette/CommandPalette";
import { PreflightModal } from "../preflight/PreflightModal";
import { ExportModal } from "../publishing/ExportModal";
import { Book3dPreviewModal } from "../three/Book3dPreviewModal";
import { BookWizardModal } from "../wizard/BookWizardModal";
import { GlyphBrowserModal } from "../palette/GlyphBrowserModal";
import { ManuscriptImportModal } from "../publishing/ManuscriptImportModal";
import { DataMergeModal } from "../publishing/DataMergeModal";
import { TextStylesModal } from "../palette/TextStylesModal";
import { AIStudioPanel } from "../ai/AIStudioPanel";
import { LayoutGalleryModal } from "../panels/LayoutGalleryModal";
import { PerformanceDiagnostics } from "./PerformanceDiagnostics";
import { LayoutPartnerPanel } from "../layoutPartner/LayoutPartnerPanel";
import { SmartChapterBuilder } from "../curriculum/SmartChapterBuilder";
import { CurriculumWorkspaceBar, CurriculumInsertOverlay } from "../curriculum/CurriculumWorkspaceBar";
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from "lucide-react";

interface BookEditorWorkspaceProps {
  onBackToDashboard?: () => void;
}

export const BookEditorWorkspace: React.FC<BookEditorWorkspaceProps> = ({
  onBackToDashboard,
}) => {
  const {
    getActiveBook,
    getActivePage,
    selectedElementIds,
    updateElementTransform,
    deleteSelectedElements,
    duplicateSelectedElements,
    copySelection,
    pasteSelection,
    elements,
    loadFromStorage,
  } = useEditorStore();

  const { undo, redo } = useHistoryStore();
  const {
    toasts,
    dismissToast,
    commandPaletteOpen,
    setCommandPaletteOpen,
    setActiveTool,
    setActiveStudio,
    focusMode,
    setFocusMode,
    themeMode,
    isFullscreen,
    toggleFullscreen,
    setIsFullscreen,
  } = useUiStore();

  // Listen to native browser fullscreen state changes (e.g. Esc key or browser button)
  useEffect(() => {
    const handleFullscreenChange = () => {
      const doc = document as any;
      const isFull = Boolean(
        doc.fullscreenElement ||
        doc.webkitFullscreenElement ||
        doc.mozFullScreenElement ||
        doc.msFullscreenElement
      );
      setIsFullscreen(isFull);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    document.addEventListener("mozfullscreenchange", handleFullscreenChange);
    document.addEventListener("MSFullscreenChange", handleFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", handleFullscreenChange);
      document.removeEventListener("mozfullscreenchange", handleFullscreenChange);
      document.removeEventListener("MSFullscreenChange", handleFullscreenChange);
    };
  }, [setIsFullscreen]);

  // Sync theme mode to documentElement
  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.classList.remove("light", "dark");
      document.documentElement.classList.add(themeMode);
      document.documentElement.setAttribute("data-theme", themeMode);
    }
  }, [themeMode]);

  // Load from local storage on mount
  useEffect(() => {
    loadFromStorage();
    retryPendingCloudChanges();
    const beforeLeave = (event: BeforeUnloadEvent) => {
      flushPendingPersistence();
      if (hasPendingCloudChanges()) { event.preventDefault(); event.returnValue = ''; }
    };
    window.addEventListener('beforeunload', beforeLeave);
    window.addEventListener('online', retryPendingCloudChanges);
    return () => {
      window.removeEventListener('beforeunload', beforeLeave);
      window.removeEventListener('online', retryPendingCloudChanges);
    };
  }, [loadFromStorage]);

  // Keep a usable canvas beside the element library on narrow editor windows.
  useEffect(() => {
    const narrow = window.matchMedia("(max-width: 900px)");
    const closeInspector = () => {
      if (narrow.matches) useUiStore.getState().setRightInspectorOpen(false);
    };
    closeInspector();
    narrow.addEventListener("change", closeInspector);
    return () => narrow.removeEventListener("change", closeInspector);
  }, []);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is currently typing in an input or contentEditable
      const target = e.target as HTMLElement;
      if (target.closest('[role="dialog"][aria-modal="true"]')) return;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      // Command Palette: Cmd/Ctrl + K
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCommandPaletteOpen(true);
        return;
      }

      // Native Fullscreen Editing: F11 or 'f' (like YouTube)
      if (
        e.key === "F11" ||
        (e.key.toLowerCase() === "f" && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey)
      ) {
        e.preventDefault();
        toggleFullscreen();
        return;
      }

      // Zen / Focus Mode: Shift + F or Cmd/Ctrl + Shift + F
      if (e.shiftKey && e.key.toLowerCase() === "f") {
        e.preventDefault();
        const currentFocus = useUiStore.getState().focusMode;
        useUiStore.getState().setFocusMode(!currentFocus);
        return;
      }

      if (commandPaletteOpen) return;

      // Studio Switchers: Cmd/Ctrl + 1..8
      if ((e.metaKey || e.ctrlKey) && !e.shiftKey) {
        const studios: StudioMode[] = [
          "BOOK",
          "LAYOUT",
          "VECTOR",
          "PIXEL",
          "CONTENT",
          "REVIEW",
          "PREFLIGHT",
          "EXPORT",
        ];
        const num = parseInt(e.key, 10);
        if (num >= 1 && num <= 8) {
          e.preventDefault();
          setActiveStudio(studios[num - 1]);
          return;
        }
      }

      // Undo / Redo
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
        return;
      }

      // Copy / Paste
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "c") {
        e.preventDefault();
        copySelection();
        return;
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "v") {
        e.preventDefault();
        pasteSelection();
        return;
      }

      // Duplicate (Cmd + D)
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "d") {
        e.preventDefault();
        duplicateSelectedElements();
        return;
      }

      // Delete / Backspace
      if (e.key === "Delete" || e.key === "Backspace") {
        if (selectedElementIds.length > 0) {
          e.preventDefault();
          deleteSelectedElements();
        }
        return;
      }

      // Tool Hotkeys (Without Cmd/Ctrl)
      if (!e.metaKey && !e.ctrlKey && !e.altKey) {
        const key = e.key.toLowerCase();
        const toolMap: Record<string, EditorTool> = {
          v: "move",
          a: "node",
          t: "frameText",
          m: "shape",
          p: "pen",
          b: "brush",
          e: "eraser",
          s: "cloneStamp",
          j: "healing",
          h: "hand",
          z: "zoom",
          r: "measure",
          i: "eyedropper",
          c: "crop",
        };
        if (toolMap[key]) {
          e.preventDefault();
          setActiveTool(toolMap[key]);
          return;
        }
      }

      // Arrow Key Nudging
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
        if (selectedElementIds.length > 0) {
          e.preventDefault();
          const step = e.shiftKey ? 10 : 1; // 1pt normal, 10pt with Shift

          selectedElementIds.forEach((id) => {
            const el = elements[id];
            if (!el || el.locked) return;

            let deltaX = 0;
            let deltaY = 0;

            if (e.key === "ArrowUp") deltaY = -step;
            if (e.key === "ArrowDown") deltaY = step;
            if (e.key === "ArrowLeft") deltaX = -step;
            if (e.key === "ArrowRight") deltaX = step;

            updateElementTransform(
              id,
              {
                x: el.transform.x + deltaX,
                y: el.transform.y + deltaY,
              },
              true
            );
          });
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    selectedElementIds,
    elements,
    commandPaletteOpen,
    setCommandPaletteOpen,
    undo,
    redo,
    copySelection,
    pasteSelection,
    duplicateSelectedElements,
    deleteSelectedElements,
    updateElementTransform,
    setActiveTool,
    setActiveStudio,
  ]);

  const book = getActiveBook();
  const activePage = getActivePage();

  if (!book || !activePage) {
    return (
      <div className="h-screen w-screen bg-[#f4f6fa] dark:bg-[#0b0f17] flex items-center justify-center text-slate-700 dark:text-slate-300">
        Loading Book Publishing Workspace...
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex flex-col bg-[#f4f6fa] dark:bg-[#0b0f17] overflow-hidden select-none">
      {/* Top Application Bar with 8 Studios */}
      <TopHeader onOpenDashboard={() => {
        flushPendingPersistence();
        if (hasPendingCloudChanges() && !window.confirm('Some chapter changes have not reached central storage. Your device recovery copy is retained. Leave the editor?')) return;
        onBackToDashboard?.();
      }} />
      {!focusMode && <CurriculumWorkspaceBar />}

      {/* Dynamic Context Toolbar - hidden in Focus Canvas Mode */}
      {!focusMode && <ContextToolbar />}

      {/* Main Studio Middle Area */}
      <div className="flex-1 flex w-full overflow-hidden relative">
        {/* Compact Tool Rail */}
        {!focusMode && <ToolRail />}

        {/* Left Studio Dock (Pages, Layers, Presets, Assets, Styles, Review) */}
        {!focusMode && <LeftSidebar />}

        {/* Central Precision Canvas Viewport */}
        <PageCanvas book={book} activePage={activePage} />

        {/* Right Studio Inspector Panel */}
        {!focusMode && <InspectorPanel />}
      </div>

      {/* Bottom Page Thumbnails Strip */}
      {!focusMode && <BottomPageStrip />}

      {/* Zen / Focus Canvas Floating Exit Pill */}
      {focusMode && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#0e1424] border border-white/15 px-4 py-2 rounded-full shadow-2xl text-[13px] flex items-center gap-3 text-slate-100">
          <span className="w-2 h-2 rounded-full bg-indigo-400" />
          <span className="font-medium font-sans">Focus canvas</span>
          <button
            onClick={() => setFocusMode(false)}
            className="px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/20 text-[10px] font-mono font-semibold transition-colors btn-spring cursor-pointer"
          >
            Exit (Shift + F)
          </button>
        </div>
      )}

      {/* Native Browser Fullscreen Floating Indicator */}
      {isFullscreen && (
        <div className="fixed top-3 left-1/2 -translate-x-1/2 z-50 bg-slate-900/90 dark:bg-[#0e1424]/90 border border-slate-700/60 dark:border-white/15 px-3.5 py-1.5 rounded-full shadow-2xl text-[12px] flex items-center gap-2.5 text-white backdrop-blur-md animate-in fade-in slide-in-from-top-2 duration-200 pointer-events-auto">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-medium font-sans">Full Screen Editing</span>
          <button
            onClick={toggleFullscreen}
            className="px-2.5 py-0.5 rounded-full bg-white/15 hover:bg-white/25 text-[10px] font-mono font-semibold transition-colors cursor-pointer"
            title="Exit Fullscreen (Esc or F11)"
          >
            Exit (Esc / F)
          </button>
        </div>
      )}

      {/* Production Modals & Overlays */}
      <CommandPalette />
      <PreflightModal />
      <ExportModal />
      <Book3dPreviewModal />
      <BookWizardModal />
      <SmartChapterBuilder />
      <CurriculumInsertOverlay />
      <GlyphBrowserModal />
      <ManuscriptImportModal />
      <DataMergeModal />
      <TextStylesModal />
      <AIStudioPanel />
      <LayoutGalleryModal />
      <PerformanceDiagnostics />
      <LayoutPartnerPanel />

      {/* Toast Notifications */}
      <div className="fixed bottom-28 right-6 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map((toast) => {
          return (
            <div
              key={toast.id}
              className={`pointer-events-auto flex items-center gap-3 px-4 py-2.5 rounded-xl shadow-2xl border text-[13px] font-medium ${
                toast.type === "success"
                  ? "bg-emerald-950/90 border-emerald-500/40 text-emerald-200"
                  : toast.type === "error"
                  ? "bg-rose-950/90 border-rose-500/40 text-rose-200"
                  : toast.type === "warning"
                  ? "bg-amber-950/90 border-amber-500/40 text-amber-200"
                  : "bg-slate-900/90 border-white/20 text-slate-200"
              }`}
            >
              {toast.type === "success" && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
              {toast.type === "error" && <AlertCircle className="w-4 h-4 text-rose-400" />}
              {toast.type === "warning" && <AlertTriangle className="w-4 h-4 text-amber-400" />}
              {toast.type === "info" && <Info className="w-4 h-4 text-sky-400" />}

              <div>
                <span className="font-semibold block">{toast.title}</span>
                {toast.message && (
                  <span className="text-[10px] opacity-80 block">{toast.message}</span>
                )}
              </div>

              <button
                onClick={() => dismissToast(toast.id)}
                className="ml-2 p-1 hover:bg-white/10 rounded"
              >
                <X className="w-3.5 h-3.5 opacity-60 hover:opacity-100" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
