"use client";

import React, { useState } from "react";
import { useUiStore } from "../../editor/stores/uiStore";
import { useEditorStore } from "../../editor/stores/editorStore";
import { X, FileUp, Sparkles, BookOpen, Layers, CheckCircle2 } from "lucide-react";

const SAMPLE_MANUSCRIPT = `# Unit 2: Plant Physiology and Micro-Transport
## Chapter 3: Cellular Transport and Xylem Vessels
### Page 1: How Plants Pull Water 300 Feet Skyward
All tall vascular land plants transport ground water against gravity using cohesion-tension in xylem columns.
### Page 2: Microscopic Investigation of Stem Cross-Sections
Observing xylem rings and phloem vessels under light microscopy.
### Page 3: Guard Cells and Stomatal Gas Exchange
Carbon dioxide uptake and transpiration dynamics across leaf surfaces.
### Page 4: Photosynthetic Sugar Distribution via Phloem
Translocation of sucrose from photosynthetic source leaves to metabolic sinks.
### Page 5: Chapter 2 Synthesis & Laboratory Assessment
Self-check questions and quantitative transpiration experiment calculations.`;

export const ManuscriptImportModal: React.FC = () => {
  const { manuscriptImportOpen, setManuscriptImportOpen } = useUiStore();
  const { importManuscript } = useEditorStore();

  const [manuscriptText, setManuscriptText] = useState(SAMPLE_MANUSCRIPT);
  const [parseResult, setParseResult] = useState<{
    units: number;
    chapters: number;
    pages: number;
  }>({ units: 1, chapters: 1, pages: 5 });

  if (!manuscriptImportOpen) return null;

  const handleTextChange = (text: string) => {
    setManuscriptText(text);
    const lines = text.split("\n");
    let u = 0,
      c = 0,
      p = 0;
    lines.forEach((l) => {
      if (l.trim().startsWith("# Unit")) u++;
      if (l.trim().startsWith("## Chapter")) c++;
      if (l.trim().startsWith("### Page") || (l.trim().startsWith("### ") && !l.trim().startsWith("### Page"))) p++;
    });
    setParseResult({ units: u, chapters: c, pages: p });
  };

  const handleImport = () => {
    importManuscript(manuscriptText);
    setManuscriptImportOpen(false);
  };

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 select-none"
      onClick={() => setManuscriptImportOpen(false)}
    >
      <div
        className="w-full max-w-2xl bg-[#0e131d] border border-white/10 rounded-2xl shadow-2xl p-6 overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
              <FileUp className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-sm text-slate-100 block">
                Full-Book Curriculum Manuscript Importer
              </span>
              <span className="text-[11px] text-slate-400">
                Paste structured text/markdown to generate units, chapters, and auto-paginated layouts
              </span>
            </div>
          </div>
          <button
            onClick={() => setManuscriptImportOpen(false)}
            className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Live Parse Summary Badges */}
        <div className="grid grid-cols-3 gap-3 my-3">
          <div className="bg-black/30 border border-white/5 p-2.5 rounded-xl flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-emerald-400" />
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Units Detected</span>
              <span className="text-sm font-bold text-white font-mono">{parseResult.units}</span>
            </div>
          </div>
          <div className="bg-black/30 border border-white/5 p-2.5 rounded-xl flex items-center gap-2">
            <Layers className="w-4 h-4 text-sky-400" />
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Chapters</span>
              <span className="text-sm font-bold text-white font-mono">{parseResult.chapters}</span>
            </div>
          </div>
          <div className="bg-black/30 border border-white/5 p-2.5 rounded-xl flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Pages to Build</span>
              <span className="text-sm font-bold text-white font-mono">{parseResult.pages}</span>
            </div>
          </div>
        </div>

        {/* Editor Textarea */}
        <div className="flex-1 flex flex-col mb-4">
          <div className="flex items-center justify-between mb-1.5 text-[11px] text-slate-400">
            <span>Manuscript Markdown Source:</span>
            <button
              onClick={() => handleTextChange(SAMPLE_MANUSCRIPT)}
              className="text-indigo-400 hover:text-indigo-300 underline"
            >
              Reset to Sample Manuscript
            </button>
          </div>
          <textarea
            value={manuscriptText}
            onChange={(e) => handleTextChange(e.target.value)}
            rows={10}
            className="w-full flex-1 bg-black/40 border border-white/10 rounded-xl p-3 font-mono text-xs text-slate-200 outline-none focus:border-indigo-500 scrollbar-thin resize-none leading-relaxed"
            placeholder="# Unit 1: Living Systems&#10;## Chapter 1: Cells&#10;### Page 1: Concept..."
          />
        </div>

        {/* Action Buttons */}
        <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs">
          <span className="text-slate-400 text-[11px]">
            Uses deterministic educational layout rules • Non-destructive
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setManuscriptImportOpen(false)}
              className="px-3.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300"
            >
              Cancel
            </button>
            <button
              onClick={handleImport}
              className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold flex items-center gap-1.5 shadow-lg shadow-emerald-900/30"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Parse & Generate Pages</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
