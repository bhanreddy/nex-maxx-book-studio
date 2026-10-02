import {
  PageElement,
  ElementTransform,
} from "../../domain/element/types";
import { PageDimensions, Margins } from "../../domain/book/types";
import { TextWrapMode } from "../../domain/creative/types";
import { effectiveTextWrap } from "./textWrapLayout";

/**
 * NEX Layout Partner - Core Layout & Relationship Engine (Parts 1, 3, 4, 6, 7, 8, 10, 11)
 * High-performance deterministic layout intelligence.
 */

export interface ExclusionRegion {
  elementId: string;
  x: number;
  y: number;
  width: number;
  height: number;
  mode: TextWrapMode;
  offsets: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
}

export interface MagneticDropZone {
  id: string;
  label: string;
  category: "hero" | "banner" | "column" | "sidebar" | "feature";
  description?: string;
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface LayoutIntentDirective {
  density?: "compact" | "balanced" | "comfortable" | "low" | "high";
  illustrationPriority?: "low" | "balanced" | "high" | "hero";
  typographyScale?: "standard" | "large" | "extra-large" | "academic" | "editorial";
  cornerRadius?: number;
  themeId?: string;
  gradeSuitability?: string;
  columnCount?: number;
  lineHeight?: number;
  spacingScale?: number;
  paddingScale?: number;
  heroImage?: boolean;
}

export interface LayoutVariation {
  id: string;
  name: string;
  description: string;
  icon: string;
  elementTransforms: Record<string, Partial<ElementTransform>>;
}

/**
 * Part 4: Calculate text wrap exclusion region for an element
 */
export function calculateExclusionRegion(element: PageElement): ExclusionRegion | null {
  const wrap = effectiveTextWrap(element);
  if (!wrap || wrap.mode === "none") return null;

  const baseOffset = wrap.offsetPt ?? wrap.wrapMarginPt ?? 12;
  const top = wrap.topOffsetPt ?? baseOffset;
  const bottom = wrap.bottomOffsetPt ?? baseOffset;
  const left = wrap.leftOffsetPt ?? baseOffset;
  const right = wrap.rightOffsetPt ?? baseOffset;

  return {
    elementId: element.id,
    x: element.transform.x - left,
    y: element.transform.y - top,
    width: element.transform.width + left + right,
    height: element.transform.height + top + bottom,
    mode: wrap.mode,
    offsets: { top, bottom, left, right },
  };
}

/**
 * Part 4: Text wrapping collision and split calculation
 * If an image overlaps a text container, compute adjusted geometry
 */
export function resolveTextWrapping(
  textElement: PageElement,
  wrappingElements: PageElement[]
): {
  adjustedTransform: Partial<ElementTransform>;
  columns?: number;
  columnGap?: number;
  splitRequired?: boolean;
} {
  const textBounds = textElement.transform;

  for (const blocker of wrappingElements) {
    if (blocker.id === textElement.id) continue;
    const region = calculateExclusionRegion(blocker);
    if (!region) continue;

    // Check AABB intersection
    const overlaps =
      textBounds.x < region.x + region.width &&
      textBounds.x + textBounds.width > region.x &&
      textBounds.y < region.y + region.height &&
      textBounds.y + textBounds.height > region.y;

    if (!overlaps) continue;

    // Mode: Top and bottom (push text below blocker)
    if (region.mode === "top-bottom") {
      if (textBounds.y >= blocker.transform.y) {
        // Text is below or at blocker -> shift text downward
        const targetY = region.y + region.height + 8;
        return {
          adjustedTransform: {
            y: targetY,
            height: Math.max(40, textBounds.height - (targetY - textBounds.y)),
          },
        };
      }
    }

    // Mode: Square / Box / Tight on left or right
    if (["box", "square", "tight", "contour"].includes(region.mode)) {
      const blockerCenter = blocker.transform.x + blocker.transform.width / 2;
      const textCenter = textBounds.x + textBounds.width / 2;

      // If blocker is on the left side of text
      if (blockerCenter < textCenter) {
        const newX = region.x + region.width + 8;
        const newWidth = Math.max(120, textBounds.x + textBounds.width - newX);
        return {
          adjustedTransform: {
            x: newX,
            width: newWidth,
          },
        };
      } else {
        // Blocker is on the right side of text
        const newWidth = Math.max(120, region.x - textBounds.x - 8);
        return {
          adjustedTransform: {
            width: newWidth,
          },
        };
      }
    }
  }

  return { adjustedTransform: {} };
}

/**
 * Part 8: Generate Magnetic Drop Zones for a page
 */
export function getMagneticDropZones(
  pageDim: PageDimensions,
  margins: Margins
): MagneticDropZone[] {
  const usableX = margins.insidePt;
  const usableY = margins.topPt;
  const usableW = pageDim.widthPt - (margins.insidePt + margins.outsidePt);
  const usableH = pageDim.heightPt - (margins.topPt + margins.bottomPt);
  const colGap = 16;
  const halfW = (usableW - colGap) / 2;
  const thirdW = (usableW - colGap * 2) / 3;
  const twoThirdsW = thirdW * 2 + colGap;

  return [
    {
      id: "zone-hero",
      label: "Hero Feature (Top 35%)",
      category: "hero",
      description: "High-emphasis hero visual or opener position",
      bounds: {
        x: usableX,
        y: usableY,
        width: usableW,
        height: Math.round(usableH * 0.35),
      },
    },
    {
      id: "zone-top-banner",
      label: "Top Banner",
      category: "banner",
      description: "Full-width header or chapter banner slot",
      bounds: {
        x: 0,
        y: 0,
        width: pageDim.widthPt,
        height: Math.round(usableY + 80),
      },
    },
    {
      id: "zone-half-left",
      label: "Left Column (50%)",
      category: "column",
      description: "Balanced left-half editorial column",
      bounds: {
        x: usableX,
        y: usableY,
        width: halfW,
        height: usableH,
      },
    },
    {
      id: "zone-half-right",
      label: "Right Column (50%)",
      category: "column",
      description: "Balanced right-half editorial column",
      bounds: {
        x: usableX + halfW + colGap,
        y: usableY,
        width: halfW,
        height: usableH,
      },
    },
    {
      id: "zone-one-third-sidebar",
      label: "Left Sidebar (33%)",
      category: "sidebar",
      description: "Secondary sidebar for callouts, notes & vocabulary",
      bounds: {
        x: usableX,
        y: usableY,
        width: thirdW,
        height: usableH,
      },
    },
    {
      id: "zone-two-thirds-main",
      label: "Main Body (66%)",
      category: "column",
      description: "Primary academic article content area",
      bounds: {
        x: usableX + thirdW + colGap,
        y: usableY,
        width: twoThirdsW,
        height: usableH,
      },
    },
    {
      id: "zone-bottom-activity",
      label: "Bottom Activity Zone",
      category: "feature",
      description: "Dedicated workspace for hands-on tasks or questions",
      bounds: {
        x: usableX,
        y: usableY + usableH - 180,
        width: usableW,
        height: 180,
      },
    },
  ];
}

/**
 * Part 8: Detect closest magnetic drop zone during drag
 */
export function detectMagneticDropZone(
  x: number,
  y: number,
  width: number,
  height: number,
  pageDim: PageDimensions,
  margins: Margins,
  thresholdPt: number = 32
): MagneticDropZone | null {
  const zones = getMagneticDropZones(pageDim, margins);
  const centerX = x + width / 2;
  const centerY = y + height / 2;

  let closestZone: MagneticDropZone | null = null;
  let minDistance = thresholdPt;

  for (const zone of zones) {
    const zoneCenterX = zone.bounds.x + zone.bounds.width / 2;
    const zoneCenterY = zone.bounds.y + zone.bounds.height / 2;

    const dx = Math.abs(centerX - zoneCenterX);
    const dy = Math.abs(centerY - zoneCenterY);
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < minDistance) {
      minDistance = dist;
      closestZone = zone;
    }
  }

  return closestZone;
}

/**
 * Part 11: Natural Language Layout Commands Interpreter
 * Converts unstructured natural user intent into structured deterministic directives.
 */
export function interpretNaturalLayoutCommand(
  prompt: string,
  currentGrade?: string
): LayoutIntentDirective {
  const p = prompt.toLowerCase();
  const directive: LayoutIntentDirective = {};

  if (currentGrade && ["grade 1", "grade 2", "early", "kindergarten"].some((g) => currentGrade.toLowerCase().includes(g))) {
    directive.gradeSuitability = "Grade 1";
  }

  // 1. Playful / Early Childhood Intent
  if (p.includes("playful") || p.includes("kindergarten") || p.includes("young") || p.includes("fun")) {
    directive.density = "low";
    directive.illustrationPriority = "high";
    directive.typographyScale = "large";
    directive.cornerRadius = 16;
    directive.themeId = "playful-primary";
    directive.gradeSuitability = "Grade 1";
    directive.lineHeight = 1.6;
    directive.spacingScale = 20;
    return directive;
  }

  // 2. Academic / Scholarly Intent
  if (p.includes("academic") || p.includes("formal") || p.includes("rigorous") || p.includes("scholarly")) {
    directive.density = "high";
    directive.illustrationPriority = "balanced";
    directive.typographyScale = "academic";
    directive.cornerRadius = 4;
    directive.themeId = "academic-blue";
    directive.columnCount = 2;
    directive.lineHeight = 1.4;
    directive.spacingScale = 12;
    return directive;
  }

  // 3. Image / Visual Focus Intent
  if (p.includes("image") || p.includes("illustration") || p.includes("hero") || p.includes("visual")) {
    directive.illustrationPriority = "hero";
    directive.heroImage = true;
    directive.density = "comfortable";
    return directive;
  }

  // 4. Grade 1 / Grade 2 Specific
  if (p.includes("grade 1") || p.includes("grade 2") || p.includes("nursery") || p.includes("early")) {
    directive.gradeSuitability = "Grade 1";
    directive.typographyScale = "extra-large";
    directive.density = "low";
    directive.cornerRadius = 14;
    directive.themeId = "playful-primary";
    return directive;
  }

  // 5. Space Reduction / Compact
  if (p.includes("reduce empty space") || p.includes("compact") || p.includes("tighter") || p.includes("dense")) {
    directive.density = "compact";
    directive.spacingScale = 10;
    directive.paddingScale = 8;
    return directive;
  }

  // 6. Premium / Futuristic Identity
  if (p.includes("premium") || p.includes("futuristic") || p.includes("flagship") || p.includes("high-end")) {
    directive.themeId = "nex-future";
    directive.typographyScale = "editorial";
    directive.cornerRadius = 10;
    directive.density = "balanced";
    return directive;
  }

  // 7. Legibility / Reading Ease
  if (p.includes("read") || p.includes("legib") || p.includes("clear") || p.includes("clean")) {
    directive.typographyScale = "large";
    directive.lineHeight = 1.6;
    directive.density = "comfortable";
    directive.columnCount = 2;
    return directive;
  }

  // Fallback balanced standard
  directive.density = "balanced";
  directive.illustrationPriority = "balanced";
  directive.typographyScale = "standard";
  return directive;
}

/**
 * Part 10: Instant Layout Variations Generator (9 high quality textbook presets)
 * Generates alternative layouts without modifying or losing content.
 */
export function generateLayoutVariations(
  elements: PageElement[],
  pageDim: PageDimensions,
  margins: Margins
): LayoutVariation[] {
  const usableX = margins.insidePt;
  const usableY = margins.topPt;
  const usableW = pageDim.widthPt - (margins.insidePt + margins.outsidePt);
  const usableH = pageDim.heightPt - (margins.topPt + margins.bottomPt);
  const colGap = 16;
  const halfW = (usableW - colGap) / 2;

  // Categorize elements
  const headings = elements.filter((e) =>
    ["heading", "chapter-title", "lesson-title"].includes(e.type)
  );
  const bodies = elements.filter((e) =>
    ["body", "body-text", "subheading", "quote"].includes(e.type)
  );
  const visuals = elements.filter((e) =>
    ["image", "illustration", "diagram", "pictureFrame"].includes(e.type)
  );
  const activities = elements.filter((e) =>
    ["activity", "experiment", "learningObjectives", "learning-objective", "summary"].includes(e.type)
  );
  const assessments = elements.filter((e) =>
    ["question", "mcq", "trueFalse", "fillInBlank", "worksheet", "exercise"].includes(e.type)
  );

  // Helper to build transforms map
  const buildVariation = (
    id: string,
    name: string,
    description: string,
    icon: string,
    layoutFn: () => Record<string, Partial<ElementTransform>>
  ): LayoutVariation => ({
    id,
    name,
    description,
    icon,
    elementTransforms: layoutFn(),
  });

  return [
    // 1. Balanced Academic
    buildVariation(
      "var-balanced",
      "Balanced Academic",
      "Classical textbook spread with header, 2-column text, and anchor activity",
      "⚖️",
      () => {
        const map: Record<string, Partial<ElementTransform>> = {};
        let currentY = usableY;

        headings.forEach((h) => {
          map[h.id] = { x: usableX, y: currentY, width: usableW, height: 44 };
          currentY += 54;
        });

        if (bodies.length > 0) {
          const bodyH = Math.min(260, usableH * 0.4);
          bodies.forEach((b, idx) => {
            const isLeft = idx % 2 === 0;
            map[b.id] = {
              x: isLeft ? usableX : usableX + halfW + colGap,
              y: currentY,
              width: bodies.length === 1 ? usableW : halfW,
              height: bodyH,
            };
          });
          currentY += bodyH + 18;
        }

        if (visuals.length > 0) {
          const visH = 160;
          visuals.forEach((v) => {
            map[v.id] = { x: usableX, y: currentY, width: usableW, height: visH };
          });
          currentY += visH + 16;
        }

        activities.concat(assessments).forEach((a) => {
          map[a.id] = { x: usableX, y: currentY, width: usableW, height: 140 };
          currentY += 152;
        });

        return map;
      }
    ),

    // 2. Hero Visual Focus
    buildVariation(
      "var-hero-visual",
      "Hero Visual",
      "Dominant top feature image with structured narrative flowing below",
      "🖼️",
      () => {
        const map: Record<string, Partial<ElementTransform>> = {};
        let currentY = usableY;

        if (visuals.length > 0) {
          const heroH = Math.round(usableH * 0.38);
          map[visuals[0].id] = { x: usableX, y: currentY, width: usableW, height: heroH };
          currentY += heroH + 16;
        }

        headings.forEach((h) => {
          map[h.id] = { x: usableX, y: currentY, width: usableW, height: 38 };
          currentY += 46;
        });

        bodies.forEach((b) => {
          map[b.id] = { x: usableX, y: currentY, width: usableW, height: 180 };
          currentY += 194;
        });

        activities.forEach((a) => {
          map[a.id] = { x: usableX, y: currentY, width: usableW, height: 120 };
          currentY += 130;
        });

        return map;
      }
    ),

    // 3. Editorial Split Screen
    buildVariation(
      "var-split-screen",
      "Editorial Split",
      "50/50 dual column division with deep reading text left and graphic right",
      "📑",
      () => {
        const map: Record<string, Partial<ElementTransform>> = {};
        let leftY = usableY;
        let rightY = usableY;

        headings.forEach((h) => {
          map[h.id] = { x: usableX, y: leftY, width: halfW, height: 50 };
          leftY += 60;
        });

        bodies.forEach((b) => {
          map[b.id] = { x: usableX, y: leftY, width: halfW, height: 320 };
          leftY += 330;
        });

        visuals.forEach((v) => {
          map[v.id] = { x: usableX + halfW + colGap, y: rightY, width: halfW, height: 220 };
          rightY += 236;
        });

        activities.forEach((a) => {
          map[a.id] = { x: usableX + halfW + colGap, y: rightY, width: halfW, height: 160 };
          rightY += 172;
        });

        return map;
      }
    ),

    // 4. Playful Primary Learning
    buildVariation(
      "var-playful-primary",
      "Playful Primary",
      "Generous spacing, soft card boundaries, high breathing room for early learners",
      "🎈",
      () => {
        const map: Record<string, Partial<ElementTransform>> = {};
        let currentY = usableY + 10;

        headings.forEach((h) => {
          map[h.id] = { x: usableX + 16, y: currentY, width: usableW - 32, height: 48 };
          currentY += 64;
        });

        visuals.forEach((v) => {
          map[v.id] = { x: usableX + 24, y: currentY, width: usableW - 48, height: 200 };
          currentY += 218;
        });

        bodies.forEach((b) => {
          map[b.id] = { x: usableX + 16, y: currentY, width: usableW - 32, height: 160 };
          currentY += 176;
        });

        activities.forEach((a) => {
          map[a.id] = { x: usableX + 16, y: currentY, width: usableW - 32, height: 140 };
        });

        return map;
      }
    ),

    // 5. Minimal Swiss Grid
    buildVariation(
      "var-minimal-swiss",
      "Minimal Swiss",
      "Typographic purity, calibrated margins, and disciplined whitespace",
      "📐",
      () => {
        const map: Record<string, Partial<ElementTransform>> = {};
        let currentY = usableY + 20;

        headings.forEach((h) => {
          map[h.id] = { x: usableX, y: currentY, width: usableW * 0.75, height: 50 };
          currentY += 68;
        });

        bodies.forEach((b) => {
          map[b.id] = { x: usableX, y: currentY, width: usableW * 0.75, height: 260 };
          currentY += 280;
        });

        visuals.forEach((v) => {
          map[v.id] = { x: usableX + usableW * 0.5, y: usableY + 80, width: usableW * 0.5, height: 180 };
        });

        activities.forEach((a) => {
          map[a.id] = { x: usableX, y: currentY, width: usableW, height: 130 };
        });

        return map;
      }
    ),

    // 6. Magazine Showcase
    buildVariation(
      "var-magazine",
      "Magazine Digest",
      "Modern journalistic format with large pull quote and asymmetric layout",
      "📰",
      () => {
        const map: Record<string, Partial<ElementTransform>> = {};
        let currentY = usableY;

        headings.forEach((h) => {
          map[h.id] = { x: usableX, y: currentY, width: usableW, height: 56 };
          currentY += 68;
        });

        if (visuals.length > 0) {
          map[visuals[0].id] = { x: usableX + halfW + colGap, y: currentY, width: halfW, height: 240 };
        }

        bodies.forEach((b) => {
          map[b.id] = { x: usableX, y: currentY, width: halfW, height: 300 };
          currentY += 310;
        });

        activities.forEach((a) => {
          map[a.id] = { x: usableX, y: currentY, width: usableW, height: 140 };
        });

        return map;
      }
    ),

    // 7. Interactive Worksheet
    buildVariation(
      "var-worksheet",
      "Workbook & Assessment",
      "Structured problem solving grid with clear answer and deduction spaces",
      "✏️",
      () => {
        const map: Record<string, Partial<ElementTransform>> = {};
        let currentY = usableY;

        headings.forEach((h) => {
          map[h.id] = { x: usableX, y: currentY, width: usableW, height: 36 };
          currentY += 46;
        });

        assessments.forEach((q) => {
          map[q.id] = { x: usableX, y: currentY, width: usableW, height: 110 };
          currentY += 122;
        });

        activities.forEach((a) => {
          map[a.id] = { x: usableX, y: currentY, width: usableW, height: 130 };
          currentY += 142;
        });

        return map;
      }
    ),
  ];
}
