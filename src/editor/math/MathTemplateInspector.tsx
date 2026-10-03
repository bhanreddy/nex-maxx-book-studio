/* eslint-disable @typescript-eslint/no-explicit-any */
// ============================================================================
// NEX MAXX BOOK STUDIO - MATH TEMPLATE INSPECTOR & PROPERTY PANEL
// Dedicated right-side editor for parametric math components (Classes 1 to 5)
// ============================================================================

import React, { useState } from "react";
import { PageElement } from "../../domain/element/types";
import { getMathTemplate, saveCustomMathTemplate } from "./mathRegistry";
import { useEditorStore } from "../stores/editorStore";
import { useUiStore } from "../stores/uiStore";
import { generateSimilarQuestion } from "./mathAlgorithms";
import { MathAnswerMode, MathStyleVariant } from "./types";
import {
  Copy,
  Star,
  RefreshCw,
  Eye,
  EyeOff,
} from "lucide-react";
import { MathDesignControls } from "./MathDesignControls";
import { MathDataFields } from "./MathDataFields";
import { updateMathTemplateData } from "./mathActions";

interface MathTemplateInspectorProps {
  element: PageElement;
}

export const MathTemplateInspector: React.FC<MathTemplateInspectorProps> = ({ element }) => {
  const { updateElementContent, duplicateSelectedElements } = useEditorStore();
  const { showToast } = useUiStore();

  const mathTemplateId =
    element.content?.mathTemplateId || element.presetId || "math-place-value-indian";
  const template = getMathTemplate(mathTemplateId);

  const mathData = element.content?.mathData || element.content || {};
  const currentMode: MathAnswerMode = element.content?.mathMode || "teacher";
  const currentVariant: MathStyleVariant =
    (element.content?.styleVariant as MathStyleVariant) || "color-coded";

  const [dupPromptOpen, setDupPromptOpen] = useState(false);
  const [newDupNumber, setNewDupNumber] = useState("");
  const [customTemplateName, setCustomTemplateName] = useState("");
  const [saveModalOpen, setSaveModalOpen] = useState(false);

  if (!template) {
    return (
      <div className="p-3 text-xs text-slate-500 border-b border-slate-200 dark:border-white/10">
        Math Template not recognized: {mathTemplateId}
      </div>
    );
  }

  const handleUpdate = (patch: Record<string, any>) => {
    updateMathTemplateData(element.id, patch);
  };

  const handleModeChange = (mode: MathAnswerMode) => {
    updateElementContent(element.id, { mathMode: mode });
  };

  const handleVariantChange = (variant: MathStyleVariant) => {
    updateElementContent(element.id, { styleVariant: variant });
  };

  // Section 34: Local Deterministic Random Question Generator ("Generate Similar")
  const handleGenerateSimilar = () => {
    const rules = {
      digitCount: String(mathData.number || mathData.num1 || 400).length || 3,
      allowCarry: true,
      allowBorrow: true,
    };
    const generated = template.generator ? template.generator(rules) : Object.fromEntries(Object.entries(generateSimilarQuestion(template.category, rules)).filter(([key]) => key in mathData));
    if (!Object.keys(generated).length) {
      showToast({ type: "info", title: "Edit this template’s content", message: "Use the fields below to create your own question." });
      return;
    }
    handleUpdate(generated);
    showToast({
      type: "success",
      title: "Generated Similar Question",
      message: "Mathematical values recalculated successfully.",
    });
  };

  // Section 32: Smart Duplication with New Data
  const handleDuplicateWithNewData = () => {
    const parsed = parseInt(newDupNumber.replace(/[^0-9]/g, ""), 10);
    if (isNaN(parsed)) return;

    // First clone the element
    duplicateSelectedElements();
    const newId = useEditorStore.getState().selectedElementIds[0];
    if (newId && newId !== element.id) {
      useEditorStore.getState().updateElementContent(newId, {
        mathData: { ...mathData, ["number" in mathData ? "number" : "num1"]: parsed },
        ["number" in mathData ? "number" : "num1"]: parsed,
      });
    }

    setDupPromptOpen(false);
    setNewDupNumber("");
    showToast({
      type: "success",
      title: "Duplicated with New Data",
      message: `Created duplicate with value ${parsed}`,
    });
  };

  // Section 40: Save to My Templates
  const handleSaveToMyTemplates = () => {
    const name = customTemplateName.trim() || `${template.name} (Custom)`;
    saveCustomMathTemplate({
      id: `custom-math-${Date.now()}`,
      name,
      baseTemplateId: template.id,
      category: template.category,
      grades: template.grades,
      data: mathData,
      styleVariant: currentVariant,
      createdAt: new Date().toISOString(),
      appearance: element.content.mathAppearance,
      overrides: element.content.mathOverrides,
      width: element.transform.width,
      height: element.transform.height,
      mode: currentMode,
    });
    setSaveModalOpen(false);
    setCustomTemplateName("");
    showToast({
      type: "success",
      title: "Saved as Custom Template",
      message: `Added "${name}" to My Templates`,
    });
  };

  return (
    <fieldset disabled={element.locked} className="math-inspector p-3 border-b border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02] text-xs space-y-3 select-none">
      {/* 1. Header with Template Info */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-200/80 dark:border-white/10">
        <div>
          <span className="text-[9px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 block font-mono">
            MATH COMPONENT • CLASS {template.grades.join(", ")}
          </span>
          <h4 className="font-bold text-slate-800 dark:text-slate-100 text-xs">
            {template.name}
          </h4>
        </div>
        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 capitalize">
          {template.category}
        </span>
      </div>

      <MathDesignControls element={element} template={template} />

      {/* 2. Teacher Mode vs Student Mode Toggle (Section 33) */}
      <div>
        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block mb-1">
          Answer Mode
        </label>
        <div className="grid grid-cols-2 gap-1 p-0.5 rounded-lg bg-slate-200/70 dark:bg-white/10">
          <button
            onClick={() => handleModeChange("teacher")}
            className={`py-1 px-2 rounded-md font-semibold text-[10.5px] transition-all flex items-center justify-center gap-1 ${
              currentMode === "teacher"
                ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs font-bold"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <Eye className="w-3 h-3" />
            <span>Teacher (Solved)</span>
          </button>
          <button
            onClick={() => handleModeChange("student")}
            className={`py-1 px-2 rounded-md font-semibold text-[10.5px] transition-all flex items-center justify-center gap-1 ${
              currentMode === "student"
                ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs font-bold"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <EyeOff className="w-3 h-3" />
            <span>Student (Blanks)</span>
          </button>
        </div>
      </div>

      {/* 3. Style Variant Switcher (Section 28: Clean | Colour Coded | Visual) */}
      <div>
        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block mb-1">
          Style Variant
        </label>
        <div className="grid grid-cols-3 gap-1">
          {template.styleVariants.map((v) => (
            <button
              key={v}
              onClick={() => handleVariantChange(v)}
              className={`py-1 px-1.5 rounded-md font-semibold text-[10px] capitalize border transition-all ${
                currentVariant === v
                  ? "bg-indigo-600 text-white border-indigo-700 shadow-xs"
                  : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50"
              }`}
            >
              {v.replace("-", " ")}
            </button>
          ))}
        </div>
      </div>

      {/* 4. Dynamic Mathematical Fields (Section 30: CONTENT & OPTIONS) */}
      <div className="space-y-2 pt-1 border-t border-slate-200/80 dark:border-white/10">
        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block">
          Mathematical Content
        </label>

        <MathDataFields key={element.id} template={template} data={mathData} onUpdate={handleUpdate} />
        {Array.isArray(mathData.questions) && template.measureHeight && <p className="text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">Questions and their answer keys are authored separately. Update the answer when you change a question.</p>}
      </div>

      {/* 5. Smart Actions: Generate Similar, Duplicate with New Data, Save Template */}
      <div className="pt-2 border-t border-slate-200/80 dark:border-white/10 space-y-1.5">
        {/* Local Deterministic Generator */}
        {(!template.measureHeight || template.generator) && <button
          onClick={handleGenerateSimilar}
          className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-semibold text-xs border border-indigo-200 dark:border-indigo-800 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Generate Similar (Local)</span>
        </button>}

        {/* Duplicate with New Data */}
        {dupPromptOpen && ("number" in mathData || "num1" in mathData) ? (
          <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 space-y-1.5">
            <span className="text-[10px] font-bold text-indigo-700 dark:text-indigo-300 block">
              Enter New Number:
            </span>
            <div className="flex gap-1">
              <input
                type="text"
                autoFocus
                placeholder="e.g. 91,508"
                value={newDupNumber}
                onChange={(e) => setNewDupNumber(e.target.value)}
                className="flex-1 px-2 py-1 text-xs rounded border border-indigo-300 bg-white dark:bg-slate-900 font-mono outline-none"
              />
              <button
                onClick={handleDuplicateWithNewData}
                className="px-2.5 py-1 rounded bg-indigo-600 text-white font-bold text-xs"
              >
                Apply
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => ("number" in mathData || "num1" in mathData) ? setDupPromptOpen(true) : duplicateSelectedElements()}
            className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 font-semibold text-xs transition-colors"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>{template.measureHeight ? "Duplicate this exercise" : "Duplicate with New Data..."}</span>
          </button>
        )}

        {/* Save to My Templates */}
        {saveModalOpen ? (
          <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 space-y-1.5">
            <span className="text-[10px] font-bold text-amber-800 dark:text-amber-200 block">
              Custom Template Name:
            </span>
            <div className="flex gap-1">
              <input
                type="text"
                autoFocus
                placeholder="My Custom Place Value..."
                value={customTemplateName}
                onChange={(e) => setCustomTemplateName(e.target.value)}
                className="flex-1 px-2 py-1 text-xs rounded border border-amber-300 bg-white dark:bg-slate-900 outline-none"
              />
              <button
                onClick={handleSaveToMyTemplates}
                className="px-2.5 py-1 rounded bg-amber-600 text-white font-bold text-xs"
              >
                Save
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setSaveModalOpen(true)}
            className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 text-slate-600 dark:text-slate-400 font-medium text-xs transition-colors"
          >
            <Star className="w-3.5 h-3.5" />
            <span>Save as Custom Template</span>
          </button>
        )}
      </div>
    </fieldset>
  );
};
