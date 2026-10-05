"use client";

import React, { useRef, useEffect, useState, useCallback, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  Check,
  Type,
  Palette,
  Highlighter,
  Superscript as SuperscriptIcon,
  Subscript as SubscriptIcon,
  Sigma,
  CaseSensitive,
  ChevronDown,
  Eraser,
} from "lucide-react";
import { PageElement } from "../../domain/element/types";
import { FontSelectorPopover } from "../../features/ui/FontSelectorPopover";
import { ColorPickerPopover } from "../../features/ui/ColorPickerPopover";
import { MathSymbolsPopover } from "../../features/ui/MathSymbolsPopover";
import {
  toSentenceCase,
  toTitleCase,
  toCapitalizeWords,
} from "../design/typographyCatalog";

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
  element,
  initialText,
  onCommit,
  onClose,
  multiline = true,
  className = "",
  style = {},
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const commitRef = useRef(onCommit);
  commitRef.current = onCommit;
  const [toolbarPosition, setToolbarPosition] = useState<{ left: number; top: number } | null>(null);
  const [currentColor, setCurrentColor] = useState(element.style.color || "#0f172a");
  const [currentLineHeight, setCurrentLineHeight] = useState(element.style.lineHeight || 1.5);
  const isComposingRef = useRef(false);
  const lastCommittedTextRef = useRef(initialText);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Active Formatting States
  const [activeFormats, setActiveFormats] = useState<{
    bold: boolean;
    italic: boolean;
    underline: boolean;
    strike: boolean;
    superscript: boolean;
    subscript: boolean;
  }>({
    bold: false,
    italic: false,
    underline: false,
    strike: false,
    superscript: false,
    subscript: false,
  });

  // Current Inline Settings for Selection
  const [currentFontSize, setCurrentFontSize] = useState<number>(
    element.style.fontSize || 12
  );
  const [currentFontFamily, setCurrentFontFamily] = useState<string>(
    element.style.fontFamily || "Inter"
  );

  // Dropdown Popovers
  const [activePopover, setActivePopover] = useState<
    "font" | "color" | "highlight" | "math" | "case" | null
  >(null);

  // Saved selection range when clicking toolbar popovers
  const savedRangeRef = useRef<Range | null>(null);

  const saveCurrentSelection = useCallback(() => {
    if (typeof window === "undefined") return;
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0 && editorRef.current) {
      try {
        const range = sel.getRangeAt(0);
        if (
          editorRef.current.contains(range.commonAncestorContainer) ||
          editorRef.current === range.commonAncestorContainer
        ) {
          savedRangeRef.current = range.cloneRange();
        }
      } catch {}
    }
  }, []);

  const restoreSelection = () => {
    if (!editorRef.current) return null;
    const range = savedRangeRef.current;
    editorRef.current.focus();
    if (range && editorRef.current.contains(range.commonAncestorContainer)) {
      const selection = window.getSelection();
      selection?.removeAllRanges(); selection?.addRange(range);
      return range;
    }
    return null;
  };

  // Populate initial DOM once on mount
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.innerHTML = initialText || "";
      lastCommittedTextRef.current = editorRef.current.innerHTML;
      editorRef.current.focus();

      // Place cursor at the end initially
      const sel = window.getSelection();
      if (sel) {
        const range = document.createRange();
        range.selectNodeContents(editorRef.current);
        range.collapse(false);
        sel.removeAllRanges();
        sel.addRange(range);
        savedRangeRef.current = range.cloneRange();
      }
    }
    const editor = editorRef.current;
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      if (editor && editor.innerHTML !== lastCommittedTextRef.current) commitRef.current(editor.innerHTML.replace(/\u200b/g, ""));
    };
  }, []); // Run once on mount

  useLayoutEffect(() => {
    const position = () => {
      if (!editorRef.current) return;
      const bounds = editorRef.current.getBoundingClientRect();
      const toolbarHeight = toolbarRef.current?.offsetHeight || 88;
      const toolbarWidth = Math.min(840, window.innerWidth - 24);
      setToolbarPosition({ left: Math.max(12, Math.min(bounds.left, window.innerWidth - toolbarWidth - 12)),
        top: Math.max(12, Math.min(bounds.top >= toolbarHeight + 12 ? bounds.top - toolbarHeight - 8 : bounds.bottom + 8, window.innerHeight - toolbarHeight - 12)) });
    };
    position();
    window.addEventListener("resize", position);
    window.addEventListener("scroll", position, true);
    return () => { window.removeEventListener("resize", position); window.removeEventListener("scroll", position, true); };
  }, []);

  // Check active formatting states (bold, italic, etc.)
  const updateActiveFormats = useCallback(() => {
    saveCurrentSelection();
    if (typeof document !== "undefined") {
      setActiveFormats({
        bold: document.queryCommandState("bold"),
        italic: document.queryCommandState("italic"),
        underline: document.queryCommandState("underline"),
        strike: document.queryCommandState("strikeThrough"),
        superscript: document.queryCommandState("superscript"),
        subscript: document.queryCommandState("subscript"),
      });

      // Check current font or color at selection
      const sel = window.getSelection();
      if (sel && sel.anchorNode && editorRef.current?.contains(sel.anchorNode)) {
        const parent = sel.anchorNode.parentElement;
        if (parent) {
          const computed = window.getComputedStyle(parent);
          if (computed.color) setCurrentColor(computed.color);
          const computedSize = parseFloat(computed.fontSize);
          const computedLeading = parseFloat(computed.lineHeight);
          if (computedSize > 0 && computedLeading > 0) setCurrentLineHeight(Math.round(computedLeading / computedSize * 100) / 100);
          if (computed.fontFamily) {
            const family = computed.fontFamily.split(",")[0].replace(/['"]/g, "").trim();
            setCurrentFontFamily(family);
          }
          if (computed.fontSize) {
            const px = parseFloat(computed.fontSize);
            // approximate pt (px * 0.75)
            const pt = Math.round(px * 0.75 * 100) / 100;
            if (pt > 0) setCurrentFontSize(pt);
          }
        }
      }
    }
  }, []);

  // Format execution helper
  const execFormat = (cmd: string, val: string = "") => {
    if (!editorRef.current) return;
    restoreSelection();
    document.execCommand("styleWithCSS", false, "true");
    document.execCommand(cmd, false, val);
    updateActiveFormats();
    handleInput();
  };

  // Wrap or Apply Style to Range
  const applyInlineStyleToSelection = (styles: Record<string, string>) => {
    if (!editorRef.current) return;
    saveCurrentSelection();
    const range = restoreSelection();
    if (!range) return;
    if (range.collapsed) {
      // A collapsed caret configures the next typed characters.
      const span = document.createElement("span");
      Object.entries(styles).forEach(([prop, val]) => span.style.setProperty(prop, val));
      span.textContent = "\u200b";
      document.execCommand("insertHTML", false, span.outerHTML);
      saveCurrentSelection();
      handleInput();
      return;
    }

    const offset = getSelectionCharacterOffsetWithin(editorRef.current);
    const selectedContent = range.cloneContents();
    // Remove conflicting declarations only from the selected fragment. Repeated size or colour changes must win.
    selectedContent.querySelectorAll<HTMLElement>("*").forEach(node => {
      Object.keys(styles).forEach(prop => node.style.removeProperty(prop));
      if (styles["font-family"]) node.removeAttribute("face");
      if (styles["font-size"]) node.removeAttribute("size");
      if (styles.color) node.removeAttribute("color");
    });
    const span = document.createElement("span");
    // cloneContents excludes the common ancestor. Retain its authored inline styles
    // before replacing the selection, or changing the font can erase its size/bold.
    const ancestors: HTMLElement[] = [];
    let ancestor = range.commonAncestorContainer.nodeType === Node.ELEMENT_NODE
      ? range.commonAncestorContainer as HTMLElement : range.commonAncestorContainer.parentElement;
    while (ancestor && ancestor !== editorRef.current) { ancestors.unshift(ancestor); ancestor = ancestor.parentElement; }
    ancestors.forEach(node => {
      if (["B", "STRONG"].includes(node.tagName)) span.style.fontWeight = "bold";
      if (["I", "EM"].includes(node.tagName)) span.style.fontStyle = "italic";
      if (node.tagName === "U") span.style.textDecoration = "underline";
      if (["S", "STRIKE", "DEL"].includes(node.tagName)) span.style.textDecoration = "line-through";
      if (node.tagName === "SUP") span.style.verticalAlign = "super";
      if (node.tagName === "SUB") span.style.verticalAlign = "sub";
      for (const property of Array.from(node.style)) span.style.setProperty(property, node.style.getPropertyValue(property));
    });

    Object.entries(styles).forEach(([prop, val]) => {
      span.style.setProperty(prop, val);
    });

    span.appendChild(selectedContent);
    // Use the browser editing transaction so Cmd/Ctrl+Z also undoes selection formatting.
    document.execCommand("insertHTML", false, span.outerHTML);
    setSelectionCharacterOffsetWithin(editorRef.current, offset);
    saveCurrentSelection();

    updateActiveFormats();
    handleInput();
  };

  const syncToStore = useCallback(
    (immediate = false) => {
      if (!editorRef.current) return;
      const currentHtml = editorRef.current.innerHTML.replace(/\u200b/g, "");
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }

      if (currentHtml === lastCommittedTextRef.current) return;
      if (immediate) {
        lastCommittedTextRef.current = currentHtml;
        onCommit(currentHtml);
      } else {
        debounceTimerRef.current = setTimeout(() => {
          if (!editorRef.current) return;
          const html = editorRef.current.innerHTML.replace(/\u200b/g, "");
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
    if (e.relatedTarget && (editorRef.current?.contains(e.relatedTarget as Node) || toolbarRef.current?.contains(e.relatedTarget as Node))) return;
    syncToStore(true);
    // Native pickers may report a null target; the outside-pointer handler handles dismissal.
    if (e.relatedTarget) onClose();
  };

  useEffect(() => {
    const handleOutside = (event: PointerEvent) => {
      const target = event.target as Node;
      if (editorRef.current?.contains(target) || toolbarRef.current?.contains(target)) return;
      syncToStore(true);
      onClose();
    };
    document.addEventListener("pointerdown", handleOutside, true);
    return () => document.removeEventListener("pointerdown", handleOutside, true);
  }, [syncToStore, onClose]);

  // Transform Case on Selection
  const transformSelectionCase = (type: "upper" | "lower" | "title" | "sentence" | "capitalize") => {
    if (!editorRef.current) return;
    const sel = window.getSelection();
    let range: Range | null = null;
    if (sel && sel.rangeCount > 0 && editorRef.current) {
      try {
        const r = sel.getRangeAt(0);
        if (
          editorRef.current.contains(r.commonAncestorContainer) ||
          editorRef.current === r.commonAncestorContainer
        ) {
          range = r;
        }
      } catch {}
    }
    if (!range && savedRangeRef.current) {
      range = savedRangeRef.current;
    }
    let original = range ? range.toString() : "";

    // If nothing selected, select entire text
    if (!original && editorRef.current) {
      original = editorRef.current.innerText || "";
      range = document.createRange();
      range.selectNodeContents(editorRef.current);
    }
    if (!original || !range) return;

    let converted = original;
    if (type === "upper") converted = original.toUpperCase();
    if (type === "lower") converted = original.toLowerCase();
    if (type === "title") converted = toTitleCase(original);
    if (type === "sentence") converted = toSentenceCase(original);
    if (type === "capitalize") converted = toCapitalizeWords(original);

    range.deleteContents();
    const textNode = document.createTextNode(converted);
    range.insertNode(textNode);

    // Reselect
    try {
      range.selectNode(textNode);
      sel?.removeAllRanges();
      sel?.addRange(range);
      savedRangeRef.current = range.cloneRange();
    } catch {}

    setActivePopover(null);
    handleInput();
  };

  // Insert Math Symbol at Caret
  const insertMathSymbol = (symbol: string) => {
    if (!editorRef.current) return;
    restoreSelection();

    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      const range = sel.getRangeAt(0);
      range.deleteContents();
      const node = document.createTextNode(symbol);
      range.insertNode(node);
      range.setStartAfter(node);
      range.collapse(true);
      sel.removeAllRanges();
      sel.addRange(range);
    }
    setActivePopover(null);
    handleInput();
  };

  // Adjust Font Size on Selection
  const adjustSelectionFontSize = (delta: number) => {
    const next = Math.max(6, currentFontSize + delta);
    setCurrentFontSize(next);
    applyInlineStyleToSelection({ "font-size": `${next}pt` });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Stop all keyboard events from escaping to canvas hotkeys!
    e.stopPropagation();

    // Standard Shortcuts
    if (e.metaKey || e.ctrlKey) {
      const key = e.key.toLowerCase();
      if (key === "z" || key === "y") {
        e.preventDefault();
        execFormat(key === "y" || e.shiftKey ? "redo" : "undo");
        return;
      }
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
      if (key === "=" || key === "+") {
        e.preventDefault();
        if (e.shiftKey) execFormat("superscript");
        else execFormat("subscript");
        return;
      }
      if (key === "x" && e.shiftKey) {
        e.preventDefault();
        execFormat("strikeThrough");
        return;
      }
      if (key === ">" || (key === "." && e.shiftKey)) {
        e.preventDefault();
        adjustSelectionFontSize(1);
        return;
      }
      if (key === "<" || (key === "," && e.shiftKey)) {
        e.preventDefault();
        adjustSelectionFontSize(-1);
        return;
      }
      if (key === "enter") {
        e.preventDefault();
        syncToStore(true);
        onClose();
        return;
      }
    }

    if (e.key === "Tab") {
      e.preventDefault();
      if (e.shiftKey) {
        execFormat("outdent");
      } else {
        execFormat("indent");
      }
      return;
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
    <div className="relative w-full h-full group/rich-editor" onPointerDown={e => e.stopPropagation()} onClick={e => e.stopPropagation()} onDoubleClick={e => e.stopPropagation()}>
      {/* Floating Rich-Text Formatting Toolbar */}
      {toolbarPosition && createPortal(<div
        ref={toolbarRef}
        role="toolbar"
        aria-label="Selected text formatting"
        className="rich-text-floating-toolbar fixed z-[100000] flex flex-wrap items-center gap-1 bg-[#10141d] text-white px-2 py-2 rounded-xl shadow-xl border border-white/20 select-none text-xs"
        style={{ ...toolbarPosition, width: "min(840px, calc(100vw - 24px))" }}
        onPointerDown={(e) => { e.stopPropagation(); saveCurrentSelection(); }}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
        onMouseDown={(e) => {
          saveCurrentSelection();
          if (!(e.target as HTMLElement).closest("input, select, textarea")) e.preventDefault();
        }}
      >
        {/* Font Family Trigger */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              saveCurrentSelection();
              setActivePopover(activePopover === "font" ? null : "font");
            }}
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/10 hover:bg-white/15 text-slate-200 transition-colors text-[11px] max-w-[110px]"
            title="Font Family"
          >
            <Type className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
            <span className="truncate" style={{ fontFamily: currentFontFamily }}>
              {currentFontFamily}
            </span>
            <ChevronDown className="w-2.5 h-2.5 opacity-60 flex-shrink-0" />
          </button>

          {activePopover === "font" && (
            <div className="absolute left-0 top-full mt-1 z-[200]">
              <FontSelectorPopover
                currentFont={currentFontFamily}
                onSelect={(font) => {
                  setCurrentFontFamily(font);
                  applyInlineStyleToSelection({ "font-family": font });
                  setActivePopover(null);
                }}
                onClose={() => setActivePopover(null)}
              />
            </div>
          )}
        </div>

        {/* Font Size Adjuster (- / Size / +) */}
        <div className="flex items-center bg-white/10 rounded-lg p-0.5 border border-white/10">
          <button
            type="button"
            onClick={() => adjustSelectionFontSize(-1)}
            className="px-1.5 py-0.5 rounded hover:bg-white/20 text-slate-300 hover:text-white font-mono text-[10px]"
            title="Decrease Font Size (Cmd+Shift+<)"
          >
            −
          </button>
          <input type="number" aria-label="Selected text font size (pt)" min={6} max={300} step={0.5}
            value={currentFontSize} className="w-12 bg-transparent font-mono text-[11px] text-center text-indigo-300 outline-none"
            onChange={e => { const size = Number(e.target.value); if (size >= 6 && size <= 300) { setCurrentFontSize(size); applyInlineStyleToSelection({ "font-size": `${size}pt` }); } }} />
          <button
            type="button"
            onClick={() => adjustSelectionFontSize(1)}
            className="px-1.5 py-0.5 rounded hover:bg-white/20 text-slate-300 hover:text-white font-mono text-[10px]"
            title="Increase Font Size (Cmd+Shift+>)"
          >
            +
          </button>
        </div>

        <div className="w-[1px] h-4 bg-white/20 mx-0.5" />

        {/* Bold */}
        <button
          type="button"
          onClick={() => execFormat("bold")}
          className={`p-1 rounded-lg hover:bg-white/20 transition-colors ${
            activeFormats.bold ? "bg-indigo-600 text-white" : "text-slate-300"
          }`}
          title="Bold (Cmd+B)"
        >
          <Bold className="w-3.5 h-3.5" />
        </button>

        {/* Italic */}
        <button
          type="button"
          onClick={() => execFormat("italic")}
          className={`p-1 rounded-lg hover:bg-white/20 transition-colors ${
            activeFormats.italic ? "bg-indigo-600 text-white" : "text-slate-300"
          }`}
          title="Italic (Cmd+I)"
        >
          <Italic className="w-3.5 h-3.5" />
        </button>

        {/* Underline */}
        <button
          type="button"
          onClick={() => execFormat("underline")}
          className={`p-1 rounded-lg hover:bg-white/20 transition-colors ${
            activeFormats.underline ? "bg-indigo-600 text-white" : "text-slate-300"
          }`}
          title="Underline (Cmd+U)"
        >
          <Underline className="w-3.5 h-3.5" />
        </button>

        {/* Strikethrough */}
        <button
          type="button"
          onClick={() => execFormat("strikeThrough")}
          className={`p-1 rounded-lg hover:bg-white/20 transition-colors ${
            activeFormats.strike ? "bg-indigo-600 text-white" : "text-slate-300"
          }`}
          title="Strikethrough (Cmd+Shift+X)"
        >
          <Strikethrough className="w-3.5 h-3.5" />
        </button>

        {/* Superscript */}
        <button
          type="button"
          onClick={() => execFormat("superscript")}
          className={`p-1 rounded-lg hover:bg-white/20 transition-colors ${
            activeFormats.superscript ? "bg-indigo-600 text-white" : "text-slate-300"
          }`}
          title="Superscript (e.g. x²)"
        >
          <SuperscriptIcon className="w-3.5 h-3.5" />
        </button>

        {/* Subscript */}
        <button
          type="button"
          onClick={() => execFormat("subscript")}
          className={`p-1 rounded-lg hover:bg-white/20 transition-colors ${
            activeFormats.subscript ? "bg-indigo-600 text-white" : "text-slate-300"
          }`}
          title="Subscript (e.g. H₂O)"
        >
          <SubscriptIcon className="w-3.5 h-3.5" />
        </button>

        <div className="w-[1px] h-4 bg-white/20 mx-0.5" />

        {/* Text Color Trigger */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              saveCurrentSelection();
              setActivePopover(activePopover === "color" ? null : "color");
            }}
            className="p-1 rounded-lg hover:bg-white/20 text-slate-300 hover:text-white transition-colors flex items-center gap-1"
            title="Text Color"
          >
            <Palette className="w-3.5 h-3.5 text-rose-400" />
            <div
              className="w-2.5 h-2.5 rounded-full border border-white/30"
              style={{ backgroundColor: currentColor }}
            />
          </button>

          {activePopover === "color" && (
            <div className="absolute left-0 top-full mt-1 z-[200]">
              <ColorPickerPopover
                color={currentColor}
                onChange={(c) => {
                  setCurrentColor(c);
                  applyInlineStyleToSelection({ color: c });
                }}
                onClose={() => setActivePopover(null)}
                label="Text Color"
              />
            </div>
          )}
        </div>

        {/* Text Highlight / Marker */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              saveCurrentSelection();
              setActivePopover(activePopover === "highlight" ? null : "highlight");
            }}
            className="p-1 rounded-lg hover:bg-white/20 text-slate-300 hover:text-white transition-colors"
            title="Highlight Text"
          >
            <Highlighter className="w-3.5 h-3.5 text-amber-400" />
          </button>

          {activePopover === "highlight" && (
            <div className="absolute left-0 top-full mt-1 z-[200] bg-[#10141d] border border-white/15 rounded-xl shadow-2xl p-2 flex items-center gap-1.5">
              {[
                { label: "Yellow", color: "#fef08a" },
                { label: "Amber", color: "#fed7aa" },
                { label: "Green", color: "#bbf7d0" },
                { label: "Cyan", color: "#a5f3fc" },
                { label: "Pink", color: "#fbcfe8" },
                { label: "Violet", color: "#e9d5ff" },
              ].map((hl) => (
                <button
                  key={hl.label}
                  type="button"
                  onClick={() => {
                    applyInlineStyleToSelection({
                      "background-color": hl.color,
                      color: "#0f172a",
                      "border-radius": "3px",
                      padding: "0.1em 0.3em",
                    });
                    setActivePopover(null);
                  }}
                  className="w-5 h-5 rounded-full border border-white/20 hover:scale-120 transition-transform shadow-xs"
                  style={{ backgroundColor: hl.color }}
                  title={hl.label}
                />
              ))}
              <button
                type="button"
                onClick={() => {
                  applyInlineStyleToSelection({
                    "background-color": "transparent",
                  });
                  setActivePopover(null);
                }}
                className="text-[9px] text-slate-400 hover:text-white px-1 font-mono"
                title="Remove highlight"
              >
                Clear
              </button>
            </div>
          )}
        </div>

        {/* Math & Science Symbols */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              saveCurrentSelection();
              setActivePopover(activePopover === "math" ? null : "math");
            }}
            className="p-1 rounded-lg hover:bg-white/20 text-slate-300 hover:text-white transition-colors"
            title="Insert Mathematical & Greek Symbols"
          >
            <Sigma className="w-3.5 h-3.5 text-cyan-400" />
          </button>

          {activePopover === "math" && (
            <div className="absolute left-0 top-full mt-1 z-[200]">
              <MathSymbolsPopover
                onInsertSymbol={insertMathSymbol}
                onClose={() => setActivePopover(null)}
              />
            </div>
          )}
        </div>

        {/* Text Case Conversion Menu */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              saveCurrentSelection();
              setActivePopover(activePopover === "case" ? null : "case");
            }}
            className="p-1 rounded-lg hover:bg-white/20 text-slate-300 hover:text-white transition-colors flex items-center gap-0.5"
            title="Text Case Transformations"
          >
            <CaseSensitive className="w-3.5 h-3.5 text-emerald-400" />
            <ChevronDown className="w-2 h-2 opacity-60" />
          </button>

          {activePopover === "case" && (
            <div className="absolute left-0 top-full mt-1 z-[200] w-36 bg-[#10141d] border border-white/15 rounded-xl shadow-2xl p-1.5 text-[11px] space-y-0.5">
              <button
                type="button"
                onClick={() => transformSelectionCase("upper")}
                className="w-full text-left px-2 py-1 rounded hover:bg-white/10 text-slate-200"
              >
                UPPERCASE
              </button>
              <button
                type="button"
                onClick={() => transformSelectionCase("lower")}
                className="w-full text-left px-2 py-1 rounded hover:bg-white/10 text-slate-200"
              >
                lowercase
              </button>
              <button
                type="button"
                onClick={() => transformSelectionCase("title")}
                className="w-full text-left px-2 py-1 rounded hover:bg-white/10 text-slate-200"
              >
                Title Case
              </button>
              <button
                type="button"
                onClick={() => transformSelectionCase("sentence")}
                className="w-full text-left px-2 py-1 rounded hover:bg-white/10 text-slate-200"
              >
                Sentence case
              </button>
              <button
                type="button"
                onClick={() => transformSelectionCase("capitalize")}
                className="w-full text-left px-2 py-1 rounded hover:bg-white/10 text-slate-200"
              >
                Capitalize Words
              </button>
            </div>
          )}
        </div>

        <label className="flex items-center gap-1 px-1 text-slate-300" title="Line height for selected text">
          Leading
          <input type="number" aria-label="Selected text line height" min={0.8} max={4} step={0.1} value={currentLineHeight}
            className="w-12 bg-white/10 rounded p-1 text-white outline-none"
            onChange={e => { const height = Number(e.target.value); if (height >= 0.8 && height <= 4) { setCurrentLineHeight(height); applyInlineStyleToSelection({ "line-height": String(height) }); } }} />
        </label>

        {/* Clear Selection Formatting */}
        <button
          type="button"
          onClick={() => execFormat("removeFormat")}
          className="p-1 rounded-lg hover:bg-white/20 text-slate-400 hover:text-rose-300 transition-colors"
          title="Clear Formatting on Selection"
        >
          <Eraser className="w-3.5 h-3.5" />
        </button>

        <div className="w-[1px] h-4 bg-white/20 mx-0.5" />

        {/* Alignment */}
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

        <button
          type="button"
          onClick={() => execFormat("justifyFull")}
          className="p-1 rounded hover:bg-white/20 text-slate-300 transition-colors"
          title="Justify"
        >
          <AlignJustify className="w-3.5 h-3.5" />
        </button>

        {/* Lists */}
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

        {/* Done Button */}
        <button
          type="button"
          onClick={() => {
            syncToStore(true);
            onClose();
          }}
          className="p-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium flex items-center gap-1 text-[11px] px-2 transition-colors shadow-sm ml-1"
          title="Commit & Finish Editing (Escape or Cmd+Enter)"
        >
          <Check className="w-3.5 h-3.5" />
          <span>Done</span>
        </button>
      </div>, document.body)}

      {/* Primary Editable Surface */}
      <div
        ref={editorRef}
        contentEditable
        role="textbox"
        aria-label={`Edit text: ${element.displayName}`}
        aria-multiline={multiline}
        suppressContentEditableWarning
        spellCheck={element.style.spellCheck !== false}
        lang={element.style.lang || "en"}
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
        className={`w-full h-full outline-none focus:ring-2 focus:ring-indigo-500/80 bg-white/70 dark:bg-black/50 rounded p-1 select-text overflow-auto ${className}`}
        style={{
          minHeight: "100%",
          cursor: "text",
          fontFamily: element.style.fontFamily || "inherit",
          fontSize: element.style.fontSize ? `${element.style.fontSize}pt` : "inherit",
          fontWeight: element.style.fontWeight || "inherit",
          fontStyle: element.style.fontStyle,
          textDecoration: element.style.textDecoration,
          lineHeight: element.style.lineHeight || "inherit",
          letterSpacing: element.style.letterSpacing ? `${element.style.letterSpacing}pt` : "inherit",
          wordSpacing: element.style.wordSpacing ? `${element.style.wordSpacing}pt` : "inherit",
          color: element.style.color || "inherit",
          textAlign: element.style.textAlign || "inherit",
          ...style,
        }}
      />
    </div>
  );
};
