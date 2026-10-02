"use client";

import React, { useMemo, useRef, useState } from "react";
import {
  DesignBorder,
  DesignColorTokens,
  DesignDecoration,
  DesignRole,
  DesignSpacing,
  ElementContent,
} from "../../domain/element/types";
import { LayoutNode, parseLayout } from "./layoutParse";
import { imageFilter } from "../educational/imageTreatment";
import { readPublicationImage } from "../educational/imageAssets";

interface LayoutViewProps {
  dsl: string;
  tokens: DesignColorTokens;
  content: ElementContent;
  width: number;
  role: DesignRole;
  showNumber?: boolean;
  decoration?: DesignDecoration;
  spacing?: DesignSpacing;
  border?: DesignBorder;
  onEdit?: (patch: Record<string, string>) => void;
}

interface Tone {
  ink: string;
  muted: string;
  rule: string;
  fill: string | undefined;
}

function LayoutInlineEditor({
  initialValue,
  style,
  onCommit,
  onCancel,
}: {
  initialValue: string;
  style: React.CSSProperties;
  onCommit: (val: string) => void;
  onCancel: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    if (ref.current) {
      ref.current.innerText = initialValue;
      ref.current.focus();
      const sel = window.getSelection();
      if (sel) {
        const range = document.createRange();
        range.selectNodeContents(ref.current);
        range.collapse(false);
        sel.removeAllRanges();
        sel.addRange(range);
      }
    }
  }, []);

  return (
    <div
      ref={ref}
      contentEditable
      suppressContentEditableWarning
      style={{ ...style, outline: "none" }}
      onMouseDown={(e) => e.stopPropagation()}
      onKeyDown={(e) => {
        e.stopPropagation();
        if (e.key === "Escape") {
          e.preventDefault();
          onCancel();
        } else if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          onCommit(ref.current?.innerText || "");
        }
      }}
      onBlur={() => {
        onCommit(ref.current?.innerText || "");
      }}
    />
  );
}

export const LayoutView: React.FC<LayoutViewProps> = ({
  dsl,
  tokens,
  content,
  width,
  role,
  showNumber = true,
  decoration = "standard",
  spacing = "normal",
  onEdit,
}) => {
  const tree = useMemo(() => {
    try {
      return parseLayout(dsl);
    } catch {
      return null;
    }
  }, [dsl]);

  const [editing, setEditing] = useState<string | null>(null);
  const narrow = width < 230;
  const gap = spacing === "tight" ? 3 : spacing === "generous" ? 8 : 5;
  const pad = role === "running" || role === "furniture" ? (spacing === "generous" ? 4 : 1) : spacing === "tight" ? 6 : spacing === "generous" ? 12 : 8;

  if (!tree) {
    return <div style={{ fontSize: "11pt", color: tokens.text }}>{String(content.text || content.title || "")}</div>;
  }

  const toneFor = (fill: string | undefined, parent: Tone): Tone => {
    if (fill === "accent") {
      return { ink: tokens.onAccent, muted: tokens.onAccent, rule: tokens.onAccent, fill };
    }
    if (fill === "callout") {
      return { ink: tokens.calloutText, muted: tokens.calloutText, rule: tokens.calloutBorder, fill };
    }
    if (fill === "tint" || fill === "surface" || fill === "paper") {
      return { ink: tokens.text, muted: tokens.textMuted, rule: tokens.accent, fill };
    }
    return parent;
  };

  const baseTone: Tone = {
    ink: tokens.text,
    muted: tokens.textMuted,
    rule: tokens.accent,
    fill: undefined,
  };

  const renderNode = (node: LayoutNode, tone: Tone, key: string, depth = 0): React.ReactNode => {
    if (decoration === "restrained" && (node.op === "ornament" || node.op === "panel")) return null;
    if (decoration === "restrained" && node.op === "corners") {
      return node.children.map((child, index) => renderNode(child, tone, `${key}-c${index}`, depth + 1));
    }

    const next = toneFor(node.fill, tone);
    const align = node.align;
    const textAlign = align === "center" ? "center" : align === "right" ? "right" : "left";

    if (node.op === "stack" || node.op === "row" || node.op === "band" || node.op === "corners") {
      const row = node.op === "row";
      const collapse = narrow && row && node.children.some((child) => child.op === "panel" || child.op === "number" || child.widthPct);
      const background = fillColor(node.fill, tokens);
      return (
        <div
          key={key}
          style={{
            display: "flex",
            flexDirection: row && !collapse ? "row" : "column",
            alignItems: row ? (align === "end" ? "flex-end" : align === "center" ? "center" : "stretch") : align === "center" ? "center" : align === "right" ? "flex-end" : "stretch",
            justifyContent: row && align === "center" ? "center" : "flex-start",
            gap: `${gap}pt`,
            width: node.widthPct ? `${node.widthPct}%` : depth === 0 ? "100%" : undefined,
            height: depth === 0 || (node.op === "band" && node.fill === "accent" && !node.widthPct) ? "100%" : undefined,
            flex: node.widthPct ? `0 0 ${node.widthPct}%` : depth === 0 ? undefined : "1 1 auto",
            minWidth: 0,
            position: "relative",
            boxSizing: "border-box",
            background,
            color: next.ink,
            textAlign,
            padding: node.op === "band" || node.fill ? `${Math.max(4, pad - 2)}pt ${pad}pt` : undefined,
            borderRadius: node.fill ? "2pt" : undefined,
          }}
        >
          {node.op === "corners" && decoration !== "restrained" && <CornerMarks color={next.rule} />}
          {node.children.map((child, index) => renderNode(child, next, `${key}-${index}`, depth + 1))}
        </div>
      );
    }

    if (node.op === "rail") {
      const thick = node.mods.includes("thick") && decoration !== "restrained";
      return (
        <div
          key={key}
          style={{
            width: thick ? "3.5pt" : "0.8pt",
            alignSelf: "stretch",
            background: next.rule,
            borderRadius: "1pt",
            flex: "0 0 auto",
          }}
        />
      );
    }

    if (node.op === "rule") return <Rule key={key} node={node} tone={next} decoration={decoration} />;
    if (node.op === "ornament") return <Ornament key={key} node={node} tone={next} tokens={tokens} />;
    if (node.op === "panel") return <Plate key={key} node={node} tokens={tokens} />;
    if (node.op === "number") {
      if (!showNumber) return null;
      return <NumberMark key={key} node={node} tone={next} tokens={tokens} content={content} decoration={decoration} />;
    }
    if (node.op === "title") return <TitleSlot key={key} node={node} tone={next} tokens={tokens} content={content} role={role} width={width} editing={editing} setEditing={setEditing} onEdit={onEdit} />;
    if (node.op === "subtitle") return <SubtitleSlot key={key} node={node} tone={next} tokens={tokens} content={content} />;
    if (node.op === "kicker" || node.op === "label") return <KickerSlot key={key} node={node} tone={next} tokens={tokens} content={content} />;
    if (node.op === "body" || node.op === "quote") return <ProseSlot key={key} node={node} tone={next} tokens={tokens} content={content} width={width} editing={editing} setEditing={setEditing} onEdit={onEdit} />;
    if (node.op === "caption") return <CaptionSlot key={key} tone={next} tokens={tokens} content={content} />;
    if (node.op === "meta") return <MetaSlot key={key} node={node} tone={next} tokens={tokens} content={content} />;
    if (node.op === "term") return <div key={key} style={termStyle(tokens, next)}>{textOf(content.term, "Osmosis")}</div>;
    if (node.op === "def") return <div key={key} style={proseStyle(tokens, next, 9.5)}>{textOf(content.definition || content.body, "A short definition.")}</div>;
    if (node.op === "question") return <div key={key} style={{ ...proseStyle(tokens, next, 10.5), fontWeight: 650 }}>{textOf(content.questionText, "Explain the idea in your own words.")}</div>;
    if (node.op === "formula") return <FormulaSlot key={key} tokens={tokens} tone={next} content={content} />;
    if (node.op === "items") return <ItemsSlot key={key} node={node} tokens={tokens} tone={next} content={content} />;
    if (node.op === "steps") return <StepsSlot key={key} tokens={tokens} tone={next} content={content} />;
    if (node.op === "options") return <OptionsSlot key={key} tokens={tokens} tone={next} content={content} />;
    if (node.op === "lines") return <LinesSlot key={key} node={node} tone={next} />;
    if (node.op === "badges") return <BadgesSlot key={key} tokens={tokens} tone={next} content={content} />;
    if (node.op === "materials") return <div key={key} style={proseStyle(tokens, next, 9)}><strong>Materials. </strong>{textOf(content.materials, "Potato, salt solution, balance.")}</div>;
    if (node.op === "table") return <TableSlot key={key} node={node} tokens={tokens} tone={next} content={content} />;
    if (node.op === "figure") return <FigureSlot key={key} node={node} tokens={tokens} content={content} onEdit={onEdit} />;
    if (node.op === "attr") return <div key={key} style={{ fontFamily: tokens.bodyFont, fontSize: "8.5pt", color: next.muted }}>{content.attribution ? `— ${content.attribution}` : ""}</div>;
    return null;
  };

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        minWidth: 0,
        overflow: "hidden",
        boxSizing: "border-box",
        padding: `${pad}pt`,
        color: tokens.text,
        fontFamily: tokens.bodyFont,
      }}
    >
      {renderNode(tree, baseTone, "root")}
    </div>
  );
};

function fillColor(fill: string | undefined, tokens: DesignColorTokens): string | undefined {
  if (fill === "accent") return tokens.accent;
  if (fill === "tint") return tokens.accentTint;
  if (fill === "surface") return tokens.surface;
  if (fill === "paper") return tokens.paper;
  if (fill === "callout") return tokens.calloutSurface;
  return undefined;
}

function textOf(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim() ? value : fallback;
}

function titleSize(text: string, role: DesignRole, scale: number, width: number): number {
  const base = role === "chapter" ? 18 : role === "heading" ? 12.5 : role === "running" ? 8 : 11;
  let size = base * scale;
  if (text.length > 42) size *= 0.84;
  if (text.length > 78) size *= 0.84;
  if (width < 220) size *= 0.88;
  return Math.max(role === "running" ? 7 : 9, size);
}

function CornerMarks({ color }: { color: string }) {
  const arm = "8pt";
  const edge = "0pt";
  const border = `1pt solid ${color}`;
  const corner = (top: boolean, left: boolean): React.CSSProperties => ({
    position: "absolute",
    width: arm,
    height: arm,
    top: top ? edge : undefined,
    bottom: top ? undefined : edge,
    left: left ? edge : undefined,
    right: left ? undefined : edge,
    borderTop: top ? border : undefined,
    borderBottom: top ? undefined : border,
    borderLeft: left ? border : undefined,
    borderRight: left ? undefined : border,
  });
  return (
    <>
      <span style={corner(true, true)} />
      <span style={corner(true, false)} />
      <span style={corner(false, true)} />
      <span style={corner(false, false)} />
    </>
  );
}

function Rule({ node, tone, decoration }: { node: LayoutNode; tone: Tone; decoration: DesignDecoration }) {
  const kind = decoration === "restrained" && (node.mods.includes("double") || node.mods.includes("thick")) ? "hairline" : node.mods[0] || "hairline";
  if (kind === "v") {
    return <div style={{ width: "0.6pt", alignSelf: "stretch", background: tone.rule, flex: "0 0 auto" }} />;
  }
  if (kind === "flex") {
    return <div style={{ flex: 1, height: "0.6pt", background: tone.rule, alignSelf: "center", minWidth: "12pt" }} />;
  }
  const short = kind === "short";
  const thick = kind === "thick";
  const dotted = kind === "dotted";
  const height = thick ? "1.6pt" : "0.55pt";
  if (kind === "double") {
    return (
      <div style={{ width: short ? "32%" : "100%", display: "flex", flexDirection: "column", gap: "1.5pt" }}>
        <div style={{ height: "0.6pt", background: tone.rule }} />
        <div style={{ height: "0.4pt", background: tone.rule }} />
      </div>
    );
  }
  return (
    <div
      style={{
        width: short ? "28%" : "100%",
        height: dotted ? 0 : height,
        background: dotted ? "transparent" : tone.rule,
        borderTop: dotted ? `0.8pt dotted ${tone.rule}` : undefined,
        alignSelf: short ? "flex-start" : "stretch",
      }}
    />
  );
}

function Ornament({ node, tone, tokens }: { node: LayoutNode; tone: Tone; tokens: DesignColorTokens }) {
  const kind = node.mods[0] || "diamond";
  if (kind === "diamond") {
    return <span style={{ width: "5pt", height: "5pt", background: tone.rule, transform: "rotate(45deg)", display: "inline-block", alignSelf: "center", flex: "0 0 auto" }} />;
  }
  if (kind === "square") {
    return <span style={{ width: "6pt", height: "6pt", border: `1pt solid ${tone.rule}`, display: "inline-block", alignSelf: "center", flex: "0 0 auto" }} />;
  }
  if (kind === "asterism") {
    return <div style={{ textAlign: "center", color: tone.rule, fontFamily: tokens.headingFont, fontSize: "11pt", letterSpacing: "0.2em" }}>⁂</div>;
  }
  if (kind === "brackets" || kind === "bracketL" || kind === "bracketR") {
    const glyph = kind === "bracketR" ? "⟩" : kind === "bracketL" ? "⟨" : "⟨  ⟩";
    return <div style={{ color: tone.rule, fontFamily: tokens.headingFont, fontSize: kind === "brackets" ? "12pt" : "20pt", lineHeight: 1, alignSelf: "center" }}>{glyph}</div>;
  }
  return null;
}

function Plate({ node, tokens }: { node: LayoutNode; tokens: DesignColorTokens }) {
  return (
    <div
      style={{
        width: node.widthPct ? `${node.widthPct}%` : "28%",
        flex: "0 0 auto",
        minHeight: "48pt",
        alignSelf: "stretch",
        background: tokens.accentTint,
        border: `0.6pt solid ${tokens.border}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: tokens.textMuted,
        fontFamily: tokens.bodyFont,
        fontSize: "7.5pt",
        letterSpacing: "0.12em",
        textTransform: "uppercase",
      }}
    >
      Plate
    </div>
  );
}

function NumberMark({
  node,
  tone,
  tokens,
  content,
  decoration,
}: {
  node: LayoutNode;
  tone: Tone;
  tokens: DesignColorTokens;
  content: ElementContent;
  decoration: DesignDecoration;
}) {
  const raw = textOf(content.number, "04");
  let styleName = node.mods[0] || "modest";
  if (decoration === "restrained" && (styleName === "circle" || styleName === "display")) styleName = "modest";
  const common: React.CSSProperties = {
    fontFamily: tokens.headingFont,
    color: tone.ink,
    flex: "0 0 auto",
    lineHeight: 1,
  };
  if (styleName === "display" || styleName === "drop") {
    return <div style={{ ...common, fontSize: styleName === "drop" ? "34pt" : "32pt", fontWeight: 700, width: node.widthPct ? `${node.widthPct}%` : undefined, letterSpacing: "-0.03em" }}>{raw}</div>;
  }
  if (styleName === "vertical") {
    return <div style={{ ...common, writingMode: "vertical-rl", transform: "rotate(180deg)", fontSize: "9pt", letterSpacing: "0.18em", fontWeight: 650 }}>{raw}</div>;
  }
  if (styleName === "chip") return <span style={chipStyle(tokens, tone)}>{raw}</span>;
  if (styleName === "circle") {
    return (
      <span style={{ ...common, width: "28pt", height: "28pt", borderRadius: "50%", border: `1pt solid ${tone.rule}`, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "9pt", fontWeight: 700 }}>
        {raw}
      </span>
    );
  }
  return <div style={{ ...common, fontSize: "11pt", fontWeight: 700, width: node.widthPct ? `${node.widthPct}%` : undefined }}>{raw}</div>;
}

function chipStyle(tokens: DesignColorTokens, tone: Tone): React.CSSProperties {
  const inverse = tone.fill === "accent";
  return {
    display: "inline-flex",
    alignItems: "center",
    alignSelf: "center",
    padding: "1pt 5pt",
    borderRadius: "2pt",
    border: `0.6pt solid ${inverse ? tokens.onAccent : tokens.accent}`,
    background: inverse ? "transparent" : tokens.accentTint,
    color: inverse ? tokens.onAccent : tokens.accent,
    fontFamily: tokens.bodyFont,
    fontSize: "7.5pt",
    fontWeight: 700,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    flex: "0 0 auto",
    lineHeight: 1.3,
  };
}

function TitleSlot({
  node,
  tone,
  tokens,
  content,
  role,
  width,
  editing,
  setEditing,
  onEdit,
}: {
  node: LayoutNode;
  tone: Tone;
  tokens: DesignColorTokens;
  content: ElementContent;
  role: DesignRole;
  width: number;
  editing: string | null;
  setEditing: (value: string | null) => void;
  onEdit?: (patch: Record<string, string>) => void;
}) {
  const value = textOf(content.text || content.title, "Untitled");
  const scale = Number(node.mods.find((mod) => !Number.isNaN(Number(mod)))) || 1;
  const size = titleSize(value, role, scale, width);
  if (editing === "text" && onEdit) {
    return (
      <LayoutInlineEditor
        initialValue={value}
        style={{ fontFamily: tokens.headingFont, fontSize: `${size}pt`, fontWeight: 650, lineHeight: 1.15, minWidth: 0 }}
        onCommit={(text) => {
          setEditing(null);
          onEdit({ text });
        }}
        onCancel={() => setEditing(null)}
      />
    );
  }
  return (
    <div
      onDoubleClick={(event) => {
        if (!onEdit) return;
        event.stopPropagation();
        setEditing("text");
      }}
      style={{
        fontFamily: tokens.headingFont,
        fontSize: `${size}pt`,
        fontWeight: 650,
        lineHeight: 1.14,
        letterSpacing: size > 16 ? "-0.015em" : "0",
        color: tone.ink,
        minWidth: 0,
        overflowWrap: "anywhere",
      }}
    >
      {value}
    </div>
  );
}

function SubtitleSlot({ node, tone, tokens, content }: { node: LayoutNode; tone: Tone; tokens: DesignColorTokens; content: ElementContent }) {
  const value = content.subtitle;
  if (!value) return null;
  return (
    <div style={{ fontFamily: tokens.bodyFont, fontSize: "9.5pt", lineHeight: 1.35, fontStyle: node.mods.includes("italic") ? "italic" : "normal", color: tone.fill === "accent" ? tone.ink : tone.muted, overflowWrap: "anywhere" }}>
      {String(value)}
    </div>
  );
}

function KickerSlot({ node, tone, tokens, content }: { node: LayoutNode; tone: Tone; tokens: DesignColorTokens; content: ElementContent }) {
  const value = textOf(node.op === "label" ? content.label || content.kicker : content.kicker || content.label, node.op === "label" ? "Label" : "Chapter");
  if (node.mods.includes("chip") || node.mods.includes("solution")) {
    const chipText = node.mods.includes("solution") ? "Solution" : value;
    return <span style={chipStyle(tokens, tone)}>{chipText}</span>;
  }
  return (
    <div
      style={{
        fontFamily: tokens.bodyFont,
        fontSize: "7.5pt",
        fontWeight: 700,
        letterSpacing: "0.14em",
        textTransform: "uppercase",
        color: tone.fill === "accent" ? tone.ink : node.mods.includes("plain") ? tone.ink : tone.rule,
        width: node.widthPct ? `${node.widthPct}%` : undefined,
      }}
    >
      {value}
    </div>
  );
}

function ProseSlot({
  node,
  tone,
  tokens,
  content,
  width,
  editing,
  setEditing,
  onEdit,
}: {
  node: LayoutNode;
  tone: Tone;
  tokens: DesignColorTokens;
  content: ElementContent;
  width: number;
  editing: string | null;
  setEditing: (value: string | null) => void;
  onEdit?: (patch: Record<string, string>) => void;
}) {
  const field = node.op === "quote" ? "text" : content.body ? "body" : "text";
  const value = textOf(field === "body" ? content.body : content.text || content.body, "The paragraph continues here.");
  const italic = node.op === "quote" || node.mods.includes("italic");
  const narrow = node.mods.includes("narrow");
  if (editing === field && onEdit) {
    return (
      <LayoutInlineEditor
        initialValue={value}
        style={proseStyle(tokens, tone, 10.5)}
        onCommit={(text) => {
          setEditing(null);
          onEdit({ [field]: text });
        }}
        onCancel={() => setEditing(null)}
      />
    );
  }
  return (
    <div
      onDoubleClick={(event) => {
        if (!onEdit) return;
        event.stopPropagation();
        setEditing(field);
      }}
      style={{
        ...proseStyle(tokens, tone, node.op === "quote" ? 11 : 10.5),
        fontStyle: italic ? "italic" : "normal",
        fontFamily: node.op === "quote" ? tokens.headingFont : tokens.bodyFont,
        maxWidth: narrow ? "92%" : "100%",
        margin: narrow && width > 260 ? "0 auto" : undefined,
      }}
    >
      {node.op === "quote" && node.mods.includes("mark") && (
        <span style={{ fontFamily: tokens.headingFont, fontSize: "22pt", lineHeight: 0.8, color: tone.rule, float: "left", paddingRight: "4pt" }}>&ldquo;</span>
      )}
      {node.mods.includes("drop") && value.length > 0 && (
        <span style={{ fontFamily: tokens.headingFont, fontSize: "26pt", float: "left", lineHeight: 0.8, paddingRight: "4pt", fontWeight: 700, color: tone.ink }}>{value.slice(0, 1)}</span>
      )}
      {node.mods.includes("lead") ? <LeadIn text={value} /> : node.mods.includes("drop") ? value.slice(1) : value}
    </div>
  );
}

function LeadIn({ text }: { text: string }) {
  const words = text.split(" ");
  const lead = words.slice(0, 4).join(" ");
  const rest = words.slice(4).join(" ");
  return (
    <>
      <span style={{ fontVariant: "small-caps", letterSpacing: "0.06em", fontWeight: 650 }}>{lead}</span>
      {rest ? ` ${rest}` : ""}
    </>
  );
}

function proseStyle(tokens: DesignColorTokens, tone: Tone, size: number): React.CSSProperties {
  return {
    fontFamily: tokens.bodyFont,
    fontSize: `${size}pt`,
    lineHeight: 1.45,
    color: tone.ink,
    minWidth: 0,
    overflowWrap: "anywhere",
  };
}

function termStyle(tokens: DesignColorTokens, tone: Tone): React.CSSProperties {
  return { fontFamily: tokens.headingFont, fontSize: "12pt", fontWeight: 700, color: tone.ink, lineHeight: 1.15 };
}

function CaptionSlot({ tone, tokens, content }: { tone: Tone; tokens: DesignColorTokens; content: ElementContent }) {
  return <div style={{ ...proseStyle(tokens, tone, 8.5), fontStyle: "normal" }}>{textOf(content.caption, "Figure 1  Caption")}</div>;
}

function MetaSlot({ node, tone, tokens, content }: { node: LayoutNode; tone: Tone; tokens: DesignColorTokens; content: ElementContent }) {
  const kind = node.mods[0] || "chapter";
  const map: Record<string, string> = {
    chapter: textOf(content.chapterTitle, "Chapter"),
    section: textOf(content.section, "Section"),
    page: textOf(content.pageNumber, "1"),
    credit: textOf(content.credit, ""),
    example: content.exampleSentence ? `Example. ${content.exampleSentence}` : "",
    marks: content.marks ? `${content.marks} marks` : "",
    hint: content.hint ? `Hint. ${content.hint}` : "",
    answer: content.solution ? `Answer. ${content.solution}` : "",
    speech: textOf(content.partOfSpeech, ""),
  };
  const value = map[kind] || "";
  if (!value) return null;
  const small = node.mods.includes("smallcaps");
  return (
    <div style={{ fontFamily: tokens.bodyFont, fontSize: "8pt", color: tone.muted, letterSpacing: small ? "0.12em" : "0.01em", textTransform: small ? "uppercase" : "none", fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", minWidth: 0 }}>
      {value}
    </div>
  );
}

function FormulaSlot({ tokens, tone, content }: { tokens: DesignColorTokens; tone: Tone; content: ElementContent }) {
  return (
    <div style={{ background: tone.fill === "accent" ? "transparent" : tokens.accentTint, border: `0.6pt solid ${tone.rule}`, padding: "3pt 6pt", textAlign: "center" }}>
      <div style={{ fontFamily: tokens.bodyFont, fontSize: "7pt", letterSpacing: "0.12em", textTransform: "uppercase", color: tone.rule, fontWeight: 700 }}>Formula</div>
      <div style={{ fontFamily: tokens.headingFont, fontSize: "11pt", color: tone.ink }}>{textOf(content.formula, "KE = 1/2 mv²")}</div>
    </div>
  );
}

function ItemsSlot({ node, tokens, tone, content }: { node: LayoutNode; tokens: DesignColorTokens; tone: Tone; content: ElementContent }) {
  const mode = node.mods[0] || "check";
  if (mode === "pair") {
    const pairs = (content.pairs as string[][] | undefined) || [["Cell wall", "Support"], ["Chloroplast", "Light"], ["Vacuole", "Storage"]];
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "2pt" }}>
        {pairs.map((pair, index) => (
          <div key={index} style={{ display: "flex", gap: "8pt", fontFamily: tokens.bodyFont, fontSize: "9pt", color: tone.ink }}>
            <span style={{ flex: 1 }}>{pair[0]}</span>
            <span style={{ color: tone.rule }}>—</span>
            <span style={{ flex: 1 }}>{pair[1]}</span>
          </div>
        ))}
      </div>
    );
  }
  const items = (content.items as string[] | undefined) || ["First point", "Second point", "Third point"];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2pt" }}>
      {items.map((item, index) => (
        <div key={index} style={{ display: "flex", gap: "5pt", fontFamily: tokens.bodyFont, fontSize: "9pt", lineHeight: 1.35, color: tone.ink, minWidth: 0 }}>
          {mode === "number" ? (
            <span style={{ fontWeight: 700, color: tone.rule, flex: "0 0 auto" }}>{index + 1}.</span>
          ) : (
            <span style={{ width: "8pt", height: "8pt", border: `0.8pt solid ${tone.rule}`, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "7pt", color: tone.rule, flex: "0 0 auto", marginTop: "1pt" }}>✓</span>
          )}
          <span style={{ minWidth: 0, overflowWrap: "anywhere" }}>{item}</span>
        </div>
      ))}
    </div>
  );
}

function StepsSlot({ tokens, tone, content }: { tokens: DesignColorTokens; tone: Tone; content: ElementContent }) {
  const steps = (content.steps as string[] | undefined) || ["Identify the known values.", "Substitute into the relation.", "State the result with units."];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2pt" }}>
      {steps.map((step, index) => (
        <div key={index} style={{ fontFamily: tokens.bodyFont, fontSize: "9pt", lineHeight: 1.35, color: tone.ink }}>
          <span style={{ fontWeight: 700, color: tone.rule }}>{index + 1}. </span>
          {step.replace(/^\d+\.\s*/, "")}
        </div>
      ))}
    </div>
  );
}

function OptionsSlot({ tokens, tone, content }: { tokens: DesignColorTokens; tone: Tone; content: ElementContent }) {
  const options = (content.options as string[] | undefined) || ["True", "False"];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2pt" }}>
      {options.map((option, index) => (
        <div key={index} style={{ display: "flex", gap: "5pt", alignItems: "flex-start", fontFamily: tokens.bodyFont, fontSize: "9pt", color: tone.ink }}>
          <span style={{ fontWeight: 700, width: "12pt", flex: "0 0 auto" }}>{String.fromCharCode(65 + index)}.</span>
          <span style={{ width: "8pt", height: "8pt", border: `0.8pt solid ${tone.rule}`, marginTop: "1pt", flex: "0 0 auto" }} />
          <span>{option}</span>
        </div>
      ))}
    </div>
  );
}

function LinesSlot({ node, tone }: { node: LayoutNode; tone: Tone }) {
  const count = Number(node.mods[0]) || 4;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "7pt", marginTop: "2pt" }} aria-label="Answer lines">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} style={{ borderBottom: `0.6pt solid ${tone.rule}`, height: "8pt", opacity: 0.85 }} />
      ))}
    </div>
  );
}

function BadgesSlot({ tokens, tone, content }: { tokens: DesignColorTokens; tone: Tone; content: ElementContent }) {
  const chips = [
    `Time ${textOf(content.duration, "25 min")}`,
    `Level ${textOf(content.difficulty, "Intermediate")}`,
    `Group ${textOf(content.groupType, "Pairs")}`,
  ];
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "3pt" }}>
      {chips.map((chip) => (
        <span key={chip} style={chipStyle(tokens, tone)}>{chip}</span>
      ))}
    </div>
  );
}

function TableSlot({ node, tokens, tone, content }: { node: LayoutNode; tokens: DesignColorTokens; tone: Tone; content: ElementContent }) {
  const kind = node.mods[0] || "grid";
  const headers = (content.headers as string[] | undefined) || ["Feature", "Plant", "Animal"];
  const rows = (content.rows as string[][] | undefined) || [["Wall", "Present", "Absent"], ["Chloroplast", "Present", "Absent"]];
  if (kind === "stats") {
    return (
      <div style={{ display: "flex", gap: "8pt", justifyContent: "space-between" }}>
        {headers.slice(0, 3).map((header, index) => (
          <div key={header} style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: tokens.headingFont, fontSize: "16pt", fontWeight: 700, color: tone.ink, lineHeight: 1 }}>{rows[0]?.[index] || "—"}</div>
            <div style={{ fontFamily: tokens.bodyFont, fontSize: "7.5pt", letterSpacing: "0.08em", textTransform: "uppercase", color: tone.muted, marginTop: "2pt" }}>{header}</div>
          </div>
        ))}
      </div>
    );
  }
  if (kind === "kv") {
    const pairs = rows.length ? rows : [["Term", "Meaning"]];
    return (
      <div>
        {pairs.map((row, index) => (
          <div key={index} style={{ display: "flex", gap: "8pt", borderTop: `0.5pt solid ${tokens.border}`, padding: "3pt 0", fontFamily: tokens.bodyFont, fontSize: "8.5pt", color: tone.ink }}>
            <div style={{ width: "34%", fontWeight: 700 }}>{row[0]}</div>
            <div style={{ flex: 1 }}>{row[1]}</div>
          </div>
        ))}
      </div>
    );
  }
  const band = kind === "band";
  const plain = kind === "plain" || kind === "rules";
  const striped = kind === "striped";
  const emphasis = kind === "emphasis";
  return (
    <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: tokens.bodyFont, fontSize: "8pt", color: tone.ink }}>
      <thead>
        <tr>
          {headers.map((header) => (
            <th key={header} style={{ textAlign: "left", fontWeight: 700, padding: "3pt 4pt", background: band ? tokens.accent : "transparent", color: band ? tokens.onAccent : tone.ink, borderBottom: `0.7pt solid ${band ? tokens.accent : tokens.border}`, borderRight: plain || band ? undefined : `0.4pt solid ${tokens.border}` }}>
              {header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, rowIndex) => (
          <tr key={rowIndex} style={{ background: striped && rowIndex % 2 === 1 ? tokens.accentTint : "transparent" }}>
            {row.map((cell, cellIndex) => (
              <td key={cellIndex} style={{ padding: "3pt 4pt", borderBottom: `0.45pt solid ${tokens.border}`, borderRight: plain || band ? undefined : `0.4pt solid ${tokens.border}`, fontWeight: emphasis && cellIndex === 0 ? 700 : 400, background: emphasis && cellIndex === 0 ? tokens.accentTint : undefined }}>
                {cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function FigureSlot({
  node,
  tokens,
  content,
  onEdit,
}: {
  node: LayoutNode;
  tokens: DesignColorTokens;
  content: ElementContent;
  onEdit?: (patch: Record<string, string>) => void;
}) {
  const kind = node.mods[0] || "frame";
  const circle = kind === "circle";
  const fileInputRef = useRef<HTMLInputElement>(null);
  const src = content.src || content.imageUrl || content.url;
  const caption = content.caption;
  const focusX = content.focalX ?? 0.5;
  const focusY = content.focalY ?? 0.5;
  const scale = content.cropScale || content.scale || 1;
  const flipX = content.flipX ? -1 : 1;
  const flipY = content.flipY ? -1 : 1;
  const fit = content.fit || content.imageFit || "cover";
  const filter = imageFilter({
    brightness: content.brightness,
    contrast: content.contrast,
    saturation: content.saturation,
  });

  return (
    <div
      style={{
        flex: node.widthPct ? `0 0 ${node.widthPct}%` : "1 1 auto",
        width: node.widthPct ? `${node.widthPct}%` : "100%",
        minHeight: circle ? "72pt" : "52pt",
        height: circle ? "78pt" : "100%",
        maxHeight: "100%",
        border: kind === "plate" ? `3pt solid ${tokens.border}` : `0.7pt solid ${tokens.border}`,
        borderRadius: circle ? "50%" : kind === "rounded" ? "8pt" : "1pt",
        background: tokens.paper,
        display: "flex",
        flexDirection: "column",
        position: "relative",
        overflow: "hidden",
        alignSelf: "stretch",
      }}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        style={{ display: "none" }}
        onChange={async (e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (!file || !onEdit) return;
          try {
            const asset = await readPublicationImage(file);
            onEdit({
              src: asset.src,
              imageUrl: asset.src,
              rawWidthPx: String(asset.rawWidthPx),
              rawHeightPx: String(asset.rawHeightPx),
              alt: file.name,
              focalX: "0.5",
              focalY: "0.5",
              scale: "1",
            });
          } catch (err) {
            alert(String(err));
          }
        }}
      />

      <div
        style={{
          position: "relative",
          flex: "1 1 auto",
          width: "100%",
          height: "100%",
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt={content.alt || caption || "Figure image"}
            style={{
              width: "100%",
              height: "100%",
              objectFit: fit,
              objectPosition: `${focusX * 100}% ${focusY * 100}%`,
              filter,
              transform: `scale(${scale * flipX}, ${scale * flipY})`,
              transformOrigin: `${focusX * 100}% ${focusY * 100}%`,
            }}
          />
        ) : (
          <>
            <FigureMark kind={kind} color={tokens.accent} muted={tokens.textMuted} />
            <span
              style={{
                position: "absolute",
                left: "4pt",
                bottom: "3pt",
                fontFamily: tokens.bodyFont,
                fontSize: "7pt",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: tokens.textMuted,
              }}
            >
              {kind === "diagram" ? "Diagram" : "Figure"}
            </span>
          </>
        )}

        {onEdit && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              fileInputRef.current?.click();
            }}
            title={src ? "Replace image" : "Add image"}
            style={{
              position: "absolute",
              top: "4pt",
              right: "4pt",
              background: "rgba(15,23,42,0.75)",
              color: "#f8fafc",
              border: "1px solid rgba(255,255,255,0.2)",
              borderRadius: "4pt",
              fontSize: "6.5pt",
              padding: "2pt 5pt",
              cursor: "pointer",
            }}
          >
            {src ? "Replace" : "+ Image"}
          </button>
        )}
      </div>

      {caption && (
        <div
          style={{
            padding: "2pt 4pt",
            fontFamily: tokens.bodyFont,
            fontSize: "7pt",
            color: tokens.textMuted,
            borderTop: `0.5pt solid ${tokens.border}`,
            background: tokens.paper,
            flexShrink: 0,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {caption}
        </div>
      )}
    </div>
  );
}

function FigureMark({ kind, color, muted }: { kind: string; color: string; muted: string }) {
  if (kind === "diagram") {
    return (
      <svg width="78%" height="70%" viewBox="0 0 120 70" aria-hidden>
        <rect x="8" y="18" width="36" height="28" fill="none" stroke={color} strokeWidth="1.2" />
        <circle cx="78" cy="32" r="14" fill="none" stroke={color} strokeWidth="1.2" />
        <path d="M44 32 H64" stroke={muted} strokeWidth="1" />
      </svg>
    );
  }
  return (
    <svg width="70%" height="60%" viewBox="0 0 100 60" aria-hidden>
      <path d="M8 46 L28 22 L46 40 L62 16 L92 46" fill="none" stroke={color} strokeWidth="1.4" />
      <circle cx="70" cy="16" r="4" fill="none" stroke={muted} strokeWidth="1" />
    </svg>
  );
}
