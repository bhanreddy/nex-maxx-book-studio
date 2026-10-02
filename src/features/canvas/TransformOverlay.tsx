"use client";

import { elementTree } from "../../editor/core/elementGroups";
import React, { useState, useRef } from "react";
import { PageElement } from "../../domain/element/types";
import { PageDimensions, Margins, Bleed } from "../../domain/book/types";
import {
  Rect,
  getBoundingBox,
  getTransformHandles,
  calculateResize,
  HandleType,
  radToDeg,
} from "../../editor/core/geometry";
import { computeSnapping, SnapGuideLine, SpacingIndicator } from "../../editor/core/snapping";
import { useEditorStore } from "../../editor/stores/editorStore";
import { useUiStore } from "../../editor/stores/uiStore";
import { useLayoutPartnerStore } from "../../editor/layoutPartner/layoutPartnerStore";
import { detectMagneticDropZone } from "../../editor/layoutPartner/partnerEngine";
import { wrapsText } from "../../editor/layoutPartner/textWrapLayout";
import { MotifOverlay } from "./MotifOverlay";
import { stageName } from "../../editor/curriculum/frameworkPlan";
import { CURRICULUM_BLOCK_MAP } from "../../editor/curriculum/catalog";
import { setFrameworkMode } from "../../editor/curriculum/actions";
import { Move, Unlink2 } from "lucide-react";

/** Coalesce high-frequency mouse events and flush the final position before undo commits. */
function frameMouseMoves(apply: (event: MouseEvent) => void) {
  let pending: MouseEvent | null = null;
  let scheduled = 0;
  const flush = () => {
    if (scheduled) cancelAnimationFrame(scheduled);
    scheduled = 0;
    const event = pending;
    pending = null;
    if (event) apply(event);
  };
  return { flush, move: (event: MouseEvent) => {
    pending = event;
    if (!scheduled) scheduled = requestAnimationFrame(flush);
  } };
}

interface TransformOverlayProps {
  selectedElements: PageElement[];
  allPageElements: PageElement[];
  pageDimensions: PageDimensions;
  margins: Margins;
  bleed: Bleed;
  zoom: number;
}

export const TransformOverlay: React.FC<TransformOverlayProps> = ({
  selectedElements,
  allPageElements,
  pageDimensions,
  margins,
  bleed,
  zoom,
}) => {
  const updateElementTransform = useEditorStore((s) => s.updateElementTransform);
  const duplicateSelectedElementsWithOffset = useEditorStore((s) => s.duplicateSelectedElementsWithOffset);
  const detachEducationalBlock = useEditorStore((s) => s.detachEducationalBlock);
  const snapEnabled = useUiStore((s) => s.snapEnabled);
  const cropElementId = useUiStore((s) => s.cropElementId);
  const setCropElementId = useUiStore((s) => s.setCropElementId);
  const editingTextElementId = useUiStore((s) => s.editingTextElementId);
  const setEditingTextElementId = useUiStore((s) => s.setEditingTextElementId);

  const [isDragging, setIsDragging] = useState(false);
  const [, setActiveHandle] = useState<HandleType | null>(null);
  const [activeGuides, setActiveGuides] = useState<SnapGuideLine[]>([]);
  const [activeSpacing, setActiveSpacing] = useState<SpacingIndicator[]>([]);

  // The workspace owns keyboard duplication; a second listener would duplicate twice.

  // Drag tracking refs
  const dragStartRef = useRef<{
    startX: number;
    startY: number;
    initialRects: { id: string; rect: Rect; rotation: number }[];
    combinedBoundingBox: Rect;
  }>({
    startX: 0,
    startY: 0,
    initialRects: [],
    combinedBoundingBox: { x: 0, y: 0, width: 0, height: 0 },
  });

  if (selectedElements.length === 0 || selectedElements.every(el => el.locked) || (selectedElements.length === 1 && (selectedElements[0].id === cropElementId || selectedElements[0].id === editingTextElementId))) return null;

  const rects: Rect[] = selectedElements.map((el) => ({
    x: el.transform.x,
    y: el.transform.y,
    width: el.transform.width,
    height: el.transform.height,
  }));

  const boundingBox = getBoundingBox(rects);
  const singleElement = selectedElements.length === 1 ? selectedElements[0] : null;
  const rotation = singleElement ? singleElement.transform.rotation : 0;
  const handles = getTransformHandles(boundingBox, rotation);
  const curriculumMeta = singleElement?.smartBlockData?.curriculum;
  const curriculumName = curriculumMeta ? (CURRICULUM_BLOCK_MAP[curriculumMeta.type]?.name || singleElement?.displayName) : singleElement?.displayName;

  // Other elements for snapping calculations
  const otherRects: Rect[] = allPageElements
    .filter((el) => !selectedElements.some((s) => s.id === el.id))
    .map((el) => ({
      x: el.transform.x,
      y: el.transform.y,
      width: el.transform.width,
      height: el.transform.height,
    }));

  // Handle Box Drag (Move)
  const handleBoxMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Left click only
    e.stopPropagation();

    // Alt / Option Drag to Duplicate (Directive 42)
    if (e.altKey) {
      duplicateSelectedElementsWithOffset({ dx: 0, dy: 0 });
    }

    if (curriculumMeta?.chapterId) {
      const activeBook = useEditorStore.getState().getActiveBook();
      const ch = activeBook?.chapters.find(c => c.id === curriculumMeta.chapterId);
      if (ch?.framework?.mode === "easy") {
        setFrameworkMode(curriculumMeta.chapterId, "design");
      }
    }
    selectedElements.forEach(el => {
      if (el.smartBlockData?.isLockedDesign) {
        useEditorStore.getState().updateElement(el.id, {
          smartBlockData: { ...el.smartBlockData, isLockedDesign: false }
        });
      }
    });

    const before = elementTree(selectedElements.map(el => el.id), useEditorStore.getState().elements);
    setIsDragging(true);
    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialRects: selectedElements.map((el) => ({
        id: el.id,
        rect: {
          x: el.transform.x,
          y: el.transform.y,
          width: el.transform.width,
          height: el.transform.height,
        },
        rotation: el.transform.rotation,
      })),
      combinedBoundingBox: boundingBox,
    };

    const applyMouseMove = (moveEvent: MouseEvent) => {
      const deltaScreenX = moveEvent.clientX - dragStartRef.current.startX;
      const deltaScreenY = moveEvent.clientY - dragStartRef.current.startY;

      const deltaPtX = deltaScreenX * 0.75 / zoom;
      const deltaPtY = deltaScreenY * 0.75 / zoom;

      const rawMovingRect: Rect = {
        x: dragStartRef.current.combinedBoundingBox.x + deltaPtX,
        y: dragStartRef.current.combinedBoundingBox.y + deltaPtY,
        width: dragStartRef.current.combinedBoundingBox.width,
        height: dragStartRef.current.combinedBoundingBox.height,
      };

      // Compute snapping
      const snapResult = computeSnapping(
        rawMovingRect,
        otherRects,
        pageDimensions,
        margins,
        bleed,
        {
          thresholdPt: 5 / zoom, disabled: !snapEnabled || moveEvent.altKey,
          userGuides: useUiStore.getState().userGuides,
          columnGrid: useUiStore.getState().columnGrid.enabled ? {
            columns: useEditorStore.getState().getActiveBook()?.masterPages.find(master => master.id === useEditorStore.getState().getActivePage()?.masterPageId)?.gridColumns || useUiStore.getState().columnGrid.columns,
            gutterPt: useUiStore.getState().columnGrid.gutterPt,
          } : undefined,
          baselineGridPt: useUiStore.getState().baselineGrid.enabled ? useUiStore.getState().baselineGrid.stepPt : undefined,
        }
      );

      setActiveGuides(snapResult.guides);
      setActiveSpacing(snapResult.spacingIndicators || []);

      const effectiveDeltaX = snapResult.x - dragStartRef.current.combinedBoundingBox.x;
      const effectiveDeltaY = snapResult.y - dragStartRef.current.combinedBoundingBox.y;

      // Partner Magnetic Drop Zone detection (Part 8)
      const partnerStore = useLayoutPartnerStore.getState();
      if (partnerStore.partnerMode !== "manual" && !selectedElements.some(wrapsText)) {
        const detectedZone = detectMagneticDropZone(
          rawMovingRect.x,
          rawMovingRect.y,
          rawMovingRect.width,
          rawMovingRect.height,
          pageDimensions,
          margins,
          36
        );
        partnerStore.setHoveredDropZone(detectedZone);
      }

      dragStartRef.current.initialRects.forEach(({ id, rect }) => {
        updateElementTransform(
          id,
          {
            x: Math.round((rect.x + effectiveDeltaX) * 10) / 10,
            y: Math.round((rect.y + effectiveDeltaY) * 10) / 10,
          },
          false
        );
      });
    };

    const moves = frameMouseMoves(applyMouseMove);
    const handleMouseMove = moves.move;
    const handleMouseUp = () => {
      moves.flush();
      setIsDragging(false);
      setActiveGuides([]);
      setActiveSpacing([]);

      // Magnetic Drop Zone Snapping (Part 8)
      const partnerStore = useLayoutPartnerStore.getState();
      const dropZone = partnerStore.hoveredDropZone;
      const wrappingObject = selectedElements.some(wrapsText);
      if (dropZone && !wrappingObject && partnerStore.partnerMode !== "manual" && selectedElements.length === 1 && !selectedElements[0].smartBlockData && selectedElements[0].category !== "decorative") {
        const singleEl=useEditorStore.getState().elements[selectedElements[0].id];
        updateElementTransform(singleEl.id,{x:dropZone.bounds.x,y:dropZone.bounds.y,width:dropZone.bounds.width,height:Math.min(singleEl.transform.height,dropZone.bounds.height)},false);
      }
      useEditorStore.getState().commitTransformGesture(before);

      partnerStore.setHoveredDropZone(null);
      if (partnerStore.partnerMode === "auto") {
        partnerStore.refreshHealthReport();
      }

      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  // Handle Resize & Rotate
  const handleHandleMouseDown = (handle: HandleType, e: React.MouseEvent) => {
    if (e.button !== 0) return;
    e.stopPropagation();

    setActiveHandle(handle);

    if (curriculumMeta?.chapterId) {
      const activeBook = useEditorStore.getState().getActiveBook();
      const ch = activeBook?.chapters.find(c => c.id === curriculumMeta.chapterId);
      if (ch?.framework?.mode === "easy") {
        setFrameworkMode(curriculumMeta.chapterId, "design");
      }
    }
    selectedElements.forEach(el => {
      if (el.smartBlockData?.isLockedDesign) {
        useEditorStore.getState().updateElement(el.id, {
          smartBlockData: { ...el.smartBlockData, isLockedDesign: false }
        });
      }
    });

    const before = elementTree(selectedElements.map(el => el.id), useEditorStore.getState().elements);
    const artboard = document.getElementById("page-artboard")?.getBoundingClientRect();
    const startX = e.clientX;
    const startY = e.clientY;
    const initialRect = { ...boundingBox };
    const centerPt = {
      x: initialRect.x + initialRect.width / 2,
      y: initialRect.y + initialRect.height / 2,
    };

    const applyMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = (moveEvent.clientX - startX) * .75 / zoom;
      const deltaY = (moveEvent.clientY - startY) * .75 / zoom;

      if (handle === "rot" && singleElement) {
        // Rotation calculation
        const elementScreenCenterX = (artboard?.left || 0) + centerPt.x * zoom / .75;
        const elementScreenCenterY = (artboard?.top || 0) + centerPt.y * zoom / .75;
        const rad = Math.atan2(
          moveEvent.clientY - elementScreenCenterY,
          moveEvent.clientX - elementScreenCenterX
        );
        let deg = Math.round(radToDeg(rad) + 90);
        if (deg < 0) deg += 360;
        if (deg >= 360) deg -= 360;

        // Snap to 45 deg intervals if Shift is held
        if (moveEvent.shiftKey) {
          deg = Math.round(deg / 45) * 45;
        }

        updateElementTransform(singleElement.id, { rotation: deg }, false);
      } else if (singleElement) {
        // Standard Resize
        const lockAspect = moveEvent.shiftKey || singleElement.type === "image";
        const newRect = calculateResize(initialRect, handle, deltaX, deltaY, lockAspect);

        updateElementTransform(
          singleElement.id,
          {
            x: Math.round(newRect.x * 10) / 10,
            y: Math.round(newRect.y * 10) / 10,
            width: Math.round(newRect.width * 10) / 10,
            height: Math.round(newRect.height * 10) / 10,
          },
          false
        );
      }
    };

    const moves = frameMouseMoves(applyMouseMove);
    const handleMouseMove = moves.move;
    const handleMouseUp = () => {
      moves.flush();
      setActiveHandle(null);
      useEditorStore.getState().commitTransformGesture(before);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  return (
    <>
      {/* Smart Alignment Guide Lines */}
      {activeGuides.map((guide, idx) => {
        if (guide.type === "vertical") {
          return (
            <div
              key={idx}
              className="absolute pointer-events-none z-50 border-l border-fuchsia-500"
              style={{
                left: `${guide.positionPt}pt`,
                top: `${guide.startPt}pt`,
                height: `${guide.endPt - guide.startPt}pt`,
              }}
            >
              {guide.label && (
                <span className="absolute top-2 left-1 bg-fuchsia-600 text-white text-[7pt] px-1 py-0.5 rounded font-mono shadow-sm">
                  {guide.label}
                </span>
              )}
            </div>
          );
        } else {
          return (
            <div
              key={idx}
              className="absolute pointer-events-none z-50 border-t border-fuchsia-500"
              style={{
                top: `${guide.positionPt}pt`,
                left: `${guide.startPt}pt`,
                width: `${guide.endPt - guide.startPt}pt`,
              }}
            >
              {guide.label && (
                <span className="absolute -top-4 left-2 bg-fuchsia-600 text-white text-[7pt] px-1 py-0.5 rounded font-mono shadow-sm">
                  {guide.label}
                </span>
              )}
            </div>
          );
        }
      })}

      {/* Smart Equal Spacing Indicators (Directive 43) */}
      {activeSpacing.map((sp, idx) => (
        <div
          key={`spacing-${idx}`}
          className="absolute pointer-events-none z-50 flex items-center justify-center"
          style={
            sp.type === "vertical"
              ? {
                  left: `${sp.crossAxisPt - 25}pt`,
                  top: `${sp.startPt}pt`,
                  width: `50pt`,
                  height: `${sp.endPt - sp.startPt}pt`,
                }
              : {
                  left: `${sp.startPt}pt`,
                  top: `${sp.crossAxisPt - 12}pt`,
                  width: `${sp.endPt - sp.startPt}pt`,
                  height: `24pt`,
                }
          }
        >
          <div
            className={`absolute bg-fuchsia-400/80 ${
              sp.type === "vertical" ? "w-[1px] h-full" : "h-[1px] w-full"
            }`}
          />
          <span className="relative z-10 bg-fuchsia-600 text-white text-[7pt] font-mono font-medium px-1.5 py-0.5 rounded-full shadow-md">
            {sp.label}
          </span>
        </div>
      ))}

      {/* Main Selection Bounding Box */}
      <div
        className={`absolute border-2 z-40 transition-none ${curriculumMeta ? "border-[#d7c49c]" : "border-indigo-500/90"} ${(singleElement?.type === "smart-block" || Boolean(curriculumMeta)) ? "pointer-events-none" : "pointer-events-auto"}`}
        style={{
          left: `${boundingBox.x}pt`,
          top: `${boundingBox.y}pt`,
          width: `${boundingBox.width}pt`,
          height: `${boundingBox.height}pt`,
          transform: rotation ? `rotate(${rotation}deg)` : undefined,
          cursor: isDragging ? "grabbing" : "move",
        }}
        onDoubleClick={e => {
          if (singleElement?.type === "image") { e.stopPropagation(); setCropElementId(singleElement.id); }
          else if (singleElement && ["body", "heading", "subheading", "caption", "quote", "chapter-title", "lesson-title"].includes(singleElement.type)) { e.stopPropagation(); setEditingTextElementId(singleElement.id); }
        }}
        onMouseDown={(singleElement?.type === "smart-block" || Boolean(curriculumMeta)) ? undefined : handleBoxMouseDown}
      >
        {curriculumMeta?.type === "lesson-schema" && <button type="button" aria-label="Move lesson schema" className="absolute -top-7 right-0 pointer-events-auto rounded bg-slate-900 px-2 py-1 text-[8pt] text-white cursor-move" onMouseDown={handleBoxMouseDown}>Move schema</button>}
        {(singleElement?.type === "smart-block" || Boolean(curriculumMeta)) && (
          <>
            {/* Dedicated Top Move & Unlock Header Bar */}
            <div
              className="absolute -top-9 left-0 pointer-events-auto flex items-center gap-2 bg-slate-950/95 text-amber-200 border border-amber-500/40 text-[7.5pt] font-sans px-2.5 py-1 rounded-lg shadow-xl select-none z-50 backdrop-blur-md"
            >
              <div
                className="flex items-center gap-1.5 cursor-grab active:cursor-grabbing hover:text-amber-300 font-bold"
                onMouseDown={handleBoxMouseDown}
                title="Click and drag to move block anywhere on the page"
              >
                <Move className="w-3.5 h-3.5 text-amber-400" />
                <span>Move {curriculumName || singleElement?.displayName || "Block"}</span>
              </div>
              <div className="h-3 w-px bg-amber-500/30" />
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (singleElement) detachEducationalBlock(singleElement.id);
                }}
                className="flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 hover:text-white border border-amber-400/40 hover:border-amber-400 text-[7pt] font-medium transition-all"
                title="Detach into independent movable text and image layers"
              >
                <Unlink2 className="w-3 h-3 text-amber-300" />
                <span>Make Text & Images Movable</span>
              </button>
            </div>
            {/* Edge Drag Hit Areas (8pt border perimeter) */}
            <div className="absolute -top-2 left-0 right-0 h-4 pointer-events-auto cursor-move" onMouseDown={handleBoxMouseDown} title="Drag border to move block" />
            <div className="absolute -bottom-2 left-0 right-0 h-4 pointer-events-auto cursor-move" onMouseDown={handleBoxMouseDown} title="Drag border to move block" />
            <div className="absolute top-0 bottom-0 -left-2 w-4 pointer-events-auto cursor-move" onMouseDown={handleBoxMouseDown} title="Drag border to move block" />
            <div className="absolute top-0 bottom-0 -right-2 w-4 pointer-events-auto cursor-move" onMouseDown={handleBoxMouseDown} title="Drag border to move block" />
          </>
        )}
        {Boolean(singleElement?.smartBlockData) && <MotifOverlay element={singleElement!} zoom={zoom} />}
        {curriculumMeta && (
          <div
            className="studio-selection-label pointer-events-auto cursor-move select-none"
            onMouseDown={handleBoxMouseDown}
            title="Drag here to move the block on page"
          >
            {curriculumName} · {stageName(curriculumMeta.frameworkStage, curriculumMeta.type)}
            <small>Drag to move. Corners resize.</small>
          </div>
        )}
        {/* Dimensions Tag */}
        <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-[7pt] font-mono px-1.5 py-0.5 rounded shadow pointer-events-none whitespace-nowrap">
          {Math.round(boundingBox.width)} × {Math.round(boundingBox.height)} pt
          {rotation ? ` (${rotation}°)` : ""}
        </div>

        {/* 8 Resize Handles + 1 Rotation Handle (Directive 41: Large hit target, crisp visual handle) */}
        {handles.map((h) => {
          if (h.type === "rot") {
            return (
              <div
                key={h.type}
                className="absolute w-5 h-5 flex items-center justify-center cursor-grab hover:scale-110 transition-transform"
                style={{
                  left: "50%",
                  top: "-20pt",
                  transform: "translate(-50%, -50%)",
                  pointerEvents: "auto",
                }}
                onMouseDown={(e) => handleHandleMouseDown("rot", e)}
                aria-label="Rotate selected block"
                title="Rotate (Shift snaps to 45°)"
              >
                <div className="w-3.5 h-3.5 bg-white border-2 border-indigo-600 rounded-full shadow" />
              </div>
            );
          }

          // Positioning relative to box
          let posStyle: React.CSSProperties = {};
          if (h.type === "nw") posStyle = { top: 0, left: 0, transform: "translate(-50%, -50%)" };
          if (h.type === "n") posStyle = { top: 0, left: "50%", transform: "translate(-50%, -50%)" };
          if (h.type === "ne") posStyle = { top: 0, right: 0, transform: "translate(50%, -50%)" };
          if (h.type === "e") posStyle = { top: "50%", right: 0, transform: "translate(50%, -50%)" };
          if (h.type === "se") posStyle = { bottom: 0, right: 0, transform: "translate(50%, 50%)" };
          if (h.type === "s") posStyle = { bottom: 0, left: "50%", transform: "translate(-50%, 50%)" };
          if (h.type === "sw") posStyle = { bottom: 0, left: 0, transform: "translate(-50%, 50%)" };
          if (h.type === "w") posStyle = { top: "50%", left: 0, transform: "translate(-50%, -50%)" };

          return (
            <div
              key={h.type}
              className="absolute w-7 h-7 flex items-center justify-center group"
              aria-label={`Resize from ${h.type}`}
              style={{
                ...posStyle,
                cursor: h.cursor,
                pointerEvents: "auto",
              }}
              onMouseDown={(e) => handleHandleMouseDown(h.type, e)}
            >
              <div className={`studio-handle-dot ${curriculumMeta ? "is-curriculum" : ""} group-hover:scale-125 transition-transform`} />
            </div>
          );
        })}
      </div>
    </>
  );
};
