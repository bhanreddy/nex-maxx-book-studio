import {
  DesignBorder,
  DesignColorTokens,
  DesignRole,
} from "../../domain/element/types";

export interface LayoutNode {
  op: string;
  align?: string;
  fill?: string;
  mods: string[];
  widthPct?: number;
  children: LayoutNode[];
}

export function parseLayout(source: string): LayoutNode {
  let i = 0;
  const node = parseNode();
  skip();
  if (i < source.length) {
    throw new Error(`Unexpected "${source.slice(i)}" in layout ${source}`);
  }
  return node;

  function parseNode(): LayoutNode {
    skip();
    const op = readIdent();
    const node: LayoutNode = { op, mods: [], children: [] };
    while (i < source.length) {
      const sigil = source[i];
      if (sigil !== "@" && sigil !== ":" && sigil !== "#" && sigil !== "~") break;
      i += 1;
      const value = readIdent();
      if (sigil === "@") node.align = value;
      else if (sigil === "#") node.fill = value;
      else if (sigil === "~") node.widthPct = Number(value);
      else node.mods.push(value);
    }
    skip();
    if (source[i] === "{") {
      i += 1;
      while (i < source.length && source[i] !== "}") {
        skip();
        if (source[i] === "}") break;
        node.children.push(parseNode());
        skip();
        if (source[i] === ",") i += 1;
      }
      if (source[i] !== "}") throw new Error(`Unclosed brace in ${source}`);
      i += 1;
    }
    return node;
  }

  function readIdent(): string {
    const start = i;
    while (i < source.length && /[a-zA-Z0-9.+-]/.test(source[i])) i += 1;
    if (start === i) throw new Error(`Expected token at ${i} in ${source}`);
    return source.slice(start, i);
  }

  function skip(): void {
    while (source[i] === " ") i += 1;
  }
}

export interface FrameColors {
  color: string;
  background: string;
  borderColor: string;
  borderWidth: number;
  fontFamily: string;
  textAlign: "left" | "center" | "right";
}

const CARD_ROLES: DesignRole[] = ["learning", "practice", "table", "figure", "quote"];

export function frameFromLayout(
  layout: string,
  tokens: DesignColorTokens,
  role: DesignRole,
  border: DesignBorder
): FrameColors {
  let fill: string | undefined;
  let align: string | undefined;
  try {
    const root = parseLayout(layout);
    fill = root.fill;
    align = root.align;
  } catch {
    fill = undefined;
  }

  let background = "transparent";
  let color = tokens.text;
  let borderColor = tokens.border;

  if (fill === "accent") {
    background = tokens.accent;
    color = tokens.onAccent;
    borderColor = tokens.accent;
  } else if (fill === "tint") {
    background = tokens.accentTint;
    color = tokens.text;
  } else if (fill === "surface") {
    background = tokens.surface;
    color = tokens.text;
  } else if (fill === "paper") {
    background = tokens.paper;
    color = tokens.text;
  } else if (fill === "callout") {
    background = tokens.calloutSurface;
    color = tokens.calloutText;
    borderColor = tokens.calloutBorder;
  } else if (CARD_ROLES.includes(role) && role !== "quote") {
    background = tokens.surface;
  } else if (tokens.mode === "dark") {
    background = tokens.paper;
    color = tokens.text;
  }

  let borderWidth = 0;
  const filled = background !== "transparent";
  if (border === "standard") borderWidth = filled || CARD_ROLES.includes(role) ? 0.9 : 0;
  else if (border === "hairline" && (fill === "callout" || fill === "surface" || fill === "tint" || CARD_ROLES.includes(role))) {
    borderWidth = 0.7;
  }

  const textAlign = align === "center" ? "center" : align === "right" ? "right" : "left";
  const fontFamily =
    role === "body" || role === "table" || role === "practice" ? tokens.bodyFont : tokens.headingFont;

  return { color, background, borderColor, borderWidth, fontFamily, textAlign };
}
