"use client";

import React, { useState, useRef, useEffect } from "react";
import { CurveNode } from "../../domain/creative/types";
import { useEditorStore } from "../../editor/stores/editorStore";
import { useUiStore } from "../../editor/stores/uiStore";
import { curveNodesToSvgPath } from "../../editor/vector/bezier";

interface VectorPenOverlayProps {
  zoom: number;
}

export const VectorPenOverlay: React.FC<VectorPenOverlayProps> = ({
  zoom,
}) => {
  const { addVectorCurve } = useEditorStore();
  const { activeTool, setActiveTool } = useUiStore();

  const [currentNodes, setCurrentNodes] = useState<CurveNode[]>([]);
  const [pointerPos, setPointerPos] = useState<{ x: number; y: number } | null>(null);
  const [isPencilDrawing, setIsPencilDrawing] = useState(false);
  const pencilPointsRef = useRef<{ x: number; y: number }[]>([]);

  const isPenTool = activeTool === "pen";
  const isPencilTool = activeTool === "pencil";

  const getArtboardCoords = (e: React.PointerEvent<HTMLDivElement>) => {
    const artboard = document.getElementById("page-artboard");
    if (!artboard) return { x: 0, y: 0 };
    const rect = artboard.getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoom;
    const y = (e.clientY - rect.top) / zoom;
    return { x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 };
  };

  // Listen for Enter or Esc key to finish pen curve
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter" && currentNodes.length >= 2) {
        addVectorCurve(currentNodes, false, currentNodes[0].x, currentNodes[0].y);
        setCurrentNodes([]);
        setActiveTool("node");
      } else if (e.key === "Escape") {
        setCurrentNodes([]);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentNodes, addVectorCurve, setActiveTool]);

  // PEN TOOL: Click to place nodes
  const handlePenPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    e.stopPropagation();

    const coords = getArtboardCoords(e);

    // If clicking near first node, close path and commit!
    if (currentNodes.length > 2) {
      const first = currentNodes[0];
      const dist = Math.hypot(coords.x - first.x, coords.y - first.y);
      if (dist < 12) {
        // Calculate offset relative to first node
        const minX = Math.min(...currentNodes.map((n) => n.x));
        const minY = Math.min(...currentNodes.map((n) => n.y));
        const normalizedNodes = currentNodes.map((n) => ({
          ...n,
          x: n.x - minX,
          y: n.y - minY,
        }));
        addVectorCurve(normalizedNodes, true, minX, minY);
        setCurrentNodes([]);
        setActiveTool("node");
        return;
      }
    }

    const newNode: CurveNode = {
      id: `pen-node-${Date.now()}-${currentNodes.length}`,
      x: coords.x,
      y: coords.y,
      type: "sharp",
    };

    setCurrentNodes([...currentNodes, newNode]);
  };

  // PENCIL TOOL: Freehand drag
  const handlePencilPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    e.stopPropagation();

    const coords = getArtboardCoords(e);
    pencilPointsRef.current = [coords];
    setIsPencilDrawing(true);

    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const coords = getArtboardCoords(e);
    setPointerPos(coords);

    if (isPencilDrawing) {
      pencilPointsRef.current.push(coords);
    }
  };

  const handlePencilPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isPencilDrawing) return;
    setIsPencilDrawing(false);

    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // fallback
    }

    const rawPoints = pencilPointsRef.current;
    if (rawPoints.length < 3) return;

    // Downsample points every 4th point for smooth Bézier representation
    const sampled: { x: number; y: number }[] = [];
    for (let i = 0; i < rawPoints.length; i += 4) {
      sampled.push(rawPoints[i]);
    }
    if (sampled[sampled.length - 1] !== rawPoints[rawPoints.length - 1]) {
      sampled.push(rawPoints[rawPoints.length - 1]);
    }

    const minX = Math.min(...sampled.map((p) => p.x));
    const minY = Math.min(...sampled.map((p) => p.y));

    // Convert to smooth CurveNodes
    const nodes: CurveNode[] = sampled.map((p, idx) => {
      const prev = sampled[Math.max(0, idx - 1)];
      const next = sampled[Math.min(sampled.length - 1, idx + 1)];
      const hx = (next.x - prev.x) * 0.25;
      const hy = (next.y - prev.y) * 0.25;

      return {
        id: `pencil-node-${idx}`,
        x: p.x - minX,
        y: p.y - minY,
        type: "smooth",
        handleIn: { x: -hx, y: -hy },
        handleOut: { x: hx, y: hy },
      };
    });

    addVectorCurve(nodes, false, minX, minY);
    pencilPointsRef.current = [];
    setActiveTool("node");
  };

  if (!isPenTool && !isPencilTool) return null;

  return (
    <div
      className="absolute inset-0 pointer-events-auto cursor-crosshair z-40"
      onPointerDown={isPenTool ? handlePenPointerDown : handlePencilPointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={isPencilTool ? handlePencilPointerUp : undefined}
    >
      <svg className="w-full h-full pointer-events-none overflow-visible">
        {/* PEN TOOL: In-progress path */}
        {isPenTool && currentNodes.length > 0 && (
          <g>
            <path
              d={curveNodesToSvgPath(currentNodes, false)}
              fill="none"
              stroke="#e11d48"
              strokeWidth={2 / zoom}
              strokeDasharray="4,2"
            />

            {/* Rubber-band line to pointer */}
            {pointerPos && (
              <line
                x1={currentNodes[currentNodes.length - 1].x}
                y1={currentNodes[currentNodes.length - 1].y}
                x2={pointerPos.x}
                y2={pointerPos.y}
                stroke="#f43f5e"
                strokeWidth={1.5 / zoom}
                strokeDasharray="3,3"
              />
            )}

            {/* Render Nodes */}
            {currentNodes.map((n, idx) => (
              <circle
                key={n.id}
                cx={n.x}
                cy={n.y}
                r={(idx === 0 ? 5 : 4) / zoom}
                fill={idx === 0 ? "#22c55e" : "#e11d48"}
                stroke="#ffffff"
                strokeWidth={1.5 / zoom}
              />
            ))}
          </g>
        )}

        {/* PENCIL TOOL: Freehand preview */}
        {isPencilDrawing && pencilPointsRef.current.length > 1 && (
          <path
            d={`M ${pencilPointsRef.current.map((p) => `${p.x} ${p.y}`).join(" L ")}`}
            fill="none"
            stroke="#0284c7"
            strokeWidth={2 / zoom}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
      </svg>

      {/* Pen Hint Tooltip */}
      {isPenTool && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-slate-900/90 text-white border border-white/10 px-3 py-1 rounded text-[8pt] font-mono shadow-lg flex items-center gap-2 pointer-events-none">
          <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
          <span>
            {currentNodes.length === 0
              ? "Click to start path"
              : `Click to add node (${currentNodes.length} placed). Click first node or press Enter to close.`}
          </span>
        </div>
      )}
    </div>
  );
};
