"use client";

import React, { useState } from "react";
import { useUiStore } from "../../editor/stores/uiStore";
import { useEditorStore } from "../../editor/stores/editorStore";
import { EducationalAIProvider } from "../../editor/ai/aiProvider";
import {
  AIAssetStyle,
  AIAspectRatio,
  AIGenerationMetadata,
} from "../../domain/creative/types";
import {
  Sparkles,
  Wand2,
  Image as ImageIcon,
  Shapes,
  Maximize2,
  Scissors,
  ZoomIn,
  RefreshCw,
  CheckCircle2,
  X,
  History,
} from "lucide-react";

export const AIStudioPanel: React.FC = () => {
  const {
    aiModalOpen,
    setAiModalOpen,
    aiActiveTab,
    setAiActiveTab,
    showToast,
  } = useUiStore();

  const {
    selectedElementIds,
    elements,
    addAIGeneratedElement,
    expandImageToFrame,
    removeImageBackground,
    upscaleImage,
  } = useEditorStore();

  const [prompt, setPrompt] = useState(
    "Cross-section of a plant leaf showing stomata and chloroplasts for Grade 5"
  );
  const [style, setStyle] = useState<AIAssetStyle>("scientific-diagram");
  const [aspectRatio, setAspectRatio] = useState<AIAspectRatio>("4:3");
  const [isGenerating, setIsGenerating] = useState(false);
  const [latestGeneration, setLatestGeneration] = useState<AIGenerationMetadata | null>(null);
  const [generationHistory, setGenerationHistory] = useState<AIGenerationMetadata[]>([]);

  if (!aiModalOpen) return null;

  const singleSelectedId = selectedElementIds.length === 1 ? selectedElementIds[0] : null;
  const singleElement = singleSelectedId ? elements[singleSelectedId] : null;

  const handleGenerateImage = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    try {
      const provider = new EducationalAIProvider();
      const meta = await provider.generateImage({
        prompt: prompt.trim(),
        style,
        aspectRatio,
      });

      setLatestGeneration(meta);
      setGenerationHistory((prev) => [meta, ...prev]);

      // If user has an empty picture frame or image selected, insert into it
      addAIGeneratedElement({
        imageUrl: meta.variations?.[0],
        isVector: false,
        metadata: meta,
        targetFrameId: singleElement?.type === "pictureFrame" ? singleElement.id : undefined,
      });
    } catch {
      showToast({
        type: "error",
        title: "Generation Error",
        message: "Failed to generate educational media",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateVector = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    try {
      const provider = new EducationalAIProvider();
      const { svgContent, metadata } = await provider.generateVector({
        prompt: prompt.trim(),
        style,
      });

      setLatestGeneration(metadata);
      setGenerationHistory((prev) => [metadata, ...prev]);

      addAIGeneratedElement({
        svgContent,
        isVector: true,
        metadata,
      });
    } catch {
      showToast({
        type: "error",
        title: "Vector Generation Error",
        message: "Failed to generate vector illustration",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 select-none"
      onClick={() => setAiModalOpen(false)}
    >
      <div
        className="w-full max-w-3xl bg-[#0e131d] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#121926]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-rose-600 to-amber-600 flex items-center justify-center shadow-lg">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                NEX MAXX AI Studio
                <span className="text-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/30 px-1.5 py-0.5 rounded font-mono">
                  Curriculum Engine
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Non-destructive generative illustrations, vector diagrams, and canvas expansion
              </p>
            </div>
          </div>
          <button
            onClick={() => setAiModalOpen(false)}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-white/5"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Studio Subtabs */}
        <div className="flex items-center gap-2 px-6 py-2.5 bg-black/30 border-b border-white/5 overflow-x-auto">
          {[
            { id: "generate", label: "Generate Image", icon: ImageIcon },
            { id: "vector", label: "Generate Vector", icon: Shapes },
            { id: "expand", label: "Generative Expand", icon: Maximize2 },
            { id: "removeBg", label: "Remove Background", icon: Scissors },
            { id: "upscale", label: "Super Resolution", icon: ZoomIn },
            { id: "history", label: "History", icon: History },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = aiActiveTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setAiActiveTab(tab.id as typeof aiActiveTab)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  active
                    ? "bg-rose-600 text-white shadow-md shadow-rose-900/30"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 custom-scrollbar">
          {/* TAB 1: GENERATE IMAGE */}
          {aiActiveTab === "generate" && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Curriculum Prompt
                </label>
                <textarea
                  rows={3}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe the educational concept, grade level, and visual elements..."
                  className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-xs text-slate-100 outline-none focus:border-rose-500/50 resize-none font-sans"
                />
              </div>

              {/* Curriculum Presets */}
              <div>
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                  Educational Style Presets
                </span>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "scientific-diagram", label: "Scientific Diagram", desc: "Clean labeled biological & chemical graphics" },
                    { id: "educational-illustration", label: "Textbook Concept", desc: "Textbook chapter opener artwork" },
                    { id: "cartoon-mascot", label: "Primary Mascot", desc: "Friendly animated guide for Nursery–G2" },
                    { id: "flat-math", label: "Mathematics Proof", desc: "Geometry, fractions, coordinate axes" },
                    { id: "watercolor", label: "Literature Watercolor", desc: "Soft storybook & poem scenery" },
                    { id: "line-art-coloring", label: "Workbook Line Art", desc: "Black & white activity outlines" },
                  ].map((st) => (
                    <button
                      key={st.id}
                      onClick={() => setStyle(st.id as AIAssetStyle)}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        style === st.id
                          ? "bg-rose-950/40 border-rose-500/60 text-rose-200"
                          : "bg-black/20 border-white/5 text-slate-400 hover:border-white/15"
                      }`}
                    >
                      <span className="font-semibold text-xs block text-slate-200">{st.label}</span>
                      <span className="text-[10px] text-slate-500 block leading-tight mt-0.5">
                        {st.desc}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Aspect Ratio */}
              <div>
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                  Aspect Ratio
                </span>
                <div className="flex gap-2">
                  {(["4:3", "16:9", "1:1", "3:4"] as const).map((ar) => (
                    <button
                      key={ar}
                      onClick={() => setAspectRatio(ar)}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-mono transition-all ${
                        aspectRatio === ar
                          ? "bg-rose-600/30 border-rose-500 text-rose-200 font-bold"
                          : "bg-black/20 border-white/5 text-slate-400 hover:text-white"
                      }`}
                    >
                      {ar}
                    </button>
                  ))}
                </div>
              </div>

              {/* Target Frame Detection Notification */}
              {singleElement && singleElement.type === "pictureFrame" && (
                <div className="p-3 bg-emerald-950/30 border border-emerald-500/40 rounded-xl flex items-center gap-2 text-xs text-emerald-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>
                    Selected Picture Frame: <strong>{singleElement.displayName}</strong>. Generated artwork will fill this frame automatically.
                  </span>
                </div>
              )}

              {/* Action Button */}
              <button
                onClick={handleGenerateImage}
                disabled={isGenerating}
                className="w-full py-3 bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-rose-900/40 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> Generating High-Resolution Image...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4" /> Generate Educational Image (12 Credits)
                  </>
                )}
              </button>
            </div>
          )}

          {/* TAB 2: GENERATE VECTOR */}
          {aiActiveTab === "vector" && (
            <div className="space-y-4">
              <div className="p-3 bg-indigo-950/30 border border-indigo-500/30 rounded-xl text-xs text-indigo-300 leading-relaxed">
                ✨ <strong>True Semantic Vector Output:</strong> Generates editable SVG vector groups with scalable Bézier paths, labels, and curves that can be directly manipulated with the <strong>Node Tool</strong>.
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Vector Diagram Prompt
                </label>
                <input
                  type="text"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="e.g. Simple colorful water cycle diagram with evaporation arrows for Grade 4"
                  className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-xs text-slate-100 outline-none focus:border-indigo-500/50"
                />
              </div>

              {/* Suggested Curriculum Prompts */}
              <div className="flex flex-wrap gap-1.5">
                {[
                  "Photosynthesis Leaf with CO2 and O2 inflow arrows",
                  "Water cycle diagram with ocean, evaporation and rain clouds",
                  "Plant cell organelles diagram with nucleus and cell wall",
                  "Human digestive tract pathway with stomach and intestines",
                  "Fraction circle model showing 3/4 shaded in orange",
                ].map((sample, idx) => (
                  <button
                    key={idx}
                    onClick={() => setPrompt(sample)}
                    className="px-2.5 py-1 bg-white/5 hover:bg-white/10 border border-white/5 rounded-full text-[10px] text-slate-400 hover:text-white"
                  >
                    + {sample}
                  </button>
                ))}
              </div>

              <button
                onClick={handleGenerateVector}
                disabled={isGenerating}
                className="w-full py-3 bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-500 hover:to-sky-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-indigo-900/40 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> Synthesizing Vector Paths...
                  </>
                ) : (
                  <>
                    <Shapes className="w-4 h-4" /> Generate Editable Vector SVG (18 Credits)
                  </>
                )}
              </button>
            </div>
          )}

          {/* TAB 3: GENERATIVE EXPAND */}
          {aiActiveTab === "expand" && (
            <div className="space-y-4 text-xs">
              <p className="text-slate-400">
                Outpaints surrounding scene boundaries to match target aspect ratio or layout frame without stretching or distorting source artwork.
              </p>
              {singleElement && singleElement.type === "image" ? (
                <div className="p-4 bg-black/30 border border-white/10 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-200">{singleElement.displayName}</span>
                    <span className="font-mono text-slate-400 text-[10px]">
                      {Math.round(singleElement.transform.width)} × {Math.round(singleElement.transform.height)} pt
                    </span>
                  </div>
                  <button
                    onClick={() => expandImageToFrame(singleElement.id)}
                    className="w-full py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-semibold rounded-lg flex items-center justify-center gap-2"
                  >
                    <Maximize2 className="w-4 h-4" /> Expand to Current Bounds
                  </button>
                </div>
              ) : (
                <div className="p-6 text-center text-slate-500 bg-black/20 rounded-xl border border-white/5">
                  Select an image element on the canvas to run Generative Expand.
                </div>
              )}
            </div>
          )}

          {/* TAB 4: REMOVE BACKGROUND */}
          {aiActiveTab === "removeBg" && (
            <div className="space-y-4 text-xs">
              <p className="text-slate-400">
                Automatically detects the foreground educational subject and creates a non-destructive alpha mask without erasing original pixels.
              </p>
              {singleElement && singleElement.type === "image" ? (
                <div className="p-4 bg-black/30 border border-white/10 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-200">{singleElement.displayName}</span>
                  </div>
                  <button
                    onClick={() => removeImageBackground(singleElement.id)}
                    className="w-full py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-semibold rounded-lg flex items-center justify-center gap-2"
                  >
                    <Scissors className="w-4 h-4" /> 1-Click Remove Background (Create Mask)
                  </button>
                </div>
              ) : (
                <div className="p-6 text-center text-slate-500 bg-black/20 rounded-xl border border-white/5">
                  Select an image element on the canvas to remove its background.
                </div>
              )}
            </div>
          )}

          {/* TAB 5: SUPER RESOLUTION */}
          {aiActiveTab === "upscale" && (
            <div className="space-y-4 text-xs">
              <p className="text-slate-400">
                Enhances raster details and upscales effective print resolution to 300+ DPI for commercial textbook press printing.
              </p>
              {singleElement && singleElement.type === "image" ? (
                <div className="p-4 bg-black/30 border border-white/10 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-200">{singleElement.displayName}</span>
                    <span className="text-[10px] text-amber-300 font-mono">
                      Current DPI: {singleElement.metadata?.effectiveDpi || 150} DPI
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => upscaleImage(singleElement.id, 2)}
                      className="py-2 bg-white/10 hover:bg-white/15 rounded-lg text-slate-200 font-medium"
                    >
                      Upscale 2× (300 DPI Target)
                    </button>
                    <button
                      onClick={() => upscaleImage(singleElement.id, 4)}
                      className="py-2 bg-rose-600 hover:bg-rose-500 text-white font-semibold rounded-lg"
                    >
                      Upscale 4× (600 DPI Ultra)
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-6 text-center text-slate-500 bg-black/20 rounded-xl border border-white/5">
                  Select an image element on the canvas to upscale.
                </div>
              )}
            </div>
          )}

          {/* TAB 6: HISTORY */}
          {aiActiveTab === "history" && (
            <div className="space-y-3 text-xs">
              {generationHistory.length === 0 ? (
                <div className="p-8 text-center text-slate-500">
                  No generation history in this session yet.
                </div>
              ) : (
                generationHistory.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 bg-black/30 border border-white/10 rounded-xl flex items-center justify-between"
                  >
                    <div>
                      <span className="font-semibold text-slate-200 block">{item.prompt}</span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {item.style} • Seed: {item.seed} • {new Date(item.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <button
                      onClick={() =>
                        addAIGeneratedElement({
                          imageUrl: item.variations?.[0],
                          svgContent: item.vectorSvgContent,
                          isVector: Boolean(item.vectorSvgContent),
                          metadata: item,
                        })
                      }
                      className="px-2.5 py-1.5 bg-rose-600/30 hover:bg-rose-600/50 text-rose-200 rounded text-[10px] font-medium"
                    >
                      Insert Again
                    </button>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Latest Generation Preview */}
          {latestGeneration && (
            <div className="pt-4 border-t border-white/10">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-2 font-mono">
                Latest Generation Result
              </span>
              <div className="p-3 bg-black/40 border border-rose-500/30 rounded-xl flex items-center gap-4">
                {latestGeneration.vectorSvgContent ? (
                  <div
                    className="w-24 h-20 bg-black/60 rounded-lg overflow-hidden border border-white/10 flex-shrink-0"
                    dangerouslySetInnerHTML={{ __html: latestGeneration.vectorSvgContent }}
                  />
                ) : latestGeneration.variations?.[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={latestGeneration.variations[0]}
                    alt="Preview"
                    className="w-24 h-20 object-cover rounded-lg border border-white/10 flex-shrink-0"
                  />
                ) : null}
                <div className="flex-1 min-w-0">
                  <span className="font-semibold text-slate-200 text-xs block truncate">
                    {latestGeneration.prompt}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono block">
                    Style: {latestGeneration.style} • Model: {latestGeneration.model}
                  </span>
                  <span className="text-[10px] text-emerald-400 block mt-1">
                    ✓ Inserted onto active page spread
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
