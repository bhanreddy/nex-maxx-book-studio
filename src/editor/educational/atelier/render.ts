import type { BlockMotif, SmartBlockInstance } from "../../../domain/educational/blockSchema";
import { GRADE_SCALES } from "../../../domain/educational/designTokens";
import { contrastRatio, toGrayHex } from "../../design/contrast";
import type { ArtworkKind, PublicationPalette, PublicationScene, SceneNode } from "../publicationScene";
import { ATELIER_BLOCKS, ATELIER_SKINS } from "./catalog";
import { SIGNATURE_LAYOUTS, signatureLayout } from "./skins/signature";
import type { Box, SkinContext } from "./draw";

export interface AtelierHelpers {
  wrapText: SkinContext["wrap"];
  textWidth: SkinContext["measure"];
  artworkNodes: (kind: ArtworkKind, x: number, y: number, w: number, h: number, p: PublicationPalette, opacity?: number) => SceneNode[];
  resolvePublicationPalette: (block: SmartBlockInstance) => PublicationPalette;
}

function scaledBox(motif: BlockMotif, width: number, reflow = false): Box {
  if (motif.nudged || !motif.originWidth) return { x: motif.x, y: motif.y, w: motif.w, h: motif.h };
  const scale = width / motif.originWidth;
  return { x: motif.x * scale, y: reflow ? motif.y : motif.y * scale, w: motif.w * scale, h: reflow ? motif.h : motif.h * scale };
}

export function renderAtelier(block: SmartBlockInstance, helpers: AtelierHelpers, options: { teacher?: boolean } = {}): PublicationScene | null {
  const def = ATELIER_BLOCKS[block.presetId];
  const skin = def?.skinId ? ATELIER_SKINS[def.skinId] : undefined;
  if (!def || !skin) return null;
  const palette = helpers.resolvePublicationPalette(block);
  const width = Math.max(180, block.transform.width);
  const grayscale = block.styleOverrides.printMode === "grayscale";
  const quiet = block.styleOverrides.printMode === "reduced-ink";
  const ink = (color: string) => {
    const source = grayscale ? toGrayHex(color) : color;
    return source;
  };
  const onFill = (fill: string) => contrastRatio("#FFFFFF", fill) >= 4.5 ? "#FFFFFF" : ink(palette.text);
  const frames: SkinContext["frames"] = [];
  const ctx: SkinContext = {
    block, palette, width,
    size: Math.max(10.5, GRADE_SCALES[block.gradeBand]?.bodyPt || 12) * Math.max(1, block.styleOverrides.fontSizeScale || 1),
    serif: block.family === "nex-editorial",
    teacher: Boolean(options.teacher),
    nodes: [],
    warnings: [],
    frames,
    ink, onFill,
    wrap: helpers.wrapText,
    measure: helpers.textWidth,
    artwork: (kind, x, y, w, h, p, opacity) => helpers.artworkNodes(kind as ArtworkKind, x, y, w, h, p, opacity),
    box: (id, fallback, role, kind = "ornament") => {
      const found = (block.styleOverrides.motifs || []).find(motif => motif.id === id);
      const resolved = found?.nudged
        ? { x: found.x, y: found.y, w: found.w || fallback.w, h: found.h || fallback.h }
        : found ? scaledBox(found, width) : fallback;
      frames.push({ id, role, kind: found?.kind || kind, x: resolved.x, y: resolved.y, w: resolved.w, h: resolved.h, locked: found?.locked });
      return resolved;
    },
  };
  const selectedLayout = SIGNATURE_LAYOUTS.find(layout => layout.id === block.styleOverrides.layoutVariant);
  const composed = selectedLayout ? signatureLayout(ctx, selectedLayout.id) : skin.compose(ctx);
  const plateNodes: SceneNode[] = [];
  const frontNodes: SceneNode[] = [];
  if (!quiet) {
    for (const motif of block.styleOverrides.motifs || []) {
      if (motif.role !== "plate" && motif.role !== "photo" && motif.role !== "illustration") continue;
      if (frames.some(frame => frame.id === motif.id)) continue;
      const box = scaledBox(motif, width, block.styleOverrides.responsiveResize);
      frames.push({ id: motif.id, role: motif.role, kind: motif.kind, x: box.x, y: box.y, w: box.w, h: box.h, locked: motif.locked });
      const bucket = motif.behind === false ? frontNodes : plateNodes;
      if (motif.role === "photo" && motif.src) {
        bucket.push({ kind: "image", x: box.x, y: box.y, w: box.w, h: box.h, src: motif.src, alt: motif.alt || "Background plate", focalX: motif.focalX ?? .5, focalY: motif.focalY ?? .5, scale: motif.scale ?? 1, sourceWidth: motif.rawWidthPx, sourceHeight: motif.rawHeightPx, opacity: motif.opacity, fit: motif.fit, flipX: motif.flipX, flipY: motif.flipY, radius: motif.radius, brightness: motif.brightness, contrast: motif.contrast, saturation: motif.saturation, mask: motif.mask, customMaskPath: motif.customMaskPath, motifId: motif.id });
        bucket.push({ kind: "rect", x: box.x, y: box.y, w: box.w, h: box.h, fill: ink(palette.surface), radius: 8, opacity: motif.behind === false ? 0 : .9, motifId: motif.id });
      } else if (motif.kind !== "paper") {
        helpers.artworkNodes(motif.kind as ArtworkKind, box.x, box.y, box.w, box.h, palette, motif.opacity).forEach(node => { if (node.kind !== "gradient" && node.kind !== "clip") bucket.push({ ...node, motifId: motif.id }); });
      }
    }
  }
  if(block.styleOverrides.illustration&&block.styleOverrides.illustration!=="none"&&!quiet)plateNodes.push(...helpers.artworkNodes(block.styleOverrides.illustration,width-110,18,90,60,palette,.12));
  const height = Math.max(composed.height, ...frames.map(frame => frame.y + frame.h + 12), 72);
  const groundNode = ctx.nodes[0];
  if (groundNode?.kind === "rect" && block.styleOverrides.cornerRadiusPt !== undefined) groundNode.radius = block.styleOverrides.cornerRadiusPt;
  const background = block.styleOverrides.backgroundImage;
  if (background?.src && !quiet) {
    plateNodes.unshift({kind:"image",x:0,y:0,w:width,h:height,src:background.src,alt:background.alt,focalX:background.focalX,focalY:background.focalY,scale:background.scale,sourceWidth:background.rawWidthPx,sourceHeight:background.rawHeightPx,opacity:background.opacity});
    plateNodes.splice(1,0,{kind:"rect",x:12,y:12,w:width-24,h:height-24,fill:ink(palette.surface),radius:8,opacity:.94});
  }
  const spec=block.styleOverrides.backgroundSpec;
  if(groundNode?.kind==="rect"&&spec?.type==="gradient"&&spec.gradient&&!quiet){
    groundNode.gradientId="atelier-ground";
    plateNodes.unshift({kind:"gradient",id:"atelier-ground",x1:0,y1:0,x2:width,y2:height,from:ink(spec.gradient.from),to:ink(spec.gradient.to)});
  }
  if(spec?.patternOverlay&&spec.patternOverlay!=="none"&&!quiet){
    if(spec.patternOverlay==="dots"){
      for(let x=10;x<width;x+=24)for(let y=10;y<height;y+=24)plateNodes.push({kind:"ellipse",x,y,rx:.6,ry:.6,fill:ink(palette.primary),opacity:.09});
    }else{
      for(let y=12;y<height;y+=24){if(spec.patternOverlay==="waves")plateNodes.push({kind:"path",d:`M 0 ${y} Q ${width/2} ${y-14} ${width} ${y}`,fill:"none",stroke:ink(palette.primary),strokeWidth:.5,opacity:.07});else plateNodes.push({kind:"line",x:0,y,x2:width,y2:spec.patternOverlay==="isometric"?y+width*.2:y,stroke:ink(palette.primary),strokeWidth:.5,opacity:.07});}
      if(spec.patternOverlay==="grid")for(let x=12;x<width;x+=24)plateNodes.push({kind:"line",x,y:0,x2:x,y2:height,stroke:ink(palette.primary),strokeWidth:.5,opacity:.07});
    }
  }
  const rest = ctx.nodes.slice(groundNode?.kind === "rect" ? 1 : 0);
  const nodes = groundNode ? [groundNode, ...plateNodes, ...rest, ...frontNodes] : [...plateNodes, ...ctx.nodes, ...frontNodes];
  if (groundNode?.kind === "rect") groundNode.h = height;
  const title = block.semanticContent.title;
  const rendered = nodes.filter(node => node.kind === "text").map(node => node.kind === "text" ? node.text : "").join(" ");
  if (title && !rendered.includes(title)) nodes.push({ kind: "text", x: 16, y: 28, text: title, size: 16, fill: ink(palette.primary), bold: true });
  return { width, height, nodes, variant: skin.id, warnings: ctx.warnings, motifs: frames };
}
