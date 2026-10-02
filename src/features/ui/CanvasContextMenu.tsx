"use client";

import React, { useEffect, useRef } from "react";
import {
  Copy,
  Scissors,
  Clipboard,
  Layers,
  Trash2,
  Lock,
  Unlock,
  Sparkles,
  ArrowUp,
  ArrowDown,
  Group,
  Ungroup,
  Type,
  Shapes,
  Maximize2,
  Wand2,
  LayoutTemplate,
} from "lucide-react";
import { useEditorStore } from "../../editor/stores/editorStore";
import { useUiStore } from "../../editor/stores/uiStore";

export interface ContextMenuState {
  isOpen: boolean;
  x: number;
  y: number;
  targetElementId?: string;
}

interface CanvasContextMenuProps {
  menuState: ContextMenuState;
  onClose: () => void;
}

export const CanvasContextMenu: React.FC<CanvasContextMenuProps> = ({
  menuState,
  onClose,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const {
    selectedElementIds,
    elements,
    copySelection,
    pasteSelection,
    duplicateSelectedElements,
    deleteSelectedElements,
    bringToFront,
    sendToBack,
    bringForward,
    sendBackward,
    groupSelectedElements,
    groupAndLockSelectedElements,
    ungroupSelectedElements,
    updateElement,
    addTextFrame,
    addVectorShape,
    autoArrangeActivePage,
  } = useEditorStore();

  const {
    setLeftPanelOpen,
    setLeftPanelTab,
    setActiveLayoutGalleryOpen,
    showToast,
  } = useUiStore();

  // Close on click outside or Escape
  useEffect(() => {
    if (!menuState.isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [menuState.isOpen, onClose]);

  if (!menuState.isOpen) return null;

  const hasSelection = selectedElementIds.length > 0;
  const singleElement =
    selectedElementIds.length === 1 ? elements[selectedElementIds[0]] : null;
  const isLocked = selectedElementIds.length > 0 && selectedElementIds.every(id => elements[id]?.locked);

  // Viewport clamping
  const menuWidth = 210;
  const menuHeight = hasSelection ? 340 : 210;
  const posX = Math.min(menuState.x, window.innerWidth - menuWidth - 12);
  const posY = Math.min(menuState.y, window.innerHeight - menuHeight - 12);

  return (
    <div
      ref={menuRef}
      style={{ left: `${posX}px`, top: `${posY}px` }}
      className="fixed z-50 w-52 bg-[#0e1320]/95 backdrop-blur-2xl border border-white/12 rounded-xl shadow-2xl p-1.5 text-xs text-slate-200 select-none animate-in fade-in zoom-in-95 duration-100 font-sans"
      onClick={(e) => e.stopPropagation()}
    >
      {hasSelection ? (
        <>
          {/* Duplicate / Copy / Paste */}
          <button
            onClick={() => {
              duplicateSelectedElements();
              onClose();
            }}
            className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-white/10 hover:text-white transition-colors"
          >
            <span className="flex items-center gap-2">
              <Copy className="w-3.5 h-3.5 text-slate-400" />
              <span>Duplicate</span>
            </span>
            <span className="text-[10px] text-slate-500 font-mono">⌘D</span>
          </button>

          <button
            onClick={() => {
              copySelection();
              onClose();
            }}
            className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-white/10 hover:text-white transition-colors"
          >
            <span className="flex items-center gap-2">
              <Clipboard className="w-3.5 h-3.5 text-slate-400" />
              <span>Copy</span>
            </span>
            <span className="text-[10px] text-slate-500 font-mono">⌘C</span>
          </button>

          <button
            onClick={() => {
              pasteSelection();
              onClose();
            }}
            className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-white/10 hover:text-white transition-colors"
          >
            <span className="flex items-center gap-2">
              <Scissors className="w-3.5 h-3.5 text-slate-400" />
              <span>Paste</span>
            </span>
            <span className="text-[10px] text-slate-500 font-mono">⌘V</span>
          </button>

          <div className="h-px bg-white/10 my-1" />

          {/* Layer Arrangement */}
          <button
            onClick={() => {
              if (singleElement) bringForward(singleElement.id);
              onClose();
            }}
            className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-white/10 hover:text-white transition-colors"
          >
            <span className="flex items-center gap-2">
              <ArrowUp className="w-3.5 h-3.5 text-slate-400" />
              <span>Bring Forward</span>
            </span>
            <span className="text-[10px] text-slate-500 font-mono">]</span>
          </button>

          <button
            onClick={() => {
              if (singleElement) sendBackward(singleElement.id);
              onClose();
            }}
            className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-white/10 hover:text-white transition-colors"
          >
            <span className="flex items-center gap-2">
              <ArrowDown className="w-3.5 h-3.5 text-slate-400" />
              <span>Send Backward</span>
            </span>
            <span className="text-[10px] text-slate-500 font-mono">[</span>
          </button>

          <button
            onClick={() => {
              if (singleElement) bringToFront(singleElement.id);
              onClose();
            }}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-white/10 hover:text-white transition-colors text-slate-300"
          >
            <Layers className="w-3.5 h-3.5 text-slate-400" />
            <span>Bring to Front</span>
          </button>

          <button
            onClick={() => {
              if (singleElement) sendToBack(singleElement.id);
              onClose();
            }}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-white/10 hover:text-white transition-colors text-slate-300"
          >
            <Layers className="w-3.5 h-3.5 text-slate-400 rotate-180" />
            <span>Send to Back</span>
          </button>

          <div className="h-px bg-white/10 my-1" />

          {/* Group / Lock */}
          {selectedElementIds.length > 1 ? (
            <>
              <button
                onClick={() => {
                  groupSelectedElements();
                  onClose();
                }}
                className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-white/10 hover:text-white transition-colors"
              >
                <span className="flex items-center gap-2">
                  <Group className="w-3.5 h-3.5 text-slate-400" />
                  <span>Group Elements</span>
                </span>
                <span className="text-[10px] text-slate-500 font-mono">⌘G</span>
              </button>
              <button
                onClick={() => {
                  groupAndLockSelectedElements();
                  onClose();
                }}
                className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-amber-500/20 text-amber-300 hover:text-amber-200 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <Lock className="w-3.5 h-3.5 text-amber-400" />
                  <span>Group & Lock</span>
                </span>
                <span className="text-[10px] text-amber-500/80 font-mono">⌘⇧L</span>
              </button>
            </>
          ) : singleElement?.childElementIds?.length ? (
            <button
              onClick={() => {
                ungroupSelectedElements();
                onClose();
              }}
              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-white/10 hover:text-white transition-colors"
            >
              <span className="flex items-center gap-2">
                <Ungroup className="w-3.5 h-3.5 text-slate-400" />
                <span>Ungroup</span>
              </span>
              <span className="text-[10px] text-slate-500 font-mono">⇧⌘G</span>
            </button>
          ) : null}

          {(selectedElementIds.length > 1 || singleElement?.type === "group" || Boolean(singleElement?.childElementIds?.length)) && (
            <button
              onClick={() => {
                useUiStore.getState().setCreateLayoutModalOpen(true);
                onClose();
              }}
              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-amber-500/20 text-amber-300 transition-colors font-medium"
            >
              <span className="flex items-center gap-2">
                <LayoutTemplate className="w-3.5 h-3.5 text-amber-400" />
                <span>Create Layout from Selection</span>
              </span>
              <span className="text-[10px] text-amber-500/80 font-mono">Preset</span>
            </button>
          )}

          <button
            onClick={() => {
              selectedElementIds.forEach((id) => {
                updateElement(id, { locked: !isLocked });
              });
              onClose();
            }}
            className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-white/10 hover:text-white transition-colors"
          >
            <span className="flex items-center gap-2">
              {isLocked ? (
                <Unlock className="w-3.5 h-3.5 text-amber-400" />
              ) : (
                <Lock className="w-3.5 h-3.5 text-slate-400" />
              )}
              <span>{isLocked ? "Unlock Object" : "Lock Object"}</span>
            </span>
            <span className="text-[10px] text-slate-500 font-mono">⌘L</span>
          </button>

          <div className="h-px bg-white/10 my-1" />

          {/* AI Action Quick Trigger */}
          <button
            onClick={() => {
              showToast({
                title: "✦ AI Partner Analysis",
                message: "Analyzing selected element for pedagogical enhancement...",
                type: "info",
              });
              onClose();
            }}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-indigo-600/20 text-indigo-300 font-medium transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>✦ Enhance with AI</span>
          </button>

          <div className="h-px bg-white/10 my-1" />

          {/* Delete */}
          <button
            onClick={() => {
              deleteSelectedElements();
              onClose();
            }}
            className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-rose-500/20 text-rose-300 transition-colors"
          >
            <span className="flex items-center gap-2">
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete</span>
            </span>
            <span className="text-[10px] text-rose-400/60 font-mono">⌫</span>
          </button>
        </>
      ) : (
        <>
          {/* Empty Space Menu */}
          <button
            onClick={() => {
              pasteSelection();
              onClose();
            }}
            className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-white/10 hover:text-white transition-colors"
          >
            <span className="flex items-center gap-2">
              <Clipboard className="w-3.5 h-3.5 text-slate-400" />
              <span>Paste Here</span>
            </span>
            <span className="text-[10px] text-slate-500 font-mono">⌘V</span>
          </button>

          <button
            onClick={() => {
              addTextFrame(54, 120, 240, 60);
              onClose();
            }}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-white/10 hover:text-white transition-colors"
          >
            <Type className="w-3.5 h-3.5 text-slate-400" />
            <span>Add Text Frame</span>
          </button>

          <button
            onClick={() => {
              addVectorShape("rectangle", 54, 120, 160, 100);
              onClose();
            }}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-white/10 hover:text-white transition-colors"
          >
            <Shapes className="w-3.5 h-3.5 text-slate-400" />
            <span>Add Shape</span>
          </button>

          <button
            onClick={() => {
              setLeftPanelOpen(true);
              setLeftPanelTab("blocks");
              onClose();
            }}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-indigo-600/20 text-indigo-300 font-medium transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Insert Smart Block...</span>
          </button>

          <div className="h-px bg-white/10 my-1" />

          <button
            onClick={() => {
              setActiveLayoutGalleryOpen(true);
              onClose();
            }}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-white/10 hover:text-white transition-colors"
          >
            <Wand2 className="w-3.5 h-3.5 text-indigo-400" />
            <span>Try Alternative Layout...</span>
          </button>

          <button
            onClick={() => {
              autoArrangeActivePage("balanced");
              onClose();
            }}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-white/10 hover:text-white transition-colors"
          >
            <Maximize2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Auto Arrange Page</span>
          </button>
        </>
      )}
    </div>
  );
};
