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
  Paintbrush,
  Eraser,
  Image as ImageIcon,
} from "lucide-react";
import { useEditorStore } from "../../editor/stores/editorStore";
import { useUiStore } from "../../editor/stores/uiStore";
import { directPasteImageFromClipboard } from "../../editor/clipboard/universalClipboard";
import { clipboardRoots, cutSelectionIssue } from "../../editor/clipboard/elementClipboard";

export interface ContextMenuState {
  isOpen: boolean;
  x: number;
  y: number;
  targetElementId?: string;
  pageId?: string;
  position?: { x: number; y: number };
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
    cutSelection,
    pasteSelection,
    clipboardElements,
    getActivePage,
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
    copyTextStyle,
    pasteTextStyle,
    clearTextFormatting,
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
  const isGroup = Boolean(singleElement?.childElementIds?.length);
  const cutIssue = cutSelectionIssue(clipboardRoots(selectedElementIds, elements, getActivePage()?.id || ""), elements);

  // Viewport clamping
  const menuWidth = 210;
  const menuHeight = Math.min(hasSelection ? 560 : 260, window.innerHeight - 24);
  const posX = Math.max(12, Math.min(menuState.x, window.innerWidth - menuWidth - 12));
  const posY = Math.max(12, Math.min(menuState.y, window.innerHeight - menuHeight - 12));

  return (
    <div
      ref={menuRef}
      data-canvas-controls
      onPointerDown={e => e.stopPropagation()}
      onMouseDown={e => e.stopPropagation()}
      style={{ left: `${posX}px`, top: `${posY}px`, maxHeight: "calc(100vh - 24px)", overflowY: "auto" }}
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
              <span>{isGroup ? "Copy Group" : "Copy"}</span>
            </span>
            <span className="text-[10px] text-slate-500 font-mono">⌘C</span>
          </button>

          <button
            disabled={Boolean(cutIssue)}
            title={cutIssue || "The selection moves when you paste it on the destination page."}
            onClick={() => {
              cutSelection();
              onClose();
            }}
            className="w-full min-h-11 flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-white/10 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <span className="flex items-center gap-2"><Scissors className="w-3.5 h-3.5 text-slate-400"/><span>{isGroup ? "Cut Group" : "Cut"}</span></span>
            <span className="text-[10px] text-slate-500 font-mono">⌘/Ctrl X</span>
          </button>

          <button
            disabled={clipboardElements.length === 0}
            onClick={() => {
              pasteSelection();
              onClose();
            }}
            className="w-full min-h-11 flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-white/10 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <span className="flex items-center gap-2">
              <Clipboard className="w-3.5 h-3.5 text-slate-400" />
              <span>Paste</span>
            </span>
            <span className="text-[10px] text-slate-500 font-mono">⌘V</span>
          </button>

          {/* Typography Style Actions */}
          {singleElement && (["heading", "subheading", "body", "caption", "quote"].includes(singleElement.type) || singleElement.content?.text !== undefined) && (
            <>
              <button
                onClick={() => {
                  copyTextStyle(singleElement.id);
                  onClose();
                }}
                className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-white/10 hover:text-white transition-colors text-rose-300 hover:text-rose-200"
              >
                <span className="flex items-center gap-2">
                  <Paintbrush className="w-3.5 h-3.5" />
                  <span>Copy Style</span>
                </span>
                <span className="text-[10px] text-slate-500 font-mono">⌘⌥C</span>
              </button>

              <button
                onClick={() => {
                  pasteTextStyle();
                  onClose();
                }}
                className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-white/10 hover:text-white transition-colors text-rose-300 hover:text-rose-200"
              >
                <span className="flex items-center gap-2">
                  <Paintbrush className="w-3.5 h-3.5" />
                  <span>Paste Style</span>
                </span>
                <span className="text-[10px] text-slate-500 font-mono">⌘⌥V</span>
              </button>

              <button
                onClick={() => {
                  clearTextFormatting(singleElement.id);
                  onClose();
                }}
                className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-white/10 hover:text-white transition-colors text-amber-300 hover:text-amber-200"
              >
                <span className="flex items-center gap-2">
                  <Eraser className="w-3.5 h-3.5" />
                  <span>Clear Formatting</span>
                </span>
              </button>
            </>
          )}

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
            disabled={clipboardElements.length === 0}
            onClick={() => {
              pasteSelection({ pageId: menuState.pageId, position: menuState.position });
              onClose();
            }}
            className="w-full min-h-11 flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-white/10 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <span className="flex items-center gap-2">
              <Clipboard className="w-3.5 h-3.5 text-slate-400" />
              <span>Paste Here</span>
            </span>
            <span className="text-[10px] text-slate-500 font-mono">⌘V</span>
          </button>

          <button
            onClick={() => {
              void directPasteImageFromClipboard();
              onClose();
            }}
            className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-white/10 hover:text-white transition-colors"
          >
            <span className="flex items-center gap-2">
              <ImageIcon className="w-3.5 h-3.5 text-emerald-400" />
              <span>Direct Paste Image</span>
            </span>
            <span className="text-[9px] text-emerald-400/80 font-mono">Instant</span>
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
