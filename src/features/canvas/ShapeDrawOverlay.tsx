"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { useEditorStore } from "../../editor/stores/editorStore";
import { useUiStore } from "../../editor/stores/uiStore";
import { generateShapeSvgPath } from "../../editor/vector/shapeGeometry";

interface ShapeDrawOverlayProps {
  artboardElementId: string;
  pageId: string;
  zoom: number;
  pageWidthPt: number;
  pageHeightPt: number;
}

export const ShapeDrawOverlay: React.FC<ShapeDrawOverlayProps> = ({
  artboardElementId,
  pageId,
  zoom,
  pageWidthPt,
  pageHeightPt,
}) => {
  const { addVectorShape } = useEditorStore();
  const { activeShapeType, setActiveTool, showToast } = useUiStore();

  const [isDrawing, setIsDrawing] = useState(false);
  const [startPt, setStartPt] = useState<{ x: number; y: number } | null>(null);
  const [currentPt, setCurrentPt] = useState<{ x: number; y: number } | null>(null);
  const [shiftKey, setShiftKey] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Helper to convert screen coordinates to page pt coordinates
  const getPointFromEvent = useCallback(
    (e: React.PointerEvent<HTMLDivElement> | PointerEvent) => {
      const artboard = document.getElementById(artboardElementId);
      if (!artboard) return { x: 50, y: 50 };
      const rect = artboard.getBoundingClientRect();
      const screenX = e.clientX - rect.left;
      const screenY = e.clientY - rect.top;
      // In CSS, 1pt = 1.333333px, so 1px = 0.75pt. Scaled by zoom:
      const ptX = Math.round(((screenX * 0.75) / zoom) * 10) / 10;
      const ptY = Math.round(((screenY * 0.75) / zoom) * 10) / 10;
      return {
        x: Math.max(0, Math.min(pageWidthPt, ptX)),
        y: Math.max(0, Math.min(pageHeightPt, ptY)),
      };
    },
    [artboardElementId, zoom, pageWidthPt, pageHeightPt]
  );

  // Listen to keyboard Escape to cancel drawing
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsDrawing(false);
        setStartPt(null);
        setCurrentPt(null);
        setActiveTool("move");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [setActiveTool]);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();

    try {
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    } catch {}

    const pt = getPointFromEvent(e);
    setStartPt(pt);
    setCurrentPt(pt);
    setShiftKey(e.shiftKey);
    setIsDrawing(true);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDrawing || !startPt) return;
    e.preventDefault();
    e.stopPropagation();

    const pt = getPointFromEvent(e);
    setCurrentPt(pt);
    setShiftKey(e.shiftKey);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDrawing || !startPt) return;
    e.preventDefault();
    e.stopPropagation();

    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}

    const endPt = getPointFromEvent(e);
    const rawW = Math.abs(endPt.x - startPt.x);
    const rawH = Math.abs(endPt.y - startPt.y);

    // If click without drag (distance < 8pt):
    if (rawW < 8 && rawH < 8) {
      // 1. Check if user clicked on an existing element on the page
      const store = useEditorStore.getState();
      const existingElements = Object.values(store.elements)
        .filter((el) => el.pageId === pageId && !el.hidden && !el.locked)
        .sort((a, b) => (b.transform.zIndex || 0) - (a.transform.zIndex || 0));

      const clickedEl = existingElements.find((el) => {
        return (
          startPt.x >= el.transform.x &&
          startPt.x <= el.transform.x + el.transform.width &&
          startPt.y >= el.transform.y &&
          startPt.y <= el.transform.y + el.transform.height
        );
      });

      if (clickedEl) {
        // User clicked an existing element! Select it and switch to move tool!
        store.selectElement(clickedEl.id);
        setIsDrawing(false);
        setStartPt(null);
        setCurrentPt(null);
        setActiveTool("move");
        return;
      }

      // 2. Otherwise create a default-sized shape at click location
      const isSquareLike = [
        "circle",
        "square",
        "star",
        "polygon",
        "cross",
        "plus",
      ].includes(activeShapeType);
      const defaultW = isSquareLike ? 100 : 140;
      const defaultH = isSquareLike ? 100 : 90;
      const posX = Math.max(10, Math.round(startPt.x - defaultW / 2));
      const posY = Math.max(10, Math.round(startPt.y - defaultH / 2));

      addVectorShape(activeShapeType, posX, posY, defaultW, defaultH, pageId);
      showToast({
        type: "success",
        title: `Created ${activeShapeType}`,
        message: `${defaultW} × ${defaultH} pt shape placed on worksheet`,
      });
    } else {
      // User dragged out a shape bounding box!
      let finalW = rawW;
      let finalH = rawH;

      if (e.shiftKey) {
        const side = Math.max(finalW, finalH);
        finalW = side;
        finalH = side;
      }

      const finalX = endPt.x < startPt.x ? startPt.x - finalW : startPt.x;
      const finalY = endPt.y < startPt.y ? startPt.y - finalH : startPt.y;

      const clampedX = Math.round(Math.max(0, finalX));
      const clampedY = Math.round(Math.max(0, finalY));
      const clampedW = Math.round(Math.max(10, finalW));
      const clampedH = Math.round(Math.max(10, finalH));

      addVectorShape(activeShapeType, clampedX, clampedY, clampedW, clampedH, pageId);
      showToast({
        type: "success",
        title: `Drawn ${activeShapeType}`,
        message: `${clampedW} × ${clampedH} pt shape drawn on worksheet`,
      });
    }

    setIsDrawing(false);
    setStartPt(null);
    setCurrentPt(null);
    setActiveTool("move");
  };

  // Calculate live preview dimensions
  let previewX = 0;
  let previewY = 0;
  let previewW = 0;
  let previewH = 0;

  if (isDrawing && startPt && currentPt) {
    let w = Math.abs(currentPt.x - startPt.x);
    let h = Math.abs(currentPt.y - startPt.y);

    if (shiftKey) {
      const maxSide = Math.max(w, h);
      w = maxSide;
      h = maxSide;
    }

    previewW = Math.max(2, w);
    previewH = Math.max(2, h);
    previewX = currentPt.x < startPt.x ? startPt.x - previewW : startPt.x;
    previewY = currentPt.y < startPt.y ? startPt.y - previewH : startPt.y;
  }

  const previewPath =
    previewW > 2 && previewH > 2
      ? generateShapeSvgPath(activeShapeType, previewW, previewH)
      : "";

  return (
    <div
      ref={overlayRef}
      data-shape-draw-overlay="true"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      className="absolute inset-0 z-50 cursor-crosshair pointer-events-auto select-none overflow-visible"
      title={`Click and drag to draw a ${activeShapeType} on the worksheet. Hold Shift for 1:1 ratio.`}
    >
      {/* Floating Instructions Banner at top of page */}
      <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-slate-900/90 text-white text-[9.5pt] px-3 py-1 rounded-full shadow-lg border border-white/20 backdrop-blur-sm pointer-events-none flex items-center gap-2 z-50">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <span>
          Draw <strong>{activeShapeType}</strong>: Click & drag on page
        </span>
        <span className="text-[8pt] text-slate-300 bg-white/10 px-1.5 py-0.5 rounded font-mono">
          Shift: 1:1 Ratio
        </span>
        <span className="text-[8pt] text-slate-300 bg-white/10 px-1.5 py-0.5 rounded font-mono">
          Esc: Cancel
        </span>
      </div>

      {/* Live Drawing SVG Preview */}
      {isDrawing && previewW > 2 && previewH > 2 && (
        <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible z-50">
          <defs>
            <linearGradient id="shapeDrawGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#6366f1" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#a855f7" stopOpacity="0.15" />
            </linearGradient>
          </defs>

          {/* Alignment guide lines */}
          <line
            x1={`${previewX}pt`}
            y1="0"
            x2={`${previewX}pt`}
            y2={`${pageHeightPt}pt`}
            stroke="#6366f1"
            strokeWidth="0.8"
            strokeDasharray="3,3"
            opacity="0.4"
          />
          <line
            x1={`${previewX + previewW}pt`}
            y1="0"
            x2={`${previewX + previewW}pt`}
            y2={`${pageHeightPt}pt`}
            stroke="#6366f1"
            strokeWidth="0.8"
            strokeDasharray="3,3"
            opacity="0.4"
          />
          <line
            x1="0"
            y1={`${previewY}pt`}
            x2={`${pageWidthPt}pt`}
            y2={`${previewY}pt`}
            stroke="#6366f1"
            strokeWidth="0.8"
            strokeDasharray="3,3"
            opacity="0.4"
          />
          <line
            x1="0"
            y1={`${previewY + previewH}pt`}
            x2={`${pageWidthPt}pt`}
            y2={`${previewY + previewH}pt`}
            stroke="#6366f1"
            strokeWidth="0.8"
            strokeDasharray="3,3"
            opacity="0.4"
          />

          {/* Drawn Shape Outline & Fill */}
          <g transform={`translate(${previewX}, ${previewY})`}>
            <path
              d={previewPath}
              fill="url(#shapeDrawGrad)"
              stroke="#4f46e5"
              strokeWidth="2"
              strokeDasharray="5,3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>

          {/* Corner anchor handles */}
          <circle cx={`${previewX}pt`} cy={`${previewY}pt`} r="3" fill="#4f46e5" />
          <circle cx={`${previewX + previewW}pt`} cy={`${previewY}pt`} r="3" fill="#4f46e5" />
          <circle cx={`${previewX}pt`} cy={`${previewY + previewH}pt`} r="3" fill="#4f46e5" />
          <circle cx={`${previewX + previewW}pt`} cy={`${previewY + previewH}pt`} r="3" fill="#4f46e5" />

          {/* Dimension Badge Tooltip */}
          <g transform={`translate(${previewX + previewW / 2}, ${previewY + previewH + 14})`}>
            <rect
              x="-42"
              y="-10"
              width="84"
              height="18"
              rx="4"
              fill="#1e1b4b"
              fillOpacity="0.9"
              stroke="#6366f1"
              strokeWidth="1"
            />
            <text
              x="0"
              y="2.5"
              fill="#ffffff"
              fontSize="8pt"
              fontFamily="monospace"
              fontWeight="bold"
              textAnchor="middle"
            >
              {Math.round(previewW)} × {Math.round(previewH)} pt
            </text>
          </g>
        </svg>
      )}
    </div>
  );
};
