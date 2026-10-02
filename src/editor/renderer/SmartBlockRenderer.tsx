"use client";

import React, { memo, useState, useMemo } from "react";
import type { LucideIcon } from "lucide-react";
import {
  BookOpen,
  Check,
  Compass,
  Unlink2,
  QrCode,
  Shuffle,
  Sparkles,
  Target,
  Users,
  Zap,
  ShieldAlert,
  Cpu,
  Activity,
  Radio,
  Plus,
  Trash2,
  ChevronDown,
  LayoutGrid,
  Columns,
  Flame,
} from "lucide-react";

import { SmartBlockInstance } from "../../domain/educational/blockSchema";
import {
  resolveBlockTokens,
  ARCHETYPE_TELEMETRY_CODES,
  PUBLICATION_PALETTES,
} from "../../domain/educational/designTokens";
import { EDUCATIONAL_BLOCK_REGISTRY } from "../educational/blockRegistry";
import { computeSmartBlockLayout } from "../educational/smartBlockSolver";
import { useEditorStore } from "../stores/editorStore";

export type FancyLayoutVariant =
  | "holographic-hud"
  | "neo-bento"
  | "editorial-luxury"
  | "cyberpunk-terminal"
  | "activity-studio"
  | "quantum-split";

interface SmartBlockRendererProps {
  block: SmartBlockInstance;
  isSelected?: boolean;
  zoom?: number;
  onExploreStyles?: () => void;
  onDetach?: () => void;
}

type ArchetypeVisualProfile = {
  label: string;
  icon: LucideIcon;
  tone: "primary" | "accent" | "danger" | "emerald";
  motif: "orbit" | "burst" | "grid" | "steps" | "dots" | "wave" | "circuit";
  telemetryTag: string;
};

const ARCHETYPE_VISUALS: Record<string, ArchetypeVisualProfile> = {
  "learning-outcomes": {
    label: "Mastery Targets",
    icon: Target,
    tone: "primary",
    motif: "orbit",
    telemetryTag: "SYS.OBJ // CORE-TARGET",
  },
  "warm-up": {
    label: "Ignition Arc",
    icon: Zap,
    tone: "accent",
    motif: "burst",
    telemetryTag: "IGNITE // ARC-PLASMA",
  },
  "worked-examples": {
    label: "Quantum Pipeline",
    icon: Compass,
    tone: "primary",
    motif: "steps",
    telemetryTag: "EXEC.PATH // PIPELINE",
  },
  "common-mistakes": {
    label: "Hazard Protocol",
    icon: ShieldAlert,
    tone: "danger",
    motif: "circuit",
    telemetryTag: "ANOMALY // HAZARD-TRAP",
  },
  collaboration: {
    label: "Team Synch",
    icon: Users,
    tone: "primary",
    motif: "wave",
    telemetryTag: "TEAM.SYNCH // SATELLITE",
  },
  "ai-explore": {
    label: "Quantum Terminal",
    icon: Sparkles,
    tone: "accent",
    motif: "grid",
    telemetryTag: "SIM.NEX // RETICLE-3D",
  },
  "quick-check": {
    label: "Neural Diagnostic",
    icon: Activity,
    tone: "accent",
    motif: "grid",
    telemetryTag: "DIAGNOSTIC // PULSE",
  },
  "concept-map": {
    label: "Neural Orbit",
    icon: Cpu,
    tone: "primary",
    motif: "orbit",
    telemetryTag: "NEURAL.NET // ORBIT",
  },
};

const FALLBACK_VISUAL: ArchetypeVisualProfile = {
  label: "Learning Block",
  icon: BookOpen,
  tone: "primary",
  motif: "dots",
  telemetryTag: "SYS.HUD // ACTIVE",
};

const tint = (color: string, percentage: number) =>
  `color-mix(in srgb, ${color} ${Math.max(0, Math.min(100, percentage))}%, transparent)`;

const resolveToneColor = (
  tone: ArchetypeVisualProfile["tone"],
  primary: string,
  accent: string
) => {
  if (tone === "danger") return "#f43f5e";
  if (tone === "emerald") return "#10b981";
  if (tone === "accent") return accent;
  return primary;
};

/** Tactical hairline corner targeting brackets (┌ ┐ └ ┘) */
const HudCornerBrackets: React.FC<{ color: string }> = ({ color }) => (
  <div
    aria-hidden="true"
    className="pointer-events-none absolute inset-0 z-20 overflow-hidden rounded-[inherit]"
  >
    <span
      className="absolute top-1.5 left-1.5 w-3 h-3 border-t-[1.5px] border-l-[1.5px] rounded-tl-[1px] opacity-80"
      style={{ borderColor: color }}
    />
    <span
      className="absolute top-1.5 right-1.5 w-3 h-3 border-t-[1.5px] border-r-[1.5px] rounded-tr-[1px] opacity-80"
      style={{ borderColor: color }}
    />
    <span
      className="absolute bottom-1.5 left-1.5 w-3 h-3 border-b-[1.5px] border-l-[1.5px] rounded-bl-[1px] opacity-80"
      style={{ borderColor: color }}
    />
    <span
      className="absolute bottom-1.5 right-1.5 w-3 h-3 border-b-[1.5px] border-r-[1.5px] rounded-br-[1px] opacity-80"
      style={{ borderColor: color }}
    />
  </div>
);

/** Inline Editable Text component with 60fps zero-lag typing */
const InlineText: React.FC<{
  value: string;
  onChange: (next: string) => void;
  className?: string;
  style?: React.CSSProperties;
  placeholder?: string;
  multiline?: boolean;
}> = ({ value, onChange, className = "", style = {}, placeholder = "Type here...", multiline = false }) => {
  const [isEditing, setIsEditing] = useState(false);
  const elementRef = React.useRef<HTMLSpanElement>(null);
  const textRef = React.useRef(value);

  // Sync ref when value prop changes outside edit mode
  React.useEffect(() => {
    if (!isEditing) {
      textRef.current = value;
    }
  }, [value, isEditing]);

  // When entering edit mode, populate DOM once and place caret at the end
  React.useEffect(() => {
    if (isEditing && elementRef.current) {
      elementRef.current.innerText = textRef.current;
      elementRef.current.focus();
      try {
        const selection = window.getSelection();
        const range = document.createRange();
        range.selectNodeContents(elementRef.current);
        range.collapse(false);
        selection?.removeAllRanges();
        selection?.addRange(range);
      } catch {}
    }
  }, [isEditing]);

  const commit = () => {
    setIsEditing(false);
    if (elementRef.current) {
      const nextText = elementRef.current.innerText.trim();
      if (nextText !== value && nextText.length > 0) {
        textRef.current = nextText;
        onChange(nextText);
      } else if (nextText.length === 0) {
        elementRef.current.innerText = value;
        textRef.current = value;
      }
    }
  };

  if (isEditing) {
    return (
      <span
        ref={elementRef}
        contentEditable
        suppressContentEditableWarning
        onInput={(e: React.FormEvent<HTMLSpanElement>) => {
          textRef.current = (e.currentTarget as HTMLElement).innerText;
        }}
        onBlur={commit}
        onKeyDown={(e: React.KeyboardEvent) => {
          e.stopPropagation();
          if (e.key === "Enter" && !multiline) {
            e.preventDefault();
            commit();
          }
          if (e.key === "Escape") {
            e.preventDefault();
            if (elementRef.current) {
              elementRef.current.innerText = value;
              textRef.current = value;
            }
            setIsEditing(false);
          }
        }}
        onKeyUp={(e: React.KeyboardEvent) => e.stopPropagation()}
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
        className={`outline-2 outline-dashed outline-indigo-500 bg-white/40 dark:bg-black/40 rounded px-1 min-w-[1ch] max-w-full inline-block cursor-text select-text ${className}`}
        style={{
          ...style,
          color: style.color || "inherit",
          caretColor: "currentColor",
        }}
      />
    );
  }

  return (
    <span
      onClick={(e) => {
        e.stopPropagation();
        textRef.current = value;
        setIsEditing(true);
      }}
      title="Click to edit text"
      className={`cursor-text hover:outline-dashed hover:outline-1 hover:outline-indigo-400/80 rounded transition-all inline-block ${className}`}
      style={style}
    >
      {value || <span className="opacity-40 italic">{placeholder}</span>}
    </span>
  );
};

export const SmartBlockRenderer = memo(function SmartBlockRenderer({
  block,
  isSelected = false,
  onExploreStyles,
  onDetach,
}: SmartBlockRendererProps) {
  const updateSmartBlockContent = useEditorStore((s) => s.updateSmartBlockContent);
  const updateSmartBlockStyle = useEditorStore((s) => s.updateSmartBlockStyle);
  const [showLayoutMenu, setShowLayoutMenu] = useState(false);
  const [showPaletteMenu, setShowPaletteMenu] = useState(false);

  const def =
    EDUCATIONAL_BLOCK_REGISTRY[block.presetId] ||
    EDUCATIONAL_BLOCK_REGISTRY["outcomes-cards-play"] ||
    Object.values(EDUCATIONAL_BLOCK_REGISTRY)[0];

  const { palette, scale, traits } = resolveBlockTokens(
    block.subject,
    block.gradeBand,
    block.family
  );

  const layout = computeSmartBlockLayout(block, def);
  const content = block.semanticContent;
  const customPalette = block.styleOverrides.customPalette;

  const primaryColor = customPalette?.primary || palette.primary;
  const accentColor = customPalette?.accent || palette.accent;
  const surfaceColor = customPalette?.surface || palette.surface;
  const textColor = customPalette?.text || palette.textPrimary;
  const borderColor = customPalette?.border || palette.border;

  const visual = ARCHETYPE_VISUALS[block.archetypeId] ?? FALLBACK_VISUAL;
  const Icon = visual.icon;
  const toneColor = resolveToneColor(visual.tone, primaryColor, accentColor);

  // Active fancy layout variant (defaults to archetype or family style)
  const activeVariant: FancyLayoutVariant =
    (block.styleOverrides.layoutVariant as FancyLayoutVariant) ||
    (block.family === "nex-future"
      ? "holographic-hud"
      : block.family === "nex-play"
      ? "activity-studio"
      : block.family === "nex-editorial"
      ? "editorial-luxury"
      : "neo-bento");

  const isHolo = activeVariant === "holographic-hud";
  const isBento = activeVariant === "neo-bento";
  const isEditorial = activeVariant === "editorial-luxury";
  const isCyber = activeVariant === "cyberpunk-terminal";
  const isActivity = activeVariant === "activity-studio";
  const isSplit = activeVariant === "quantum-split";

  const cornerRadius =
    block.styleOverrides.cornerRadiusPt ?? (isEditorial ? 4 : isBento ? 16 : isActivity ? 14 : scale.cornerRadiusPt);

  const chamferPolygon = useMemo(() => {
    if (isCyber || block.styleOverrides.hudStyle?.chamfer === "notch-8px") {
      return "polygon(0 10px, 10px 0, calc(100% - 10px) 0, 100% 10px, 100% calc(100% - 10px), calc(100% - 10px) 100%, 10px 100%, 0 calc(100% - 10px))";
    }
    if (block.styleOverrides.hudStyle?.chamfer === "notch-14px") {
      return "polygon(0 16px, 16px 0, calc(100% - 16px) 0, 100% 16px, 100% calc(100% - 16px), calc(100% - 16px) 100%, 16px 100%, 0 calc(100% - 16px))";
    }
    return undefined;
  }, [isCyber, block.styleOverrides.hudStyle?.chamfer]);

  const updateContent = (patch: Partial<SmartBlockInstance["semanticContent"]>) => {
    updateSmartBlockContent(block.id, patch);
  };

  const updateStyle = (patch: Partial<SmartBlockInstance["styleOverrides"]>) => {
    updateSmartBlockStyle(block.id, patch);
  };

  // Background style based on chosen fancy layout
  const background = useMemo<React.CSSProperties>(() => {
    if (isCyber) {
      return {
        backgroundImage: `
          repeating-linear-gradient(0deg, rgba(0,0,0,0.06) 0px, rgba(0,0,0,0.06) 1px, transparent 1px, transparent 4px),
          radial-gradient(circle at 10% 10%, ${tint(accentColor, 18)} 0%, transparent 40%),
          linear-gradient(135deg, ${tint(primaryColor, 14)} 0%, #ffffff 50%, ${tint(accentColor, 8)} 100%)
        `,
        backgroundColor: surfaceColor,
      };
    }
    if (isHolo) {
      return {
        backgroundImage: [
          `radial-gradient(circle at 15% 0%, ${tint(accentColor, 20)} 0%, transparent 45%)`,
          `radial-gradient(circle at 85% 15%, ${tint(primaryColor, 16)} 0%, transparent 50%)`,
          `linear-gradient(145deg, ${tint(primaryColor, 10)} 0%, rgba(255,255,255,0.85) 45%, ${tint(accentColor, 8)} 100%)`,
        ].join(", "),
        backgroundColor: surfaceColor,
      };
    }
    if (isBento) {
      return {
        backgroundImage: `
          radial-gradient(circle at 80% 0%, ${tint(accentColor, 15)} 0%, transparent 50%),
          linear-gradient(145deg, #ffffff 0%, ${tint(primaryColor, 6)} 100%)
        `,
        backgroundColor: "#ffffff",
      };
    }
    if (isEditorial) {
      return {
        backgroundImage: `linear-gradient(180deg, ${tint(primaryColor, 5)} 0%, #ffffff 40%, #ffffff 100%)`,
        backgroundColor: "#ffffff",
      };
    }
    // Activity studio
    return {
      backgroundImage: `
        radial-gradient(circle at 10% 10%, ${tint(accentColor, 12)} 0%, transparent 35%),
        linear-gradient(135deg, rgba(255,255,255,0.95) 0%, ${tint(primaryColor, 8)} 100%)
      `,
      backgroundColor: surfaceColor,
    };
  }, [accentColor, isBento, isCyber, isEditorial, isHolo, primaryColor, surfaceColor]);

  const glowBoxShadow = useMemo(() => {
    if (isCyber) {
      return isSelected
        ? `0 0 0 2px #06b6d4, 0 0 28px ${tint("#06b6d4", 40)}, 0 16px 36px -6px rgba(0,0,0,0.2)`
        : `0 0 16px ${tint(toneColor, 25)}, 0 8px 24px -4px rgba(0,0,0,0.12)`;
    }
    if (isBento) {
      return isSelected
        ? `inset 0 1.5px 0 rgba(255, 255, 255, 0.95), 0 0 0 2px #6366f1, 0 20px 40px -10px rgba(0,0,0,0.15)`
        : `inset 0 1.5px 0 rgba(255, 255, 255, 0.9), 0 10px 25px -5px rgba(0,0,0,0.08), 0 0 1px rgba(0,0,0,0.1)`;
    }
    if (isEditorial) {
      return isSelected
        ? `0 0 0 2px #334155, 0 12px 28px -6px rgba(0,0,0,0.14)`
        : `0 4px 20px -2px rgba(0,0,0,0.06)`;
    }
    // Default / Holo
    return isSelected
      ? `inset 0 1.5px 0 rgba(255, 255, 255, 0.95), 0 0 0 2px #6366f1, 0 0 24px ${tint(toneColor, 35)}, 0 16px 36px -6px ${tint(toneColor, 25)}`
      : `inset 0 1.5px 0 rgba(255, 255, 255, 0.85), ${traits.shadowStyle}, 0 6px 20px -4px ${tint(primaryColor, 12)}`;
  }, [isBento, isCyber, isEditorial, isSelected, primaryColor, toneColor, traits.shadowStyle]);

  const telemetryCode =
    ARCHETYPE_TELEMETRY_CODES[block.archetypeId] || visual.telemetryTag;

  return (
    <section
      className={`group/nex-block relative isolate flex h-full w-full flex-col select-none overflow-hidden font-sans transition-all duration-200 ${
        isSelected ? "ring-2 ring-indigo-500/90 ring-offset-2" : ""
      }`}
      style={{
        ...background,
        borderRadius: chamferPolygon ? undefined : `${cornerRadius}pt`,
        clipPath: chamferPolygon,
        border: `${isEditorial ? 2 : traits.borderWidthPt}pt solid ${borderColor}`,
        boxShadow: glowBoxShadow,
      }}
      role="group"
      aria-label={`${content.title || visual.label} educational block`}
      data-archetype={block.archetypeId}
      data-family={block.family}
      data-layout-variant={activeVariant}
    >
      {/* 1. Tactical HUD Brackets (Holo or Cyber mode) */}
      {(isHolo || isCyber) && <HudCornerBrackets color={toneColor} />}

      {/* 2. Top Specular Rim Light */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 z-10 h-[2px]"
        style={{
          background: `linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.95) 25%, ${toneColor} 50%, rgba(255,255,255,0.95) 75%, transparent 100%)`,
        }}
      />

      {/* 3. FLOATING DESIGN TOOLS (Visible when selected) */}
      {isSelected && (
        <div
          className="absolute top-2 right-2 z-40 flex items-center gap-1 bg-[#10141D]/95 backdrop-blur-xl border border-white/15 rounded-xl p-1 shadow-2xl animate-float-in text-white text-[8pt]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Fancy Layout Selector */}
          <div className="relative">
            <button
              onClick={() => {
                setShowLayoutMenu(!showLayoutMenu);
                setShowPaletteMenu(false);
              }}
              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-slate-200 transition-colors font-medium"
              title="Change block visual layout"
            >
              <LayoutGrid className="w-3 h-3 text-indigo-400" />
              <span className="capitalize">{activeVariant.replace("-", " ")}</span>
              <ChevronDown className="w-2.5 h-2.5 opacity-60" />
            </button>

            {showLayoutMenu && (
              <div className="absolute right-0 top-full mt-1.5 w-48 bg-[#10141D] border border-white/15 rounded-xl shadow-2xl p-1.5 z-50 animate-float-in space-y-0.5">
                <div className="text-[7pt] uppercase tracking-wider text-slate-400 font-mono px-2 py-1">
                  Layout Styles
                </div>
                {(
                  [
                    { id: "holographic-hud", label: "✦ Holographic HUD", icon: Zap },
                    { id: "neo-bento", label: "❖ Neo-Bento Cards", icon: LayoutGrid },
                    { id: "editorial-luxury", label: "✒️ Editorial Luxury", icon: BookOpen },
                    { id: "cyberpunk-terminal", label: "⚡ Cyberpunk Terminal", icon: Cpu },
                    { id: "activity-studio", label: "🎯 Activity Studio", icon: Flame },
                    { id: "quantum-split", label: "◫ Quantum Split", icon: Columns },
                  ] as const
                ).map((mode) => (
                  <button
                    key={mode.id}
                    onClick={() => {
                      updateStyle({ layoutVariant: mode.id });
                      setShowLayoutMenu(false);
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between text-xs transition-colors ${
                      activeVariant === mode.id
                        ? "bg-indigo-600 text-white font-medium"
                        : "text-slate-300 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <span>{mode.label}</span>
                    {activeVariant === mode.id && <Check className="w-3 h-3 text-white" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Quick Palette Switcher */}
          <div className="relative">
            <button
              onClick={() => {
                setShowPaletteMenu(!showPaletteMenu);
                setShowLayoutMenu(false);
              }}
              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-slate-200 transition-colors"
              title="Change palette"
            >
              <span
                className="w-2.5 h-2.5 rounded-full border border-white/40"
                style={{ backgroundColor: primaryColor }}
              />
              <ChevronDown className="w-2.5 h-2.5 opacity-60" />
            </button>

            {showPaletteMenu && (
              <div className="absolute right-0 top-full mt-1.5 w-44 bg-[#10141D] border border-white/15 rounded-xl shadow-2xl p-2 z-50 animate-float-in">
                <div className="text-[7pt] uppercase tracking-wider text-slate-400 font-mono mb-1.5">
                  Color Themes
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  {Object.entries(PUBLICATION_PALETTES).map(([id, p]) => (
                    <button
                      key={id}
                      onClick={() => {
                        updateStyle({
                          paletteId: id,
                          customPalette: {
                            primary: p.primary,
                            accent: p.accent,
                            surface: p.surface,
                            text: p.text,
                            border: p.border,
                          },
                        });
                        setShowPaletteMenu(false);
                      }}
                      className="w-7 h-7 rounded-lg border border-white/30 flex items-center justify-center hover:scale-110 transition-transform"
                      style={{ background: `linear-gradient(135deg, ${p.primary} 50%, ${p.accent} 50%)` }}
                      title={p.name}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Shuffle Style */}
          {onExploreStyles && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onExploreStyles();
              }}
              className="p-1.5 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/40 text-indigo-300 border border-indigo-500/30 transition-colors"
              title="Shuffle visual variant"
            >
              <Shuffle className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Detach to Canvas Elements */}
          {onDetach && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDetach();
              }}
              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 font-medium transition-colors"
              title="Detach into individual editable canvas elements (shapes, text frames, images)"
            >
              <Unlink2 className="w-3 h-3" />
              <span>Detach</span>
            </button>
          )}
        </div>
      )}

      {/* 4. FUTURISTIC / EDITORIAL HEADER */}
      <header
        className={`relative z-10 flex min-h-[42px] shrink-0 items-center justify-between gap-2 border-b px-4 py-2.5 ${
          isEditorial ? "bg-white/80" : "backdrop-blur-md"
        }`}
        style={{
          borderColor: tint(borderColor, 55),
          background: isEditorial
            ? `linear-gradient(90deg, ${tint(primaryColor, 8)} 0%, #ffffff 100%)`
            : `linear-gradient(90deg, ${tint(primaryColor, 14)} 0%, ${tint(accentColor, 7)} 60%, transparent 100%)`,
        }}
      >
        <div className="flex min-w-0 items-center gap-3">
          {/* Glowing Icon Pod */}
          <div
            className={`relative grid h-8 w-8 shrink-0 place-items-center rounded-xl border shadow-sm transition-transform duration-200 group-hover/nex-block:scale-105 ${
              isBento ? "rounded-2xl" : isCyber ? "rounded-none" : "rounded-xl"
            }`}
            style={{
              color: toneColor,
              borderColor: tint(toneColor, 40),
              background: `linear-gradient(145deg, rgba(255,255,255,0.98), ${tint(toneColor, 16)})`,
              boxShadow: `0 4px 14px ${tint(toneColor, 22)}, inset 0 1px 0 rgba(255,255,255,0.9)`,
            }}
          >
            <Icon className="h-4 w-4" strokeWidth={2.4} />
            {/* Active Concentric Pulsing LED Beacon */}
            <span className="absolute -right-1 -top-1 flex h-2.5 w-2.5">
              <span
                className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                style={{ backgroundColor: toneColor }}
              />
              <span
                className="relative inline-flex rounded-full h-2.5 w-2.5 border border-white shadow-xs"
                style={{ backgroundColor: toneColor }}
              />
            </span>
          </div>

          <div className="min-w-0">
            {/* Metadata / Unit badge row */}
            <div className="mb-0.5 flex min-w-0 items-center gap-2 flex-wrap">
              {/* Unit Badge (Editable) */}
              <span
                className="font-mono text-[7pt] font-extrabold uppercase tracking-[0.14em]"
                style={{ color: toneColor }}
              >
                <InlineText
                  value={content.unitBadge || ""}
                  onChange={(val) => updateContent({ unitBadge: val })}
                  placeholder="UNIT 01"
                />
              </span>

              {/* Archetype Label Badge */}
              <span
                className={`inline-flex items-center rounded border px-2 py-[2px] font-mono text-[6pt] font-extrabold uppercase tracking-[0.1em] shadow-xs ${
                  isCyber ? "transform -skew-x-12" : "rounded-full"
                }`}
                style={{
                  color: toneColor,
                  borderColor: tint(toneColor, 35),
                  backgroundColor: tint(toneColor, 12),
                }}
              >
                <span className={isCyber ? "transform skew-x-12" : ""}>{visual.label}</span>
              </span>
            </div>

            {/* Block Title (Editable) */}
            <h3
              className="font-extrabold leading-[1.1] tracking-[-0.02em]"
              style={{
                fontFamily: isEditorial ? "Merriweather, Georgia, serif" : traits.fontHeading,
                fontSize: `${scale.headingPt}pt`,
                color: textColor,
              }}
            >
              <InlineText
                value={content.title}
                onChange={(val) => updateContent({ title: val })}
                placeholder="Block Title..."
              />
            </h3>
          </div>
        </div>
      </header>

      {/* 5. DYNAMIC CONTENT BODY */}
      <div
        className="relative z-10 flex min-h-0 flex-1 flex-col overflow-hidden p-3.5"
        style={{
          fontFamily: traits.fontBody,
          color: textColor,
          fontSize: `${scale.bodyPt * layout.fontSizeScale}pt`,
        }}
      >
        {/* Subtitle / Prompt (Editable) */}
        {(content.subtitle || isSelected) && (
          <div className="mb-2.5 flex items-start gap-2">
            <Radio
              className="mt-[2px] h-3.5 w-3.5 shrink-0 animate-pulse"
              style={{ color: toneColor }}
              strokeWidth={2.4}
            />
            <p
              className="flex-1 text-[8pt] font-semibold italic leading-snug opacity-90"
              style={{ color: textColor }}
            >
              <InlineText
                value={content.subtitle || ""}
                onChange={(val) => updateContent({ subtitle: val })}
                placeholder="Click to add curriculum prompt or subtitle..."
              />
            </p>
          </div>
        )}

        <div className="min-h-0 flex-1 overflow-y-auto custom-scrollbar pr-0.5 space-y-2.5">
          {/* A. LEARNING OUTCOMES / CHECKLIST ITEMS */}
          {content.items && content.items.length > 0 && (
            <div
              className={`grid gap-2.5 ${
                layout.isTwoColumn || isBento || isSplit ? "grid-cols-2" : "grid-cols-1"
              }`}
            >
              {content.items.map((item, index) => (
                <div
                  key={index}
                  className={`group/item relative flex min-w-0 items-start gap-2.5 overflow-hidden border p-2.5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${
                    isBento
                      ? "rounded-2xl bg-white/95"
                      : isCyber
                      ? "rounded-none bg-black/5"
                      : "rounded-xl bg-white/90"
                  }`}
                  style={{
                    borderColor: tint(borderColor, 55),
                    boxShadow: `inset 0 1px 0 rgba(255,255,255,0.95), 0 3px 8px ${tint(primaryColor, 8)}`,
                  }}
                >
                  {/* Glowing Illuminated Check Badge */}
                  <span
                    className={`mt-[0.5px] grid h-5 w-5 shrink-0 place-items-center border font-mono text-[7pt] font-extrabold shadow-xs transition-transform duration-200 group-hover/item:scale-110 ${
                      isBento ? "rounded-full" : isCyber ? "rounded-none" : "rounded-lg"
                    }`}
                    style={{
                      background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})`,
                      color: "#ffffff",
                      borderColor: tint("#ffffff", 70),
                      boxShadow: `0 2px 8px ${tint(primaryColor, 40)}`,
                    }}
                    aria-hidden="true"
                  >
                    <Check className="h-3 w-3 stroke-[3]" />
                  </span>

                  <div className="min-w-0 flex-1">
                    <span className="block text-[8.2pt] font-bold leading-[1.38]">
                      <InlineText
                        value={item}
                        onChange={(next) => {
                          const nextItems = [...(content.items || [])];
                          nextItems[index] = next;
                          updateContent({ items: nextItems });
                        }}
                        multiline
                      />
                    </span>
                    <div className="mt-1 flex items-center justify-between text-[6pt] font-mono opacity-60">
                      <span>COMPETENCY #{String(index + 1).padStart(2, "0")}</span>
                      <span className="text-emerald-600 font-bold">✦ VERIFIED</span>
                    </div>
                  </div>

                  {/* Quick Remove Item button on hover */}
                  {isSelected && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const nextItems = (content.items || []).filter((_, i) => i !== index);
                        updateContent({ items: nextItems });
                      }}
                      className="opacity-0 group-hover/item:opacity-100 p-1 text-slate-400 hover:text-rose-500 rounded transition-opacity"
                      title="Remove item"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}

                  {/* Left Luminous Telemetry Edge */}
                  <span
                    aria-hidden="true"
                    className="absolute inset-y-0 left-0 w-[3px]"
                    style={{
                      backgroundColor: toneColor,
                      boxShadow: `0 0 8px ${toneColor}`,
                    }}
                  />
                </div>
              ))}

              {/* Add Item button if selected */}
              {isSelected && (
                <button
                  onClick={() => {
                    const nextItems = [...(content.items || []), "New learning outcome"];
                    updateContent({ items: nextItems });
                  }}
                  className="flex items-center justify-center gap-1.5 p-2 rounded-xl border border-dashed border-indigo-400/60 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-700 text-[8pt] font-semibold transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Target</span>
                </button>
              )}
            </div>
          )}

          {/* B. WORKED EXAMPLES / STEP-BY-STEP PIPELINE */}
          {content.steps && content.steps.length > 0 && (
            <div className="relative space-y-2.5">
              {/* Illuminated Vertical Energy Vector Rail */}
              <span
                aria-hidden="true"
                className="absolute bottom-3 left-[15px] top-3 w-[2px] rounded-full z-0 opacity-80"
                style={{
                  background: `linear-gradient(180deg, ${primaryColor} 0%, ${accentColor} 50%, ${primaryColor} 100%)`,
                  boxShadow: `0 0 10px ${tint(primaryColor, 50)}`,
                }}
              />

              {content.steps.map((step, index) => (
                <div
                  key={index}
                  className={`group/step relative z-10 flex items-start gap-3 border p-3 pr-3.5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${
                    isBento ? "rounded-2xl bg-white/95" : isCyber ? "rounded-none bg-black/5" : "rounded-xl bg-white/95"
                  }`}
                  style={{
                    borderColor: tint(borderColor, 58),
                    boxShadow: `inset 0 1px 0 rgba(255,255,255,0.95), 0 3px 10px ${tint(primaryColor, 8)}`,
                  }}
                >
                  {/* Step Chip with Tactical Monospace Badge */}
                  <span
                    className={`relative z-10 grid h-6.5 min-w-6.5 shrink-0 place-items-center font-mono text-[7pt] font-black text-white shadow-sm ${
                      isBento ? "rounded-xl" : isCyber ? "rounded-none" : "rounded-lg"
                    }`}
                    style={{
                      background: `linear-gradient(145deg, ${primaryColor}, ${accentColor})`,
                      boxShadow: `0 3px 12px ${tint(primaryColor, 40)}`,
                    }}
                  >
                    0{step.stepNumber}
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="mb-0.5 flex items-center justify-between gap-2">
                      <span
                        className="text-[8.5pt] font-extrabold leading-tight tracking-tight"
                        style={{ color: primaryColor }}
                      >
                        <InlineText
                          value={step.title}
                          onChange={(val) => {
                            const nextSteps = [...(content.steps || [])];
                            nextSteps[index] = { ...step, title: val };
                            updateContent({ steps: nextSteps });
                          }}
                        />
                      </span>
                      <span className="font-mono text-[6pt] font-bold text-slate-400 uppercase tracking-widest shrink-0">
                        PHASE {index + 1} &gt;&gt;
                      </span>
                    </div>

                    <p className="whitespace-pre-line text-[7.8pt] font-medium leading-[1.46] text-slate-700">
                      <InlineText
                        value={step.body}
                        onChange={(val) => {
                          const nextSteps = [...(content.steps || [])];
                          nextSteps[index] = { ...step, body: val };
                          updateContent({ steps: nextSteps });
                        }}
                        multiline
                      />
                    </p>
                  </div>

                  {/* Remove Step button on selection */}
                  {isSelected && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const nextSteps = (content.steps || [])
                          .filter((_, i) => i !== index)
                          .map((s, k) => ({ ...s, stepNumber: k + 1 }));
                        updateContent({ steps: nextSteps });
                      }}
                      className="opacity-0 group-step:opacity-100 p-1 text-slate-400 hover:text-rose-500 rounded transition-opacity"
                      title="Remove step"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ))}

              {isSelected && (
                <button
                  onClick={() => {
                    const nextSteps = [
                      ...(content.steps || []),
                      {
                        stepNumber: (content.steps || []).length + 1,
                        title: "Next Worked Step",
                        body: "Describe the solution method clearly.",
                      },
                    ];
                    updateContent({ steps: nextSteps });
                  }}
                  className="flex items-center justify-center gap-1.5 w-full p-2 rounded-xl border border-dashed border-indigo-400/60 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-700 text-[8pt] font-semibold transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Step</span>
                </button>
              )}
            </div>
          )}

          {/* C. CALLOUT / TRAP / KEY IDEA */}
          {content.calloutText && (
            <div
              className={`relative my-1 overflow-hidden border p-3.5 transition-all duration-200 ${
                isBento ? "rounded-2xl" : isCyber ? "rounded-none" : "rounded-xl"
              }`}
              style={{
                background:
                  visual.tone === "danger"
                    ? `repeating-linear-gradient(45deg, rgba(244,63,94,0.06) 0px, rgba(244,63,94,0.06) 8px, transparent 8px, transparent 16px), linear-gradient(135deg, #ffffff 0%, #fff1f2 100%)`
                    : `linear-gradient(135deg, rgba(255,255,255,0.95) 0%, ${tint(primaryColor, 8)} 100%)`,
                borderColor: visual.tone === "danger" ? "rgba(244, 63, 94, 0.45)" : tint(borderColor, 65),
                boxShadow: `inset 0 1px 0 rgba(255,255,255,0.9), 0 4px 16px ${tint(primaryColor, 10)}`,
              }}
            >
              <div className="flex items-start gap-3">
                <span
                  className="mt-[1px] grid h-7 w-7 shrink-0 place-items-center rounded-xl shadow-xs"
                  style={{
                    color: toneColor,
                    backgroundColor: tint(toneColor, 14),
                    boxShadow: `0 2px 8px ${tint(toneColor, 25)}`,
                  }}
                >
                  <Icon className="h-4 w-4" strokeWidth={2.4} />
                </span>
                <div className="min-w-0 flex-1">
                  {visual.tone === "danger" && (
                    <span className="font-mono text-[6pt] font-extrabold text-rose-600 uppercase tracking-widest block mb-1">
                      [CRITICAL ANOMALY // INTERCEPTED]
                    </span>
                  )}
                  <p className="whitespace-pre-line text-[8.5pt] font-semibold leading-[1.5] text-slate-800">
                    <InlineText
                      value={content.calloutText}
                      onChange={(val) => updateContent({ calloutText: val })}
                      multiline
                    />
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* D. QUICK CHECK / MULTIPLE CHOICE QUESTIONS */}
          {content.questions && content.questions.length > 0 && (
            <div className="space-y-2.5">
              {content.questions.map((question, questionIndex) => (
                <div
                  key={questionIndex}
                  className={`border p-3 transition-all duration-200 hover:shadow-md ${
                    isBento ? "rounded-2xl bg-white/95" : isCyber ? "rounded-none bg-black/5" : "rounded-xl bg-white/95"
                  }`}
                  style={{
                    borderColor: tint(borderColor, 55),
                    background: `linear-gradient(135deg, rgba(255,255,255,0.95) 0%, ${tint(primaryColor, 5)} 100%)`,
                    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.9)",
                  }}
                >
                  <div className="mb-2.5 flex items-start gap-2.5">
                    <span
                      className="grid h-5 min-w-5 shrink-0 place-items-center rounded-lg font-mono text-[6.5pt] font-black text-white shadow-xs"
                      style={{
                        background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})`,
                      }}
                    >
                      Q{questionIndex + 1}
                    </span>
                    <span className="text-[8.5pt] font-bold leading-[1.38] text-slate-800 flex-1">
                      <InlineText
                        value={question.prompt}
                        onChange={(val) => {
                          const nextQ = [...(content.questions || [])];
                          nextQ[questionIndex] = { ...question, prompt: val };
                          updateContent({ questions: nextQ });
                        }}
                      />
                    </span>
                  </div>

                  {question.options && question.options.length > 0 && (
                    <div className="grid grid-cols-2 gap-2">
                      {question.options.map((option, optionIndex) => (
                        <div
                          key={optionIndex}
                          className="flex min-w-0 items-center gap-2 rounded-xl border px-2.5 py-1.5 text-left text-[7.5pt] font-semibold transition-all duration-150 hover:border-indigo-400 hover:bg-white"
                          style={{
                            borderColor: tint(borderColor, 55),
                            backgroundColor: "rgba(255,255,255,0.85)",
                            boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
                          }}
                        >
                          <span
                            className="grid h-4.5 w-4.5 shrink-0 place-items-center rounded-md font-mono text-[6.2pt] font-black"
                            style={{
                              color: primaryColor,
                              backgroundColor: tint(primaryColor, 14),
                            }}
                          >
                            [{String.fromCharCode(65 + optionIndex)}]
                          </span>
                          <span className="truncate text-slate-700 flex-1">
                            <InlineText
                              value={option}
                              onChange={(val) => {
                                const nextOptions = [...(question.options || [])];
                                nextOptions[optionIndex] = val;
                                const nextQ = [...(content.questions || [])];
                                nextQ[questionIndex] = { ...question, options: nextOptions };
                                updateContent({ questions: nextQ });
                              }}
                            />
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* E. DIGITAL SIMULATION / QR RETICLE TERMINAL */}
          {content.qrUrl && (
            <div
              className={`relative mt-2 flex items-center justify-between gap-3 overflow-hidden border p-3 shadow-sm ${
                isBento ? "rounded-2xl" : isCyber ? "rounded-none" : "rounded-xl"
              }`}
              style={{
                borderColor: tint(accentColor, 40),
                background: `linear-gradient(120deg, ${tint(primaryColor, 14)} 0%, ${tint(accentColor, 12)} 50%, rgba(255,255,255,0.85) 100%)`,
              }}
            >
              <div className="flex min-w-0 items-center gap-3">
                <div
                  className="relative grid h-11 w-11 shrink-0 place-items-center rounded-xl border bg-white p-1 shadow-md"
                  style={{ borderColor: accentColor }}
                >
                  <QrCode className="h-9 w-9 text-slate-900" />
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-x-0 top-1/2 h-[1.5px] -translate-y-1/2 opacity-70 animate-pulse"
                    style={{
                      backgroundColor: accentColor,
                      boxShadow: `0 0 8px ${accentColor}`,
                    }}
                  />
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p
                      className="text-[8pt] font-extrabold leading-tight tracking-tight"
                      style={{ color: textColor }}
                    >
                      Interactive Digital Simulation
                    </p>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                  </div>
                  <p className="mt-0.5 font-mono text-[6.5pt] font-medium leading-[1.3] opacity-70">
                    LAT: 42.109 // 3D LAB STREAM LINKED
                  </p>
                </div>
              </div>

              <span
                className="shrink-0 rounded-xl border px-3 py-1.5 font-mono text-[6.5pt] font-black uppercase tracking-[0.1em] text-white shadow-sm flex items-center gap-1.5"
                style={{
                  background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})`,
                  borderColor: tint("#ffffff", 40),
                  boxShadow: `0 2px 10px ${tint(accentColor, 40)}`,
                }}
              >
                <Radio className="w-3 h-3 animate-pulse" />
                NEX DIGITAL
              </span>
            </div>
          )}
        </div>

        {/* Footnote (Editable) */}
        {(content.footnote || isSelected) && (
          <footer
            className="mt-2.5 flex items-center justify-between border-t pt-2 font-mono text-[6.5pt] font-medium leading-tight opacity-75"
            style={{ borderColor: tint(borderColor, 45) }}
          >
            <div className="flex items-center gap-2 truncate">
              <span
                aria-hidden="true"
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: toneColor }}
              />
              <span className="truncate">
                <InlineText
                  value={content.footnote || ""}
                  onChange={(val) => updateContent({ footnote: val })}
                  placeholder="Click to add lesson footnote or check prompt..."
                />
              </span>
            </div>
          </footer>
        )}
      </div>
    </section>
  );
});

SmartBlockRenderer.displayName = "SmartBlockRenderer";
