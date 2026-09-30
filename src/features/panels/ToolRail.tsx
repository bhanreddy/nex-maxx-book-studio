"use client";

import React, { useState } from "react";
import { useUiStore, ToolType } from "../../editor/stores/uiStore";
import { useEditorStore } from "../../editor/stores/editorStore";
import {
  MousePointer,
  Square,
  Circle,
  Star,
  Minus,
  ArrowRight,
  Type,
  Image as ImageIcon,
  PenTool,
  Table as TableIcon,
  Crop,
  Pipette,
  Ruler,
  Hand,
  ZoomIn,
  Activity,
  Brush,
  Eraser,
  Stamp,
  Sparkles,
  Maximize2,
  Scissors,
  Wand2,
  ScissorsLineDashed,
  Layers,
  MoreHorizontal,
} from "lucide-react";

export const ToolRail: React.FC = () => {
  const {
    activeStudio,
    activeTool,
    setActiveTool,
    activeShapeType,
    setActiveShapeType,
    setAiModalOpen,
    setAiActiveTab,
  } = useUiStore();

  const { addVectorShape } = useEditorStore();
  const [shapeMenuOpen, setShapeMenuOpen] = useState(false);
  const [moreToolsOpen, setMoreToolsOpen] = useState(false);

  // Studio-specific tool sets
  const getToolsForStudio = (): {
    id: ToolType;
    label: string;
    sublabel?: string;
    beginnerTooltip: string;
    proTooltip: string;
    shortcut: string;
    icon: React.ComponentType<{ className?: string }>;
    action?: () => void;
  }[] => {
    if (activeStudio === "VECTOR") {
      return [
        { id: "move", label: "Move", beginnerTooltip: "Select, move, and transform vector curves.", proTooltip: "Move Tool", shortcut: "V", icon: MousePointer },
        { id: "node", label: "Node", beginnerTooltip: "Adjust Bézier control points and handles.", proTooltip: "Node Bézier Tool", shortcut: "A", icon: Activity },
        { id: "pen", label: "Pen", beginnerTooltip: "Draw precise Bézier curves and anchor paths.", proTooltip: "Pen Tool", shortcut: "P", icon: PenTool },
        { id: "pencil", label: "Pencil", beginnerTooltip: "Freehand smooth vector sketching.", proTooltip: "Pencil Tool", shortcut: "N", icon: Brush },
        { id: "shape", label: "Shape", beginnerTooltip: "Draw geometric primitives and vectors.", proTooltip: "Vector Shapes", shortcut: "M", icon: Square },
        { id: "corner", label: "Corner", beginnerTooltip: "Fillet and round sharp vector corners.", proTooltip: "Corner Fillet Tool", shortcut: "C", icon: ScissorsLineDashed },
        { id: "imageTrace", label: "Trace", beginnerTooltip: "Convert raster sketches to vector paths.", proTooltip: "Auto Trace", shortcut: "T", icon: Wand2 },
        { id: "measure", label: "Measure", beginnerTooltip: "Inspect exact point distances and angles.", proTooltip: "Measure Tool", shortcut: "R", icon: Ruler },
        { id: "hand", label: "Pan", beginnerTooltip: "Pan freely across the vector workspace.", proTooltip: "Pan Tool", shortcut: "H", icon: Hand },
        { id: "zoom", label: "Zoom", beginnerTooltip: "Magnify canvas to inspect precise anchor nodes.", proTooltip: "Zoom Tool", shortcut: "Z", icon: ZoomIn },
      ];
    }

    if (activeStudio === "PIXEL") {
      return [
        { id: "move", label: "Move", beginnerTooltip: "Select and reposition pixel layers.", proTooltip: "Move Tool", shortcut: "V", icon: MousePointer },
        { id: "brush", label: "Brush", beginnerTooltip: "Paint with customizable soft/hard brushes.", proTooltip: "Paint Brush", shortcut: "B", icon: Brush },
        { id: "eraser", label: "Eraser", beginnerTooltip: "Erase raster pixels cleanly.", proTooltip: "Eraser Tool", shortcut: "E", icon: Eraser },
        { id: "cloneStamp", label: "Clone", beginnerTooltip: "Sample and duplicate texture regions.", proTooltip: "Clone Stamp", shortcut: "S", icon: Stamp },
        { id: "healing", label: "Heal", beginnerTooltip: "Content-aware healing and inpainting.", proTooltip: "Healing Brush", shortcut: "J", icon: Sparkles },
        { id: "marqueeSelect", label: "Select", beginnerTooltip: "Make rectangular or elliptical pixel selections.", proTooltip: "Marquee Selection", shortcut: "M", icon: Square },
        { id: "crop", label: "Crop", beginnerTooltip: "Trim and rotate the raster canvas.", proTooltip: "Crop Tool", shortcut: "C", icon: Crop },
        { id: "eyedropper", label: "Sample", beginnerTooltip: "Pick colors directly from canvas pixels.", proTooltip: "Eyedropper", shortcut: "I", icon: Pipette },
        { id: "hand", label: "Pan", beginnerTooltip: "Pan freely across high-res pixel canvas.", proTooltip: "Pan Tool", shortcut: "H", icon: Hand },
        { id: "zoom", label: "Zoom", beginnerTooltip: "Zoom in to pixel-level magnification.", proTooltip: "Zoom Tool", shortcut: "Z", icon: ZoomIn },
      ];
    }

    if (activeStudio === "AI") {
      return [
        { id: "move", label: "Select", beginnerTooltip: "Select elements for AI enhancement.", proTooltip: "Select Element", shortcut: "V", icon: MousePointer },
        {
          id: "aiGenerateImage",
          label: "Image",
          beginnerTooltip: "Generate textbook illustrations with AI prompts.",
          proTooltip: "Text-to-Image Generation",
          shortcut: "I",
          icon: ImageIcon,
          action: () => {
            setAiActiveTab("generate");
            setAiModalOpen(true);
          },
        },
        {
          id: "aiGenerateVector",
          label: "Vector",
          beginnerTooltip: "Generate clean SVG icons and diagrams.",
          proTooltip: "Text-to-Vector SVG",
          shortcut: "V",
          icon: Sparkles,
          action: () => {
            setAiActiveTab("vector");
            setAiModalOpen(true);
          },
        },
        {
          id: "aiExpand",
          label: "Expand",
          beginnerTooltip: "Outpaint and expand image canvas context.",
          proTooltip: "Generative Outpainting",
          shortcut: "X",
          icon: Maximize2,
          action: () => {
            setAiActiveTab("expand");
            setAiModalOpen(true);
          },
        },
        {
          id: "aiRemoveBg",
          label: "Cutout",
          beginnerTooltip: "Isolate subject and remove image background.",
          proTooltip: "Neural Background Removal",
          shortcut: "R",
          icon: Scissors,
          action: () => {
            setAiActiveTab("removeBg");
            setAiModalOpen(true);
          },
        },
        {
          id: "aiUpscale",
          label: "Upscale",
          beginnerTooltip: "Enhance resolution up to 4x for 300 DPI print.",
          proTooltip: "Super Resolution Upscale",
          shortcut: "U",
          icon: ZoomIn,
          action: () => {
            setAiActiveTab("upscale");
            setAiModalOpen(true);
          },
        },
      ];
    }

    // Default Flagship Layout Studio: Directives 4, 6, 34
    return [
      {
        id: "move",
        label: "Move",
        beginnerTooltip: "Select, drag, resize, and rotate objects.",
        proTooltip: "Pointer & Transform Tool",
        shortcut: "V",
        icon: MousePointer,
      },
      {
        id: "frameText",
        label: "Text",
        beginnerTooltip: "Add a text area that can automatically flow across pages.",
        proTooltip: "Linked Frame Text Tool",
        shortcut: "T",
        icon: Type,
      },
      {
        id: "pictureFrame",
        label: "Image",
        beginnerTooltip: "Insert pictures, diagrams, and illustrations.",
        proTooltip: "Picture Frame Slot",
        shortcut: "F",
        icon: ImageIcon,
      },
      {
        id: "shape",
        label: "Shape",
        beginnerTooltip: "Draw rectangles, badges, banners, and stars.",
        proTooltip: "Vector Primitives",
        shortcut: "M",
        icon: Square,
      },
      {
        id: "activity",
        label: "Activity",
        beginnerTooltip: "Insert hands-on exercises, experiments, or question cards.",
        proTooltip: "Curriculum Activity Card",
        shortcut: "A",
        icon: Activity,
        action: () => {
          // Open sidebar to presets tab with 'activities' category
          useUiStore.getState().setLeftPanelOpen(true);
          useUiStore.getState().setLeftPanelTab("templates");
          useUiStore.getState().setPresetCategoryFilter("activities");
        },
      },
      {
        id: "table",
        label: "Table",
        beginnerTooltip: "Insert tables for schedules, rubrics, and data.",
        proTooltip: "Textbook Grid Table",
        shortcut: "Tab",
        icon: TableIcon,
      },
      {
        id: "layout",
        label: "Layout",
        beginnerTooltip: "Try alternative balanced arrangements for this page.",
        proTooltip: "Adaptive Layout Gallery",
        shortcut: "L",
        icon: Sparkles,
        action: () => {
          useUiStore.getState().setActiveLayoutGalleryOpen(true);
        },
      },
      {
        id: "pen",
        label: "Pen",
        beginnerTooltip: "Draw custom smooth curves, arrows, and dividers.",
        proTooltip: "Vector Pen Tool",
        shortcut: "P",
        icon: PenTool,
      },
      {
        id: "hand",
        label: "Pan",
        beginnerTooltip: "Hold Space or click to drag the canvas view.",
        proTooltip: "Pan Canvas Tool",
        shortcut: "H",
        icon: Hand,
      },
      {
        id: "zoom",
        label: "Zoom",
        beginnerTooltip: "Zoom in to check typography and margins.",
        proTooltip: "Magnification Tool",
        shortcut: "Z",
        icon: ZoomIn,
      },
    ];
  };

  const tools = getToolsForStudio();
  const everydayStudio = activeStudio !== "VECTOR" && activeStudio !== "PIXEL" && activeStudio !== "AI";
  const primaryToolIds = ["move", "frameText", "pictureFrame", "shape", "table", "hand"];
  const overflowToolIds = ["pen", "activity", "layout", "zoom"];
  const primaryTools = everydayStudio ? tools.filter((tool) => primaryToolIds.includes(tool.id)) : tools;
  const overflowTools = everydayStudio ? tools.filter((tool) => overflowToolIds.includes(tool.id)) : [];

  const handleToolClick = (tool: (typeof tools)[0]) => {
    if (tool.action) {
      tool.action();
      return;
    }

    if (tool.id === "shape") {
      setShapeMenuOpen(!shapeMenuOpen);
      setActiveTool("shape");
    } else {
      setShapeMenuOpen(false);
      setActiveTool(tool.id);
    }
  };

  return (
    <div className="w-14 h-full bg-[#080b11] border-r border-white/[0.08] flex flex-col items-center py-2.5 text-slate-300 z-20 select-none relative font-sans">
      <div className="flex flex-col gap-1.5 w-full px-1.5 overflow-y-auto overflow-x-hidden no-scrollbar">
        {primaryTools.map((t) => {
          const Icon = t.icon;
          const isActive = activeTool === t.id;

          return (
            <div key={t.id} className="relative group flex flex-col items-center justify-center">
              <button
                onClick={() => handleToolClick(t)}
                className={`relative w-10 h-10 rounded-xl flex items-center justify-center transition-transform duration-100 active:scale-[0.97] ${
                  isActive
                    ? "bg-[#1c1814] text-[#f3e6c8] shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_1px_2px_rgba(0,0,0,0.4)] border border-[#d7c49c]/45"
                    : "text-slate-400 hover:text-slate-100 hover:bg-white/[0.06]"
                }`}
                title={`${t.label} (${t.shortcut})`}
              >
                {/* Active Indicator Bar on Left */}
                {isActive && (
                  <span className="absolute left-0 top-2 bottom-2 w-0.5 rounded-r bg-[#d7c49c]" />
                )}
                <Icon className="w-4 h-4 stroke-[1.8]" />
              </button>

              {/* Rich beginner tooltip on hover */}
              <div className="absolute left-16 top-1/2 -translate-y-1/2 bg-[#0d1322] text-white px-3.5 py-2.5 rounded-xl shadow-[0_12px_32px_rgba(0,0,0,0.5)] border border-white/15 whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150 z-50 flex flex-col gap-1.5 min-w-[200px]">
                <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-1.5">
                  <span className="text-xs font-semibold text-indigo-300 tracking-wide">{t.label}</span>
                  <span className="font-mono text-[9px] text-slate-300 bg-white/10 px-1.5 py-0.5 rounded border border-white/10 font-bold">
                    {t.shortcut}
                  </span>
                </div>
                <p className="text-[11px] text-slate-200 leading-snug whitespace-normal max-w-[210px]">
                  {t.beginnerTooltip}
                </p>
                <div className="flex items-center justify-between text-[9px] text-slate-400 font-mono tracking-tight pt-0.5">
                  <span className="text-indigo-400 font-semibold">Pro:</span>
                  <span>{t.proTooltip}</span>
                </div>
              </div>
            </div>
          );
        })}
        {overflowTools.length > 0 && (
          <div className="relative">
            <button
              onClick={() => setMoreToolsOpen((open) => !open)}
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-transform duration-100 active:scale-[0.97] ${
                moreToolsOpen || overflowTools.some((tool) => tool.id === activeTool)
                  ? "bg-[#1c1814] text-[#f3e6c8] border border-[#d7c49c]/45"
                  : "text-slate-400 hover:text-slate-100 hover:bg-white/[0.06]"
              }`}
              title="More tools"
              aria-expanded={moreToolsOpen}
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
            {moreToolsOpen && (
              <div className="absolute left-16 top-0 bg-[#0f172a] border border-white/15 rounded-2xl p-1.5 shadow-[0_20px_45px_rgba(0,0,0,0.6)] z-50 flex flex-col gap-0.5 w-44">
                {overflowTools.map((tool) => {
                  const Icon = tool.icon;
                  return (
                    <button
                      key={tool.id}
                      onClick={() => {
                        handleToolClick(tool);
                        setMoreToolsOpen(false);
                      }}
                      className={`flex items-center gap-2 min-h-9 px-2.5 rounded-lg text-[13px] text-left ${
                        activeTool === tool.id
                          ? "bg-white/10 text-white"
                          : "text-slate-300 hover:bg-white/10"
                      }`}
                    >
                      <Icon className="w-4 h-4 text-indigo-300" />
                      <span>{tool.label}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Floating Shape Submenu when shape tool clicked */}
      {shapeMenuOpen && (
        <div className="absolute left-16 top-24 bg-[#0f172a] border border-white/15 rounded-2xl p-2 shadow-[0_20px_45px_rgba(0,0,0,0.6)] z-50 flex flex-col gap-0.5 w-48">
          <div className="px-2 py-1.5 mb-1 border-b border-white/10">
            <span className="text-[13px] font-medium text-slate-200">Shapes</span>
          </div>
          {[
            { id: "rectangle", label: "Rectangle", icon: Square },
            { id: "circle", label: "Circle", icon: Circle },
            { id: "star", label: "5-Point Star", icon: Star },
            { id: "polygon", label: "Hexagon Polygon", icon: Layers },
            { id: "line", label: "Straight Line", icon: Minus },
            { id: "arrow", label: "Vector Arrow", icon: ArrowRight },
          ].map((s) => {
            const SIcon = s.icon;
            return (
              <button
                key={s.id}
                onClick={() => {
                  setActiveShapeType(s.id as typeof activeShapeType);
                  addVectorShape(s.id as typeof activeShapeType);
                  setShapeMenuOpen(false);
                }}
                className={`flex items-center gap-2.5 min-h-9 px-2.5 rounded-lg text-[13px] hover:bg-white/10 text-left active:scale-[0.97] ${
                  activeShapeType === s.id ? "bg-indigo-600/30 text-indigo-200 border border-indigo-500/40" : "text-slate-300"
                }`}
              >
                <SIcon className="w-4 h-4 text-indigo-400" />
                <span className="font-medium">{s.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
