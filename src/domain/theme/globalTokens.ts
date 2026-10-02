/**
 * NEX MAXX Book Studio - Centralized Global Styles & Design Tokens Engine
 * 
 * Provides unified design tokens for:
 * - Typography (scale, fonts, line-heights, letter-spacing)
 * - Colours (primary, secondary, accent, surface, paper, text, borders)
 * - Spacing (compact, normal, generous)
 * - Radius (square, gentle, rounded, pill)
 * - Borders (hairline, thin, standard, bold)
 * - Shadows (flat, elevation-1, elevation-2, glow)
 * - Paragraph & Heading Styles
 * - Subject Themes (Math, Science, English, EVS, Social Studies, CS)
 */

import { GRADE_SCALES } from "../educational/designTokens";
import { Book, TextStyleDefinition } from "../book/types";
import { PageElement } from "../element/types";
import { buildPublicationScene } from "../../editor/educational/publicationScene";

export interface GlobalTypographyTokens {
  headingFont: string;
  bodyFont: string;
  monoFont: string;
  scale: {
    h1: number;
    h2: number;
    h3: number;
    body: number;
    small: number;
    caption: number;
  };
  lineHeights: {
    heading: number;
    body: number;
    tight: number;
  };
}

export interface GlobalColorTokens {
  primary: string;
  secondary: string;
  accent: string;
  surface: string;
  paper: string;
  text: string;
  textMuted: string;
  border: string;
  focusRing: string;
}

export interface GlobalSpacingTokens {
  xs: number; // pt
  sm: number;
  md: number;
  lg: number;
  xl: number;
}

export interface GlobalRadiusTokens {
  none: number;
  sm: number;
  md: number;
  lg: number;
  pill: number;
}

export interface GlobalBorderTokens {
  hairlinePt: number;
  thinPt: number;
  standardPt: number;
  thickPt: number;
}

export interface GlobalShadowTokens {
  none: string;
  subtle: string;
  elevated: string;
  floating: string;
}

export interface GlobalDesignTokens {
  id: string;
  name: string;
  subjectThemeId: string;
  typography: GlobalTypographyTokens;
  colors: GlobalColorTokens;
  spacing: GlobalSpacingTokens;
  radius: GlobalRadiusTokens;
  borders: GlobalBorderTokens;
  shadows: GlobalShadowTokens;
  paragraphStyles: TextStyleDefinition[];
}

export const DEFAULT_DESIGN_TOKENS: GlobalDesignTokens = {
  id: "tokens-nex-academic",
  name: "NEX Academic Editorial",
  subjectThemeId: "math",
  typography: {
    headingFont: "Outfit, sans-serif",
    bodyFont: "Inter, sans-serif",
    monoFont: "monospace",
    scale: {
      h1: 26,
      h2: 20,
      h3: 15,
      body: 10.5,
      small: 9,
      caption: 8,
    },
    lineHeights: {
      heading: 1.25,
      body: 1.5,
      tight: 1.15,
    },
  },
  colors: {
    primary: "#4f46e5",
    secondary: "#6366f1",
    accent: "#f59e0b",
    surface: "#f8fafc",
    paper: "#ffffff",
    text: "#0f172a",
    textMuted: "#64748b",
    border: "#e2e8f0",
    focusRing: "#6366f1",
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 14,
    lg: 20,
    xl: 28,
  },
  radius: {
    none: 0,
    sm: 4,
    md: 8,
    lg: 12,
    pill: 9999,
  },
  borders: {
    hairlinePt: 0.5,
    thinPt: 1,
    standardPt: 1.5,
    thickPt: 2.5,
  },
  shadows: {
    none: "none",
    subtle: "0 1px 2px rgba(0, 0, 0, 0.05)",
    elevated: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
    floating: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
  },
  paragraphStyles: [
    {
      id: "ps-h1",
      name: "Chapter Heading (H1)",
      category: "heading",
      fontFamily: "Outfit, sans-serif",
      fontSize: 26,
      fontWeight: 800,
      lineHeight: 1.2,
      letterSpacing: -0.5,
      color: "#0f172a",
    },
    {
      id: "ps-h2",
      name: "Section Title (H2)",
      category: "heading",
      fontFamily: "Outfit, sans-serif",
      fontSize: 18,
      fontWeight: 700,
      lineHeight: 1.25,
      letterSpacing: -0.3,
      color: "#1e293b",
    },
    {
      id: "ps-h3",
      name: "Subheading (H3)",
      category: "heading",
      fontFamily: "Inter, sans-serif",
      fontSize: 13,
      fontWeight: 600,
      lineHeight: 1.3,
      letterSpacing: 0,
      color: "#334155",
    },
    {
      id: "ps-body",
      name: "Editorial Body Text",
      category: "body",
      fontFamily: "Inter, sans-serif",
      fontSize: 10.5,
      fontWeight: 400,
      lineHeight: 1.5,
      letterSpacing: 0.1,
      color: "#1e293b",
    },
    {
      id: "ps-question",
      name: "Question Stem",
      category: "question",
      fontFamily: "Inter, sans-serif",
      fontSize: 10.5,
      fontWeight: 600,
      lineHeight: 1.45,
      letterSpacing: 0,
      color: "#0f172a",
    },
    {
      id: "ps-caption",
      name: "Figure & Photo Caption",
      category: "caption",
      fontFamily: "Inter, sans-serif",
      fontSize: 8.5,
      fontWeight: 500,
      lineHeight: 1.35,
      letterSpacing: 0.2,
      color: "#64748b",
    },
  ],
};

/**
 * Propagate global tokens safely across all linked elements in the entire book
 */
export function propagateGlobalTokensToBook(
  tokens: GlobalDesignTokens,
  book: Book,
  elementsMap: Record<string, PageElement>
): {
  updatedBook: Book;
  updatedElements: Record<string, PageElement>;
  updatedElementsCount: number;
} {
  const updatedElements = { ...elementsMap };
  let count = 0;

  const ownedIds = new Set(book.pages.flatMap(page => page.elementIds));
  ownedIds.forEach((id) => {
    const el = updatedElements[id];
    if (!el || el.metadata?.styleOverride) return; // Respect explicit user overrides

    let hasChange = false;
    const newStyle = { ...el.style };
    const linkedStyle = tokens.paragraphStyles.find(style => style.id === el.style.styleId);
    if (linkedStyle) { Object.assign(newStyle, linkedStyle); hasChange = true; }
    let smartBlockData = el.smartBlockData;
    if (smartBlockData && el.metadata?.tags?.includes('smart-component')) {
      const baseSize = Math.max(10.5, GRADE_SCALES[smartBlockData.gradeBand].bodyPt);
      smartBlockData = { ...smartBlockData, styleOverrides: { ...smartBlockData.styleOverrides, fontFamily: tokens.typography.bodyFont, fontSizeScale: Math.max(1, tokens.typography.scale.body / baseSize), customPalette: { primary: tokens.colors.primary, accent: tokens.colors.accent, surface: tokens.colors.surface, text: tokens.colors.text, border: tokens.colors.border }, cornerRadiusPt: tokens.radius.md, paddingPt: tokens.spacing.md, spacingPt: tokens.spacing.sm, borderWidthPt: tokens.borders.standardPt } };
      newStyle.boxShadow = tokens.shadows.subtle;
      hasChange = true;
    }

    // 1. Text elements: update font family, colors, line heights
    if (el.type === "heading" || el.type === "chapter-title") {
      newStyle.fontFamily = tokens.typography.headingFont;
      newStyle.fontSize = tokens.typography.scale.h1;
      newStyle.lineHeight = tokens.typography.lineHeights.heading;
      newStyle.color = tokens.colors.text;
      hasChange = true;
    } else if (el.type === "subheading" || el.type === "lesson-title") {
      newStyle.fontFamily = tokens.typography.headingFont;
      newStyle.fontSize = tokens.typography.scale.h2;
      newStyle.lineHeight = tokens.typography.lineHeights.heading;
      newStyle.color = tokens.colors.primary;
      hasChange = true;
    } else if (el.type === "body" || el.type === "body-text") {
      newStyle.fontFamily = tokens.typography.bodyFont;
      newStyle.fontSize = tokens.typography.scale.body;
      newStyle.color = tokens.colors.text;
      newStyle.lineHeight = tokens.typography.lineHeights.body;
      hasChange = true;
    } else if (el.type === "caption") {
      newStyle.fontFamily = tokens.typography.bodyFont;
      newStyle.fontSize = tokens.typography.scale.caption;
      newStyle.color = tokens.colors.textMuted;
      hasChange = true;
    }

    // 2. Boxes & Cards: update border colors and border radius
    if (el.style?.borderRadius !== undefined && el.style.borderRadius > 0 && el.style.borderRadius < 100) {
      newStyle.borderRadius = tokens.radius.md;
      hasChange = true;
    }
    if (el.style?.borderColor !== undefined) {
      newStyle.borderColor = tokens.colors.border;
      if (el.style.borderWidth) newStyle.borderWidth = tokens.borders.standardPt;
      hasChange = true;
    }

    if (el.style.boxShadow !== undefined) { newStyle.boxShadow = tokens.shadows.subtle; hasChange = true; }
    if (linkedStyle) Object.assign(newStyle, linkedStyle);

    if (hasChange) {
      updatedElements[id] = {
        ...el,
        style: newStyle,
        smartBlockData,
        ...(smartBlockData && el.metadata?.tags?.includes('smart-component') ? { transform: { ...el.transform, height: buildPublicationScene(smartBlockData).height } } : {}),
      };
      count++;
    }
  });

  const updatedBook: Book = {
    ...book,
    globalTokens: structuredClone(tokens),
    textStyles: [...(book.textStyles || []).filter(style => !tokens.paragraphStyles.some(tokenStyle => tokenStyle.id === style.id)), ...structuredClone(tokens.paragraphStyles)],
  };

  return {
    updatedBook,
    updatedElements,
    updatedElementsCount: count,
  };
}
