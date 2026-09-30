"use client";

import React, { useRef, useState } from "react";
import { PageElement } from "../../domain/element/types";
import { useEditorStore } from "../../editor/stores/editorStore";
import { useUiStore } from "../../editor/stores/uiStore";
import { renderBrushPath, renderEraserPath, applyInpaintPatch } from "../../editor/pixel/pixelEngine";

interface PixelBrushOverlayProps {
  activePageId: string;
  selectedElements: PageElement[];
  pageWidthPt: number;
  pageHeightPt: number;
  zoom: number;
}

export const PixelBrushOverlay: React.FC<PixelBrushOverlayProps> = ({
  activePageId,
  selectedElements,
  pageWidthPt,
  pageHeightPt,
  zoom,
}) => {
  const { elements, updateElement, addPixelLayer, selectElement } = useEditorStore();
  const { activeTool, brushSettings } = useUiStore();

  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number } | null>(null);
  const strokePointsRef = useRef<{ x: number; y: number }[]>([]);
  const targetElementRef = useRef<PageElement | null>(null);

  const isPixelTool = ["brush", "eraser", "cloneStamp", "healing"].includes(activeTool);

  // Helper to convert client coordinates to artboard point coordinates
  const getArtboardCoords = (e: React.PointerEvent<HTMLDivElement>) => {
    const artboard = document.getElementById("page-artboard");
    if (!artboard) return { x: 0, y: 0 };
    const rect = artboard.getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoom;
    const y = (e.clientY - rect.top) / zoom;
    return { x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isPixelTool || e.button !== 0) return;
    e.stopPropagation();
    e.preventDefault();

    // 1. Identify or create target pixel layer
    let target = selectedElements.find((el) => el.type === "pixel-layer") || null;
    if (!target) {
      // Find any pixel layer on the page
      const pagePixel = Object.values(elements).find(
        (el) => el.pageId === activePageId && el.type === "pixel-layer"
      );
      if (pagePixel) {
        target = pagePixel;
        selectElement(target.id);
      } else {
        // Automatically create a canvas-sized pixel layer
        target = addPixelLayer(0, 0, pageWidthPt, pageHeightPt);
      }
    }

    if (!target) return;
    targetElementRef.current = target;

    const coords = getArtboardCoords(e);
    // Relative to target element
    const relX = coords.x - target.transform.x;
    const relY = coords.y - target.transform.y;

    strokePointsRef.current = [{ x: relX, y: relY }];
    setIsDrawing(true);

    // Initial dab on preview canvas
    const pCanvas = previewCanvasRef.current;
    if (pCanvas) {
      const pCtx = pCanvas.getContext("2d");
      if (pCtx) {
        pCtx.clearRect(0, 0, pCanvas.width, pCanvas.height);
        if (activeTool === "brush") {
          renderBrushPath(pCtx, strokePointsRef.current, {
            size: brushSettings.size,
            hardness: brushSettings.hardness,
            opacity: brushSettings.opacity,
            color: brushSettings.color,
            flow: brushSettings.flow,
          });
        } else if (activeTool === "eraser") {
          renderEraserPath(pCtx, strokePointsRef.current, {
            size: brushSettings.size,
            hardness: brushSettings.hardness,
          });
        }
      }
    }

    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const coords = getArtboardCoords(e);
    setCursorPos(coords);

    if (!isDrawing || !targetElementRef.current) return;
    e.stopPropagation();

    const target = targetElementRef.current;
    const relX = coords.x - target.transform.x;
    const relY = coords.y - target.transform.y;

    strokePointsRef.current.push({ x: relX, y: relY });

    const pCanvas = previewCanvasRef.current;
    if (pCanvas) {
      const pCtx = pCanvas.getContext("2d");
      if (pCtx) {
        if (activeTool === "brush") {
          renderBrushPath(pCtx, strokePointsRef.current, {
            size: brushSettings.size,
            hardness: brushSettings.hardness,
            opacity: brushSettings.opacity,
            color: brushSettings.color,
            flow: brushSettings.flow,
          });
        } else if (activeTool === "eraser") {
          renderEraserPath(pCtx, strokePointsRef.current, {
            size: brushSettings.size,
            hardness: brushSettings.hardness,
          });
        }
      }
    }
  };

  const handlePointerUp = async (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDrawing || !targetElementRef.current) return;
    setIsDrawing(false);

    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // fallback
    }

    const target = targetElementRef.current;
    const pCanvas = previewCanvasRef.current;
    if (!pCanvas || strokePointsRef.current.length === 0) return;

    // Create offscreen composite canvas
    const offscreen = document.createElement("canvas");
    offscreen.width = Math.round(target.transform.width);
    offscreen.height = Math.round(target.transform.height);
    const oCtx = offscreen.getContext("2d");
    if (!oCtx) return;

    // If target has existing bitmap, draw it first
    if (target.pixelData?.dataUrl) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      await new Promise<void>((resolve) => {
        img.onload = () => {
          oCtx.drawImage(img, 0, 0, offscreen.width, offscreen.height);
          resolve();
        };
        img.onerror = () => resolve();
        img.src = target.pixelData!.dataUrl;
      });
    }

    if (activeTool === "brush") {
      renderBrushPath(oCtx, strokePointsRef.current, {
        size: brushSettings.size,
        hardness: brushSettings.hardness,
        opacity: brushSettings.opacity,
        color: brushSettings.color,
        flow: brushSettings.flow,
      });
    } else if (activeTool === "eraser") {
      renderEraserPath(oCtx, strokePointsRef.current, {
        size: brushSettings.size,
        hardness: brushSettings.hardness,
      });
    } else if (activeTool === "healing") {
      // Inpainting / healing patch over stroke bounding area
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      strokePointsRef.current.forEach((pt) => {
        minX = Math.min(minX, pt.x);
        minY = Math.min(minY, pt.y);
        maxX = Math.max(maxX, pt.x);
        maxY = Math.max(maxY, pt.y);
      });
      const box = {
        x: Math.max(0, minX - 10),
        y: Math.max(0, minY - 10),
        width: Math.min(offscreen.width, maxX - minX + 20),
        height: Math.min(offscreen.height, maxY - minY + 20),
      };
      applyInpaintPatch(offscreen, box, { dx: 30, dy: 0 }, 10);
    }

    const newDataUrl = offscreen.toDataURL("image/png");

    // Commit to pixel layer
    updateElement(target.id, {
      pixelData: {
        ...target.pixelData,
        dataUrl: newDataUrl,
        widthPx: offscreen.width,
        heightPx: offscreen.height,
      },
    });

    // Clear preview canvas
    const pCtx = pCanvas.getContext("2d");
    if (pCtx) {
      pCtx.clearRect(0, 0, pCanvas.width, pCanvas.height);
    }

    strokePointsRef.current = [];
    targetElementRef.current = null;
  };

  const handlePointerLeave = () => {
    setCursorPos(null);
  };

  if (!isPixelTool) return null;

  return (
    <div
      className="absolute inset-0 pointer-events-auto cursor-crosshair z-40"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerLeave}
    >
      {/* Dynamic Stroke Preview Canvas */}
      <canvas
        ref={previewCanvasRef}
        width={pageWidthPt}
        height={pageHeightPt}
        className="w-full h-full pointer-events-none absolute inset-0"
      />

      {/* Floating Brush Ring Cursor */}
      {cursorPos && (
        <div
          className="absolute rounded-full border border-sky-400/80 pointer-events-none -translate-x-1/2 -translate-y-1/2 shadow-sm"
          style={{
            left: `${cursorPos.x}pt`,
            top: `${cursorPos.y}pt`,
            width: `${brushSettings.size}pt`,
            height: `${brushSettings.size}pt`,
            backgroundColor:
              activeTool === "brush" ? `${brushSettings.color}22` : "rgba(255,255,255,0.15)",
          }}
        />
      )}
    </div>
  );
};
