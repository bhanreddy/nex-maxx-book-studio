"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  ListOrdered,
  Check,
} from "lucide-react";
import { PageElement } from "../../domain/element/types";

// ==========================================
// CHARACTER-OFFSET SELECTION PRESERVATION
// ==========================================

export function getSelectionCharacterOffsetWithin(element: HTMLElement): { start: number; end: number } {
  let start = 0;
  let end = 0;
  const sel = window.getSelection();
  if (sel && sel.rangeCount > 0) {
    const range = sel.getRangeAt(0);
    const preCaretRange = range.cloneRange();
    try {
      preCaretRange.selectNodeContents(element);
      preCaretRange.setEnd(range.startContainer, range.startOffset);
      start = preCaretRange.toString().length;
      end = start + range.toString().length;
    } catch {
      // Range might be outside element
    }
  }
  return { start, end };
}

export function setSelectionCharacterOffsetWithin(
  element: HTMLElement,
  offset: { start: number; end: number }
): void {
  const sel = window.getSelection();
  if (!sel) return;

  let currentPos = 0;
  let startNode: Node | null = null;
  let startOffset = 0;
  let endNode: Node | null = null;
  let endOffset = 0;

  function traverse(node: Node) {
    if (node.nodeType === Node.TEXT_NODE) {
      const textLen = node.textContent?.length || 0;
      if (!startNode && currentPos + textLen >= offset.start) {
        startNode = node;
        startOffset = Math.max(0, offset.start - currentPos);
      }
      if (!endNode && currentPos + textLen >= offset.end) {
        endNode = node;
        endOffset = Math.max(0, offset.end - currentPos);
      }
      currentPos += textLen;
    } else {
      for (let i = 0; i < node.childNodes.length; i++) {
        traverse(node.childNodes[i]);
        if (startNode && endNode) break;
      }
    }
  }

  traverse(element);

  const targetStart = startNode as Node | null;
  const targetEnd = endNode as Node | null;

  if (targetStart && targetEnd) {
    try {
      const range = document.createRange();
      range.setStart(targetStart, Math.min(startOffset, targetStart.textContent?.length || 0));
      range.setEnd(targetEnd, Math.min(endOffset, targetEnd.textContent?.length || 0));
      sel.removeAllRanges();
      sel.addRange(range);
    } catch {
      // Ignore boundary errors
    }
  }
}

// ==========================================
// RICH TEXT INLINE EDITOR
// ==========================================

interface RichTextInlineEditorProps {
  element: PageElement;
  initialText: string;
  onCommit: (text: string) => void;
  onClose: () => void;
  multiline?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export const RichTextInlineEditor: React.FC<RichTextInlineEditorProps> = ({
  initialText,
  onCommit,
  onClose,
  multiline = true,
  className = "",
  style = {},
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const isComposingRef = useRef(false);
  const lastCommittedTextRef = useRef(initialText);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [activeFormats, setActiveFormats] = useState<{
    bold: boolean;
    italic: boolean;
    underline: boolean;
    strike: boolean;
  }>({
    bold: false,
    italic: false,
    underline: false,
    strike: false,
  });

  // Populate initial DOM once on mount to avoid React reconciliation wipe
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.innerHTML = initialText || "";
      editorRef.current.focus();

      // Place cursor at the end initially
      const sel = window.getSelection();
      if (sel) {
        const range = document.createRange();
        range.selectNodeContents(editorRef.current);
        range.collapse(false);
        sel.removeAllRanges();
        sel.addRange(range);
      }
    }
  }, []); // Run once on mount

  // Check active formatting states (bold, italic, etc.)
  const updateActiveFormats = useCallback(() => {
    if (typeof document !== "undefined") {
      setActiveFormats({
        bold: document.queryCommandState("bold"),
        italic: document.queryCommandState("italic"),
        underline: document.queryCommandState("underline"),
        strike: document.queryCommandState("strikeThrough"),
      });
    }
  }, []);

  // Format execution helper
  const execFormat = (cmd: string, val: string = "") => {
    if (!editorRef.current) return;
    editorRef.current.focus();
    document.execCommand(cmd, false, val);
    updateActiveFormats();
    handleInput();
  };

  const syncToStore = useCallback(
    (immediate = false) => {
      if (!editorRef.current) return;
      const currentHtml = editorRef.current.innerHTML;
      if (currentHtml === lastCommittedTextRef.current) return;

      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }

      if (immediate) {
        lastCommittedTextRef.current = currentHtml;
        onCommit(currentHtml);
      } else {
        debounceTimerRef.current = setTimeout(() => {
          if (!editorRef.current) return;
          const html = editorRef.current.innerHTML;
          lastCommittedTextRef.current = html;
          onCommit(html);
        }, 250);
      }
    },
    [onCommit]
  );

  const handleInput = () => {
    if (isComposingRef.current) return;
    updateActiveFormats();
    syncToStore(false);
  };

  const handleBlur = (e: React.FocusEvent) => {
    // If clicking on our floating toolbar, don't close edit mode
    if (e.relatedTarget && (e.relatedTarget as HTMLElement).closest(".rich-text-floating-toolbar")) {
      return;
    }
    syncToStore(true);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Stop all keyboard events from escaping to canvas / workspace hotkeys!
    e.stopPropagation();

    // Bold / Italic / Underline shortcuts
    if (e.metaKey || e.ctrlKey) {
      const key = e.key.toLowerCase();
      if (key === "b") {
        e.preventDefault();
        execFormat("bold");
        return;
      }
      if (key === "i") {
        e.preventDefault();
        execFormat("italic");
        return;
      }
      if (key === "u") {
        e.preventDefault();
        execFormat("underline");
        return;
      }
      if (key === "enter") {
        e.preventDefault();
        syncToStore(true);
        onClose();
        return;
      }
    }

    if (e.key === "Escape") {
      e.preventDefault();
      syncToStore(true);
      onClose();
      return;
    }

    if (e.key === "Enter" && !multiline && !e.shiftKey) {
      e.preventDefault();
      syncToStore(true);
      onClose();
      return;
    }
  };

  return (
    <div className="relative w-full h-full">
      {/* Floating Rich-Text Formatting Toolbar */}
      <div
        className="rich-text-floating-toolbar absolute -top-11 left-0 z-50 flex items-center gap-1 bg-[#1e293b]/95 text-white backdrop-blur-md px-2 py-1 rounded-lg shadow-2xl border border-white/20 select-none animate-in fade-in zoom-in-95 duration-100"
        onMouseDown={(e) => e.preventDefault()} // Keep focus inside editor
      >
        <button
          type="button"
          onClick={() => execFormat("bold")}
          className={`p-1 rounded hover:bg-white/20 transition-colors ${
            activeFormats.bold ? "bg-indigo-500 text-white" : "text-slate-300"
          }`}
          title="Bold (Cmd+B)"
        >
          <Bold className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={() => execFormat("italic")}
          className={`p-1 rounded hover:bg-white/20 transition-colors ${
            activeFormats.italic ? "bg-indigo-500 text-white" : "text-slate-300"
          }`}
          title="Italic (Cmd+I)"
        >
          <Italic className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={() => execFormat("underline")}
          className={`p-1 rounded hover:bg-white/20 transition-colors ${
            activeFormats.underline ? "bg-indigo-500 text-white" : "text-slate-300"
          }`}
          title="Underline (Cmd+U)"
        >
          <Underline className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={() => execFormat("strikeThrough")}
          className={`p-1 rounded hover:bg-white/20 transition-colors ${
            activeFormats.strike ? "bg-indigo-500 text-white" : "text-slate-300"
          }`}
          title="Strikethrough"
        >
          <Strikethrough className="w-3.5 h-3.5" />
        </button>

        <div className="w-[1px] h-4 bg-white/20 mx-0.5" />

        <button
          type="button"
          onClick={() => execFormat("justifyLeft")}
          className="p-1 rounded hover:bg-white/20 text-slate-300 transition-colors"
          title="Align Left"
        >
          <AlignLeft className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={() => execFormat("justifyCenter")}
          className="p-1 rounded hover:bg-white/20 text-slate-300 transition-colors"
          title="Align Center"
        >
          <AlignCenter className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={() => execFormat("justifyRight")}
          className="p-1 rounded hover:bg-white/20 text-slate-300 transition-colors"
          title="Align Right"
        >
          <AlignRight className="w-3.5 h-3.5" />
        </button>

        <div className="w-[1px] h-4 bg-white/20 mx-0.5" />

        <button
          type="button"
          onClick={() => execFormat("insertUnorderedList")}
          className="p-1 rounded hover:bg-white/20 text-slate-300 transition-colors"
          title="Bullet List"
        >
          <List className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={() => execFormat("insertOrderedList")}
          className="p-1 rounded hover:bg-white/20 text-slate-300 transition-colors"
          title="Numbered List"
        >
          <ListOrdered className="w-3.5 h-3.5" />
        </button>

        <div className="w-[1px] h-4 bg-white/20 mx-0.5" />

        <button
          type="button"
          onClick={() => {
            syncToStore(true);
            onClose();
          }}
          className="p-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-medium flex items-center gap-1 text-[10px] px-1.5 transition-colors"
          title="Done Editing (Escape or Cmd+Enter)"
        >
          <Check className="w-3 h-3" />
          <span>Done</span>
        </button>
      </div>

      {/* Primary Editable Surface */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        spellCheck="true"
        onInput={handleInput}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        onKeyUp={updateActiveFormats}
        onMouseUp={updateActiveFormats}
        onCompositionStart={() => {
          isComposingRef.current = true;
        }}
        onCompositionEnd={() => {
          isComposingRef.current = false;
          handleInput();
        }}
        className={`w-full h-full outline-none focus:ring-2 focus:ring-indigo-500/80 bg-white/60 dark:bg-black/40 rounded p-1 select-text overflow-auto ${className}`}
        style={{
          minHeight: "100%",
          cursor: "text",
          ...style,
        }}
      />
    </div>
  );
};
