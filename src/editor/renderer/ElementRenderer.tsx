"use client";
import { selectionRoot, isElementLocked } from "../core/elementGroups";
import {SmartQrRenderer} from "../../features/media/SmartQrRenderer";

import React, { useRef, useEffect, memo } from "react";
import { useUiStore } from "../stores/uiStore";
import { DesignBinding, PageElement } from "../../domain/element/types";
import { LayoutView } from "../design/LayoutView";
import { useEditorStore } from "../stores/editorStore";
import {
  Target,
  Key,
  Beaker,
  CheckCircle2,
  QrCode as QrIcon,
  Square,
  Clock,
  Award,
  Users,
  AlertTriangle,
  Lightbulb,
  BookOpen,
  Plus,
} from "lucide-react";
import { buildPublicationScene } from "../educational/publicationScene";
import { detachedSceneForElement } from "../educational/detachScene";
import { PublicationImage } from "./PublicationImage";
import { PublicationSceneView } from "./PublicationSceneView";
import { artworkNodes, ArtworkKind } from "../educational/publicationScene";
import { PUBLICATION_PALETTES } from "../../domain/educational/designTokens";
import { SmartBlockRenderer } from "./SmartBlockRenderer";
import { LessonSchemaRenderer } from "./LessonSchemaRenderer";
import { StudySkillsRenderer } from "./StudySkillsRenderer";
import { LearningOutcomesRenderer } from "./LearningOutcomesRenderer";
import { FactZoneRenderer } from "./FactZoneRenderer";
import { TopicBannerRenderer } from "./TopicBannerRenderer";
import { LifeConnectRenderer } from "./LifeConnectRenderer";
import { UniversalBlockRenderer } from "./UniversalBlockRenderer";
import { RichTextInlineEditor } from "./RichTextInlineEditor";
import { FlowText } from "./FlowText";
import { FLOW_FONT_FAMILY, isFlowText } from "../layoutPartner/textWrapLayout";

interface ElementRendererProps {
  element: PageElement;
  isSelected?: boolean;
  zoom?: number;
}

function borderStyle(style: PageElement["style"]): React.CSSProperties {
  const edge = style.borderWidth
    ? `${style.borderWidth}pt ${style.borderStyle || "solid"} ${style.borderColor || "transparent"}`
    : undefined;
  if (style.borderLeft) {
    return {
      borderTop: edge,
      borderRight: edge,
      borderBottom: edge,
      borderLeft: style.borderLeft,
    };
  }
  if (!edge) return {};
  return { borderTop: edge, borderRight: edge, borderBottom: edge, borderLeft: edge };
}

const EditableTableCell: React.FC<{
  initialText: string;
  onCommit: (text: string) => void;
}> = ({ initialText, onCommit }) => {
  const [editing, setEditing] = React.useState(false);
  const [val, setVal] = React.useState(initialText);
  React.useEffect(() => setVal(initialText), [initialText]);

  if (editing) {
    return (
      <input
        autoFocus
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onBlur={() => {
          setEditing(false);
          if (val !== initialText) onCommit(val);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            setEditing(false);
            if (val !== initialText) onCommit(val);
          }
          if (e.key === "Escape") {
            setVal(initialText);
            setEditing(false);
          }
        }}
        onClick={(e) => e.stopPropagation()}
        className="w-full bg-white text-slate-900 border border-indigo-500 rounded px-1 py-0.5 text-[8pt] outline-none"
      />
    );
  }

  return (
    <span
      className="block w-full h-full cursor-text hover:bg-indigo-50/60 rounded px-0.5"
      onDoubleClick={(e) => {
        e.stopPropagation();
        setEditing(true);
      }}
      title="Double-click to edit cell"
    >
      {val}
    </span>
  );
};

const InlineEditable: React.FC<{
  value: string;
  onCommit: (val: string) => void;
  className?: string;
  style?: React.CSSProperties;
  placeholder?: string;
  multiline?: boolean;
  tag?: "span" | "div" | "p" | "strong" | "small" | "h1" | "h2" | "h3" | "h4";
}> = ({
  value,
  onCommit,
  className = "",
  style = {},
  placeholder = "Click to edit...",
  multiline = false,
  tag: Tag = "span",
}) => {
  const [editing, setEditing] = React.useState(false);
  const [val, setVal] = React.useState(value || "");
  const inputRef = React.useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  React.useEffect(() => {
    setVal(value || "");
  }, [value]);

  React.useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const commit = () => {
    setEditing(false);
    if (val !== value) onCommit(val);
  };

  if (editing) {
    if (multiline) {
      return (
        <textarea
          ref={inputRef as React.RefObject<HTMLTextAreaElement>}
          rows={Math.max(2, val.split("\n").length)}
          value={val}
          onChange={(e) => setVal(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              commit();
            }
            if (e.key === "Escape") {
              setVal(value || "");
              setEditing(false);
            }
          }}
          onClick={(e) => e.stopPropagation()}
          className={`w-full bg-white text-slate-900 border-2 border-indigo-500 rounded px-1.5 py-0.5 text-inherit font-inherit outline-none shadow-md z-30 resize-y ${className}`}
          style={style}
        />
      );
    }
    return (
      <input
        ref={inputRef as React.RefObject<HTMLInputElement>}
        type="text"
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            commit();
          }
          if (e.key === "Escape") {
            setVal(value || "");
            setEditing(false);
          }
        }}
        onClick={(e) => e.stopPropagation()}
        className={`bg-white text-slate-900 border-2 border-indigo-500 rounded px-1.5 py-0.5 text-inherit font-inherit outline-none shadow-md z-30 ${className}`}
        style={style}
      />
    );
  }

  return (
    <Tag
      className={`cursor-text hover:outline-dashed hover:outline-1 hover:outline-indigo-500/70 rounded transition-all inline-block ${className}`}
      style={style}
      onClick={(e) => {
        e.stopPropagation();
        setEditing(true);
      }}
      title="Click to edit"
    >
      {val || <span className="opacity-40 italic">{placeholder}</span>}
    </Tag>
  );
};

export const ElementRenderer: React.FC<ElementRendererProps> = memo(function ElementRenderer({
  element,
  isSelected = false,
  zoom = 1,
}) {
  const updateElementContent = useEditorStore(s => s.updateElementContent);
  const addPage = useEditorStore(s => s.addPage);
  const shuffleEducationalBlockStyle = useEditorStore(s => s.shuffleEducationalBlockStyle);
  const detachEducationalBlock = useEditorStore(s => s.detachEducationalBlock);
  const editingTextElementId = useUiStore(s => s.editingTextElementId);
  const setEditingTextElementId = useUiStore(s => s.setEditingTextElementId);
  const isEditingText = editingTextElementId === element.id;
  const setIsEditingText = (value: boolean) => setEditingTextElementId(value ? element.id : null);
  const textEditRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isEditingText && textEditRef.current) {
      textEditRef.current.focus();
    }
  }, [isEditingText]);

  const { transform, style, content, type } = element;
  const grouped = Boolean(element.groupId);
  const locked = isElementLocked(element.id, useEditorStore.getState().elements);
  const selectGroup = (e: React.SyntheticEvent) => {
    if (!grouped) return;
    e.stopPropagation();
    useEditorStore.getState().selectElement(selectionRoot(element.id, useEditorStore.getState().elements), "shiftKey" in e && Boolean(e.shiftKey));
  };

  // Base element style mapping
  const filterParts: string[] = [];
  if (style.brightness !== undefined && style.brightness !== 100) filterParts.push(`brightness(${style.brightness}%)`);
  if (style.contrast !== undefined && style.contrast !== 100) filterParts.push(`contrast(${style.contrast}%)`);
  if (style.saturate !== undefined && style.saturate !== 100) filterParts.push(`saturate(${style.saturate}%)`);
  if (style.blur && style.blur > 0) filterParts.push(`blur(${style.blur}pt)`);
  if (style.grayscale && style.grayscale > 0) filterParts.push(`grayscale(${style.grayscale}%)`);
  if (style.sepia && style.sepia > 0) filterParts.push(`sepia(${style.sepia}%)`);
  if (style.hueRotate && style.hueRotate > 0) filterParts.push(`hue-rotate(${style.hueRotate}deg)`);
  if (style.invert && style.invert > 0) filterParts.push(`invert(${style.invert}%)`);
  const cssFilter = filterParts.length > 0 ? filterParts.join(" ") : undefined;

  const containerStyle: React.CSSProperties = {
    position: "absolute",
    pointerEvents: type === "group" || (isFlowText(element) && !isEditingText) ? "none" : undefined,
    left: `${transform.x}pt`,
    top: `${transform.y}pt`,
    width: `${transform.width}pt`,
    height: `${transform.height}pt`,
    transform: transform.rotation ? `rotate(${transform.rotation}deg)` : undefined,
    zIndex: transform.zIndex,
    backgroundColor: type === "smart-block" || content.publicationPrimitive ? undefined : style.backgroundColor,
    borderRadius: style.borderRadius ? `${style.borderRadius}pt` : undefined,
    ...(type === "smart-block" || content.publicationPrimitive ? {} : borderStyle(style)),
    opacity: style.opacity ?? 1,
    boxShadow: style.boxShadow,
    padding: !isFlowText(element) && style.padding
      ? `${style.padding.top}pt ${style.padding.right}pt ${style.padding.bottom}pt ${style.padding.left}pt`
      : undefined,
    color: style.color || "#0f172a",
    fontSize: style.fontSize ? `${style.fontSize}pt` : undefined,
    fontWeight: style.fontWeight,
    fontStyle: style.fontStyle,
    fontFamily: style.fontFamily || (isFlowText(element) ? FLOW_FONT_FAMILY : undefined),
    lineHeight: style.lineHeight,
    textAlign: style.textAlign,
    textTransform: style.textTransform,
    textDecoration: style.textDecoration,
    letterSpacing: style.letterSpacing ? `${style.letterSpacing}pt` : undefined,
    columnCount: isFlowText(element) ? undefined : style.columns,
    columnGap: style.columnGap ? `${style.columnGap}pt` : undefined,
    filter: cssFilter,
  };

  // Render element content based on its semantic type
  const renderContent = () => {
    const primitive = detachedSceneForElement(element);
    if(primitive) return <div className="w-full h-full" onDoubleClick={e=>{if(type!=="body"||element.locked)return;e.stopPropagation();setIsEditingText(true);}}>{isEditingText?<textarea autoFocus aria-label="Edit detached text" defaultValue={content.text||""} className="w-full h-full bg-white text-slate-900 outline-2 outline-indigo-500" onBlur={e=>{updateElementContent(element.id,{text:e.target.value});setIsEditingText(false);}}/>:<PublicationSceneView scene={primitive} label={element.displayName}/>}</div>;
    if(content.artwork) {
      const palette=PUBLICATION_PALETTES[content.artwork.paletteId as keyof typeof PUBLICATION_PALETTES] || PUBLICATION_PALETTES.indigo;
      return <PublicationSceneView scene={{width:transform.width,height:transform.height,variant:content.artwork.kind,warnings:[],nodes:artworkNodes(content.artwork.kind as ArtworkKind,0,0,transform.width,transform.height,palette)}} label={element.displayName}/>;
    }
    const isImage = type === "image" || type === "picture-frame" || type === "pictureFrame" || type === "ai-image";
    if (isImage) return <PublicationImage element={element} />;

    const design = content?.design as DesignBinding | undefined;
    if (design?.composition && design.tokens) {
      return (
        <LayoutView
          dsl={design.composition}
          tokens={design.tokens}
          content={content}
          width={transform.width}
          role={design.role}
          showNumber={design.showNumber}
          decoration={design.decoration}
          spacing={design.spacing}
          border={design.border}
          onEdit={(patch) => updateElementContent(element.id, patch)}
        />
      );
    }

    switch (type) {
      case "heading":
      case "subheading":
      case "body":
      case "body-text":
      case "caption":
      case "quote":
      case "chapter-title":
      case "lesson-title":
      case "header":
      case "footer":
      case "pageNumber":
      case "page-number":
      case "sidebar":
      case "callout":
        return isEditingText ? (
          <RichTextInlineEditor
            element={element}
            initialText={content.text || ""}
            multiline={type === "body" || type === "body-text" || type === "quote" || type === "callout"}
            onCommit={(text) => updateElementContent(element.id, { text })}
            onClose={() => setIsEditingText(false)}
          />
        ) : (
          <div
            className={`w-full h-full select-none cursor-pointer ${isFlowText(element) ? "" : "overflow-hidden flex flex-col justify-center"}`}
            onDoubleClick={(e) => {
              e.stopPropagation();
              setIsEditingText(true);
            }}
          >
            {content.number && (
              <span className="inline-block text-[9pt] font-mono font-bold tracking-wider text-rose-600 mb-0.5 uppercase">
                {content.numberLabel || "CHAPTER"} {content.number}
              </span>
            )}
            {isFlowText(element) ? <FlowText element={element} /> : <div
              className="font-[inherit] leading-[inherit] break-words"
              dangerouslySetInnerHTML={{ __html: content.text || "" }}
            />}
            {content.subtitle && (
              <div className="text-[10pt] font-normal opacity-75 mt-0.5 leading-snug">
                {content.subtitle}
              </div>
            )}
          </div>
        );

      case "shape":
        const shape = style.shapeType || "rectangle";
        const strokeW = style.borderWidth || 1.5;
        const strokeColor = style.borderColor || "#4338ca";
        const fillColor = style.backgroundColor || "#e0e7ff";
        const strokeDash = style.borderStyle === "dashed" ? "5,4" : undefined;

        if (shape === "circle" || shape === "ellipse") {
          return (
            <svg className="w-full h-full overflow-visible pointer-events-none">
              <ellipse
                cx="50%"
                cy="50%"
                rx="48%"
                ry="48%"
                fill={fillColor}
                stroke={strokeColor}
                strokeWidth={strokeW}
                strokeDasharray={strokeDash}
              />
            </svg>
          );
        }

        if (shape === "star") {
          return (
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full overflow-visible pointer-events-none">
              <polygon
                points="50,2 62,38 100,38 69,60 81,96 50,74 19,96 31,60 0,38 38,38"
                fill={fillColor}
                stroke={strokeColor}
                strokeWidth={strokeW}
                strokeDasharray={strokeDash}
                strokeLinejoin="round"
              />
            </svg>
          );
        }

        if (shape === "polygon") {
          return (
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full overflow-visible pointer-events-none">
              <polygon
                points="50,3 95,25 95,75 50,97 5,75 5,25"
                fill={fillColor}
                stroke={strokeColor}
                strokeWidth={strokeW}
                strokeDasharray={strokeDash}
                strokeLinejoin="round"
              />
            </svg>
          );
        }

        if (shape === "line" || shape === "arrow") {
          return (
            <svg className="w-full h-full overflow-visible pointer-events-none">
              <defs>
                <marker
                  id={`arrow-${element.id}`}
                  viewBox="0 0 10 10"
                  refX="6"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 1 L 10 5 L 0 9 z" fill={strokeColor} />
                </marker>
              </defs>
              <line
                x1="4"
                y1="50%"
                x2="96%"
                y2="50%"
                stroke={strokeColor}
                strokeWidth={strokeW}
                strokeDasharray={strokeDash}
                markerEnd={shape === "arrow" ? `url(#arrow-${element.id})` : undefined}
              />
            </svg>
          );
        }

        // Default rectangle with corner radius
        return (
          <svg className="w-full h-full overflow-visible pointer-events-none">
            <rect
              x={strokeW / 2}
              y={strokeW / 2}
              width={`calc(100% - ${strokeW}px)`}
              height={`calc(100% - ${strokeW}px)`}
              rx={style.borderRadius || 6}
              ry={style.borderRadius || 6}
              fill={fillColor}
              stroke={strokeColor}
              strokeWidth={strokeW}
              strokeDasharray={strokeDash}
            />
          </svg>
        );

      case "table":
        const headers: string[] = content.headers || ["Col 1", "Col 2", "Col 3"];
        const rows: string[][] = content.rows || [["Cell 1", "Cell 2", "Cell 3"]];
        return (
          <div className="w-full h-full flex flex-col overflow-hidden bg-white rounded-[inherit] border border-slate-200">
            <table className="w-full h-full border-collapse text-[8pt]">
              <thead>
                <tr className="bg-slate-100 text-slate-800 font-semibold border-b border-slate-300">
                  {headers.map((h, cIdx) => (
                    <th key={cIdx} className="p-1.5 text-left border-r border-slate-200 last:border-r-0">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, rIdx) => (
                  <tr
                    key={rIdx}
                    className={`border-b border-slate-200 last:border-b-0 ${
                      rIdx % 2 === 0 ? "bg-white" : "bg-slate-50/60"
                    }`}
                  >
                    {row.map((cell, cIdx) => (
                      <td
                        key={cIdx}
                        className="p-1 text-slate-700 border-r border-slate-200 last:border-r-0 hover:bg-indigo-50/40 cursor-text"
                      >
                        <EditableTableCell
                          initialText={cell}
                          onCommit={(newText) => {
                            useEditorStore.getState().updateTableCell(element.id, rIdx, cIdx, newText);
                          }}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );

      case "vector-curve":
        return (
          <svg
            className="w-full h-full overflow-visible"
            viewBox={`0 0 ${transform.width} ${transform.height}`}
          >
            <path
              d={style.pathData || ""}
              fill={style.backgroundColor || "none"}
              stroke={style.strokeColor || "#e11d48"}
              strokeWidth={style.strokeWidth ?? 2}
              strokeDasharray={style.strokeDasharray}
              strokeLinecap={style.strokeLinecap || "round"}
            />
          </svg>
        );

      case "compound-shape":
        return (
          <div className="w-full h-full border border-indigo-400/40 bg-indigo-500/10 rounded-[inherit] flex items-center justify-center text-[8pt] text-indigo-300 font-mono">
            Compound ({element.compoundData?.operation.toUpperCase() || "UNION"})
          </div>
        );

      case "pixel-layer":
        return element.pixelData?.dataUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={element.pixelData.dataUrl}
            alt="Pixel Layer"
            className="w-full h-full object-contain pointer-events-none select-none"
            style={{
              maskImage: element.pixelData.maskDataUrl ? `url(${element.pixelData.maskDataUrl})` : undefined,
              WebkitMaskImage: element.pixelData.maskDataUrl ? `url(${element.pixelData.maskDataUrl})` : undefined,
            }}
          />
        ) : (
          <div className="w-full h-full border-2 border-dashed border-sky-400/40 bg-sky-500/5 rounded flex items-center justify-center text-sky-300 text-[8pt] font-mono">
            Pixel Canvas (Empty)
          </div>
        );

      case "adjustment-layer":
        return (
          <div className="w-full h-full border border-dashed border-amber-400/50 bg-amber-500/5 rounded flex items-center justify-center text-amber-300 text-[8pt] font-mono">
            ⚡ {element.displayName}
          </div>
        );

      case "live-filter":
        return (
          <div className="w-full h-full border border-dashed border-purple-400/50 bg-purple-500/5 rounded flex items-center justify-center text-purple-300 text-[8pt] font-mono">
            ✨ {element.displayName}
          </div>
        );

      case "ai-vector":
        return content.svgContent ? (
          <div
            className="w-full h-full overflow-hidden rounded-[inherit]"
            dangerouslySetInnerHTML={{ __html: content.svgContent }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-xs text-slate-400">
            AI Vector
          </div>
        );


      case "badge":
        return (
          <div className="w-full h-full flex items-center justify-center font-bold text-[8.5pt] tracking-wider rounded-[inherit] shadow-sm">
            <InlineEditable
              value={content.text || element.displayName}
              onCommit={(val) => updateElementContent(element.id, { text: val })}
              placeholder="Badge Text..."
            />
          </div>
        );

      case "learningObjectives":
      case "learning-objective":
        const loItems = content.items || ["Understand foundational principles", "Analyze key mechanisms", "Apply concepts to real-world problems"];
        return (
          <div className="w-full h-full flex flex-col justify-between rounded-[inherit] overflow-hidden">
            <div className="flex items-center justify-between pb-1 mb-1 border-b border-sky-200/80">
              <div className="flex items-center gap-1.5 text-sky-800 font-bold tracking-wider text-[8.5pt]">
                <Target className="w-4 h-4 text-sky-600 shrink-0" />
                <InlineEditable
                  value={content.title || "LEARNING OBJECTIVES"}
                  onCommit={(val) => updateElementContent(element.id, { title: val })}
                  placeholder="Learning Objectives..."
                />
              </div>
              <span className="text-[7pt] text-sky-600 font-medium bg-sky-100/70 px-1.5 py-0.5 rounded-full">
                Outcome Checklist
              </span>
            </div>
            <div className="text-[7.5pt] text-sky-700 italic mb-1">
              <InlineEditable
                value={content.introText || "By the end of this lesson, you will be able to:"}
                multiline
                onCommit={(val) => updateElementContent(element.id, { introText: val })}
                placeholder="Introductory text..."
              />
            </div>
            <ul className="space-y-1 list-none text-[8pt] text-sky-950 leading-snug flex-1">
              {loItems.map((item: string, idx: number) => (
                <li key={idx} className="flex items-start gap-1.5 group/item">
                  <span className="text-emerald-600 font-bold text-[9pt] leading-none shrink-0">✓</span>
                  <InlineEditable
                    value={item}
                    onCommit={(val) => {
                      const next = [...loItems];
                      next[idx] = val;
                      updateElementContent(element.id, { items: next });
                    }}
                    className="flex-1"
                    placeholder="Outcome item..."
                  />
                </li>
              ))}
            </ul>
          </div>
        );

      case "didYouKnow":
      case "did-you-know":
      case "fact":
      case "fun-fact":
      case "tip":
        return (
          <div className="w-full h-full flex flex-col justify-between rounded-[inherit] relative overflow-hidden">
            <div className="flex items-center justify-between gap-1 mb-1">
              <div className="flex items-center gap-1.5 font-bold text-amber-900 text-[8.5pt]">
                <Lightbulb className="w-4 h-4 text-amber-600 shrink-0" />
                <InlineEditable
                  value={content.title || (type === "tip" ? "PRO TIP" : "DID YOU KNOW?")}
                  onCommit={(val) => updateElementContent(element.id, { title: val })}
                  placeholder="Callout Title..."
                />
              </div>
              <span className="text-[6.5pt] font-mono uppercase bg-amber-200/70 text-amber-900 px-1.5 py-0.2 rounded">
                Curiosity Spark
              </span>
            </div>
            <div className="text-[8pt] text-amber-950 leading-relaxed font-serif italic relative z-10">
              &ldquo;
              <InlineEditable
                value={content.body || content.text || "Fascinating curriculum insight and real-world connection."}
                multiline
                onCommit={(val) => updateElementContent(element.id, { body: val, text: val })}
                placeholder="Curious insight..."
              />
              &rdquo;
            </div>
            {(content.footnote || isSelected) && (
              <span className="text-[6.5pt] text-amber-700 opacity-80 mt-1 block">
                <InlineEditable
                  value={content.footnote || ""}
                  onCommit={(val) => updateElementContent(element.id, { footnote: val })}
                  placeholder="Footnote / source..."
                />
              </span>
            )}
          </div>
        );

      case "keyConcept":
      case "definition":
      case "vocabulary":
        return (
          <div className="w-full h-full flex flex-col justify-between rounded-[inherit]">
            <div className="flex items-center justify-between gap-2 border-b border-fuchsia-200/70 pb-1 mb-1">
              <div className="flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-fuchsia-600 shrink-0" />
                <InlineEditable
                  value={content.term || content.title || "KEY TERM"}
                  onCommit={(val) => updateElementContent(element.id, { term: val, title: val })}
                  className="font-bold text-fuchsia-900 text-[9pt] tracking-tight"
                  placeholder="Key term..."
                />
                {(content.phonetic || isSelected) && (
                  <span className="text-[7pt] font-mono text-fuchsia-600 opacity-80">
                    /
                    <InlineEditable
                      value={content.phonetic || ""}
                      onCommit={(val) => updateElementContent(element.id, { phonetic: val })}
                      placeholder="phonetic"
                    />
                    /
                  </span>
                )}
              </div>
              <span className="text-[6.5pt] font-semibold uppercase bg-fuchsia-100 text-fuchsia-800 px-1 rounded">
                <InlineEditable
                  value={content.partOfSpeech || "Vocabulary"}
                  onCommit={(val) => updateElementContent(element.id, { partOfSpeech: val })}
                  placeholder="noun"
                />
              </span>
            </div>
            <div className="text-[8pt] text-fuchsia-950 leading-snug font-medium mb-1 flex-1">
              <InlineEditable
                value={content.definition || content.body || "Definition of key academic term."}
                multiline
                onCommit={(val) => updateElementContent(element.id, { definition: val, body: val })}
                placeholder="Definition of term..."
              />
            </div>
            {(content.exampleSentence || isSelected) && (
              <div className="text-[7pt] text-fuchsia-800 bg-fuchsia-50/80 p-1 rounded italic">
                <span className="font-semibold not-italic">Example: </span>
                <InlineEditable
                  value={content.exampleSentence || ""}
                  onCommit={(val) => updateElementContent(element.id, { exampleSentence: val })}
                  placeholder="Example sentence..."
                />
              </div>
            )}
          </div>
        );

      case "workedExample":
      case "worked-example":
      case "example":
      case "formula":
        const weSteps = content.steps || ["1. Identify known quantities.", "2. Substitute into equation.", "3. Evaluate final numerical value."];
        return (
          <div className="w-full h-full flex flex-col justify-between rounded-[inherit] overflow-hidden">
            <div className="flex items-center justify-between border-b border-cyan-200/80 pb-1 mb-1.5">
              <div className="flex items-center gap-1.5 text-cyan-900 font-bold text-[8.5pt]">
                <BookOpen className="w-3.5 h-3.5 text-cyan-600 shrink-0" />
                <InlineEditable
                  value={content.title || "WORKED EXAMPLE"}
                  onCommit={(val) => updateElementContent(element.id, { title: val })}
                  placeholder="Worked example title..."
                />
              </div>
              <span className="text-[7pt] font-mono font-bold bg-cyan-100 text-cyan-800 px-1.5 py-0.5 rounded">
                Step-by-Step
              </span>
            </div>
            {(content.problem || isSelected) && (
              <div className="text-[8pt] text-cyan-950 font-semibold mb-1 leading-snug">
                <InlineEditable
                  value={content.problem || ""}
                  multiline
                  onCommit={(val) => updateElementContent(element.id, { problem: val })}
                  placeholder="Problem statement..."
                />
              </div>
            )}
            {(content.formula || isSelected) && (
              <div className="bg-cyan-100/60 text-cyan-900 font-mono text-[8pt] px-2 py-1 rounded border border-cyan-200 text-center my-0.5 font-bold">
                <InlineEditable
                  value={content.formula || ""}
                  onCommit={(val) => updateElementContent(element.id, { formula: val })}
                  placeholder="e.g. E = mc²"
                />
              </div>
            )}
            <div className="space-y-0.5 text-[7.5pt] text-cyan-950 mt-1">
              {weSteps.map((s: string, i: number) => (
                <div key={i} className="leading-tight">
                  <InlineEditable
                    value={s}
                    onCommit={(val) => {
                      const next = [...weSteps];
                      next[i] = val;
                      updateElementContent(element.id, { steps: next });
                    }}
                    placeholder={`Step ${i + 1}...`}
                  />
                </div>
              ))}
            </div>
            {(content.solution || isSelected) && (
              <div className="mt-1 pt-1 border-t border-cyan-200/60 font-semibold text-[8pt] text-cyan-900">
                <span className="opacity-70">Answer: </span>
                <InlineEditable
                  value={content.solution || ""}
                  onCommit={(val) => updateElementContent(element.id, { solution: val })}
                  placeholder="Final solution..."
                />
              </div>
            )}
          </div>
        );

      case "warning":
      case "note":
      case "teacherNote":
        return (
          <div className="w-full h-full flex flex-col justify-between rounded-[inherit]">
            <div className="flex items-center gap-1.5 font-bold text-rose-900 text-[8.5pt] mb-1">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <InlineEditable
                value={content.title || (type === "warning" ? "CAUTION / WARNING" : "TEACHER NOTE")}
                onCommit={(val) => updateElementContent(element.id, { title: val })}
                placeholder="Callout title..."
              />
            </div>
            <div className="text-[8pt] text-rose-950 leading-relaxed">
              <InlineEditable
                value={content.body || content.text || "Critical safety reminder, common misconception, or instructor note."}
                multiline
                onCommit={(val) => updateElementContent(element.id, { body: val, text: val })}
                placeholder="Guidance text..."
              />
            </div>
          </div>
        );

      case "activity":
      case "experiment":
        const actSteps = content.steps || [
          "1. Gather the required experimental materials.",
          "2. Record initial baseline observations in notebook.",
          "3. Follow procedure carefully and draw final conclusions."
        ];
        return (
          <div className="w-full h-full flex flex-col justify-between rounded-[inherit] overflow-hidden relative">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-600" />
            <div>
              <div className="flex items-center justify-between mb-1.5 pt-0.5">
                <div className="flex items-center gap-1.5 font-bold text-emerald-950 text-[9pt]">
                  <Beaker className="w-4 h-4 text-emerald-600 shrink-0" />
                  <InlineEditable
                    value={content.title || "HANDS-ON ACTIVITY"}
                    onCommit={(val) => updateElementContent(element.id, { title: val })}
                    placeholder="Activity title..."
                  />
                </div>
                {(content.numberBadge || isSelected) && (
                  <span className="text-[7pt] font-mono font-bold bg-emerald-600 text-white px-1.5 py-0.5 rounded">
                    <InlineEditable
                      value={content.numberBadge || "LAB 01"}
                      onCommit={(val) => updateElementContent(element.id, { numberBadge: val })}
                      placeholder="LAB 01"
                    />
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-1 mb-1.5 text-[6.5pt] font-medium text-emerald-800">
                <span className="inline-flex items-center gap-0.5 bg-emerald-100/80 px-1.5 py-0.5 rounded">
                  <Clock className="w-2.5 h-2.5" />
                  <InlineEditable
                    value={content.duration || "15 min"}
                    onCommit={(val) => updateElementContent(element.id, { duration: val })}
                    placeholder="15 min"
                  />
                </span>
                <span className="inline-flex items-center gap-0.5 bg-emerald-100/80 px-1.5 py-0.5 rounded">
                  <Award className="w-2.5 h-2.5" />
                  <InlineEditable
                    value={content.difficulty || "Easy"}
                    onCommit={(val) => updateElementContent(element.id, { difficulty: val })}
                    placeholder="Easy"
                  />
                </span>
                <span className="inline-flex items-center gap-0.5 bg-emerald-100/80 px-1.5 py-0.5 rounded">
                  <Users className="w-2.5 h-2.5" />
                  <InlineEditable
                    value={content.groupType || "Individual"}
                    onCommit={(val) => updateElementContent(element.id, { groupType: val })}
                    placeholder="Pairs"
                  />
                </span>
              </div>
              {(content.materials || isSelected) && (
                <div className="text-[7.5pt] text-emerald-900 bg-emerald-50/70 p-1 rounded border border-emerald-200/50 mb-1">
                  <span className="font-semibold">Materials: </span>
                  <InlineEditable
                    value={content.materials || ""}
                    onCommit={(val) => updateElementContent(element.id, { materials: val })}
                    placeholder="List required materials..."
                  />
                </div>
              )}
            </div>
            <div className="space-y-0.5 text-[8pt] text-emerald-950 flex-1 overflow-hidden">
              {actSteps.map((step: string, i: number) => (
                <div key={i} className="leading-snug">
                  <InlineEditable
                    value={step}
                    onCommit={(val) => {
                      const next = [...actSteps];
                      next[i] = val;
                      updateElementContent(element.id, { steps: next });
                    }}
                    placeholder={`Step ${i + 1}...`}
                  />
                </div>
              ))}
            </div>
          </div>
        );

      case "summary":
      case "revision":
        const sumItems = content.items || [
          "Fundamental concept successfully established.",
          "Key equations and variables defined.",
          "Real-world application validated."
        ];
        return (
          <div className="w-full h-full flex flex-col justify-between rounded-[inherit]">
            <div className="flex items-center justify-between gap-2 border-b border-emerald-200 pb-1 mb-1.5 text-slate-900 font-bold text-[9pt]">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <InlineEditable
                  value={content.title || (type === "revision" ? "CHAPTER REVISION" : "LESSON SUMMARY")}
                  onCommit={(val) => updateElementContent(element.id, { title: val })}
                  placeholder="Summary title..."
                />
              </div>
              <span className="text-[7pt] font-mono text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded font-semibold">
                Core Takeaways
              </span>
            </div>
            <div className="space-y-1 text-[8pt] text-slate-700 flex-1">
              {sumItems.map((item: string, i: number) => (
                <div key={i} className="flex items-start gap-1.5">
                  <span className="text-emerald-500 font-bold shrink-0">✓</span>
                  <InlineEditable
                    value={item}
                    onCommit={(val) => {
                      const next = [...sumItems];
                      next[i] = val;
                      updateElementContent(element.id, { items: next });
                    }}
                    placeholder={`Takeaway ${i + 1}...`}
                  />
                </div>
              ))}
            </div>
          </div>
        );

      case "mcq":
        const mcqOptions = content.options || ["Option A", "Option B", "Option C", "Option D"];
        return (
          <div className="w-full h-full flex flex-col justify-between text-slate-800">
            <div className="font-semibold text-[8.5pt] mb-1.5 flex items-start gap-1.5">
              <span className="px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700 text-[7.5pt] font-bold">
                <InlineEditable
                  value={content.questionNumber || "Q"}
                  onCommit={(val) => updateElementContent(element.id, { questionNumber: val })}
                  placeholder="Q1"
                />
              </span>
              <div className="flex-1">
                <InlineEditable
                  value={content.questionText || "Multiple choice question prompt..."}
                  multiline
                  onCommit={(val) => updateElementContent(element.id, { questionText: val })}
                  placeholder="Question prompt..."
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-1 text-[8pt]">
              {mcqOptions.map((opt: string, i: number) => (
                <div
                  key={i}
                  className={`p-1.5 rounded border ${
                    i === content.correctAnswerIndex
                      ? "border-emerald-300 bg-emerald-50/70 text-emerald-900 font-medium"
                      : "border-slate-200 bg-slate-50 text-slate-700"
                  }`}
                >
                  <InlineEditable
                    value={opt}
                    onCommit={(val) => {
                      const next = [...mcqOptions];
                      next[i] = val;
                      updateElementContent(element.id, { options: next });
                    }}
                    placeholder={`Option ${i + 1}...`}
                  />
                </div>
              ))}
            </div>
          </div>
        );

      case "question":
      case "assessment":
      case "exercise":
      case "worksheet":
        const marks = content.marks ?? 3;
        const lineCount = Math.min(10, Math.max(2, Math.round(marks * 1.5)));
        return (
          <div className="w-full h-full flex flex-col justify-between rounded-[inherit] overflow-hidden">
            <div>
              <div className="flex items-center justify-between gap-1 mb-1">
                <div className="flex items-center gap-1.5">
                  <span className="px-1.5 py-0.5 rounded bg-amber-500 text-white text-[7.5pt] font-mono font-bold">
                    <InlineEditable
                      value={content.questionNumber || "Q1"}
                      onCommit={(val) => updateElementContent(element.id, { questionNumber: val })}
                      placeholder="Q1"
                    />
                  </span>
                  <span className="text-[7pt] font-semibold text-slate-500 uppercase tracking-wide">
                    <InlineEditable
                      value={content.category || "Subjective"}
                      onCommit={(val) => updateElementContent(element.id, { category: val })}
                      placeholder="Subjective"
                    />
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  {(content.bloomLevel || isSelected) && (
                    <span className="text-[6.5pt] font-medium bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded">
                      <InlineEditable
                        value={content.bloomLevel || "Apply"}
                        onCommit={(val) => updateElementContent(element.id, { bloomLevel: val })}
                        placeholder="Apply"
                      />
                    </span>
                  )}
                  <span className="text-[7pt] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
                    [{marks} {marks === 1 ? "Mark" : "Marks"}]
                  </span>
                </div>
              </div>

              <div className="text-[8.5pt] text-slate-900 font-semibold leading-snug mb-1.5">
                <InlineEditable
                  value={content.questionText || content.text || "Explain the significance of this concept and justify with evidence."}
                  multiline
                  onCommit={(val) => updateElementContent(element.id, { questionText: val, text: val })}
                  placeholder="Question text..."
                />
              </div>

              {(content.hint || isSelected) && (
                <div className="text-[7pt] text-amber-800 bg-amber-50/80 p-1 rounded border border-amber-200/50 mb-1 italic">
                  <span className="font-semibold not-italic">💡 Hint: </span>
                  <InlineEditable
                    value={content.hint || ""}
                    onCommit={(val) => updateElementContent(element.id, { hint: val })}
                    placeholder="Add a helpful hint..."
                  />
                </div>
              )}
            </div>

            <div className="flex-1 flex flex-col justify-around my-1 pt-1 border-t border-slate-200/80">
              {Array.from({ length: lineCount }).map((_, idx) => (
                <div key={idx} className="w-full flex-1 min-h-[14px] flex items-end border-b border-slate-300 border-dashed" />
              ))}
            </div>

            <div className="flex justify-end text-[6.5pt] text-slate-400 font-mono">
              [Answer space: {lineCount} lines]
            </div>
          </div>
        );

      case "answer-area":
        const ansLines = content.lineCount || 6;
        return (
          <div className="w-full h-full flex flex-col justify-between rounded-[inherit] border border-slate-300/80 bg-slate-50/40 p-2">
            <div className="flex items-center justify-between text-[7pt] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              <InlineEditable
                value={content.title || "STUDENT ANSWER SPACE"}
                onCommit={(val) => updateElementContent(element.id, { title: val })}
                placeholder="Workspace title..."
              />
              <span className="font-mono text-[6.5pt]">
                <InlineEditable
                  value={content.rubric || "Write clearly within this boundary"}
                  onCommit={(val) => updateElementContent(element.id, { rubric: val })}
                  placeholder="Instructions..."
                />
              </span>
            </div>
            <div className="flex-1 flex flex-col justify-around py-0.5">
              {Array.from({ length: ansLines }).map((_, idx) => (
                <div key={idx} className="w-full flex-1 min-h-[14px] flex items-end border-b border-slate-300/80" />
              ))}
            </div>
          </div>
        );

      case "timeline":
        const timelineEvents = content.events || [
          { year: "Phase 1", title: "Discovery & Hypothesis", desc: "Formulate fundamental axioms." },
          { year: "Phase 2", title: "Empirical Testing", desc: "Rigorous laboratory validation." },
          { year: "Phase 3", title: "Formal Synthesis", desc: "Publish peer-reviewed standard." },
        ];
        return (
          <div className="w-full h-full flex flex-col justify-between rounded-[inherit] p-2 bg-white">
            <div className="font-bold text-[8.5pt] text-slate-800 mb-1 border-b border-slate-200 pb-0.5 flex items-center gap-1.5">
              <InlineEditable
                value={content.title || "CHRONOLOGICAL TIMELINE"}
                onCommit={(val) => updateElementContent(element.id, { title: val })}
                placeholder="Timeline title..."
              />
            </div>
            <div className="flex-1 flex items-center justify-between relative px-2">
              <div className="absolute left-4 right-4 top-1/2 -translate-y-1/2 h-0.5 bg-indigo-200" />
              {timelineEvents.map((evt: { year?: string; title?: string; desc?: string }, idx: number) => (
                <div key={idx} className="relative z-10 flex flex-col items-center text-center max-w-[30%]">
                  <span className="text-[7pt] font-mono font-bold bg-indigo-600 text-white px-1.5 py-0.5 rounded-full mb-1">
                    <InlineEditable
                      value={evt.year || ""}
                      onCommit={(val) => {
                        const next = [...timelineEvents];
                        next[idx] = { ...next[idx], year: val };
                        updateElementContent(element.id, { events: next });
                      }}
                      placeholder={`Y${idx + 1}`}
                    />
                  </span>
                  <div className="text-[7.5pt] font-bold text-slate-900 leading-tight">
                    <InlineEditable
                      value={evt.title || ""}
                      onCommit={(val) => {
                        const next = [...timelineEvents];
                        next[idx] = { ...next[idx], title: val };
                        updateElementContent(element.id, { events: next });
                      }}
                      placeholder="Event title..."
                    />
                  </div>
                  <div className="text-[6.5pt] text-slate-500 leading-tight mt-0.5">
                    <InlineEditable
                      value={evt.desc || ""}
                      onCommit={(val) => {
                        const next = [...timelineEvents];
                        next[idx] = { ...next[idx], desc: val };
                        updateElementContent(element.id, { events: next });
                      }}
                      placeholder="Event description..."
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case "page-number":
        return (
          <div className="w-full h-full flex items-center justify-between text-slate-500 text-[8pt] font-mono select-none px-2">
            <InlineEditable
              value={content.chapterTitle || "NEX MAXX Book Studio"}
              onCommit={(val) => updateElementContent(element.id, { chapterTitle: val })}
              placeholder="Header title..."
            />
            <span className="font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
              <InlineEditable
                value={String(content.pageNumber || 1)}
                onCommit={(val) => updateElementContent(element.id, { pageNumber: Number(val) || 1 })}
                placeholder="1"
              />
            </span>
          </div>
        );

      case "fillInBlank":
        return (
          <div className="w-full h-full flex items-center justify-between text-[8.5pt]">
            <div className="flex items-center gap-2 w-full">
              <span className="px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700 text-[7.5pt] font-bold">
                <InlineEditable
                  value={content.questionNumber || "Q"}
                  onCommit={(val) => updateElementContent(element.id, { questionNumber: val })}
                  placeholder="Q"
                />
              </span>
              <div className="text-slate-800 font-medium flex-1">
                <InlineEditable
                  value={content.sentence || "Fill in the blank sentence..."}
                  onCommit={(val) => updateElementContent(element.id, { sentence: val })}
                  placeholder="Sentence with ___ blanks..."
                />
              </div>
            </div>
          </div>
        );

      case "writingLines":
        const wlLines = Array.from({ length: content.lineCount || 4 });
        return (
          <div className="w-full h-full flex flex-col justify-between py-1">
            {(content.samplePrompt || isSelected) && (
              <p className="text-[7.5pt] text-slate-600 mb-1 font-medium italic">
                <InlineEditable
                  value={content.samplePrompt || ""}
                  onCommit={(val) => updateElementContent(element.id, { samplePrompt: val })}
                  placeholder="Handwriting prompt..."
                />
              </p>
            )}
            <div className="flex-1 flex flex-col justify-around gap-1">
              {wlLines.map((_, i) => (
                <div key={i} className="relative w-full flex-1 min-h-[18pt] flex flex-col justify-between">
                  <div className="w-full border-t border-sky-300 border-dashed" />
                  <div className="w-full border-t border-rose-300" />
                  <div className="w-full border-t border-sky-400" />
                </div>
              ))}
            </div>
          </div>
        );

      case "drawingBox":
        return (
          <div className="w-full h-full flex flex-col items-center justify-center text-center p-2">
            <Square className="w-6 h-6 text-stone-400 mb-1 stroke-1" />
            <InlineEditable
              value={content.title || "DRAWING BOX"}
              onCommit={(val) => updateElementContent(element.id, { title: val })}
              className="font-semibold text-stone-700 text-[8pt]"
              placeholder="Drawing Box Title..."
            />
            <div className="text-[7pt] text-stone-500 mt-1 max-w-[90%] leading-tight">
              <InlineEditable
                value={content.prompt || "Draw your observation here..."}
                multiline
                onCommit={(val) => updateElementContent(element.id, { prompt: val })}
                placeholder="Sketch prompt..."
              />
            </div>
          </div>
        );

      case "smart-media-qr":
        return <SmartQrRenderer element={element}/>;
      case "qrCode":
        return (
          <div className="w-full h-full flex flex-col items-center justify-center p-1.5 text-center">
            <div className="p-1 rounded bg-white shadow-sm border border-sky-200 mb-1">
              <QrIcon className="w-10 h-10 text-sky-800" />
            </div>
            <span className="text-[6pt] font-bold text-sky-900 leading-tight">
              <InlineEditable
                value={content.label || "SCAN FOR MEDIA"}
                onCommit={(val) => updateElementContent(element.id, { label: val })}
                placeholder="Scan prompt..."
              />
            </span>
          </div>
        );

      case "comparison":
        const compHeaders: string[] = content.headers || ["Criteria", "Concept A", "Concept B"];
        const compRows: string[][] = content.rows || [["Feature 1", "Detail A", "Detail B"]];
        return (
          <div className="w-full h-full flex flex-col overflow-hidden">
            <table className="w-full h-full border-collapse text-[7.5pt]">
              <thead>
                <tr className="bg-slate-100 text-slate-800 font-semibold border-b border-slate-300">
                  {compHeaders.map((h: string, idx: number) => (
                    <th key={idx} className="p-1 text-left">
                      <InlineEditable
                        value={h}
                        onCommit={(val) => {
                          const next = [...compHeaders];
                          next[idx] = val;
                          updateElementContent(element.id, { headers: next });
                        }}
                        placeholder={`Header ${idx + 1}`}
                      />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {compRows.map((row: string[], rIdx: number) => (
                  <tr
                    key={rIdx}
                    className={`border-b border-slate-200 ${
                      rIdx % 2 === 0 ? "bg-white" : "bg-slate-50/50"
                    }`}
                  >
                    {row.map((cell: string, cIdx: number) => (
                      <td key={cIdx} className="p-1 text-slate-700">
                        <InlineEditable
                          value={cell}
                          onCommit={(val) => {
                            const next = compRows.map((r, ri) =>
                              ri === rIdx ? r.map((c, ci) => (ci === cIdx ? val : c)) : r
                            );
                            updateElementContent(element.id, { rows: next });
                          }}
                          placeholder={`Cell (${rIdx + 1}, ${cIdx + 1})`}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );

      case "group":
        return null;

      case "divider":
        return <div className="w-full h-full rounded-[inherit] bg-emerald-600" />;

      case "smart-block":
        if (element.smartBlockData) {
          if (element.smartBlockData.styleOverrides.referenceElement) return <PublicationSceneView scene={buildPublicationScene({ ...element.smartBlockData, transform: element.transform })} label={element.smartBlockData.semanticContent.title}/>;
          if (element.smartBlockData.curriculum?.type === "lesson-schema") {
            return <LessonSchemaRenderer block={{ ...element.smartBlockData, transform: element.transform }} elementId={element.id} selected={isSelected} locked={element.locked}/>;
          }
          if (element.smartBlockData.curriculum?.type === "study-skills") {
            return <StudySkillsRenderer block={{ ...element.smartBlockData, transform: element.transform }} elementId={element.id} selected={isSelected} locked={element.locked}/>;
          }
          if (element.smartBlockData.curriculum?.type === "learning-outcomes" || element.smartBlockData.curriculum?.type === "learning-mission") {
            return <LearningOutcomesRenderer block={{ ...element.smartBlockData, transform: element.transform }} elementId={element.id} selected={isSelected} locked={element.locked}/>;
          }
          if (element.smartBlockData.curriculum?.type === "fact-zone") {
            return <FactZoneRenderer block={{ ...element.smartBlockData, transform: element.transform }} elementId={element.id} selected={isSelected} locked={element.locked}/>;
          }
          if (element.smartBlockData.curriculum?.type === "topic-banner") {
            return <TopicBannerRenderer block={{ ...element.smartBlockData, transform: element.transform }} elementId={element.id} selected={isSelected} locked={element.locked}/>;
          }
          if (element.smartBlockData.curriculum?.type === "life-connect") {
            return <LifeConnectRenderer block={{ ...element.smartBlockData, transform: element.transform }} elementId={element.id} selected={isSelected} locked={element.locked}/>;
          }
          if (element.smartBlockData.curriculum) {
            return (
              <UniversalBlockRenderer
                block={{ ...element.smartBlockData, transform: element.transform }}
                isSelected={isSelected}
                zoom={zoom}
                onExploreStyles={() => shuffleEducationalBlockStyle(element.id)}
                onDetach={() => detachEducationalBlock(element.id)}
              />
            );
          }
          if (element.smartBlockData.presetId.startsWith("atelier-") || element.smartBlockData.presetId.startsWith("studio-")) {
            return (
              <PublicationSceneView
                scene={buildPublicationScene({ ...element.smartBlockData, transform: element.transform })}
                label={`${element.smartBlockData.semanticContent.title} educational block`}
              />
            );
          }
          return (
            <SmartBlockRenderer
              block={{ ...element.smartBlockData, transform: element.transform }}
              isSelected={isSelected}
              zoom={zoom}
              onExploreStyles={() => shuffleEducationalBlockStyle(element.id)}
              onDetach={() => detachEducationalBlock(element.id)}
            />
          );
        }
        return (
          <div className="w-full h-full flex items-center justify-center text-xs text-slate-400">
            {element.displayName}
          </div>
        );

      default:
        return (
          <div className="w-full h-full flex items-center justify-center text-xs text-slate-400">
            {element.displayName}
          </div>
        );
    }
  };

  return (
    <div
      id={`element-${element.id}`}
      role={content.publicationPrimitive && type === "body" && !isEditingText ? "button" : undefined}
      tabIndex={content.publicationPrimitive && type === "body" && !element.locked && !isEditingText ? 0 : undefined}
      aria-label={content.publicationPrimitive && type === "body" && !isEditingText ? `Edit text: ${content.text || element.displayName}` : undefined}
      onKeyDown={e => {
        if (e.target !== e.currentTarget || element.locked || type !== "body" || !content.publicationPrimitive) return;
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault(); e.stopPropagation();
          useEditorStore.getState().selectElement(element.id);
          setIsEditingText(true);
        }
      }}
      style={containerStyle}
      className={`group select-none transition-shadow ${
        ""
      }`}
    >
      {grouped ? <div className="w-full h-full relative" onClickCapture={selectGroup} onDoubleClickCapture={selectGroup} onMouseDownCapture={selectGroup}>
        <div className="w-full h-full pointer-events-none">{renderContent()}</div>
      </div> : <div className={`w-full h-full ${locked ? "pointer-events-none" : ""}`}>{renderContent()}</div>}

      {/* Review Comments Badge Indicator */}
      {element.comments && element.comments.length > 0 && (
        <div className="absolute -top-2.5 -right-2.5 z-40 bg-indigo-600 text-white text-[7pt] font-bold px-1.5 py-0.5 rounded-full shadow-lg border border-white flex items-center gap-0.5">
          <span>💬</span>
          <span>{element.comments.length}</span>
        </div>
      )}

      {/* DPI Preflight Badge for Images if low resolution */}
      {type === "image" && content.rawWidthPx && (
        <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="bg-slate-900/80 backdrop-blur-sm text-white px-1.5 py-0.5 rounded text-[6pt] font-mono">
            {Math.round(content.rawWidthPx / (transform.width / 72))} DPI
          </span>
        </div>
      )}

      {/* Overset text indicator [+] button for linked text flow */}
      {element.isOverset && (
        <button
          type="button"
          title={`Overset text: ${element.oversetChars || "more"} characters hidden. Click to add page or link next frame.`}
          onClick={(e) => {
            e.stopPropagation();
            addPage();
          }}
          className="absolute -bottom-2 -right-2 z-40 w-5 h-5 rounded-full bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center shadow-lg border-2 border-white font-bold text-[9pt] cursor-pointer hover:scale-110 active:scale-95 transition-all"
        >
          <Plus className="w-3 h-3 stroke-[3]" />
        </button>
      )}
    </div>
  );
});
