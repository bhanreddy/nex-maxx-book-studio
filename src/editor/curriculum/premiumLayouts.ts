import type { CurriculumLayout, PremiumBlockLayout } from "../../domain/educational/curriculum";
import type { SmartBlockInstance } from "../../domain/educational/blockSchema";
import { PREMIUM_BLOCK_TOKENS } from "../../domain/educational/designTokens";
import type { PublicationScene, SceneNode } from "../educational/publicationScene";

export const PREMIUM_BLOCK_LAYOUTS: PremiumBlockLayout[] = ["premium-editorial", "premium-clay", "premium-studio"];
export function isPremiumBlockLayout(layout: string | undefined): layout is PremiumBlockLayout {
  return PREMIUM_BLOCK_LAYOUTS.includes(layout as PremiumBlockLayout);
}

/** New treatments appear immediately; every original design remains in the cycle. */
export function premiumShuffleOrder(layouts: CurriculumLayout[]): CurriculumLayout[] {
  const original = layouts.filter(layout => !isPremiumBlockLayout(layout));
  const premium = layouts.filter(isPremiumBlockLayout);
  return [...original.slice(0, 1), ...premium, ...original.slice(1)];
}

export function premiumLayoutOverrides(current: SmartBlockInstance["styleOverrides"], nextLayout: string | undefined) {
  return {
    premiumBaseLayout: isPremiumBlockLayout(nextLayout)
      ? (isPremiumBlockLayout(current.layoutVariant) ? current.premiumBaseLayout : current.layoutVariant) : undefined,
    premiumBaseContentLayout: isPremiumBlockLayout(nextLayout)
      ? (isPremiumBlockLayout(current.layoutVariant) ? current.premiumBaseContentLayout : !!current.contentLayout?.enabled) : undefined,
  };
}

/** Restyle surfaces without reflowing authored words, images, or their stable editing IDs. */
export function renderPremiumTreatment(scene: PublicationScene, variant: PremiumBlockLayout, reducedInk = false,
  overrides: SmartBlockInstance["styleOverrides"]["customPalette"] = {}, accent?: string): PublicationScene {
  const t = { ...PREMIUM_BLOCK_TOKENS[variant], accent: overrides?.primary || accent || PREMIUM_BLOCK_TOKENS[variant].accent,
    ink: overrides?.text || PREMIUM_BLOCK_TOKENS[variant].ink, edge: overrides?.border || PREMIUM_BLOCK_TOKENS[variant].edge };
  const artworkIds = new Set(scene.motifs?.filter(m => ["illustration", "photo", "artwork"].includes(m.role)).map(m => m.id));
  const paper = reducedInk ? "#FFFFFF" : overrides?.surface || t.paper;
  const nodes: SceneNode[] = [{ kind: "rect", x: 0, y: 0, w: scene.width, h: scene.height, fill: paper, radius: t.radius, stroke: t.edge, strokeWidth: t.stroke }];
  const largestText = Math.max(0, ...scene.nodes.filter(n => n.kind === "text").map(n => n.kind === "text" ? n.size : 0));
  let cardIndex = 0;
  for (const node of scene.nodes) {
    if (node.kind === "gradient" || node.kind === "clip" || node.kind === "image" || (node.motifId && artworkIds.has(node.motifId))) {
      nodes.push(node); continue;
    }
    if (node.kind === "text") {
      // Keep the original type metrics: changing font families would change line widths.
      nodes.push({ ...node, fill: node.size < largestText && node.size <= 10 ? t.muted : t.ink });
    } else if (node.kind === "rect") {
      if (node.x <= 1 && node.y <= 1 && node.w >= scene.width - 2 && node.h >= scene.height - 2) continue;
      const card = node.w > 60 && node.h > 26 && node.fill !== "none";
      if (card && variant === "premium-clay" && !reducedInk) {
        nodes.push({ ...node, x: node.x + 1.5, y: node.y + 2, gradientId: undefined, fill: t.shadow,
          radius: Math.min(t.radius, node.h / 2), stroke: undefined, opacity: .6 });
      }
      nodes.push({ ...node, gradientId: undefined, fill: node.fill === "none" ? "none" : card ? (reducedInk ? paper : t.card) : node.h < 8 || node.w < 8 ? t.accent : t.card,
        radius: Math.min(t.radius, node.h / 2), stroke: card ? t.edge : undefined, strokeWidth: t.stroke });
      if (card) {
        if (variant === "premium-editorial") nodes.push({ kind: "line", x: node.x + 10, y: node.y + 3, x2: node.x + node.w - 10, y2: node.y + 3, stroke: t.accent, strokeWidth: .65 });
        if (variant === "premium-clay") nodes.push({ kind: "line", x: node.x + 12, y: node.y + 2, x2: node.x + node.w - 12, y2: node.y + 2, stroke: "#FFFFFF", strokeWidth: 1.2, opacity: .85 });
        if (variant === "premium-studio") nodes.push({ kind: "rect", x: node.x, y: node.y + 8, w: 2.5, h: Math.max(1, node.h - 16), fill: cardIndex++ % 2 ? t.ink : t.accent, radius: 1 });
      }
    } else if (node.kind === "line") {
      nodes.push({ ...node, stroke: t.edge, strokeWidth: Math.min(node.strokeWidth || .8, 1.2) });
    } else if (node.kind === "ellipse") {
      nodes.push({ ...node, fill: node.fill === "none" ? "none" : t.card, stroke: t.accent, strokeWidth: .7 });
    } else if (node.kind === "path" || node.kind === "polygon") {
      nodes.push({ ...node, fill: node.fill === "none" ? "none" : t.card, stroke: node.stroke ? t.accent : undefined });
    }
  }
  if (variant === "premium-editorial") {
    nodes.push({ kind: "line", x: 14, y: scene.height - 7, x2: scene.width - 14, y2: scene.height - 7, stroke: t.accent, strokeWidth: .65 });
  } else if (variant === "premium-studio") {
    nodes.push({ kind: "rect", x: 0, y: 12, w: 3, h: Math.max(1, scene.height - 24), fill: t.accent, radius: 1.5 });
  }
  return { ...scene, variant, nodes };
}
