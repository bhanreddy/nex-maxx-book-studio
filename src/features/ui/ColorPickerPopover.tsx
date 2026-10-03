"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { Pipette, Check, Plus, X } from "lucide-react";
import { useEditorStore } from "../../editor/stores/editorStore";

interface ColorPickerPopoverProps {
  color: string;
  onChange: (color: string) => void;
  onClose?: () => void;
  label?: string;
  allowAlpha?: boolean;
}

const BRAND_PALETTE = [
  "#0f172a", // Obsidian
  "#1e293b", // Slate 800
  "#475569", // Slate 600
  "#94a3b8", // Slate 400
  "#ffffff", // Crisp White
  "#e11d48", // Rose Red
  "#4f46e5", // Indigo
  "#2563eb", // Royal Blue
  "#0284c7", // Sky Blue
  "#059669", // Emerald Green
  "#10b981", // Bright Emerald
  "#d97706", // Warm Amber
  "#f59e0b", // Golden Amber
  "#7c3aed", // Violet
  "#9333ea", // Purple
  "#db2777", // Pink
];

const RECENT_KEY = "nexmaxx_recent_colors";
const SAVED_KEY = "nexmaxx_saved_colors";

function getLocalList(key: string, defaults: string[]): string[] {
  if (typeof window === "undefined") return defaults;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : defaults;
  } catch {
    return defaults;
  }
}

function saveLocalList(key: string, list: string[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(list));
  } catch {}
}

export const ColorPickerPopover: React.FC<ColorPickerPopoverProps> = ({
  color,
  onChange,
  onClose,
  label = "Color",
  allowAlpha = true,
}) => {
  const popoverRef = useRef<HTMLDivElement>(null);
  const elements = useEditorStore((s) => s.elements);
  const [activeTab, setActiveTab] = useState<"swatches" | "custom">("swatches");
  const [colorMode, setColorMode] = useState<"HEX" | "RGB" | "HSL">("HEX");
  const [hexInput, setHexInput] = useState(color || "#0f172a");

  // Parse RGBA / HEX for alpha
  const [alpha, setAlpha] = useState<number>(() => {
    if (color.startsWith("rgba")) {
      const match = color.match(/rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*([\d.]+)\s*\)/);
      if (match) return Math.round(parseFloat(match[1]) * 100);
    }
    return 100;
  });

  const [recentColors, setRecentColors] = useState<string[]>(() =>
    getLocalList(RECENT_KEY, ["#0f172a", "#1e293b", "#4f46e5", "#e11d48", "#059669"])
  );
  const [savedColors, setSavedColors] = useState<string[]>(() =>
    getLocalList(SAVED_KEY, ["#0f172a", "#4f46e5", "#ffffff"])
  );

  useEffect(() => {
    setHexInput(color || "#0f172a");
  }, [color]);

  // Extract Document Colors
  const documentColors = useMemo(() => {
    const set = new Set<string>();
    Object.values(elements).forEach((el) => {
      if (el.style.color) set.add(el.style.color);
      if (el.style.backgroundColor && el.style.backgroundColor !== "transparent") {
        set.add(el.style.backgroundColor);
      }
      if (el.style.borderColor) set.add(el.style.borderColor);
    });
    return Array.from(set).slice(0, 16);
  }, [elements]);

  // Handle color change and record recent
  const applyColor = (newColor: string) => {
    onChange(newColor);
    setHexInput(newColor);

    // Update recents
    const updated = [newColor, ...recentColors.filter((c) => c.toLowerCase() !== newColor.toLowerCase())].slice(0, 12);
    setRecentColors(updated);
    saveLocalList(RECENT_KEY, updated);
  };

  const handleSaveCurrentColor = () => {
    if (!savedColors.includes(color)) {
      const updated = [...savedColors, color];
      setSavedColors(updated);
      saveLocalList(SAVED_KEY, updated);
    }
  };

  const handleRemoveSavedColor = (c: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = savedColors.filter((sc) => sc !== c);
    setSavedColors(updated);
    saveLocalList(SAVED_KEY, updated);
  };

  // Eyedropper API
  const handleEyeDropper = async () => {
    if (typeof window !== "undefined" && "EyeDropper" in window) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const eyeDropper = new (window as any).EyeDropper();
        const result = await eyeDropper.open();
        if (result?.sRGBHex) {
          applyColor(result.sRGBHex);
        }
      } catch {
        // User canceled eyedropper
      }
    }
  };

  const hasEyeDropper = typeof window !== "undefined" && "EyeDropper" in window;

  // Convert Hex to RGB
  const rgbValues = useMemo(() => {
    const raw = hexInput.replace("#", "");
    if (raw.length === 6) {
      const r = parseInt(raw.substring(0, 2), 16) || 0;
      const g = parseInt(raw.substring(2, 4), 16) || 0;
      const b = parseInt(raw.substring(4, 6), 16) || 0;
      return { r, g, b };
    }
    return { r: 15, g: 23, b: 42 };
  }, [hexInput]);

  return (
    <div
      ref={popoverRef}
      className="w-64 bg-[#10141d] border border-white/15 rounded-xl shadow-2xl p-3 text-slate-200 z-[200] animate-in fade-in zoom-in-95 duration-120 select-none font-sans"
      onMouseDown={(e) => {
        e.stopPropagation();
        if ((e.target as HTMLElement).tagName !== "INPUT") {
          e.preventDefault();
        }
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10">
        <span className="text-[11px] font-semibold tracking-wider text-slate-300 uppercase font-mono">
          {label}
        </span>
        <div className="flex items-center gap-1">
          {hasEyeDropper && (
            <button
              type="button"
              onClick={handleEyeDropper}
              className="p-1 rounded hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
              title="Pick color from screen"
            >
              <Pipette className="w-3.5 h-3.5" />
            </button>
          )}
          <div className="flex bg-white/5 rounded p-0.5 border border-white/10 text-[9px]">
            <button
              type="button"
              onClick={() => setActiveTab("swatches")}
              className={`px-1.5 py-0.5 rounded transition-all ${
                activeTab === "swatches" ? "bg-indigo-600 text-white font-medium shadow-xs" : "text-slate-400 hover:text-white"
              }`}
            >
              Swatches
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("custom")}
              className={`px-1.5 py-0.5 rounded transition-all ${
                activeTab === "custom" ? "bg-indigo-600 text-white font-medium shadow-xs" : "text-slate-400 hover:text-white"
              }`}
            >
              Picker
            </button>
          </div>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-0.5 rounded hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
              title="Close"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Swatches Tab */}
      {activeTab === "swatches" && (
        <div className="space-y-3">
          {/* Brand Palette */}
          <div>
            <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider block mb-1.5">
              Brand Palette
            </span>
            <div className="grid grid-cols-8 gap-1.5">
              {BRAND_PALETTE.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => applyColor(c)}
                  className="w-5 h-5 rounded-md border border-white/20 transition-transform hover:scale-115 relative flex items-center justify-center shadow-xs"
                  style={{ backgroundColor: c }}
                  title={c}
                >
                  {color.toLowerCase() === c.toLowerCase() && (
                    <Check
                      className={`w-3 h-3 ${c === "#ffffff" ? "text-slate-900" : "text-white"}`}
                    />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Document Colors */}
          {documentColors.length > 0 && (
            <div>
              <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider block mb-1.5">
                Document Colors
              </span>
              <div className="grid grid-cols-8 gap-1.5">
                {documentColors.map((c, i) => (
                  <button
                    key={`${c}-${i}`}
                    type="button"
                    onClick={() => applyColor(c)}
                    className="w-5 h-5 rounded-md border border-white/20 transition-transform hover:scale-115 relative flex items-center justify-center shadow-xs"
                    style={{ backgroundColor: c }}
                    title={c}
                  >
                    {color.toLowerCase() === c.toLowerCase() && (
                      <Check className="w-3 h-3 text-white drop-shadow-md" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Recent Colors */}
          {recentColors.length > 0 && (
            <div>
              <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider block mb-1.5">
                Recent
              </span>
              <div className="grid grid-cols-8 gap-1.5">
                {recentColors.slice(0, 8).map((c, i) => (
                  <button
                    key={`rec-${c}-${i}`}
                    type="button"
                    onClick={() => applyColor(c)}
                    className="w-5 h-5 rounded-md border border-white/20 transition-transform hover:scale-115 relative flex items-center justify-center shadow-xs"
                    style={{ backgroundColor: c }}
                    title={c}
                  >
                    {color.toLowerCase() === c.toLowerCase() && (
                      <Check className="w-3 h-3 text-white drop-shadow-md" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Saved Custom Colors */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider">
                Saved Colors
              </span>
              <button
                type="button"
                onClick={handleSaveCurrentColor}
                className="text-[9px] text-indigo-400 hover:text-indigo-300 flex items-center gap-0.5"
                title="Save current color"
              >
                <Plus className="w-2.5 h-2.5" /> Save
              </button>
            </div>
            <div className="grid grid-cols-8 gap-1.5">
              {savedColors.map((c, i) => (
                <div key={`saved-${c}-${i}`} className="relative group">
                  <button
                    type="button"
                    onClick={() => applyColor(c)}
                    className="w-5 h-5 rounded-md border border-white/20 transition-transform hover:scale-115 relative flex items-center justify-center shadow-xs"
                    style={{ backgroundColor: c }}
                    title={c}
                  >
                    {color.toLowerCase() === c.toLowerCase() && (
                      <Check className="w-3 h-3 text-white drop-shadow-md" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={(e) => handleRemoveSavedColor(c, e)}
                    className="absolute -top-1 -right-1 hidden group-hover:flex w-3 h-3 bg-rose-600 rounded-full items-center justify-center text-white text-[7px]"
                    title="Remove"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Custom Picker Tab */}
      {activeTab === "custom" && (
        <div className="space-y-3">
          {/* HTML5 Color Input & Preview */}
          <div className="flex items-center gap-2">
            <div className="relative w-10 h-10 rounded-lg overflow-hidden border border-white/20 shadow-inner flex-shrink-0">
              <input
                type="color"
                value={hexInput.startsWith("#") && hexInput.length === 7 ? hexInput : "#0f172a"}
                onChange={(e) => applyColor(e.target.value)}
                className="absolute -inset-2 w-14 h-14 cursor-pointer opacity-100"
              />
            </div>
            <div className="flex-1">
              <div className="text-[10px] text-slate-400 font-mono mb-0.5">Live Color</div>
              <div className="flex items-center gap-1.5">
                <div
                  className="w-4 h-4 rounded border border-white/20"
                  style={{ backgroundColor: color }}
                />
                <span className="font-mono text-xs text-white font-bold">{color}</span>
              </div>
            </div>
          </div>

          {/* Mode Selector (HEX / RGB / HSL) */}
          <div className="flex bg-white/5 rounded p-0.5 border border-white/10 text-[9px]">
            {(["HEX", "RGB", "HSL"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setColorMode(m)}
                className={`flex-1 py-0.5 rounded text-center transition-all ${
                  colorMode === m ? "bg-indigo-600 text-white font-semibold" : "text-slate-400 hover:text-white"
                }`}
              >
                {m}
              </button>
            ))}
          </div>

          {/* Mode Inputs */}
          {colorMode === "HEX" && (
            <div>
              <label className="text-[9px] text-slate-400 font-mono block mb-1">HEX Code</label>
              <div className="flex items-center bg-white/5 border border-white/10 rounded px-2 py-1">
                <span className="text-slate-500 font-mono text-xs mr-1">#</span>
                <input
                  type="text"
                  value={hexInput.replace("#", "")}
                  onChange={(e) => {
                    const val = `#${e.target.value.trim()}`;
                    setHexInput(val);
                    if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
                      applyColor(val);
                    }
                  }}
                  className="bg-transparent font-mono text-xs text-white outline-none w-full uppercase"
                  maxLength={6}
                />
              </div>
            </div>
          )}

          {colorMode === "RGB" && (
            <div className="grid grid-cols-3 gap-1.5">
              <div>
                <label className="text-[8px] text-slate-400 font-mono block mb-0.5">R</label>
                <input
                  type="number"
                  min={0}
                  max={255}
                  value={rgbValues.r}
                  onChange={(e) => {
                    const r = Math.min(255, Math.max(0, parseInt(e.target.value) || 0));
                    const next = `#${r.toString(16).padStart(2, "0")}${rgbValues.g.toString(16).padStart(2, "0")}${rgbValues.b.toString(16).padStart(2, "0")}`;
                    applyColor(next);
                  }}
                  className="w-full bg-white/5 border border-white/10 rounded px-1.5 py-1 font-mono text-[10px] text-white text-center"
                />
              </div>
              <div>
                <label className="text-[8px] text-slate-400 font-mono block mb-0.5">G</label>
                <input
                  type="number"
                  min={0}
                  max={255}
                  value={rgbValues.g}
                  onChange={(e) => {
                    const g = Math.min(255, Math.max(0, parseInt(e.target.value) || 0));
                    const next = `#${rgbValues.r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${rgbValues.b.toString(16).padStart(2, "0")}`;
                    applyColor(next);
                  }}
                  className="w-full bg-white/5 border border-white/10 rounded px-1.5 py-1 font-mono text-[10px] text-white text-center"
                />
              </div>
              <div>
                <label className="text-[8px] text-slate-400 font-mono block mb-0.5">B</label>
                <input
                  type="number"
                  min={0}
                  max={255}
                  value={rgbValues.b}
                  onChange={(e) => {
                    const b = Math.min(255, Math.max(0, parseInt(e.target.value) || 0));
                    const next = `#${rgbValues.r.toString(16).padStart(2, "0")}${rgbValues.g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
                    applyColor(next);
                  }}
                  className="w-full bg-white/5 border border-white/10 rounded px-1.5 py-1 font-mono text-[10px] text-white text-center"
                />
              </div>
            </div>
          )}

          {colorMode === "HSL" && (
            <div className="text-[10px] text-slate-400 font-mono bg-white/5 p-2 rounded border border-white/10">
              HSL representation active for publishing CSS exports.
            </div>
          )}

          {/* Opacity Slider */}
          {allowAlpha && (
            <div>
              <div className="flex items-center justify-between text-[9px] font-mono text-slate-400 mb-1">
                <span>Opacity</span>
                <span className="text-white font-bold">{alpha}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={alpha}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  setAlpha(val);
                  // Apply rgba if < 100
                  if (val < 100) {
                    const rgba = `rgba(${rgbValues.r}, ${rgbValues.g}, ${rgbValues.b}, ${val / 100})`;
                    onChange(rgba);
                  } else {
                    onChange(hexInput);
                  }
                }}
                className="w-full accent-indigo-500 cursor-pointer h-1.5 bg-white/10 rounded-lg"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};
