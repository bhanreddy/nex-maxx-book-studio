"use client";

import React, { useState, useEffect, useRef } from "react";
import { useUiStore } from "../../editor/stores/uiStore";
import { useEditorStore } from "../../editor/stores/editorStore";
import { useLayoutPartnerStore } from "../../editor/layoutPartner/layoutPartnerStore";
import {
  Search,
  Plus,
  Copy,
  Trash2,
  Columns,
  Square,
  Printer,
  FileDown,
  Box,
  Eye,
  Sparkles,
  Heading,
  HelpCircle,
  Beaker,
} from "lucide-react";

export const CommandPalette: React.FC = () => {
  const {
    commandPaletteOpen,
    setCommandPaletteOpen,
    setViewMode,
    toggleBleed,
    toggleMargins,
    resetZoom,
    setPreflightModalOpen,
    setExportModalOpen,
    setBook3dPreviewOpen,
    setActiveLayoutGalleryOpen,
    setFocusMode,
    focusMode,
  } = useUiStore();

  const {
    addPage,
    deletePage,
    duplicatePage,
    activePageIndex,
    addElement,
    autoArrangeActivePage,
    shuffleCompatibleLayout,
    smartStack,
    groupSelectedElements,
    applyThemeToBook,
    applyFontPairingToBook,
  } = useEditorStore();

  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Global Keyboard listener for Cmd/Ctrl + K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCommandPaletteOpen(!commandPaletteOpen);
      }
      if (e.key === "Escape" && commandPaletteOpen) {
        setCommandPaletteOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [commandPaletteOpen, setCommandPaletteOpen]);

  useEffect(() => {
    if (commandPaletteOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery("");
      setSelectedIndex(0);
    }
  }, [commandPaletteOpen]);

  if (!commandPaletteOpen) return null;

  // All actionable commands (Directives 58: Natural beginner commands)
  const commands = [
    // Natural Layout & Page Arrangement
    {
      id: "cmd-auto-arrange",
      title: "Auto Arrange Page",
      subtitle: "Analyze page elements and automatically calculate balanced geometry",
      keywords: ["auto arrange", "balance", "rebalance", "organize", "tidy", "fix page"],
      category: "Adaptive Layout",
      icon: Sparkles,
      action: () => autoArrangeActivePage("balanced"),
    },
    {
      id: "cmd-try-layout",
      title: "Change Layout / Try Another Layout",
      subtitle: "Preview the same content rearranged into alternative balanced compositions",
      keywords: ["change layout", "try another layout", "switch layout", "rearrange", "gallery", "two columns"],
      category: "Adaptive Layout",
      icon: Columns,
      action: () => setActiveLayoutGalleryOpen(true),
    },
    {
      id: "cmd-shuffle-layout",
      title: "Shuffle Compatible Layout",
      subtitle: "Pick the next intelligent layout variant preserving all text and images",
      keywords: ["shuffle", "randomize", "alternate", "next layout"],
      category: "Adaptive Layout",
      icon: Sparkles,
      action: () => shuffleCompatibleLayout(),
    },
    {
      id: "cmd-stack-v",
      title: "Stack Selected Vertically",
      subtitle: "Create an adaptive vertical flow container with automatic spacing",
      keywords: ["stack vertically", "vertical stack", "auto flow", "smart stack", "align down"],
      category: "Adaptive Layout",
      icon: Box,
      action: () => smartStack(undefined, "vertical"),
    },
    {
      id: "cmd-stack-h",
      title: "Stack Selected Horizontally",
      subtitle: "Place selected objects into an adaptive row with equal horizontal spacing",
      keywords: ["stack horizontally", "horizontal stack", "row", "side by side", "columns"],
      category: "Adaptive Layout",
      icon: Box,
      action: () => smartStack(undefined, "horizontal"),
    },
    {
      id: "cmd-adaptive-group",
      title: "Convert to Adaptive Container",
      subtitle: "Enable relationship-driven auto-resizing and child reflow",
      keywords: ["adaptive group", "container", "make adaptive", "auto layout", "frame"],
      category: "Adaptive Layout",
      icon: Box,
      action: () => groupSelectedElements("vertical"),
    },

    // Beginner Natural Add / Insert Commands
    {
      id: "cmd-add-activity",
      title: "Add Activity",
      subtitle: "Insert a curriculum hands-on exercise, experiment, or question card",
      keywords: ["add activity", "insert activity", "experiment", "try this", "exercise", "hands on"],
      category: "Insert Elements",
      icon: Beaker,
      action: () => {
        useUiStore.getState().setLeftPanelOpen(true);
        useUiStore.getState().setLeftPanelTab("templates");
        useUiStore.getState().setPresetCategoryFilter("activities");
        addElement("preset-hands-on-activity");
      },
    },
    {
      id: "cmd-add-image",
      title: "Add Image",
      subtitle: "Insert a picture frame ready for illustration or photo upload",
      keywords: ["add image", "insert image", "picture", "photo", "illustration", "graphic"],
      category: "Insert Elements",
      icon: Square,
      action: () => addElement("pictureFrame"),
    },
    {
      id: "cmd-add-title",
      title: "Add Title / Chapter Heading",
      subtitle: "Insert a textbook styled heading with accent bar",
      keywords: ["add title", "heading", "h1", "chapter title", "headline"],
      category: "Insert Elements",
      icon: Heading,
      action: () => addElement("preset-ch-title"),
    },
    {
      id: "cmd-add-question",
      title: "Add Assessment Question",
      subtitle: "Insert multiple-choice question card with options and rubric",
      keywords: ["add question", "assessment", "mcq", "quiz", "test", "exercise"],
      category: "Insert Elements",
      icon: HelpCircle,
      action: () => addElement("preset-mcq-question"),
    },
    {
      id: "cmd-add-did-you-know",
      title: "Add 'Did You Know?' Callout",
      subtitle: "Insert a curated trivia badge and highlight callout box",
      keywords: ["callout", "did you know", "tip", "fact", "remember", "note"],
      category: "Insert Elements",
      icon: Sparkles,
      action: () => addElement("preset-did-you-know"),
    },

    // Page Management Commands
    {
      id: "cmd-add-page",
      title: "Add Next Page",
      subtitle: "Append a fresh blank page to the current book section",
      keywords: ["add next page", "add page", "new page", "create page"],
      category: "Page Actions",
      icon: Plus,
      action: () => addPage(activePageIndex),
    },
    {
      id: "cmd-dup-page",
      title: "Duplicate Current Page",
      subtitle: "Clone current page layout and all element contents",
      keywords: ["duplicate page", "clone page", "copy page"],
      category: "Page Actions",
      icon: Copy,
      action: () => duplicatePage(activePageIndex),
    },
    {
      id: "cmd-del-page",
      title: "Delete Current Page",
      subtitle: "Remove this page from the book sequence",
      keywords: ["delete page", "remove page", "trash page"],
      category: "Page Actions",
      icon: Trash2,
      action: () => deletePage(activePageIndex),
    },

    // Publishing & Preflight
    {
      id: "cmd-export",
      title: "Export Book",
      subtitle: "Download commercial print PDF (300 DPI, CMYK) or digital ePub",
      keywords: ["export book", "export", "download pdf", "print ready", "publish"],
      category: "Publishing",
      icon: FileDown,
      action: () => setExportModalOpen(true),
    },
    {
      id: "cmd-preflight",
      title: "Run Print Preflight Check",
      subtitle: "Inspect bleed margins, text overflow, and image resolution",
      keywords: ["preflight", "validate", "check", "dpi", "overflow", "print check"],
      category: "Publishing",
      icon: Printer,
      action: () => setPreflightModalOpen(true),
    },
    {
      id: "cmd-3d-preview",
      title: "Open Interactive 3D Book Mockup",
      subtitle: "Inspect the physical book binding and realistic page flip in 3D",
      keywords: ["3d", "mockup", "3d preview", "flip book", "physical"],
      category: "Visualization",
      icon: Box,
      action: () => setBook3dPreviewOpen(true),
    },

    // View & Workspace Commands
    {
      id: "cmd-focus-mode",
      title: "Toggle Focus Mode",
      subtitle: "Hide sidebars and inspectors to immerse completely in page composition",
      keywords: ["focus mode", "distraction free", "zen", "hide panels", "fullscreen"],
      category: "View",
      icon: Eye,
      action: () => setFocusMode(!focusMode),
    },
    {
      id: "cmd-spread",
      title: "Two-Page Facing Spread View",
      subtitle: "Inspect left and right pages together as they appear in print binding",
      keywords: ["spread", "two pages", "facing pages", "book spread"],
      category: "View",
      icon: Columns,
      action: () => setViewMode("spread"),
    },
    {
      id: "cmd-single",
      title: "Single Page View",
      subtitle: "Focus canvas on one individual page",
      keywords: ["single page", "one page", "single view"],
      category: "View",
      icon: Square,
      action: () => setViewMode("single"),
    },
    {
      id: "cmd-reset-zoom",
      title: "Fit Page / 100% Zoom",
      subtitle: "Center page and scale to fit comfortable viewport",
      keywords: ["fit to page", "fit page", "reset zoom", "100%", "zoom fit"],
      category: "View",
      icon: Eye,
      action: () => resetZoom(),
    },
    {
      id: "cmd-toggle-margins",
      title: "Toggle Print Margins & Bleed",
      subtitle: "Show or hide print-safe guides and 3mm trim marks",
      keywords: ["margins", "bleed", "guides", "safe area", "trim marks"],
      category: "Guides",
      icon: Eye,
      action: () => {
        toggleMargins();
        toggleBleed();
      },
    },

    // Additional Section 12 Commands
    {
      id: "cmd-layout-partner",
      title: "✦ NEX Layout Partner",
      subtitle: "Open AI layout analysis, whitespace optimization, and page health score",
      keywords: ["layout partner", "partner", "ai layout", "analyze page", "improve layout", "whitespace"],
      category: "✦ Intelligence",
      icon: Sparkles,
      action: () => useLayoutPartnerStore.getState().setPartnerPanelOpen(true),
    },
    {
      id: "cmd-insert-chapter-opener",
      title: "Insert Chapter Opener Hero",
      subtitle: "Full-page editorial chapter title with big numeral and overview cards",
      keywords: ["insert chapter opener", "chapter opener", "hero", "chapter title", "intro"],
      category: "Insert Elements",
      icon: Heading,
      action: () => {
        addElement("preset-ch-title", 54, 80);
      },
    },
    {
      id: "cmd-insert-learning-outcomes",
      title: "Insert Learning Outcomes Card",
      subtitle: "Targeted educational goal matrix with check indicators",
      keywords: ["learning outcomes", "outcomes", "goals", "objectives", "targets"],
      category: "Insert Elements",
      icon: Sparkles,
      action: () => {
        useEditorStore.getState().addEducationalBlock("outcomes-cards-play", 54, 160);
      },
    },
    {
      id: "cmd-toggle-inspector",
      title: "Toggle Property Inspector",
      subtitle: "Show or hide the right-side properties panel",
      keywords: ["inspector", "properties", "hide inspector", "show inspector", "panel"],
      category: "View",
      icon: Box,
      action: () => {
        const cur = useUiStore.getState().rightInspectorOpen;
        useUiStore.getState().setRightInspectorOpen(!cur);
      },
    },

    // Design Systems & Theme Palettes
    {
      id: "cmd-theme-maroon",
      title: "Apply Theme: NEX MAXX Maroon",
      subtitle: "Standard flagship academic burgundy and gold palette",
      keywords: ["theme", "maroon", "burgundy", "nex maxx color", "flagship"],
      category: "Design System",
      icon: Sparkles,
      action: () => applyThemeToBook("maroon"),
    },
    {
      id: "cmd-theme-science",
      title: "Apply Theme: Science Emerald",
      subtitle: "Crisp emerald and teal palette optimized for STEM subjects",
      keywords: ["theme", "science", "green", "emerald", "stem"],
      category: "Design System",
      icon: Sparkles,
      action: () => applyThemeToBook("science"),
    },
    {
      id: "cmd-theme-math",
      title: "Apply Theme: Mathematics Blue",
      subtitle: "Professional royal blue and cyan palette for numbers and logic",
      keywords: ["theme", "math", "mathematics", "blue", "cyan"],
      category: "Design System",
      icon: Sparkles,
      action: () => applyThemeToBook("math"),
    },
    {
      id: "cmd-font-academic",
      title: "Apply Font Pairing: Modern Academic",
      subtitle: "Merriweather Serif headings paired with Inter Clean body",
      keywords: ["font", "fonts", "typography", "academic", "serif", "inter"],
      category: "Design System",
      icon: Heading,
      action: () => applyFontPairingToBook("Modern Academic"),
    },
  ];

  const q = query.toLowerCase().trim();
  const filtered = commands.filter((c) => {
    if (!q) return true;
    if (c.title.toLowerCase().includes(q)) return true;
    if (c.category.toLowerCase().includes(q)) return true;
    if (c.subtitle && c.subtitle.toLowerCase().includes(q)) return true;
    if (c.keywords && c.keywords.some((k) => k.toLowerCase().includes(q))) return true;
    return false;
  });

  const executeCommand = (cmd: typeof commands[0]) => {
    cmd.action();
    setCommandPaletteOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filtered.length));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filtered.length) % Math.max(1, filtered.length));
    } else if (e.key === "Enter" && filtered[selectedIndex]) {
      e.preventDefault();
      executeCommand(filtered[selectedIndex]);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/65 backdrop-blur-md z-50 flex items-start justify-center pt-24 px-4 select-none animate-in fade-in duration-150"
      onClick={() => setCommandPaletteOpen(false)}
    >
      <div
        className="w-full max-w-xl bg-[#10141D]/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-[0_30px_70px_-15px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col animate-float-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-white/[0.08] bg-black/30">
          <Search className="w-4 h-4 text-violet-400 mr-3 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a command, tool, or action... (e.g. 'auto arrange', 'export', 'margins')"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent text-sm text-slate-100 outline-none placeholder-slate-500 font-sans"
          />
          <div className="flex items-center gap-1.5 shrink-0 ml-2">
            <span className="text-[9pt] font-mono text-slate-400 bg-white/5 border border-white/10 px-1.5 py-0.5 rounded">
              ↑↓ navigate
            </span>
            <span className="text-[9pt] font-mono text-slate-400 bg-white/5 border border-white/10 px-1.5 py-0.5 rounded">
              ↵ run
            </span>
            <span className="text-[9pt] font-mono text-slate-400 bg-white/5 border border-white/10 px-1.5 py-0.5 rounded">
              esc
            </span>
          </div>
        </div>

        {/* Results List */}
        <div className="max-h-96 overflow-y-auto p-2 space-y-1 custom-scrollbar">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              <p className="font-semibold text-slate-300 mb-1">No matching commands</p>
              <p className="text-[10px] text-slate-500">
                Try searching for &quot;Auto arrange&quot;, &quot;Export PDF&quot;, &quot;Layout Partner&quot;, or &quot;Focus mode&quot;
              </p>
            </div>
          ) : (
            filtered.map((cmd, idx) => {
              const Icon = cmd.icon;
              const isSelected = idx === selectedIndex;
              const isAi = cmd.category.includes("Intelligence");
              return (
                <button
                  key={cmd.id}
                  onClick={() => executeCommand(cmd)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs transition-all ${
                    isSelected
                      ? isAi
                        ? "bg-gradient-to-r from-violet-600/90 to-indigo-600/90 text-white font-medium shadow-md shadow-violet-600/20"
                        : "bg-white/15 text-white font-medium shadow-sm"
                      : "text-slate-300 hover:bg-white/[0.06] hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                        isSelected
                          ? "bg-white/20 text-white"
                          : isAi
                          ? "bg-violet-500/20 text-violet-300 border border-violet-500/30"
                          : "bg-white/5 text-slate-400 border border-white/5"
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex flex-col items-start min-w-0 text-left">
                      <span className="truncate font-medium text-slate-100">{cmd.title}</span>
                      {cmd.subtitle && (
                        <span
                          className={`text-[10px] truncate leading-tight ${
                            isSelected ? "text-slate-200" : "text-slate-400"
                          }`}
                        >
                          {cmd.subtitle}
                        </span>
                      )}
                    </div>
                  </div>
                  <span
                    className={`text-[9pt] uppercase tracking-wider font-mono shrink-0 ml-3 px-2 py-0.5 rounded-md ${
                      isSelected
                        ? "bg-black/20 text-white/90"
                        : isAi
                        ? "bg-violet-500/10 text-violet-300"
                        : "bg-white/5 text-slate-400"
                    }`}
                  >
                    {cmd.category}
                  </span>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
