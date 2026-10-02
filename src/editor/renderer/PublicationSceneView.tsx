"use client";
import React, { memo, useEffect, useId, useState } from "react";
import { imageFilter, imageMaskPath } from "../educational/imageTreatment";
import { imagePlacement } from "../educational/publicationScene";
import type { PublicationScene, SceneNode } from "../educational/publicationScene";

function shape(n: SceneNode, i: number, uid: string) {
  if (n.kind === "rect") return <rect key={i} x={n.x} y={n.y} width={n.w} height={n.h} rx={n.radius} fill={n.gradientId ? `url(#${uid}-grad-${n.gradientId})` : n.fill} stroke={n.stroke} strokeWidth={n.strokeWidth} opacity={n.opacity} />;
  if (n.kind === "ellipse") return <ellipse key={i} cx={n.x} cy={n.y} rx={n.rx} ry={n.ry} fill={n.fill} stroke={n.stroke} strokeWidth={n.strokeWidth} opacity={n.opacity} />;
  if (n.kind === "line") return <line key={i} x1={n.x} y1={n.y} x2={n.x2} y2={n.y2} stroke={n.stroke} strokeWidth={n.strokeWidth} opacity={n.opacity} />;
  if (n.kind === "polygon") return <polygon key={i} points={n.points.map(p => p.join(",")).join(" ")} fill={n.fill} stroke={n.stroke} strokeWidth={n.strokeWidth} opacity={n.opacity} />;
  if (n.kind === "path") return <path key={i} d={n.d} fill={n.fill} stroke={n.stroke} strokeWidth={n.strokeWidth} opacity={n.opacity} />;
  if (n.kind === "text") return <text key={i} x={n.x} y={n.y} fontSize={n.size} fill={n.fill} fontWeight={n.bold ? 700 : 400} fontStyle={n.italic ? "italic" : undefined} textDecoration={[n.underline ? "underline" : "", n.strike ? "line-through" : ""].filter(Boolean).join(" ") || undefined} textLength={n.textLength} lengthAdjust={n.textLength !== undefined ? "spacingAndGlyphs" : undefined} letterSpacing={n.letterSpacing} textAnchor={n.align === "middle" ? "middle" : n.align === "end" ? "end" : "start"} fontFamily={n.fontFamily || (n.font === "serif" ? "Times New Roman, serif" : "Arial, Helvetica, sans-serif")}>{n.text}</text>;
  if (n.kind === "image") {
    const frame = imagePlacement(n);
    const mask = imageMaskPath(n, n.w, n.h);
    return <g key={i} opacity={n.opacity}><defs><clipPath id={`${uid}-img-${i}`}>{mask ? <path d={mask} transform={`translate(${n.x} ${n.y})`}/> : <rect x={n.x} y={n.y} width={n.w} height={n.h} rx={n.mask === "rounded" ? n.radius || 16 : n.radius || 0}/>}</clipPath></defs><g clipPath={`url(#${uid}-img-${i})`}><g transform={`translate(${n.x+n.w/2} ${n.y+n.h/2}) scale(${n.flipX?-1:1} ${n.flipY?-1:1}) translate(${-n.x-n.w/2} ${-n.y-n.h/2})`}><image href={n.src} x={frame.x} y={frame.y} width={frame.w} height={frame.h} preserveAspectRatio="none" style={{filter:imageFilter(n)}} /></g></g></g>;
  }
  return null;
}

export const PublicationSceneView = memo(function PublicationSceneView({ scene, label = "Educational layout", viewBox, wrapNode, overflow = "hidden", preserveAspectRatio = "xMidYMid meet" }: { scene: PublicationScene; label?: string; viewBox?: string; overflow?: "hidden" | "visible"; preserveAspectRatio?: string; wrapNode?: (painted: React.ReactNode, node: SceneNode, index: number) => React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const id = useId().replace(/:/g, "");
  const gradients = scene.nodes.filter(n => n.kind === "gradient");
  const clips = scene.nodes.filter(n => n.kind === "clip");
  return <svg suppressHydrationWarning xmlns="http://www.w3.org/2000/svg" role={wrapNode ? "group" : "img"} aria-label={label} viewBox={viewBox || `0 0 ${scene.width} ${scene.height}`} preserveAspectRatio={preserveAspectRatio} width="100%" height="100%" style={{ display: "block", overflow }}>
    <title>{label}</title>
    {mounted && (
      <>
        <defs>
          {gradients.map(g => g.kind === "gradient" ? <linearGradient key={g.id} id={`${id}-grad-${g.id}`} x1={g.x1} y1={g.y1} x2={g.x2} y2={g.y2} gradientUnits="userSpaceOnUse"><stop offset="0%" stopColor={g.from} /><stop offset="100%" stopColor={g.to} /></linearGradient> : null)}
          {clips.map(c => c.kind === "clip" ? <clipPath key={c.id} id={`${id}-clip-${c.id}`}><rect x={c.x} y={c.y} width={c.w} height={c.h} rx={c.radius} /></clipPath> : null)}
        </defs>
        {scene.nodes.map((n, i) => {
          const painted = shape(n, i, id);
          if (!painted) return null;
          const clipped = n.kind !== "gradient" && n.kind !== "clip" && n.clipId ? <g key={i} clipPath={`url(#${id}-clip-${n.clipId})`}>{painted}</g> : painted;
          return wrapNode ? <React.Fragment key={i}>{wrapNode(clipped, n, i)}</React.Fragment> : clipped;
        })}
      </>
    )}
  </svg>;
});
