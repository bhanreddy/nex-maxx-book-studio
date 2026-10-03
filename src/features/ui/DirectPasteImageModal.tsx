"use client";

import React, { useState, useEffect, useRef } from "react";
import { useUiStore } from "../../editor/stores/uiStore";
import { insertImageFileOntoActivePage } from "../../editor/clipboard/universalClipboard";
import {
  Clipboard,
  Upload,
  Image as ImageIcon,
  X,
  Link as LinkIcon,
  Sparkles,
} from "lucide-react";

export const DirectPasteImageModal: React.FC = () => {
  const { directPasteModalOpen, setDirectPasteModalOpen, showToast } = useUiStore();
  const [imageUrl, setImageUrl] = useState("");
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Focus modal & listen for Ctrl/Cmd+V anywhere while modal is open
  useEffect(() => {
    if (!directPasteModalOpen) return;

    const handlePaste = async (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.startsWith("image/")) {
          e.preventDefault();
          e.stopPropagation();
          const file = item.getAsFile();
          if (file) {
            setIsProcessing(true);
            await insertImageFileOntoActivePage(file);
            setIsProcessing(false);
            setDirectPasteModalOpen(false);
            return;
          }
        }
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setDirectPasteModalOpen(false);
      }
    };

    window.addEventListener("paste", handlePaste);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("paste", handlePaste);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [directPasteModalOpen, setDirectPasteModalOpen]);

  if (!directPasteModalOpen) return null;

  const handleReadClipboard = async () => {
    setIsProcessing(true);
    try {
      if (navigator.clipboard && navigator.clipboard.read) {
        const items = await navigator.clipboard.read();
        for (const item of items) {
          for (const type of item.types) {
            if (type.startsWith("image/")) {
              const blob = await item.getType(type);
              const file = new File([blob], "clipboard-image.png", {
                type: blob.type || "image/png",
              });
              await insertImageFileOntoActivePage(file);
              setDirectPasteModalOpen(false);
              return;
            }
          }
        }
      }
      showToast({
        type: "info",
        title: "No Image in Clipboard",
        message: "Copy an image to your clipboard first, or choose a file below.",
      });
    } catch (err) {
      showToast({
        type: "error",
        title: "Clipboard Access Needed",
        message: "Press Ctrl+V or Cmd+V directly to paste into this window.",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsProcessing(true);
      await insertImageFileOntoActivePage(file);
      setIsProcessing(false);
      setDirectPasteModalOpen(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      setIsProcessing(true);
      await insertImageFileOntoActivePage(file);
      setIsProcessing(false);
      setDirectPasteModalOpen(false);
    }
  };

  const handleInsertUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageUrl.trim()) return;

    setIsProcessing(true);
    try {
      const resp = await fetch(imageUrl.trim());
      const blob = await resp.blob();
      const file = new File([blob], "web-image.png", { type: blob.type || "image/png" });
      await insertImageFileOntoActivePage(file);
      setDirectPasteModalOpen(false);
    } catch {
      showToast({
        type: "error",
        title: "Could Not Fetch Image",
        message: "Check URL or CORS permissions.",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg bg-white dark:bg-[#0f172a] rounded-2xl shadow-2xl border border-slate-200 dark:border-white/10 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <Clipboard className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Direct Paste Image
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Paste any image directly onto your worksheet
              </p>
            </div>
          </div>
          <button
            onClick={() => setDirectPasteModalOpen(false)}
            className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body Drop & Paste Zone */}
        <div className="p-5 space-y-4">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDraggingOver(true);
            }}
            onDragLeave={() => setIsDraggingOver(false)}
            onDrop={handleDrop}
            onClick={handleReadClipboard}
            className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
              isDraggingOver
                ? "border-indigo-500 bg-indigo-50/60 dark:bg-indigo-950/40 scale-[1.01]"
                : "border-slate-300 dark:border-white/15 bg-slate-50/50 dark:bg-white/[0.02] hover:bg-indigo-50/30 hover:border-indigo-400 dark:hover:border-indigo-500/50"
            }`}
          >
            <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-3 shadow-inner">
              <ImageIcon className="w-6 h-6" />
            </div>

            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1">
              Press <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-300 dark:border-white/20 font-mono text-xs shadow-xs">Cmd+V</kbd> or <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-300 dark:border-white/20 font-mono text-xs shadow-xs">Ctrl+V</kbd> to Paste Image
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs">
              Or click here to paste from system clipboard, or drop an image file
            </p>

            <div className="mt-4 flex items-center gap-2">
              <button
                type="button"
                disabled={isProcessing}
                onClick={(e) => {
                  e.stopPropagation();
                  handleReadClipboard();
                }}
                className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-all"
              >
                <Clipboard className="w-3.5 h-3.5" />
                <span>{isProcessing ? "Processing..." : "Paste from Clipboard"}</span>
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
                className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-white/15 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-medium hover:bg-slate-100 dark:hover:bg-white/10 flex items-center gap-1.5 transition-all"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Browse File</span>
              </button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileSelect}
            />
          </div>

          {/* Paste Web Image URL */}
          <form onSubmit={handleInsertUrl} className="flex gap-2">
            <div className="relative flex-1">
              <LinkIcon className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="Or paste an image web link (https://...)"
                className="w-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 dark:text-slate-200 placeholder:text-slate-400 outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
            <button
              type="submit"
              disabled={!imageUrl.trim() || isProcessing}
              className="px-3.5 py-2 rounded-xl bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900 text-xs font-semibold hover:opacity-90 disabled:opacity-40 transition-all flex items-center gap-1 shrink-0"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Insert</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
