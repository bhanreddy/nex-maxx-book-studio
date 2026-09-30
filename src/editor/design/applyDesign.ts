import {
  DesignBinding,
  DesignBorder,
  DesignColorTokens,
  DesignDecoration,
  DesignSpacing,
  PageElement,
} from "../../domain/element/types";
import { DESIGN_FAMILIES } from "./families";
import { frameFromLayout } from "./layoutParse";
import { grayscaleTokens, tokensFromPalette, CalloutKey } from "./tokens";

export const PRESERVED_CONTENT_KEYS = [
  "text",
  "number",
  "subtitle",
  "title",
  "body",
  "items",
  "pairs",
  "headers",
  "rows",
  "caption",
  "questionText",
  "steps",
  "definition",
  "term",
  "chapterTitle",
  "pageNumber",
  "section",
  "problem",
  "formula",
  "solution",
  "materials",
  "exampleSentence",
  "options",
  "kicker",
  "label",
  "attribution",
  "credit",
  "hint",
  "marks",
  "duration",
  "difficulty",
  "groupType",
  "partOfSpeech",
];

export interface DesignApplyOptions {
  familyId?: string;
  paletteId?: string;
  tokens?: DesignColorTokens;
  decoration?: DesignDecoration;
  spacing?: DesignSpacing;
  border?: DesignBorder;
  showNumber?: boolean;
  grayscale?: boolean;
  replaceOverrides?: boolean;
}

function isFilled(value: unknown): boolean {
  if (typeof value === "string") return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  return value !== undefined && value !== null;
}

export function mergePresetContent(previous: Record<string, unknown>, next: Record<string, unknown>): Record<string, unknown> {
  const merged = { ...next };
  for (const key of PRESERVED_CONTENT_KEYS) {
    if (isFilled(previous[key])) merged[key] = previous[key];
  }
  return merged;
}

export function applyDesignToElement(element: PageElement, options: DesignApplyOptions): PageElement {
  if (element.metadata?.styleOverride && !options.replaceOverrides) return element;
  const design = element.content?.design as DesignBinding | undefined;
  if (!design?.composition) return applyLegacyTypography(element, options);

  const familyId = options.familyId || design.familyId;
  const paletteId = options.paletteId || design.paletteId;
  let tokens = options.tokens || tokensFromPalette(paletteId, familyId, (design.calloutKey as CalloutKey) || "info");
  if (options.grayscale) tokens = grayscaleTokens(tokens);
  const decoration = options.decoration ?? design.decoration;
  const spacing = options.spacing ?? design.spacing;
  const border = options.border ?? design.border;
  const showNumber = options.showNumber ?? design.showNumber;
  const frame = frameFromLayout(design.composition, tokens, design.role, border);

  return {
    ...element,
    style: {
      ...element.style,
      color: frame.color,
      backgroundColor: frame.background,
      borderColor: frame.borderColor,
      borderWidth: frame.borderWidth,
      borderStyle: frame.borderWidth ? "solid" : "none",
      fontFamily: frame.fontFamily,
      textAlign: frame.textAlign,
    },
    content: {
      ...element.content,
      design: {
        ...design,
        familyId,
        paletteId,
        tokens,
        decoration,
        spacing,
        border,
        showNumber,
      },
    },
    metadata: options.replaceOverrides
      ? { ...element.metadata, styleOverride: false }
      : element.metadata,
  };
}

function applyLegacyTypography(element: PageElement, options: DesignApplyOptions): PageElement {
  if (!options.familyId && !options.paletteId && !options.tokens) return element;
  const family = DESIGN_FAMILIES[options.familyId || "contemporary-academic"];
  const tokens = options.tokens || tokensFromPalette(options.paletteId || family.defaultPalette, family.id);
  const heading = ["heading", "subheading", "chapter-title", "lesson-title", "header", "footer"].includes(element.type);
  const prose = ["body", "body-text", "caption", "quote"].includes(element.type);
  if (!heading && !prose) return element;
  return {
    ...element,
    style: {
      ...element.style,
      fontFamily: heading ? tokens.headingFont : tokens.bodyFont,
      color: options.grayscale ? grayscaleTokens(tokens).text : tokens.text,
    },
  };
}
