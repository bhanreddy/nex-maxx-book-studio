"use client";

import React, { memo, useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import type { SmartBlockInstance } from "../../domain/educational/blockSchema";
import type { UniversalBlockArchetype, UniversalLayoutPreset } from "../../domain/educational/curriculum";
import { normalizeUniversalType, UNIVERSAL_BLOCK_MAP, getSubjectFixture } from "../curriculum/universalBlocks";
import { NEX_MAXX_BRAND, NEX_MAXX_PRESETS, PUBLICATION_PALETTES } from "../../domain/educational/designTokens";
import { useEditorStore } from "../stores/editorStore";
import { useUiStore } from "../stores/uiStore";
import { generateBackgroundRemovalMask } from "../pixel/selectionEngine";
import { LearningOutcomesRenderer } from "./LearningOutcomesRenderer";
import { StudySkillsRenderer } from "./StudySkillsRenderer";
import { FactZoneRenderer } from "./FactZoneRenderer";
import { TopicBannerRenderer } from "./TopicBannerRenderer";
import { LifeConnectRenderer } from "./LifeConnectRenderer";
import {
  Sparkles,
  Layers,
  ChevronDown,
  Plus,
  Trash2,
  Copy,
  Check,
  Edit3,
  Image as ImageIcon,
  Upload,
  RefreshCw,
  X,
  Move,
  ZoomIn,
  ZoomOut,
  FlipHorizontal,
  RotateCcw,
  Eraser,
  Unlink2,
} from "lucide-react";

interface UniversalBlockRendererProps {
  block: SmartBlockInstance;
  isSelected?: boolean;
  zoom?: number;
  onExploreStyles?: () => void;
  onDetach?: () => void;
}

/** Inline Editable Text component with 60fps zero-lag typing */
const InlineText: React.FC<{
  value: string;
  onChange: (next: string) => void;
  className?: string;
  style?: React.CSSProperties;
  placeholder?: string;
  multiline?: boolean;
  tag?: "span" | "h1" | "h2" | "h3" | "h4" | "p" | "strong" | "small" | "b";
}> = ({
  value,
  onChange,
  className = "",
  style = {},
  placeholder = "Type here...",
  multiline = false,
  tag = "span",
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const elementRef = useRef<HTMLElement>(null);
  const textRef = useRef(value);
  const Tag = tag;

  useEffect(() => {
    if (!isEditing) textRef.current = value;
  }, [value, isEditing]);

  const seedEditor = (node: HTMLElement | null) => {
    elementRef.current = node;
    if (!node || node.dataset.seeded === "1") return;
    node.textContent = textRef.current;
    node.dataset.seeded = "1";
    node.focus();
    try {
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(node);
      range.collapse(false);
      selection?.removeAllRanges();
      selection?.addRange(range);
    } catch {}
  };

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
      <Tag
        key="inline-editor"
        ref={seedEditor}
        contentEditable
        suppressContentEditableWarning
        onInput={(e: React.FormEvent<HTMLElement>) => {
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
        className={`outline-2 outline-dashed outline-[#922a52] bg-white/40 dark:bg-black/40 rounded px-1 min-w-[1ch] max-w-full inline-block cursor-text select-text ${className}`}
        style={{
          ...style,
          color: style.color || "inherit",
          caretColor: "currentColor",
        }}
      />
    );
  }

  return (
    <Tag
      key="inline-view"
      onClick={(e: React.MouseEvent) => {
        e.stopPropagation();
        textRef.current = value;
        setIsEditing(true);
      }}
      title="Click to edit"
      className={`cursor-text hover:outline-dashed hover:outline-1 hover:outline-[#922a52]/60 rounded transition-all inline-block ${className}`}
      style={style}
    >
      {value || <span className="opacity-40 italic">{placeholder}</span>}
    </Tag>
  );
};

/** 3D Chapter Title Display with instant 60fps in-place editor */
const ChapterTitleDisplay: React.FC<{
  title: string;
  onChange: (next: string) => void;
}> = ({ title, onChange }) => {
  const [isEditing, setIsEditing] = useState(false);
  const elementRef = useRef<HTMLTextAreaElement>(null);
  const textRef = useRef(title);

  useEffect(() => {
    if (!isEditing) textRef.current = title;
  }, [title, isEditing]);

  const commit = (nextRaw?: string) => {
    const next = (nextRaw ?? elementRef.current?.value ?? textRef.current).replace(/\s+/g, " ").trim();
    setIsEditing(false);
    if (next.length > 0 && next !== title) {
      textRef.current = next;
      onChange(next);
    } else {
      textRef.current = title;
    }
  };

  if (isEditing) {
    return (
      <textarea
        key="chapter-title-editor"
        ref={elementRef}
        defaultValue={textRef.current}
        rows={1}
        aria-label="Edit chapter title"
        onChange={(e) => {
          textRef.current = e.target.value;
          e.target.style.height = "auto";
          e.target.style.height = `${e.target.scrollHeight}px`;
        }}
        onFocus={(e) => {
          const field = e.currentTarget;
          field.style.height = "auto";
          field.style.height = `${field.scrollHeight}px`;
          const end = field.value.length;
          field.setSelectionRange(end, end);
        }}
        onBlur={(e) => commit(e.currentTarget.value)}
        onKeyDown={(e) => {
          e.stopPropagation();
          if (e.key === "Enter") {
            e.preventDefault();
            commit(e.currentTarget.value);
          }
          if (e.key === "Escape") {
            e.preventDefault();
            textRef.current = title;
            setIsEditing(false);
          }
        }}
        onKeyUp={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
        className="m-0 block w-full resize-none overflow-hidden border-0 bg-transparent p-0 text-3xl font-black tracking-tight leading-[1.05] text-[#f59e0b] outline-2 outline-dashed outline-[#922a52] sm:text-4xl md:text-5xl"
        style={{
          fontFamily: "system-ui, -apple-system, sans-serif",
          textShadow: "0 1px 0 #fef3c7, 0 2px 0 #d97706, 0 4px 0 #b45309, 0 6px 1px #78350f, 0 8px 14px rgba(120,53,15,0.3)",
          caretColor: "#78350f",
        }}
        autoFocus
      />
    );
  }

  // Display mode: render 3D two-tone title
  const words = (title || "Amazing Numbers").trim().split(/\s+/);
  let topWord = words[0] || "Amazing";
  let bottomWords = words.slice(1).join(" ") || "";
  if (words.length > 2) {
    const mid = Math.ceil(words.length / 2);
    topWord = words.slice(0, mid).join(" ");
    bottomWords = words.slice(mid).join(" ");
  }

  return (
    <div
      key="chapter-title-view"
      onClick={(e) => {
        e.stopPropagation();
        textRef.current = title;
        setIsEditing(true);
      }}
      title="Click to edit title"
      className="cursor-text hover:outline-dashed hover:outline-1 hover:outline-[#922a52]/60 rounded-xl p-0.5 transition-all inline-block select-text"
    >
      <div
        className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight leading-[1.05]"
        style={{
          fontFamily: "system-ui, -apple-system, sans-serif",
          color: "#f59e0b",
          textShadow: "0 1px 0 #fef3c7, 0 2px 0 #d97706, 0 4px 0 #b45309, 0 6px 1px #78350f, 0 8px 14px rgba(120,53,15,0.3)",
        }}
      >
        {topWord}
      </div>
      {bottomWords ? (
        <div
          className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight leading-[1.05] mt-0.5"
          style={{
            fontFamily: "system-ui, -apple-system, sans-serif",
            color: "#881337",
            textShadow: "0 1px 0 #fecdd3, 0 2px 0 #be123c, 0 4px 0 #4c0519, 0 6px 1px #2a030e, 0 8px 16px rgba(76,5,25,0.35)",
          }}
        >
          {bottomWords}
        </div>
      ) : null}
    </div>
  );
};

/**
 * 3D Illustrated Chapter Hero Opener
 * Matches the reference image:
 * - 3D Golden-framed Burgundy Shield Badge ("CHAPTER 1")
 * - Fresh botanical leaves curling around the gold bezel
 * - Flowing wavy ribbon banner with metallic gold & burgundy wave trims
 * - Origami paper airplane flying with dashed flight path
 * - Doodled numbers (1, 2, 3, +, ★) and soft clouds
 * - Playful 3D double-tier typography ("Amazing Numbers")
 * - 3D Illustrated Student at desk with books, globe, pencils & glowing lightbulb
 * - 100% EDITABLE: Text, badge number, title, subtitle, AND replaceable image with presets & upload
 */
const ChapterHeroHeader: React.FC<{
  block: SmartBlockInstance;
  content: SmartBlockInstance["semanticContent"];
  title: string;
  subtitle: string;
  primaryColor: string;
  secondaryColor: string;
  zoom?: number;
  isSelected?: boolean;
  updateContent: (patch: Partial<SmartBlockInstance["semanticContent"]>) => void;
  onDetach?: () => void;
}> = ({
  block,
  content,
  title,
  subtitle,
  primaryColor,
  secondaryColor,
  zoom = 1,
  isSelected = false,
  updateContent,
  onDetach,
}) => {
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [customUrlInput, setCustomUrlInput] = useState("");
  const [cutting, setCutting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pickerRef = useRef<HTMLDivElement>(null);

  const chapterNum = content.chapterNumber || "1";
  const badgeLabel = content.badgeLabel || "CHAPTER";
  const illustrationUrl = content.illustrationUrl || "/assets/chapter-hero/student-original-clean.png";

  const imgOffsetX = content.imageOffsetX ?? 0;
  const imgOffsetY = content.imageOffsetY ?? 0;
  const imgScale = content.imageScale ?? 1;
  const imgFlipX = Boolean(content.imageFlipX);

  const [isDraggingImage, setIsDraggingImage] = useState(false);
  const [liveOffset, setLiveOffset] = useState({ x: imgOffsetX, y: imgOffsetY });
  const dragStartRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    initialX: number;
    initialY: number;
  } | null>(null);

  // Sync external changes when not actively dragging
  useEffect(() => {
    if (!isDraggingImage) {
      setLiveOffset({ x: imgOffsetX, y: imgOffsetY });
    }
  }, [imgOffsetX, imgOffsetY, isDraggingImage]);

  const handleImagePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    if ((e.target as HTMLElement).closest("button")) return;

    e.stopPropagation();
    e.preventDefault();

    const pointerId = e.pointerId;
    try {
      (e.currentTarget as HTMLElement).setPointerCapture(pointerId);
    } catch (_) {}

    setIsDraggingImage(true);
    dragStartRef.current = {
      pointerId,
      startX: e.clientX,
      startY: e.clientY,
      initialX: liveOffset.x,
      initialY: liveOffset.y,
    };
  };

  const handleImagePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragStartRef.current || dragStartRef.current.pointerId !== e.pointerId) return;
    e.stopPropagation();
    e.preventDefault();

    const deltaScreenX = e.clientX - dragStartRef.current.startX;
    const deltaScreenY = e.clientY - dragStartRef.current.startY;
    const effectiveZoom = zoom > 0 ? zoom : 1;

    const nextX = Math.round(dragStartRef.current.initialX + deltaScreenX / effectiveZoom);
    const nextY = Math.round(dragStartRef.current.initialY + deltaScreenY / effectiveZoom);

    setLiveOffset({ x: nextX, y: nextY });
  };

  const handleImagePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragStartRef.current || dragStartRef.current.pointerId !== e.pointerId) return;
    e.stopPropagation();
    e.preventDefault();

    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch (_) {}

    const deltaScreenX = e.clientX - dragStartRef.current.startX;
    const deltaScreenY = e.clientY - dragStartRef.current.startY;
    const effectiveZoom = zoom > 0 ? zoom : 1;

    const finalX = Math.round(dragStartRef.current.initialX + deltaScreenX / effectiveZoom);
    const finalY = Math.round(dragStartRef.current.initialY + deltaScreenY / effectiveZoom);

    dragStartRef.current = null;
    setIsDraggingImage(false);
    setLiveOffset({ x: finalX, y: finalY });
    updateContent({
      imageOffsetX: finalX,
      imageOffsetY: finalY,
    });
  };

  const presets = [
    {
      id: "classic-boy",
      name: "Student with Books & Globe",
      url: "/assets/chapter-hero/student-original-clean.png",
      tag: "Math & Logic",
    },
    {
      id: "study-desk",
      name: "Pixar 3D Boy at Study Desk",
      url: "/assets/chapter-hero/student-study.jpg",
      tag: "General Study",
    },
    {
      id: "botany-plants",
      name: "Pixar 3D Girl with Plants & Terrarium",
      url: "/assets/chapter-hero/student-plants.jpg",
      tag: "Botany & Nature",
    },
    {
      id: "space-cosmos",
      name: "Pixar 3D Girl with Telescope & Planets",
      url: "/assets/chapter-hero/student-space.jpg",
      tag: "Space & Physics",
    },
  ];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        updateContent({ illustrationUrl: dataUrl, illustrationOriginalUrl: undefined });
        setShowImagePicker(false);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleApplyCustomUrl = () => {
    if (customUrlInput.trim()) {
      updateContent({ illustrationUrl: customUrlInput.trim(), illustrationOriginalUrl: undefined });
      setCustomUrlInput("");
      setShowImagePicker(false);
    }
  };

  const originalUrl = content.illustrationOriginalUrl;
  const canRestore = Boolean(originalUrl && originalUrl !== illustrationUrl);

  async function removeBackground() {
    const source = originalUrl || illustrationUrl;
    if (!source || cutting) return;
    setCutting(true);
    try {
      const cut = await generateBackgroundRemovalMask(source);
      if (!cut.changed) {
        useUiStore.getState().showToast({
          type: "warning",
          title: "Background stayed in place",
          message: "The subject and backdrop could not be separated cleanly. Try a photo with a clearer edge around the subject.",
        });
        return;
      }
      updateContent({
        illustrationUrl: cut.maskedPreviewUrl,
        illustrationOriginalUrl: originalUrl || illustrationUrl,
      });
      useUiStore.getState().showToast({
        type: "success",
        title: "Background removed",
        message: "The subject stays. Restore the original photo any time.",
      });
    } catch (error) {
      useUiStore.getState().showToast({
        type: "error",
        title: "Background not removed",
        message: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setCutting(false);
    }
  }

  function restoreOriginal() {
    if (!originalUrl) return;
    updateContent({ illustrationUrl: originalUrl, illustrationOriginalUrl: undefined });
  }

  useEffect(() => {
    if (!showImagePicker) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      event.stopPropagation();
      setShowImagePicker(false);
    };
    document.addEventListener("keydown", onKey, true);
    pickerRef.current?.focus();
    return () => document.removeEventListener("keydown", onKey, true);
  }, [showImagePicker]);

  return (
    <div className="relative w-full overflow-hidden rounded-3xl bg-gradient-to-r from-[#faf5ea] via-[#fffefb] to-[#f8f3e8] border border-[#e8d7b0] shadow-xl p-4 sm:p-6 group select-none transition-all">
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileUpload}
      />

      {/* Top S-Curved Flowing Golden & Burgundy Ribbon */}
      <div className="absolute top-0 left-0 right-0 h-10 pointer-events-none overflow-hidden">
        <svg
          viewBox="0 0 1000 60"
          preserveAspectRatio="none"
          className="w-full h-full opacity-90"
        >
          <defs>
            <linearGradient id="ribbonGoldTop" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#f59e0b" />
              <stop offset="35%" stopColor="#ffd54f" />
              <stop offset="70%" stopColor="#d97706" />
              <stop offset="100%" stopColor="#b45309" />
            </linearGradient>
            <linearGradient id="ribbonBurgundyTop" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#580a1c" />
              <stop offset="50%" stopColor="#80122e" />
              <stop offset="100%" stopColor="#400612" />
            </linearGradient>
          </defs>
          <path
            d="M 0,25 Q 180,45 380,28 T 780,18 Q 920,8 1000,20 L 1000,0 L 0,0 Z"
            fill="url(#ribbonBurgundyTop)"
            opacity="0.3"
          />
          <path
            d="M 0,16 Q 220,38 420,18 T 820,14 Q 930,12 1000,16 L 1000,0 L 0,0 Z"
            fill="url(#ribbonGoldTop)"
          />
          {/* Subtle stitch dash */}
          <path
            d="M 20,24 Q 220,44 420,24 T 820,20"
            fill="none"
            stroke="#b45309"
            strokeWidth="1"
            strokeDasharray="4 4"
            opacity="0.5"
          />
        </svg>
      </div>

      {/* Bottom S-Curved Flowing Metallic Gold & Burgundy Wave */}
      <div className="absolute bottom-0 left-0 right-0 h-12 pointer-events-none overflow-hidden">
        <svg
          viewBox="0 0 1000 70"
          preserveAspectRatio="none"
          className="w-full h-full"
        >
          <defs>
            <linearGradient id="ribbonGoldBottom" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ffd54f" />
              <stop offset="25%" stopColor="#f59e0b" />
              <stop offset="60%" stopColor="#fcd34d" />
              <stop offset="85%" stopColor="#d97706" />
              <stop offset="100%" stopColor="#ffd54f" />
            </linearGradient>
            <linearGradient id="ribbonBurgundyBottom" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#4a0816" />
              <stop offset="30%" stopColor="#7a142c" />
              <stop offset="70%" stopColor="#5c0d1f" />
              <stop offset="100%" stopColor="#3d0510" />
            </linearGradient>
          </defs>
          {/* Velvet Burgundy Base Wave */}
          <path
            d="M 0,35 Q 160,10 360,32 T 760,45 Q 890,52 1000,28 L 1000,70 L 0,70 Z"
            fill="url(#ribbonBurgundyBottom)"
          />
          {/* Gleaming Gold Piping Wave */}
          <path
            d="M 0,38 Q 160,13 360,35 T 760,48 Q 890,55 1000,31"
            fill="none"
            stroke="url(#ribbonGoldBottom)"
            strokeWidth="4"
          />
          <path
            d="M 0,44 Q 160,19 360,41 T 760,54 Q 890,61 1000,37"
            fill="none"
            stroke="#fcd34d"
            strokeWidth="1.5"
            opacity="0.8"
          />
        </svg>
      </div>

      {/* Floating Sparkles along the Ribbon */}
      <span className="absolute left-[34%] bottom-6 text-[#ffd54f] text-xs animate-pulse pointer-events-none select-none">✦</span>
      <span className="absolute left-[48%] bottom-9 text-[#fcd34d] text-base animate-pulse pointer-events-none select-none">✦</span>
      <span className="absolute left-[72%] bottom-5 text-[#ffd54f] text-[10px] pointer-events-none select-none">✦</span>

      {/* Main Content Layout */}
      <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-4 md:gap-6 min-h-[200px]">
        
        {/* LEFT: 3D Golden-Framed Burgundy Badge */}
        <div className="relative shrink-0 flex items-center justify-center">
          {/* Foliage curling around the badge */}
          <svg
            className="absolute -left-3 -top-2 w-28 h-28 pointer-events-none z-0 filter drop-shadow-sm"
            viewBox="0 0 100 100"
            fill="none"
          >
            <path
              d="M 30,50 C 20,40 18,25 24,15 C 28,8 38,12 36,22 C 34,30 38,40 45,46 Z"
              fill="#527d2c"
            />
            <path
              d="M 24,15 C 26,12 34,14 36,22 Z"
              fill="#74a838"
            />
            <path
              d="M 28,52 C 14,50 8,62 12,72 C 16,80 26,76 30,68 Z"
              fill="#5a8b32"
            />
            <path
              d="M 38,28 C 42,20 50,22 48,30 C 46,36 40,34 38,28 Z"
              fill="#8cc24a"
            />
          </svg>

          {/* Lower foliage */}
          <svg
            className="absolute -left-2 -bottom-2 w-24 h-24 pointer-events-none z-0 filter drop-shadow-sm"
            viewBox="0 0 100 100"
            fill="none"
          >
            <path
              d="M 40,30 C 30,45 20,55 15,70 C 12,80 25,85 32,74 C 38,64 42,50 48,40 Z"
              fill="#436a24"
            />
            <path
              d="M 30,72 C 35,60 48,65 52,78 C 50,86 38,84 30,72 Z"
              fill="#6a9b34"
            />
          </svg>

          {/* The 3D Sculpted Organic Shield Badge */}
          <div
            className="relative w-28 h-28 sm:w-32 sm:h-32 flex flex-col items-center justify-center text-center transition-transform hover:scale-[1.03]"
            style={{
              borderRadius: "44% 56% 54% 46% / 48% 46% 54% 52%",
              background: "radial-gradient(ellipse at 35% 28%, #8e1937 0%, #5e0b1f 60%, #3a0411 100%)",
              border: "5px solid #d49b28",
              boxShadow: "0 0 0 1px #fef08a, 0 10px 25px -4px rgba(74, 11, 27, 0.5), inset 0 2px 4px rgba(255,255,255,0.7), inset 0 -5px 10px rgba(0,0,0,0.6)",
            }}
          >
            {/* Top Label (CHAPTER / UNIT / LESSON) */}
            <div className="mb-0.5 px-2">
              <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.22em] text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.85)]">
                <InlineText
                  value={badgeLabel}
                  onChange={(val) => updateContent({ badgeLabel: val })}
                  placeholder="CHAPTER"
                />
              </span>
            </div>

            {/* Huge 3D Numeral */}
            <div
              className="text-4xl sm:text-5xl font-black tracking-tight leading-none text-[#fff9ee] select-text"
              style={{
                fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
                textShadow: "0 1px 0 #ffffff, 0 2px 0 #eeddc2, 0 4px 0 #caa976, 0 6px 0 #8b6832, 0 8px 16px rgba(0,0,0,0.5)",
              }}
            >
              <InlineText
                value={chapterNum}
                onChange={(val) => updateContent({ chapterNumber: val })}
                placeholder="1"
              />
            </div>
          </div>
        </div>

        {/* CENTER: Wavy Parchment Banner with 3D Playful Typography & Doodles */}
        <div className="relative flex-1 min-w-0 flex flex-col justify-center px-2 sm:px-4 py-1">
          {/* Flying Origami Airplane & Dashed Flight Arc */}
          <div className="absolute -top-3 left-4 w-48 h-16 pointer-events-none">
            <svg viewBox="0 0 200 60" className="w-full h-full overflow-visible">
              <path
                d="M 10,48 Q 50,15 90,38 T 150,22"
                fill="none"
                stroke="#c29f68"
                strokeWidth="1.5"
                strokeDasharray="4 4"
                opacity="0.6"
              />
              <g transform="translate(150, 14) rotate(-10) scale(0.65)">
                <polygon points="0,0 36,12 12,24" fill="#fbbf24" stroke="#d97706" strokeWidth="0.8" />
                <polygon points="0,0 36,12 14,8" fill="#fef08a" />
                <polygon points="12,24 16,10 36,12" fill="#d97706" />
              </g>
            </svg>
          </div>

          {/* Whimsical Chalk Doodles: 1 2 3, +, ★ */}
          <div className="absolute right-6 top-0 pointer-events-none select-none opacity-40 font-mono text-xs sm:text-sm font-bold text-[#8a7250] flex flex-col items-end leading-tight tracking-wider">
            <div className="flex gap-2">
              <span className="transform -rotate-6">1</span>
              <span className="transform rotate-3">2</span>
              <span className="transform rotate-12">3</span>
            </div>
            <div className="flex gap-3 text-[11px] mt-0.5">
              <span>★</span>
              <span className="text-sm font-black">+</span>
            </div>
          </div>

          {/* 3D Playful Typography Title */}
          <div className="relative z-10 flex flex-col justify-center">
            <ChapterTitleDisplay
              title={title}
              onChange={(val) => updateContent({ title: val })}
            />

            {/* Subtitle / Teaser */}
            <div className="mt-2 text-xs sm:text-sm font-medium text-[#60523e] max-w-[480px] leading-relaxed">
              <InlineText
                value={subtitle}
                onChange={(val) => updateContent({ subtitle: val, introText: val })}
                placeholder="Add chapter theme and learning teaser..."
                multiline
              />
            </div>
          </div>
        </div>

        {/* RIGHT: 3D Character & Artwork Container — FREELY MOVEABLE, SCALABLE & REPLACEABLE */}
        <div className="relative shrink-0 w-48 sm:w-60 md:w-72 h-52 sm:h-60 flex items-end justify-center group/artwork select-none">
          {/* Draggable & Scalable Illustration Image Wrapper */}
          <div
            onPointerDown={handleImagePointerDown}
            onPointerMove={handleImagePointerMove}
            onPointerUp={handleImagePointerUp}
            onPointerCancel={handleImagePointerUp}
            style={{
              transform: `translate3d(${liveOffset.x}px, ${liveOffset.y}px, 0) scale(${imgScale}) scaleX(${imgFlipX ? -1 : 1})`,
              cursor: isDraggingImage ? "grabbing" : "grab",
              touchAction: "none",
            }}
            className="relative w-full h-full flex items-end justify-center transition-transform will-change-transform"
            title="Click and drag to move image inside header"
          >
            {/* The Illustration Image */}
            <img
              src={illustrationUrl}
              alt={title}
              draggable={false}
              className="w-full h-full object-contain object-bottom drop-shadow-[0_14px_28px_rgba(0,0,0,0.22)] select-none pointer-events-none"
            />

            {/* Subtle Active/Hover Visual Frame */}
            <div
              className={`absolute inset-0 rounded-2xl border-2 border-dashed pointer-events-none transition-opacity ${
                isDraggingImage
                  ? "border-amber-400 opacity-100 bg-amber-500/5"
                  : "border-amber-400/60 opacity-0 group-hover/artwork:opacity-100"
              }`}
            />
          </div>

          {/* Image actions sit inside the artwork so the page frame cannot clip them. */}
          <div
            className={`absolute bottom-1 inset-x-1 z-30 flex flex-col gap-1 rounded-xl border border-white/15 bg-slate-950 p-1 text-white shadow-lg ${
              isSelected || isDraggingImage || showImagePicker || cutting
                ? "opacity-100 pointer-events-auto"
                : "opacity-0 pointer-events-none group-hover/artwork:opacity-100 group-hover/artwork:pointer-events-auto focus-within:opacity-100 focus-within:pointer-events-auto"
            }`}
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setShowImagePicker(true)}
              className="flex min-h-9 w-full items-center justify-center gap-1.5 rounded-lg bg-amber-400 px-2 text-[12px] font-bold text-slate-950 hover:bg-amber-300"
              title="Choose a different illustration or upload your own"
            >
              <ImageIcon className="h-3.5 w-3.5 shrink-0" />
              Replace image
            </button>
            <button
              type="button"
              disabled={cutting}
              onClick={() => void removeBackground()}
              className="flex min-h-9 w-full items-center justify-center gap-1.5 rounded-lg bg-white px-2 text-[12px] font-bold text-slate-950 hover:bg-slate-100 disabled:opacity-50"
              title="Remove the background from the photo already on this chapter"
            >
              <Eraser className="h-3.5 w-3.5 shrink-0" />
              {cutting ? "Removing…" : "Remove background"}
            </button>
            <div className="flex items-center gap-0.5">
              <span className="flex items-center gap-1 px-1 text-[10px] font-semibold text-amber-200" title="Drag the illustration to move it inside the header">
                <Move className="h-3 w-3" />
                Move
              </span>
              <button
                type="button"
                aria-label="Zoom out image"
                onClick={() => updateContent({ imageScale: Math.max(0.5, Math.round((imgScale - 0.1) * 10) / 10) })}
                className="flex h-7 w-7 items-center justify-center rounded-md text-slate-200 hover:bg-white/15"
              >
                <ZoomOut className="h-3.5 w-3.5" />
              </button>
              <span className="min-w-8 text-center font-mono text-[10px] text-slate-200">{Math.round(imgScale * 100)}%</span>
              <button
                type="button"
                aria-label="Zoom in image"
                onClick={() => updateContent({ imageScale: Math.min(2.5, Math.round((imgScale + 0.1) * 10) / 10) })}
                className="flex h-7 w-7 items-center justify-center rounded-md text-slate-200 hover:bg-white/15"
              >
                <ZoomIn className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                aria-label="Flip image horizontally"
                aria-pressed={imgFlipX}
                onClick={() => updateContent({ imageFlipX: !imgFlipX })}
                className={`flex h-7 w-7 items-center justify-center rounded-md hover:bg-white/15 ${imgFlipX ? "bg-white/15 text-amber-300" : "text-slate-200"}`}
              >
                <FlipHorizontal className="h-3.5 w-3.5" />
              </button>
              {(liveOffset.x !== 0 || liveOffset.y !== 0 || imgScale !== 1 || imgFlipX) && (
                <button
                  type="button"
                  aria-label="Reset image position and scale"
                  onClick={() => {
                    setLiveOffset({ x: 0, y: 0 });
                    updateContent({ imageOffsetX: 0, imageOffsetY: 0, imageScale: 1, imageFlipX: false });
                  }}
                  className="flex h-7 w-7 items-center justify-center rounded-md text-rose-200 hover:bg-rose-500/30"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </button>
              )}
              {canRestore && (
                <button
                  type="button"
                  onClick={restoreOriginal}
                  className="ml-auto min-h-7 rounded-md px-2 text-[11px] font-semibold text-amber-100 hover:bg-white/10"
                >
                  Restore
                </button>
              )}
            </div>
            {onDetach && (
              <button
                type="button"
                onClick={onDetach}
                className="flex min-h-8 w-full items-center justify-center gap-1.5 rounded-lg bg-amber-500/20 px-2 text-[11px] font-bold text-amber-200 hover:bg-amber-500/30 border border-amber-400/30 transition-all"
                title="Detach image and text into separate movable canvas layers"
              >
                <Unlink2 className="h-3.5 w-3.5 shrink-0" />
                Make Text & Images Movable
              </button>
            )}
          </div>
        </div>
      </div>

      {showImagePicker && typeof document !== "undefined" && createPortal(
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/60 p-4 pb-24"
          onMouseDown={(e) => {
            e.stopPropagation();
            if (e.target === e.currentTarget) setShowImagePicker(false);
          }}
        >
          <div
            ref={pickerRef}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-labelledby="chapter-artwork-title"
            className="flex max-h-[min(32rem,calc(100dvh-8rem))] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white text-slate-800 shadow-2xl outline-none"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
              <div className="flex min-w-0 items-center gap-2">
                <ImageIcon className="h-5 w-5 shrink-0 text-amber-500" />
                <h3 id="chapter-artwork-title" className="truncate text-base font-bold text-slate-900">Replace image</h3>
              </div>
              <button
                type="button"
                aria-label="Close image picker"
                onClick={() => setShowImagePicker(false)}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-3">
              <img
                src={illustrationUrl}
                alt=""
                className="h-14 w-14 shrink-0 rounded-lg border border-slate-200 object-contain"
                style={{ backgroundImage: "linear-gradient(45deg,#e2e8f0 25%,transparent 25%),linear-gradient(-45deg,#e2e8f0 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#e2e8f0 75%),linear-gradient(-45deg,transparent 75%,#e2e8f0 75%)", backgroundSize: "12px 12px", backgroundPosition: "0 0,0 6px,6px -6px,-6px 0" }}
              />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-slate-900">Photo on this chapter</p>
                <p className="mt-0.5 text-[11px] leading-snug text-slate-500">Remove the backdrop from this picture, or pick another one below.</p>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Choose from presets</p>
              <div className="grid grid-cols-2 gap-2">
                {presets.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => {
                      updateContent({ illustrationUrl: preset.url, illustrationOriginalUrl: undefined });
                      setShowImagePicker(false);
                    }}
                    className={`flex items-center gap-2 rounded-xl border p-2 text-left hover:border-amber-400 hover:bg-amber-50/40 ${
                      illustrationUrl === preset.url ? "border-amber-500 bg-amber-50 ring-2 ring-amber-400/40" : "border-slate-200 bg-white"
                    }`}
                  >
                    <img src={preset.url} alt="" className="h-12 w-12 shrink-0 rounded-lg border border-slate-100 bg-slate-50 object-contain" />
                    <span className="min-w-0">
                      <span className="block truncate text-xs font-bold text-slate-900">{preset.name}</span>
                      <span className="mt-0.5 inline-block rounded-sm bg-amber-100/70 px-1.5 py-0.5 text-[10px] font-medium text-amber-800">{preset.tag}</span>
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2 border-t border-slate-100 px-4 py-3">
              <button
                type="button"
                disabled={cutting}
                onClick={() => void removeBackground()}
                className="flex min-h-10 w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-3 text-xs font-bold text-white hover:bg-slate-800 disabled:opacity-50"
              >
                <Eraser className="h-4 w-4" />
                {cutting ? "Removing background…" : "Remove background"}
              </button>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex min-h-10 flex-1 items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 px-3 text-xs font-semibold text-slate-700 hover:border-amber-500 hover:bg-amber-50/50"
                >
                  <Upload className="h-4 w-4 text-amber-600" />
                  Upload from computer
                </button>
                <button
                  type="button"
                  onClick={() => {
                    updateContent({ illustrationUrl: "/assets/chapter-hero/student-original-clean.png", illustrationOriginalUrl: undefined });
                    setShowImagePicker(false);
                  }}
                  className="flex min-h-10 items-center justify-center gap-1 rounded-xl border border-slate-200 px-3 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                  title="Reset to the default illustration"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Reset
                </button>
              </div>
              {canRestore && (
                <button type="button" onClick={restoreOriginal} className="min-h-9 w-full rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50">
                  Restore original photo
                </button>
              )}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Or paste an image URL"
                  value={customUrlInput}
                  onChange={(e) => setCustomUrlInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleApplyCustomUrl()}
                  className="min-h-10 flex-1 rounded-xl border border-slate-200 px-3 text-xs focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                />
                <button
                  type="button"
                  onClick={handleApplyCustomUrl}
                  disabled={!customUrlInput.trim()}
                  className="min-h-10 rounded-xl bg-amber-500 px-4 text-xs font-bold text-white hover:bg-amber-600 disabled:opacity-40"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export const UniversalBlockRenderer = memo(function UniversalBlockRenderer({
  block,
  isSelected = false,
  zoom = 1,
  onExploreStyles,
  onDetach,
}: UniversalBlockRendererProps) {
  const updateSmartBlockContent = useEditorStore((s) => s.updateSmartBlockContent);
  const updateSmartBlockStyle = useEditorStore((s) => s.updateSmartBlockStyle);
  const getActivePage = useEditorStore((s) => s.getActivePage);
  const duplicateSelectedElements = useEditorStore((s) => s.duplicateSelectedElements);
  const deleteSelectedElements = useEditorStore((s) => s.deleteSelectedElements);

  const [showPresetMenu, setShowPresetMenu] = useState(false);
  const [showPaletteMenu, setShowPaletteMenu] = useState(false);

  const rawType = block.curriculum?.type || block.archetypeId || "section-heading";
  const uType = normalizeUniversalType(rawType);
  const meta = UNIVERSAL_BLOCK_MAP[uType] || UNIVERSAL_BLOCK_MAP["section-heading"];

  const content = block.semanticContent || {};
  const overrides = block.styleOverrides || {};
  const presetKey: UniversalLayoutPreset = (overrides.blockStyle as UniversalLayoutPreset) || "editorial";
  const activePreset = NEX_MAXX_PRESETS[presetKey] || NEX_MAXX_PRESETS.editorial;

  const subjectKey = block.curriculum?.subjectLabel || block.subject || "mathematics";
  const fixture = getSubjectFixture(subjectKey);

  // Palette resolution
  const customPalette = overrides.customPalette;
  const primaryColor = customPalette?.primary || activePreset.accent || NEX_MAXX_BRAND.maroon;
  const secondaryColor = customPalette?.accent || NEX_MAXX_BRAND.maroonSecondary;
  const washColor = customPalette?.surface || activePreset.wash || NEX_MAXX_BRAND.washMaroon;

  const updateContent = (patch: Partial<SmartBlockInstance["semanticContent"]>) => {
    updateSmartBlockContent(block.id, patch);
  };

  const updateStyle = (patch: Partial<SmartBlockInstance["styleOverrides"]>) => {
    updateSmartBlockStyle(block.id, patch);
  };

  const title = content.title ?? meta.defaultTitle;
  const subtitle = content.subtitle ?? content.introText ?? meta.defaultBody;
  const items = content.items && content.items.length ? content.items : meta.defaultBody.split("|");
  const steps = content.steps && content.steps.length ? content.steps : [
    { stepNumber: 1, title: "PLAN", body: "Agree on a question and gather materials." },
    { stepNumber: 2, title: "DO", body: "Test, create, observe or investigate." },
    { stepNumber: 3, title: "SHARE", body: "Present what you noticed and explain why." },
  ];
  const questions = content.questions && content.questions.length ? content.questions : [
    { prompt: meta.defaultBody.split("|")[0] || "In 6,42,510, which digit represents forty thousand?", options: [], answer: "" },
  ];

  // Grade typography scaling
  const gradeRank = typeof block.curriculum?.grade === "number" ? block.curriculum.grade : 4;
  const isEarly = gradeRank <= 2 || block.curriculum?.grade === "NURSERY" || block.curriculum?.grade === "LKG" || block.curriculum?.grade === "UKG";
  const isSecondary = gradeRank >= 9;

  // Render specific universal block UI
  const renderBlockBody = () => {
    switch (uType) {
      case "chapter-hero": {
        return (
          <ChapterHeroHeader
            block={block}
            content={content}
            title={title}
            subtitle={subtitle}
            primaryColor={primaryColor}
            secondaryColor={secondaryColor}
            zoom={zoom}
            isSelected={isSelected}
            updateContent={updateContent}
            onDetach={onDetach}
          />
        );
      }

      case "infographic-stats": {
        const stats = items.slice(0, 3);
        const labels = fixture.labels || ["First representation", "Second representation", "Third representation"];
        return (
          <div className="p-4 rounded-2xl border border-[#f0d7e2] bg-gradient-to-br from-[#fff6f9] via-white to-[#f2fafa]">
            <h3 className="text-[10px] font-bold tracking-wider uppercase mb-3 text-[#9b395e]">
              <InlineText value={title} onChange={(val) => updateContent({ title: val })} placeholder="Three ways to explore" />
            </h3>
            <div className="grid grid-cols-3 gap-3">
              {stats.map((val, idx) => (
                <div key={idx} className="bg-white border border-[#f1e5e8] rounded-xl p-3 shadow-xs flex flex-col justify-center min-h-[88px]">
                  <strong className="text-xl font-black tracking-tight" style={{ color: idx === 0 ? "#873258" : idx === 1 ? "#157e7a" : "#b17a17" }}>
                    <InlineText
                      value={val}
                      onChange={(newVal) => {
                        const updated = [...items];
                        updated[idx] = newVal;
                        updateContent({ items: updated });
                      }}
                      placeholder="Stat value"
                    />
                  </strong>
                  <span className="text-[10px] text-[#888392] mt-1 leading-snug">
                    {labels[idx] || "Key idea"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        );
      }

      case "mission-banner": {
        return (
          <div
            className="rounded-2xl p-5 flex items-center gap-4 text-white shadow-sm"
            style={{ background: activePreset.missionGradient }}
          >
            <div className="w-11 h-11 rounded-xl shrink-0 flex items-center justify-center text-2xl border border-white/30 bg-white/15">
              ✦
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-black tracking-wide text-white uppercase mb-1">
                <InlineText value={title} onChange={(val) => updateContent({ title: val })} placeholder="YOUR CHAPTER MISSION" />
              </h3>
              <p className="text-xs text-[#ffe8ee] leading-relaxed">
                <InlineText value={subtitle} onChange={(val) => updateContent({ introText: val, calloutText: val })} placeholder="Write the driving challenge..." multiline />
              </p>
            </div>
          </div>
        );
      }

      case "learning-journey": {
        const journeySteps = items.slice(0, 4);
        const bgs = ["bg-white", "bg-[#f0fbfa]", "bg-[#fff9eb]", "bg-[#f5f4ff]"];
        const colors = ["#9c3c69", "#188a89", "#bd8429", "#6558ad"];
        return (
          <div className="space-y-2">
            <div className="text-[10px] font-bold tracking-widest uppercase text-slate-400">
              <InlineText value={title} onChange={(val) => updateContent({ title: val })} placeholder="Your learning journey" />
            </div>
            <div className="grid grid-cols-4 gap-2.5">
              {journeySteps.map((step, idx) => (
                <div key={idx} className={`rounded-xl border border-[#e9e6eb] p-3 shadow-xs min-h-[96px] ${bgs[idx % 4]}`}>
                  <b className="text-xl font-extrabold tracking-tight block" style={{ color: colors[idx % 4] }}>
                    {String(idx + 1).padStart(2, "0")}
                  </b>
                  <span className="text-[11px] font-bold text-[#48495b] mt-2 block leading-snug">
                    <InlineText
                      value={step}
                      onChange={(newVal) => {
                        const updated = [...items];
                        updated[idx] = newVal;
                        updateContent({ items: updated });
                      }}
                      placeholder="Step label"
                    />
                  </span>
                </div>
              ))}
            </div>
          </div>
        );
      }

      case "topic-banner": {
        return (
          <TopicBannerRenderer
            block={block}
            elementId={block.id}
            selected={isSelected}
          />
        );
      }

      case "fact-zone": {
        return (
          <FactZoneRenderer
            block={block}
            elementId={block.id}
            selected={isSelected}
          />
        );
      }

      case "life-connect": {
        return (
          <LifeConnectRenderer
            block={block}
            elementId={block.id}
            selected={isSelected}
          />
        );
      }

      case "section-heading": {
        if (block.styleOverrides.layoutVariant === "topic-banner" || block.styleOverrides.layoutVariant === "ribbon" || block.curriculum?.type === "topic-banner") {
          return (
            <TopicBannerRenderer
              block={block}
              elementId={block.id}
              selected={isSelected}
            />
          );
        }
        return (
          <div className="py-2">
            <div className="flex items-center gap-2 mb-1.5 text-[10px] font-extrabold tracking-widest uppercase" style={{ color: primaryColor }}>
              <span className="w-4 h-1 rounded-full" style={{ backgroundColor: primaryColor }} />
              <span>THE NEXT BIG IDEA</span>
            </div>
            <h2 className="font-serif font-extrabold text-2xl tracking-tight text-[#1a1d2c] mb-1">
              <InlineText value={title} onChange={(val) => updateContent({ title: val })} placeholder="Section title..." />
            </h2>
            <p className="text-xs text-[#586073] leading-relaxed max-w-[620px]">
              <InlineText value={subtitle} onChange={(val) => updateContent({ introText: val, subtitle: val })} placeholder="Explain the big concept..." multiline />
            </p>
          </div>
        );
      }

      case "study-skills": {
        return (
          <StudySkillsRenderer
            block={block}
            elementId={block.id}
            selected={isSelected}
          />
        );
      }

      case "learning-outcomes": {
        return (
          <LearningOutcomesRenderer
            block={block}
            elementId={block.id}
            selected={isSelected}
          />
        );
      }

      case "concept-comparison": {
        const p = items.length >= 4 ? items : [
          fixture.conceptA || "Place value",
          fixture.conceptTextA || "The position of a digit changes its value.",
          fixture.conceptB || "Face value",
          fixture.conceptTextB || "A digit keeps the same face value wherever it appears.",
        ];
        return (
          <div className="grid grid-cols-2 gap-3">
            <div className="border border-[#eee5e9] bg-white rounded-xl p-4 min-h-[110px] shadow-2xs">
              <small className="block text-[9px] font-extrabold tracking-wider uppercase mb-1.5" style={{ color: primaryColor }}>
                CONCEPT 01
              </small>
              <h4 className="text-sm font-bold text-[#252a38] mb-1">
                <InlineText value={p[0]} onChange={(val) => { const u = [...p]; u[0] = val; updateContent({ items: u }); }} placeholder="Concept 1 title" />
              </h4>
              <p className="text-[11px] text-[#6a7380] leading-relaxed">
                <InlineText value={p[1]} onChange={(val) => { const u = [...p]; u[1] = val; updateContent({ items: u }); }} placeholder="Concept 1 description" multiline />
              </p>
              <div className="flex gap-1 items-end h-6 mt-3">
                <i className="flex-1 h-3 rounded bg-[#e7c0d1]" />
                <i className="flex-1 h-6 rounded bg-[#c76f95]" />
                <i className="flex-1 h-2.5 rounded bg-[#8bbfbd]" />
                <i className="flex-1 h-4 rounded bg-[#f0c56e]" />
              </div>
            </div>

            <div className="border border-[#e3f1f1] bg-[#f6fbfc] rounded-xl p-4 min-h-[110px] shadow-2xs">
              <small className="block text-[9px] font-extrabold tracking-wider uppercase mb-1.5" style={{ color: "#137f83" }}>
                CONCEPT 02
              </small>
              <h4 className="text-sm font-bold text-[#252a38] mb-1">
                <InlineText value={p[2]} onChange={(val) => { const u = [...p]; u[2] = val; updateContent({ items: u }); }} placeholder="Concept 2 title" />
              </h4>
              <p className="text-[11px] text-[#6a7380] leading-relaxed">
                <InlineText value={p[3]} onChange={(val) => { const u = [...p]; u[3] = val; updateContent({ items: u }); }} placeholder="Concept 2 description" multiline />
              </p>
              <div className="flex gap-1 items-end h-6 mt-3">
                <i className="flex-1 h-4 rounded bg-[#8bbfbd]" />
                <i className="flex-1 h-2 rounded bg-[#e7c0d1]" />
                <i className="flex-1 h-5 rounded bg-[#137f83]" />
                <i className="flex-1 h-3 rounded bg-[#f0c56e]" />
              </div>
            </div>
          </div>
        );
      }

      case "key-insight": {
        if (block.styleOverrides.layoutVariant === "fact-zone" || block.curriculum?.type === "fact-zone") {
          return (
            <FactZoneRenderer
              block={block}
              elementId={block.id}
              selected={isSelected}
            />
          );
        }
        return (
          <div className="bg-[#222838] rounded-xl p-4 text-white flex items-start gap-3 shadow-sm">
            <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center text-lg font-bold shrink-0">
              ✧
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-xs font-black text-white uppercase mb-1">
                <InlineText value={title} onChange={(val) => updateContent({ title: val })} placeholder="THE BIG IDEA" />
              </h3>
              <p className="text-[11px] text-[#dee2ee] leading-relaxed">
                <InlineText value={subtitle} onChange={(val) => updateContent({ introText: val, calloutText: val })} placeholder="Write the central learning takeaway..." multiline />
              </p>
            </div>
          </div>
        );
      }

      case "smart-table": {
        const tableData = items.length >= 6 ? items : [
          "Place value", "Face value", "Think deeply",
          "Observe carefully", "Describe clearly", "Give an example"
        ];
        return (
          <div className="border border-[#e5e9ed] rounded-xl overflow-hidden bg-white shadow-2xs">
            <div className="bg-[#263143] text-white px-3 py-2 text-[10px] font-bold tracking-wider uppercase">
              <InlineText value={title} onChange={(val) => updateContent({ title: val })} placeholder="Compare & Connect" />
            </div>
            <div className="grid grid-cols-3 text-[10.5px]">
              {tableData.slice(0, 6).map((cell, idx) => (
                <div
                  key={idx}
                  className={`p-2.5 text-center border-r border-b border-[#e9ecf0] last:border-r-0 ${
                    idx < 3 ? "bg-[#f4f7f8] font-bold text-[#333947]" : "text-[#444b59]"
                  }`}
                >
                  <InlineText
                    value={cell}
                    onChange={(newVal) => {
                      const updated = [...tableData];
                      updated[idx] = newVal;
                      updateContent({ items: updated });
                    }}
                    placeholder={`Cell ${idx + 1}`}
                  />
                </div>
              ))}
            </div>
          </div>
        );
      }

      case "quick-check": {
        const qPrompt = questions[0]?.prompt || subtitle || "In 6,42,510, which digit represents forty thousand?";
        return (
          <div className="border border-[#dfeced] rounded-xl bg-[#f4fbfb] p-3.5 flex items-start gap-3 shadow-2xs">
            <div className="bg-[#248e8f] text-white rounded-lg px-2 py-1 text-xs font-black shrink-0">
              ?
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[9px] font-black tracking-wider uppercase text-[#8c405d] mb-1">
                <InlineText value={title} onChange={(val) => updateContent({ title: val })} placeholder="CHECK YOUR THINKING" />
              </div>
              <strong className="text-xs text-[#222335] leading-snug block mb-3">
                <InlineText
                  value={qPrompt}
                  onChange={(val) => {
                    const qCopy = [...questions];
                    qCopy[0] = { ...qCopy[0], prompt: val };
                    updateContent({ questions: qCopy, subtitle: val });
                  }}
                  placeholder="Question prompt..."
                  multiline
                />
              </strong>
              <div className="w-full border-t border-dotted border-[#acb8bf] h-1" />
            </div>
          </div>
        );
      }

      case "worked-example": {
        return (
          <div className="border border-[#f1dce4] rounded-2xl p-4 bg-gradient-to-br from-[#fff7fa] to-white shadow-xs">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-lg bg-[#f9e5ee] text-[#9c3764] flex items-center justify-center text-xs font-bold">
                ↳
              </div>
              <h3 className="text-xs font-black text-[#191c29] uppercase">
                <InlineText value={title} onChange={(val) => updateContent({ title: val })} placeholder="LET'S SOLVE ONE TOGETHER" />
              </h3>
            </div>
            <p className="text-xs text-[#586073] leading-relaxed mb-3">
              <InlineText value={subtitle} onChange={(val) => updateContent({ introText: val, subtitle: val })} placeholder="Example statement..." multiline />
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="border border-[#eee5e9] bg-white rounded-xl p-3 shadow-2xs">
                <small className="block text-[8.5px] font-bold text-[#9c3764] uppercase tracking-wider mb-1">
                  STEP 01 · NOTICE
                </small>
                <p className="text-[11px] text-[#48495b] leading-relaxed">
                  <InlineText
                    value={steps[0]?.body || "Underline important information."}
                    onChange={(val) => {
                      const s = [...steps];
                      s[0] = { stepNumber: 1, title: "NOTICE", body: val };
                      updateContent({ steps: s });
                    }}
                    placeholder="Step 1 details..."
                    multiline
                  />
                </p>
              </div>
              <div className="border border-[#eee5e9] bg-white rounded-xl p-3 shadow-2xs">
                <small className="block text-[8.5px] font-bold text-[#188a89] uppercase tracking-wider mb-1">
                  STEP 02 · REASON
                </small>
                <p className="text-[11px] text-[#48495b] leading-relaxed">
                  <InlineText
                    value={steps[1]?.body || "Explain your method with evidence."}
                    onChange={(val) => {
                      const s = [...steps];
                      s[1] = { stepNumber: 2, title: "REASON", body: val };
                      updateContent({ steps: s });
                    }}
                    placeholder="Step 2 reasoning..."
                    multiline
                  />
                </p>
              </div>
            </div>
          </div>
        );
      }

      case "guided-exercises": {
        const exerciseList = items.length ? items : fixture.exercise;
        return (
          <div className="w-full h-full flex flex-col justify-between border border-[#e9e8ed] rounded-2xl p-4 bg-white shadow-xs">
            <div className="flex items-center gap-2 mb-3 shrink-0">
              <div className="w-6 h-6 rounded-lg bg-[#e4f5f3] text-[#167e7e] flex items-center justify-center text-xs font-bold">
                ✍
              </div>
              <h3 className="text-xs font-extrabold text-[#191c29]">
                <InlineText value={title} onChange={(val) => updateContent({ title: val })} placeholder="Guided practice" />
              </h3>
            </div>
            <div className="space-y-3 flex-1 flex flex-col justify-around">
              {exerciseList.map((ex, idx) => (
                <div key={idx} className="border-b border-[#eaedf1] pb-3 last:border-b-0 last:pb-0 flex items-start gap-2.5">
                  <span className="text-[11px] font-black text-[#92365e] shrink-0 min-w-[22px]">
                    {String(idx + 1).padStart(2, "0")}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-[#41495a] leading-relaxed">
                      <InlineText
                        value={ex}
                        onChange={(newVal) => {
                          const updated = [...exerciseList];
                          updated[idx] = newVal;
                          updateContent({ items: updated });
                        }}
                        placeholder="Exercise prompt..."
                        multiline
                      />
                    </p>
                    <div className="w-full border-b border-[#bac0cb] h-3 mt-1" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      }

      case "answer-workspace": {
        return (
          <div className="w-full h-full flex flex-col justify-between border border-dashed border-[#b6d8dc] rounded-2xl p-4 bg-gradient-to-br from-[#f8fbfc] to-white shadow-2xs">
            <div className="flex items-center gap-2 mb-1.5 shrink-0">
              <div className="w-6 h-6 rounded-lg bg-[#e4f5f3] text-[#167e7e] flex items-center justify-center text-xs font-bold">
                ▦
              </div>
              <h3 className="text-xs font-extrabold text-[#191c29]">
                <InlineText value={title} onChange={(val) => updateContent({ title: val })} placeholder="MY THINKING SPACE" />
              </h3>
            </div>
            <p className="text-[10px] text-[#737c8d] mb-3 shrink-0">
              <InlineText value={subtitle} onChange={(val) => updateContent({ introText: val, subtitle: val })} placeholder="Show your method, sketch or working below." />
            </p>
            <div
              className="min-h-[80px] w-full flex-1 rounded-lg border border-[#e1eef2]"
              style={{
                backgroundImage: "linear-gradient(#d2e2e958 1px, transparent 1px)",
                backgroundSize: "100% 20px",
              }}
            />
          </div>
        );
      }

      case "activity-lab": {
        return (
          <div className="w-full h-full flex flex-col justify-between border border-[#f3e4c2] rounded-2xl p-4 bg-gradient-to-br from-[#fffaef] to-white shadow-xs">
            <div className="flex items-center gap-2 mb-2 shrink-0">
              <div className="w-6 h-6 rounded-lg bg-[#fff2d9] text-[#a97721] flex items-center justify-center text-xs font-bold">
                ⚗
              </div>
              <h3 className="text-xs font-extrabold text-[#191c29]">
                <InlineText value={title} onChange={(val) => updateContent({ title: val })} placeholder="Build a Number Museum" />
              </h3>
            </div>
            <p className="text-xs text-[#586073] leading-relaxed mb-3 shrink-0">
              <InlineText value={subtitle} onChange={(val) => updateContent({ introText: val, subtitle: val })} placeholder="Activity description..." multiline />
            </p>
            <div className="space-y-1.5 flex-1 flex flex-col justify-around">
              {steps.map((s, idx) => (
                <div key={idx} className="text-[10.5px] border-l-4 border-[#dba04c] bg-[#fffaf1] px-3 py-1.5 rounded-r leading-relaxed flex items-center gap-2">
                  <b className="text-[#a97721] shrink-0">{String(idx + 1).padStart(2, "0")} {s.title}</b>
                  <span className="text-[#586073] flex-1">
                    <InlineText
                      value={s.body}
                      onChange={(newVal) => {
                        const updated = [...steps];
                        updated[idx] = { ...s, body: newVal };
                        updateContent({ steps: updated });
                      }}
                      placeholder="Step details..."
                    />
                  </span>
                </div>
              ))}
            </div>
          </div>
        );
      }

      case "real-world-case": {
        if (block.styleOverrides.layoutVariant === "life-connect" || block.curriculum?.type === "life-connect") {
          return (
            <LifeConnectRenderer
              block={block}
              elementId={block.id}
              selected={isSelected}
            />
          );
        }
        return (
          <div className="w-full h-full flex flex-col justify-between border border-[#d4eeed] rounded-2xl p-4 bg-gradient-to-br from-[#eefbfa] to-white shadow-xs">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded-lg bg-[#e4f5f3] text-[#167e7e] flex items-center justify-center text-xs font-bold">
                  ◎
                </div>
                <h3 className="text-xs font-extrabold text-[#191c29]">
                  <InlineText value={title} onChange={(val) => updateContent({ title: val })} placeholder="Numbers Around Our Community" />
                </h3>
              </div>
              <p className="text-xs text-[#586073] leading-relaxed mb-2">
                <InlineText value={subtitle} onChange={(val) => updateContent({ introText: val, subtitle: val })} placeholder="Connect math to authentic data..." multiline />
              </p>
            </div>
            <div className="text-[9px] font-extrabold text-[#167e7e] tracking-wider uppercase mt-auto pt-2">
              Think • Collect evidence • Explain • Reflect
            </div>
          </div>
        );
      }

      case "vocabulary-bank": {
        const vocabList = items.length ? items : fixture.vocab;
        return (
          <div className="w-full h-full flex flex-col justify-between border border-[#e9e8ed] rounded-2xl p-4 bg-white shadow-xs">
            <div className="flex items-center gap-2 mb-3 shrink-0">
              <div className="w-6 h-6 rounded-lg bg-[#f9e5ee] text-[#9c3764] flex items-center justify-center text-xs font-bold">
                Aa
              </div>
              <h3 className="text-xs font-extrabold text-[#191c29]">
                <InlineText value={title} onChange={(val) => updateContent({ title: val })} placeholder="WORDS WORTH KEEPING" />
              </h3>
            </div>
            <div className="flex flex-wrap gap-2 flex-1 items-start content-start">
              {vocabList.map((word, idx) => (
                <span key={idx} className="px-3 py-1.5 rounded-lg text-[11px] font-bold text-[#7d3559] bg-[#fdf1f6] border border-[#f4dce7] shadow-2xs">
                  <InlineText
                    value={word}
                    onChange={(newVal) => {
                      const updated = [...vocabList];
                      updated[idx] = newVal;
                      updateContent({ items: updated });
                    }}
                    placeholder="Word"
                  />
                </span>
              ))}
            </div>
          </div>
        );
      }

      case "reflection-connect": {
        return (
          <div className="w-full h-full border border-[#dfeced] rounded-xl bg-[#f4fbfb] p-3.5 flex items-start gap-3 shadow-2xs">
            <div className="bg-[#248e8f] text-white rounded-lg px-2 py-1 text-xs font-black shrink-0">
              ↗
            </div>
            <div className="flex-1 h-full flex flex-col justify-between min-w-0">
              <div>
                <div className="text-[9px] font-black tracking-wider uppercase text-[#8c405d] mb-1">
                  <InlineText value={title} onChange={(val) => updateContent({ title: val })} placeholder="PAUSE & REFLECT" />
                </div>
                <strong className="text-xs text-[#222335] leading-snug block mb-3">
                  <InlineText value={subtitle} onChange={(val) => updateContent({ introText: val, calloutText: val })} placeholder="Reflection prompt..." multiline />
                </strong>
              </div>
              <div className="space-y-2.5 flex-1 flex flex-col justify-around py-1">
                <div className="w-full border-t border-dotted border-[#acb8bf] h-1" />
                <div className="w-full border-t border-dotted border-[#acb8bf] h-1" />
              </div>
            </div>
          </div>
        );
      }

      case "mastery-rubric": {
        const rubricItems = items.length ? items : fixture.rubric;
        return (
          <div className="w-full h-full flex flex-col justify-between border border-[#e9e8ed] rounded-2xl p-4 bg-white shadow-xs">
            <div className="flex items-center gap-2 mb-2 shrink-0">
              <div className="w-6 h-6 rounded-lg bg-[#e4f5f3] text-[#167e7e] flex items-center justify-center text-xs font-bold">
                ✓
              </div>
              <h3 className="text-xs font-extrabold text-[#191c29]">
                <InlineText value={title} onChange={(val) => updateContent({ title: val })} placeholder="SELF-CHECK" />
              </h3>
            </div>
            <p className="text-[10px] text-[#737c8d] mb-3 shrink-0">
              Colour 1–3 circles to show your confidence; explain one area for growth.
            </p>
            <div className="divide-y divide-[#e9ecf0] flex-1 flex flex-col justify-around">
              {rubricItems.map((crit, idx) => (
                <div key={idx} className="py-2.5 flex items-center justify-between gap-3 text-[11px] text-[#505b6a]">
                  <span className="flex-1">
                    <InlineText
                      value={crit}
                      onChange={(newVal) => {
                        const updated = [...rubricItems];
                        updated[idx] = newVal;
                        updateContent({ items: updated });
                      }}
                      placeholder="Success criteria statement..."
                    />
                  </span>
                  <div className="flex gap-1.5 shrink-0">
                    <i className="w-3.5 h-3.5 rounded-full border-2 border-[#bdc4ce] block hover:border-[#167e7e] cursor-pointer" />
                    <i className="w-3.5 h-3.5 rounded-full border-2 border-[#bdc4ce] block hover:border-[#167e7e] cursor-pointer" />
                    <i className="w-3.5 h-3.5 rounded-full border-2 border-[#bdc4ce] block hover:border-[#167e7e] cursor-pointer" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      }

      case "chapter-summary": {
        return (
          <div
            className="rounded-2xl p-5 flex items-center gap-4 text-white shadow-sm"
            style={{ background: activePreset.missionGradient }}
          >
            <div className="w-10 h-10 rounded-xl shrink-0 flex items-center justify-center text-xl border border-white/30 bg-white/15">
              ✧
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-xs font-black tracking-wide text-white uppercase mb-1">
                <InlineText value={title} onChange={(val) => updateContent({ title: val })} placeholder="CHAPTER IN A NUTSHELL" />
              </h3>
              <p className="text-xs text-[#ffe8ee] leading-relaxed">
                <InlineText value={subtitle} onChange={(val) => updateContent({ introText: val, calloutText: val })} placeholder="Key takeaway..." multiline />
              </p>
            </div>
          </div>
        );
      }

      case "teacher-note": {
        return (
          <div className="rounded-xl border border-[#f5e4c7] bg-[#fff7eb] p-3 text-[11px] text-[#80673f] flex items-center gap-2.5">
            <strong className="text-[#b5740b] font-black uppercase text-[10px] tracking-wider shrink-0">
              FACILITATOR ONLY
            </strong>
            <span className="flex-1">
              <InlineText value={subtitle} onChange={(val) => updateContent({ introText: val, calloutText: val })} placeholder="Teacher guidance instructions..." />
            </span>
          </div>
        );
      }

      case "assessment-cards": {
        const cards = items.slice(0, 3);
        const headers = ["REMEMBER", "APPLY", "EXPLAIN"];
        return (
          <div className="border border-[#f1dce4] rounded-2xl p-4 bg-gradient-to-br from-[#fff7fa] to-white shadow-xs">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-lg bg-[#f9e5ee] text-[#9c3764] flex items-center justify-center text-xs font-bold">
                ☑
              </div>
              <h3 className="text-xs font-black text-[#191c29] uppercase">
                <InlineText value={title} onChange={(val) => updateContent({ title: val })} placeholder="THREE WAYS TO SHOW MASTERY" />
              </h3>
            </div>
            <div className="grid grid-cols-3 gap-2.5">
              {cards.map((text, idx) => (
                <div key={idx} className="bg-white border border-[#e9eaf0] rounded-xl p-3 shadow-2xs min-h-[114px] flex flex-col justify-between">
                  <div>
                    <b className="block text-[9px] font-black tracking-wider text-[#924166] uppercase mb-1.5">
                      {headers[idx]}
                    </b>
                    <p className="text-[10.5px] text-[#586075] leading-relaxed">
                      <InlineText
                        value={text}
                        onChange={(newVal) => {
                          const updated = [...cards];
                          updated[idx] = newVal;
                          updateContent({ items: updated });
                        }}
                        placeholder="Task description..."
                        multiline
                      />
                    </p>
                  </div>
                  <div className="w-full border-b border-[#e2e8f0] h-3" />
                </div>
              ))}
            </div>
          </div>
        );
      }

      default:
        return (
          <div className="border border-[#e9e8ed] rounded-2xl p-4 bg-white shadow-xs">
            <h3 className="text-xs font-bold text-[#191c29] mb-1">
              <InlineText value={title} onChange={(val) => updateContent({ title: val })} placeholder="Block Title..." />
            </h3>
            <p className="text-xs text-[#586073] leading-relaxed">
              <InlineText value={subtitle} onChange={(val) => updateContent({ introText: val, subtitle: val })} placeholder="Content..." multiline />
            </p>
          </div>
        );
    }
  };

  return (
    <article
      id={`universal-block-${block.id}`}
      className={`group/universal-block relative isolate w-full h-full select-none transition-all duration-150 rounded-[${activePreset.cardRadiusPt}px] ${
        isSelected ? "ring-2 ring-[#6a1b3a] ring-offset-2 shadow-lg" : ""
      }`}
      style={{
        boxShadow: isSelected ? "0 0 0 2px #6a1b3a, 0 10px 25px rgba(106, 27, 58, 0.12)" : activePreset.shadow,
      }}
      data-universal-type={uType}
      data-block-id={block.id}
    >
      {/* Floating Design Toolbar when selected */}
      {isSelected && (
        <div
          className="absolute -top-10 right-2 z-50 flex items-center gap-1.5 bg-[#192032] border border-white/20 rounded-xl p-1 shadow-2xl text-white text-[9px] animate-float-in"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-2 py-0.5 rounded bg-white/10 font-bold uppercase tracking-wider text-[#ffc0d5]">
            {meta.name}
          </div>

          {/* Preset Selector */}
          <div className="relative">
            <button
              onClick={() => {
                setShowPresetMenu(!showPresetMenu);
                setShowPaletteMenu(false);
              }}
              className="flex items-center gap-1 px-2 py-1 rounded bg-white/10 hover:bg-white/20 transition-colors font-medium"
              title="Change visual style preset"
            >
              <Layers size={11} className="text-[#f1b85e]" />
              <span className="capitalize">{presetKey}</span>
              <ChevronDown size={10} className="opacity-60" />
            </button>
            {showPresetMenu && (
              <div className="absolute right-0 top-full mt-1 w-44 bg-[#192032] border border-white/20 rounded-xl shadow-2xl p-1 z-50">
                {(["editorial", "explorer", "academy", "workbook"] as const).map((pKey) => (
                  <button
                    key={pKey}
                    onClick={() => {
                      updateStyle({ blockStyle: pKey });
                      setShowPresetMenu(false);
                    }}
                    className={`w-full text-left px-2 py-1.5 rounded flex items-center justify-between transition-colors ${
                      presetKey === pKey ? "bg-[#6a1b3a] text-white font-bold" : "text-slate-300 hover:bg-white/10"
                    }`}
                  >
                    <span>{NEX_MAXX_PRESETS[pKey].name}</span>
                    {presetKey === pKey && <Check size={11} />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Make Text & Images Movable */}
          {onDetach && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDetach();
              }}
              className="flex items-center gap-1 px-2 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-400/30 transition-colors text-[10px] font-medium"
              title="Separate this block into individual movable text and image layers"
            >
              <Unlink2 size={11} className="text-amber-300" />
              <span>Make Movable</span>
            </button>
          )}

          {/* Duplicate Block */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              const page = getActivePage();
              if (page) {
                duplicateSelectedElements();
              }
            }}
            className="p-1.5 rounded bg-white/10 hover:bg-white/20 transition-colors"
            title="Duplicate block"
          >
            <Copy size={11} />
          </button>

          {/* Delete Block */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              deleteSelectedElements();
            }}
            className="p-1.5 rounded bg-rose-500/20 hover:bg-rose-500/40 text-rose-300 transition-colors"
            title="Delete block"
          >
            <Trash2 size={11} />
          </button>
        </div>
      )}

      {/* Main Block Content */}
      <div className="studio-block-content w-full h-full">
        {renderBlockBody()}
      </div>
    </article>
  );
});
