"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  LayoutTemplate,
  Check,
  Sparkles,
  Layers,
  Tag,
  HelpCircle,
} from "lucide-react";
import { useEditorStore } from "../../editor/stores/editorStore";
import { useUiStore } from "../../editor/stores/uiStore";
import { CustomLayoutCategory, CustomLayoutPlaceholder } from "../../domain/layout/customLayoutTypes";

export const CreateLayoutModal: React.FC = () => {
  const { createLayoutModalOpen, setCreateLayoutModalOpen, setLeftPanelTab, setLeftPanelOpen } = useUiStore();
  const { selectedElementIds, elements, createCustomLayoutFromSelection } = useEditorStore();

  const [layoutName, setLayoutName] = useState("");
  const [category, setCategory] = useState<CustomLayoutCategory>("general");
  const [description, setDescription] = useState("");
  const [placeholders, setPlaceholders] = useState<CustomLayoutPlaceholder[]>([]);

  // Collect selected elements
  const selectedElements = selectedElementIds.map((id) => elements[id]).filter(Boolean);

  useEffect(() => {
    if (!createLayoutModalOpen) return;

    // Generate smart default name & placeholders
    const detectedPlaceholders: CustomLayoutPlaceholder[] = [];
    let defaultTitle = "Custom Layout";

    selectedElements.forEach((el, idx) => {
      if (el.type === "heading" || el.type === "chapter-title") {
        defaultTitle = el.content.text ? `Layout: ${el.content.text.substring(0, 24)}...` : "Custom Chapter Layout";
        detectedPlaceholders.push({
          elementId: el.id,
          key: `heading_${idx}`,
          label: "Heading Title",
          type: "text",
          defaultValue: el.content.text || "",
        });
      } else if (el.type === "body" || el.type === "body-text" || el.type === "quote") {
        detectedPlaceholders.push({
          elementId: el.id,
          key: `body_${idx}`,
          label: "Body Content",
          type: "text",
          defaultValue: el.content.text || "",
        });
      } else if (el.type === "image" || el.type === "illustration") {
        detectedPlaceholders.push({
          elementId: el.id,
          key: `image_${idx}`,
          label: "Image / Visual",
          type: "image",
          defaultValue: el.content.url || el.content.src || "",
        });
      } else if (el.type === "question" || el.type === "mcq") {
        detectedPlaceholders.push({
          elementId: el.id,
          key: `question_${idx}`,
          label: "Assessment Question",
          type: "text",
          defaultValue: el.content.question || "",
        });
      }
    });

    setLayoutName(defaultTitle);
    setPlaceholders(detectedPlaceholders);
  }, [createLayoutModalOpen, selectedElementIds]);

  if (!createLayoutModalOpen) return null;

  const handleSave = () => {
    if (!layoutName.trim()) return;
    const created = createCustomLayoutFromSelection(layoutName, category, description, placeholders);
    if (created) {
      setCreateLayoutModalOpen(false);
      // Switch left sidebar to templates/custom layout tab so user can immediately see it!
      setLeftPanelOpen(true);
      setLeftPanelTab("templates");
    }
  };

  const handleUpdatePlaceholderLabel = (idx: number, newLabel: string) => {
    setPlaceholders((prev) =>
      prev.map((p, i) => (i === idx ? { ...p, label: newLabel } : p))
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={() => setCreateLayoutModalOpen(false)}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-layout-title"
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg bg-white dark:bg-[#0f172a] rounded-2xl shadow-2xl border border-slate-200 dark:border-white/10 overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <LayoutTemplate className="w-4 h-4" />
            </div>
            <div>
              <h2 id="create-layout-title" className="text-base font-semibold text-slate-900 dark:text-white">
                Create Layout from Selection
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Save {selectedElements.length} selected element(s) into your reusable Layout Library
              </p>
            </div>
          </div>
          <button
            onClick={() => setCreateLayoutModalOpen(false)}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4 overflow-y-auto">
          {/* Name & Category */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Layout Name
            </label>
            <input
              type="text"
              value={layoutName}
              onChange={(e) => setLayoutName(e.target.value)}
              placeholder="e.g. Science Activity Card, Math Problem Set..."
              className="w-full px-3 py-2 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg text-sm text-slate-900 dark:text-white outline-none focus:border-indigo-500 transition-colors"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as CustomLayoutCategory)}
                className="w-full px-3 py-2 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg text-xs text-slate-900 dark:text-white outline-none focus:border-indigo-500"
              >
                <option value="chapter">Chapter & Opener</option>
                <option value="mathematics">Mathematics</option>
                <option value="science">Science & Discovery</option>
                <option value="interactive">Interactive Learning</option>
                <option value="worksheet">Worksheet & Practice</option>
                <option value="assessment">Assessment & Review</option>
                <option value="general">General Layout</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Elements Included
              </label>
              <div className="flex items-center gap-1 px-3 py-2 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg text-xs text-slate-600 dark:text-slate-300">
                <Layers className="w-3.5 h-3.5 text-indigo-500" />
                <span>{selectedElements.length} element(s) grouped</span>
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Description (Optional)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Standard 2-column exercise section with answer lines"
              className="w-full px-3 py-2 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg text-xs text-slate-900 dark:text-white outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          {/* Placeholders List */}
          {placeholders.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-white/10">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                  Editable Content Placeholders ({placeholders.length})
                </span>
                <span className="text-[10px] text-slate-400">
                  Exposed for quick editing when reused
                </span>
              </div>

              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {placeholders.map((p, idx) => (
                  <div
                    key={p.key}
                    className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/5 rounded-lg text-xs"
                  >
                    <span className="px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-mono text-[9px] uppercase">
                      {p.type}
                    </span>
                    <input
                      type="text"
                      value={p.label}
                      onChange={(e) => handleUpdatePlaceholderLabel(idx, e.target.value)}
                      className="flex-1 bg-transparent border-b border-transparent focus:border-indigo-500 outline-none text-slate-800 dark:text-slate-200 px-1 py-0.5 text-xs"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-slate-100 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02]">
          <button
            onClick={() => setCreateLayoutModalOpen(false)}
            className="px-4 py-2 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-white/10 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!layoutName.trim() || selectedElements.length === 0}
            className="px-4 py-2 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:pointer-events-none shadow-md shadow-indigo-600/20 flex items-center gap-1.5 transition-all active:scale-95"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Save to Layout Library</span>
          </button>
        </div>
      </div>
    </div>
  );
};
