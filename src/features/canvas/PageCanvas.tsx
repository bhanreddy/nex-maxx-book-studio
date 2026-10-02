"use client";

import { PageFrameView } from "../../editor/renderer/PageFrameView";
import { PublisherFooterView } from "../../editor/renderer/PublisherFooterView";
import { pageFrameFor, frameMargins, pageMarginsFor } from "../../editor/pageFrame/pageFrame";
import type { ArtworkKind } from "../../editor/educational/publicationScene";
import { readPublicationImage } from "../educational/PublicationInspector";
import { insertCurriculumBlock } from "../../editor/curriculum/actions";
import type { CurriculumGrade, CurriculumLayout } from "../../domain/educational/curriculum";
import React, { useRef, useState, useEffect } from "react";
import { useEditorStore } from "../../editor/stores/editorStore";
import { useUiStore } from "../../editor/stores/uiStore";
import { ElementRenderer } from "../../editor/renderer/ElementRenderer";
import { TransformOverlay } from "./TransformOverlay";
import { SmartQuickActionBar } from "./SmartQuickActionBar";
import { EmptyPageAssistant } from "./EmptyPageAssistant";
import { NodeToolOverlay } from "./NodeToolOverlay";
import { PixelBrushOverlay } from "./PixelBrushOverlay";
import { VectorPenOverlay } from "./VectorPenOverlay";
import { PageDefinition, Book } from "../../domain/book/types";
import { ptToMm } from "../../editor/core/coordinates";
import { useLayoutPartnerStore } from "../../editor/layoutPartner/layoutPartnerStore";
import { CanvasContextMenu, ContextMenuState } from "../ui/CanvasContextMenu";
import { handleUniversalPaste, handleFileDropOnCanvas } from "../../editor/clipboard/universalClipboard";
import { effectiveTextWrap } from "../../editor/layoutPartner/textWrapLayout";

interface PageCanvasProps {
  book: Book;
  activePage: PageDefinition;
}

export const PageCanvas: React.FC<PageCanvasProps> = ({ book, activePage }) => {
  const {
    elements,
    selectedElementIds,
    selectElement,
    clearSelection,
    getActivePageElements,
    addElement,
    addEducationalBlock,
    addVectorShape,
    addTextFrame,
    addTableElement,
    autoArrangeActivePage,
    applyPagePreset,
  } = useEditorStore();

  const {
    hoveredDropZone,
    previewTransforms,
    applyPreviewTransforms,
    cancelPreviewTransforms,
  } = useLayoutPartnerStore();

  const {
    zoom,
    setZoom,
    zoomIn,
    zoomOut,
    panOffset,
    setPanOffset,
    showRulers,
    showMargins,
    showBleed,
    viewMode,
    activeTool,
    activeShapeType,
    userGuides,
    addUserGuide,
    removeUserGuide,
    activeMeasure,
    setActiveMeasure,
    columnGrid,
    baselineGrid,
  } = useUiStore();

  const containerRef = useRef<HTMLDivElement>(null);
  const [isSpacePanning, setIsSpacePanning] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef({ x: 0, y: 0, startPanX: 0, startPanY: 0 });

  const fitPage = () => {
    const viewport=containerRef.current?.getBoundingClientRect();if(!viewport)return;
    const spread=viewMode==="spread"?2:1;
    setZoom(Math.max(.15,Math.min(1.5,(viewport.width-80)/(book.dimensions.widthPt/0.75*spread),(viewport.height-92)/(book.dimensions.heightPt/0.75))));
    setPanOffset({x:12,y:0});
  };

  // Measurement drag tracking
  const [measureStart, setMeasureStart] = useState<{ x: number; y: number } | null>(null);

  // Right-click Context Menu state
  const [contextMenuState, setContextMenuState] = useState<ContextMenuState>({
    isOpen: false,
    x: 0,
    y: 0,
  });

  // Spacebar panning detector & Universal Paste
  useEffect(() => {
    const isTargetEditable = (target: EventTarget | null) => {
      const active = typeof document !== "undefined" ? (document.activeElement as HTMLElement | null) : null;
      if (active) {
        if (active.tagName === "INPUT" || active.tagName === "TEXTAREA") return true;
        if (active.isContentEditable || Boolean(active.closest?.('[contenteditable="true"]'))) return true;
      }
      if (target && target instanceof HTMLElement) {
        if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") return true;
        if (target.isContentEditable || Boolean(target.closest?.('[contenteditable="true"]'))) return true;
      }
      return false;
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        const target = e.target as HTMLElement | null;
        if (!target?.closest('[role="dialog"][aria-modal="true"]')) {
          clearSelection();
          const uiState = useUiStore.getState();
          if (uiState.selectedNodeIds.length > 0) uiState.setSelectedNodeIds([]);
          if (uiState.cropElementId) uiState.setCropElementId(null);
          if (uiState.editingTextElementId) uiState.setEditingTextElementId(null);
        }
      }
      if (e.code === "Space" && !e.repeat && !isTargetEditable(e.target)) {
        setIsSpacePanning(true);
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        setIsSpacePanning(false);
        setIsPanning(false);
      }
    };

    const handlePaste = (e: ClipboardEvent) => {
      handleUniversalPaste(e);
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("paste", handlePaste);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("paste", handlePaste);
    };
  }, []);

  // Wheel zoom / pan
  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
      setZoom(zoom * zoomFactor);
    } else {
      setPanOffset({
        x: panOffset.x - e.deltaX * 0.8,
        y: panOffset.y - e.deltaY * 0.8,
      });
    }
  };

  // Helper to convert screen mouse coords to page pt coords
  const getPageCoordinates = (e: React.MouseEvent) => {
    const artboard = document.getElementById("page-artboard");
    if (!artboard) return { x: 54, y: 120 };
    const rect = artboard.getBoundingClientRect();
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;
    return {
      x: Math.round((screenX * .75 / zoom) * 10) / 10,
      y: Math.round((screenY * .75 / zoom) * 10) / 10,
    };
  };

  // Canvas Mouse Down Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    // 1. Pan mode (Spacebar, Middle mouse, or Hand tool)
    if (isSpacePanning || e.button === 1 || activeTool === "hand") {
      e.preventDefault();
      setIsPanning(true);
      panStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        startPanX: panOffset.x,
        startPanY: panOffset.y,
      };
      return;
    }

    // 2. Zoom tool click
    if (activeTool === "zoom") {
      if (e.altKey) {
        zoomOut();
      } else {
        zoomIn();
      }
      return;
    }

    // 3. Measurement Tool drag start
    if (activeTool === "measure") {
      const coords = getPageCoordinates(e);
      setMeasureStart(coords);
      return;
    }

    // 4. Vector Shape Tool click on page
    if (activeTool === "shape") {
      const coords = getPageCoordinates(e);
      addVectorShape(activeShapeType, coords.x - 70, coords.y - 50);
      return;
    }

    // 5. Frame Text Tool click on page
    if (activeTool === "frameText") {
      const coords = getPageCoordinates(e);
      addTextFrame(coords.x - 120, coords.y - 40);
      return;
    }

    // 5b. Picture Frame Tool click on page
    if (activeTool === "pictureFrame") {
      const coords = getPageCoordinates(e);
      addElement("preset-image-frame", coords.x - 140, coords.y - 100);
      return;
    }

    // 6. Table Tool click on page
    if (activeTool === "table") {
      const coords = getPageCoordinates(e);
      addTableElement(3, 3, coords.x - 180, coords.y - 60);
      return;
    }

    // Clicked empty page area -> clear selection
    if (e.target === e.currentTarget || (e.target as HTMLElement).id === "page-artboard") {
      clearSelection();
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      const dx = e.clientX - panStartRef.current.x;
      const dy = e.clientY - panStartRef.current.y;
      setPanOffset({
        x: panStartRef.current.startPanX + dx,
        y: panStartRef.current.startPanY + dy,
      });
      return;
    }

    if (activeTool === "measure" && measureStart) {
      const current = getPageCoordinates(e);

      const dx = current.x - measureStart.x;
      const dy = current.y - measureStart.y;
      const distancePt = Math.round(Math.hypot(dx, dy) * 10) / 10;
      const distanceMm = Math.round(ptToMm(distancePt) * 10) / 10;
      let angle = Math.round((Math.atan2(dy, dx) * 180) / Math.PI);
      if (angle < 0) angle += 360;

      setActiveMeasure({
        start: measureStart,
        current,
        distancePt,
        distanceMm,
        angleDeg: angle,
        dxPt: Math.round(dx * 10) / 10,
        dyPt: Math.round(dy * 10) / 10,
      });
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
    if (activeTool === "measure") {
      // keep activeMeasure until clicked again
      setMeasureStart(null);
    }
  };

  // Click on top ruler to create horizontal guide
  const handleTopRulerClick = (e: React.MouseEvent) => {
    const artboard = document.getElementById("page-artboard");
    if (!artboard) return;
    const rect = artboard.getBoundingClientRect();
    const pageY = (e.clientY - rect.top) / zoom;
    addUserGuide("horizontal", Math.max(0, Math.min(book.dimensions.heightPt, pageY)));
  };

  // Click on left ruler to create vertical guide
  const handleLeftRulerClick = (e: React.MouseEvent) => {
    const artboard = document.getElementById("page-artboard");
    if (!artboard) return;
    const rect = artboard.getBoundingClientRect();
    const pageX = (e.clientX - rect.left) / zoom;
    addUserGuide("vertical", Math.max(0, Math.min(book.dimensions.widthPt, pageX)));
  };

  const activeElements = getActivePageElements();
  const selectedElements = selectedElementIds
    .map((id) => elements[id])
    .filter(Boolean);

  const { dimensions, bleed } = book;

  // Single page or Spread mode
  const isSpread = viewMode === "spread" && activePage.displayNumber !== "Cover";
  const spreadWidthPt = isSpread ? dimensions.widthPt * 2 : dimensions.widthPt;

  // Left & right pages in spread mode
  const currentPageIdx = activePage.pageIndex;
  const leftPage = isSpread
    ? currentPageIdx % 2 === 1
      ? activePage
      : book.pages[currentPageIdx - 1] || activePage
    : activePage;
  const rightPage = isSpread
    ? currentPageIdx % 2 === 1
      ? book.pages[currentPageIdx + 1]
      : activePage
    : undefined;

  const margins = pageMarginsFor(book, leftPage);
  const leftColumns = book.masterPages?.find(master => master.id === leftPage.masterPageId)?.gridColumns || columnGrid.columns;
  const rightColumns = book.masterPages?.find(master => master.id === rightPage?.masterPageId)?.gridColumns || columnGrid.columns;
  const rightMargins = rightPage ? pageMarginsFor(book, rightPage) : margins;

  const leftElements = isSpread
    ? leftPage.elementIds.map((id) => elements[id]).filter(Boolean)
    : activeElements;
  const rightElements = rightPage
    ? rightPage.elementIds.map((id) => elements[id]).filter(Boolean)
    : [];

  // Determine cursor based on activeTool
  let cursorClass = "cursor-default";
  if (isSpacePanning || isPanning) {
    cursorClass = isPanning ? "cursor-grabbing" : "cursor-grab";
  } else if (activeTool === "hand") {
    cursorClass = isPanning ? "cursor-grabbing" : "cursor-grab";
  } else if (activeTool === "zoom") {
    cursorClass = "cursor-zoom-in";
  } else if (["shape", "pen", "pencil", "frameText", "measure", "table", "brush", "eraser", "cloneStamp", "healing"].includes(activeTool)) {
    cursorClass = "cursor-crosshair";
  } else if (activeTool === "node" || activeTool === "corner") {
    cursorClass = "cursor-pointer";
  }

  return (
    <div
      ref={containerRef}
      className={`relative flex-1 h-full w-full overflow-hidden bg-[#f1f4f8] dark:bg-[#0c1017] canvas-grid-bg select-none ${cursorClass}`}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "copy";
      }}
      onDragEnter={(e) => {
        e.preventDefault();
      }}
      onDrop={(e) => {
        e.preventDefault();
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
          const coords = getPageCoordinates(e);
          handleFileDropOnCanvas(e.dataTransfer.files, coords);
        }
      }}
    >
      {/* Top Rulers (Points & Millimeters) */}
      {showRulers && (
        <div
          onClick={handleTopRulerClick}
          className="absolute top-0 left-8 right-0 h-6 bg-white/95 dark:bg-[#0f141f] border-b border-slate-200 dark:border-white/10 z-30 flex items-center text-[8pt] text-slate-500 dark:text-slate-400 font-mono overflow-hidden cursor-pointer"
          title="Click on ruler to add horizontal guide"
        >
          <div
            className="flex h-full items-end pointer-events-none"
            style={{
              transform: `translateX(${panOffset.x}px)`,
              width: "4000px",
            }}
          >
            {Array.from({ length: 40 }).map((_, i) => {
              const ptVal = i * 72;
              return (
                <div
                  key={i}
                  className="flex-shrink-0 border-l border-slate-300 dark:border-slate-600 h-3 flex items-start pl-1 text-[7pt]"
                  style={{ width: `${72 * zoom}px` }}
                >
                  {ptVal} pt
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Left Vertical Ruler */}
      {showRulers && (
        <div
          onClick={handleLeftRulerClick}
          className="absolute top-6 left-0 bottom-0 w-8 bg-white/95 dark:bg-[#0f141f] border-r border-slate-200 dark:border-white/10 z-30 flex flex-col items-center text-[7pt] text-slate-500 dark:text-slate-400 font-mono overflow-hidden cursor-pointer"
          title="Click on ruler to add vertical guide"
        >
          <div
            className="flex flex-col w-full pointer-events-none"
            style={{
              transform: `translateY(${panOffset.y}px)`,
              height: "4000px",
            }}
          >
            {Array.from({ length: 50 }).map((_, i) => {
              const ptVal = i * 72;
              return (
                <div
                  key={i}
                  className="flex-shrink-0 border-t border-slate-300 dark:border-slate-600 w-3 flex items-center pt-0.5 text-[6pt]"
                  style={{ height: `${72 * zoom}px` }}
                >
                  {ptVal}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Origin Corner */}
      {showRulers && (
        <div className="absolute top-0 left-0 w-8 h-6 bg-slate-100 dark:bg-[#0c1017] border-r border-b border-slate-200 dark:border-white/10 z-30 flex items-center justify-center text-[7pt] font-mono text-slate-500">
          pt
        </div>
      )}

      {/* Viewport Zoom & Pan Container */}
      <div
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
        style={{
          transform: `translate(${panOffset.x}px, ${panOffset.y}px)`,
        }}
      >
        {/* Scale Container */}
        <div
          style={{
            transform: `scale(${zoom})`,
            transformOrigin: "center center",
          }}
          className="relative transition-transform duration-75 flex gap-4 pointer-events-auto"
        >
          {/* Bleed Overlay (Red dashed) */}
          {showBleed && (
            <div
              className="absolute border border-rose-500/40 border-dashed pointer-events-none"
              style={{
                left: `${-bleed.leftPt}pt`,
                top: `${-bleed.topPt}pt`,
                width: `${spreadWidthPt + bleed.leftPt + bleed.rightPt}pt`,
                height: `${dimensions.heightPt + bleed.topPt + bleed.bottomPt}pt`,
              }}
            >
              <span className="absolute -top-4 left-0 text-[6pt] text-rose-400 font-mono">
                BLEED 3mm (+{Math.round(bleed.leftPt)}pt)
              </span>
            </div>
          )}

          {/* Left Page (or Single Page) */}
          <div
            id="page-artboard"
            className="relative bg-white page-paper-shadow rounded-[2px] transition-shadow overflow-hidden ring-1 ring-black/5"
            style={{
              width: `${dimensions.widthPt}pt`,
              height: `${dimensions.heightPt}pt`,
            }}
            onContextMenu={(e) => {
              e.preventDefault();
              setContextMenuState({
                isOpen: true,
                x: e.clientX,
                y: e.clientY,
              });
            }}
            onDragOver={(e) => {
              e.preventDefault();
              e.dataTransfer.dropEffect = "copy";
            }}
            onDrop={(e) => {
              e.preventDefault();
              const coords = getPageCoordinates(e);
              const curriculumPayload = e.dataTransfer.getData("application/x-nexmaxx-curriculum");
              if (curriculumPayload) {
                try { const data = JSON.parse(curriculumPayload); insertCurriculumBlock(data.type, data.layout || undefined as CurriculumLayout | undefined, data.grade as CurriculumGrade, data.subject); }
                catch (error) { useUiStore.getState().showToast({ type: "error", title: "Block not inserted", message: String(error) }); }
                return;
              }
              const selectedId = selectedElementIds.length === 1 ? selectedElementIds[0] : undefined;
              const selected = selectedId ? elements[selectedId] : undefined;
              const atelier = selected?.smartBlockData?.presetId.startsWith("atelier-") && !selected.locked && !selected.smartBlockData.isLockedDesign ? selected : undefined;
              const artId = e.dataTransfer.getData("application/x-nexmaxx-artwork");
              const file = e.dataTransfer.files?.[0];
              if (atelier && file && file.type.startsWith("image/")) {
                readPublicationImage(file).then(asset => {
                  const motifs = atelier.smartBlockData?.styleOverrides.motifs || [];
                  useEditorStore.getState().setBlockMotifs(atelier.id, [...motifs, { id: `photo-${motifs.length}`, role: "photo", kind: "custom-image", x: coords.x - atelier.transform.x, y: coords.y - atelier.transform.y, w: 160, h: 100, rotation: 0, locked: false, opacity: 1, nudged: true, originWidth: atelier.transform.width, behind: true, src: asset.src, alt: file.name, focalX: .5, focalY: .5, scale: 1, rawWidthPx: asset.rawWidthPx, rawHeightPx: asset.rawHeightPx }]);
                  useEditorStore.getState().commitBlockMotifs(atelier.id, atelier);
                }).catch(err => useUiStore.getState().showToast({ type: "error", title: "Image not added", message: String(err) }));
                return;
              }
              if (artId && atelier) {
                const motifs = atelier.smartBlockData?.styleOverrides.motifs || [];
                useEditorStore.getState().setBlockMotifs(atelier.id, [...motifs, { id: `plate-${artId}-${motifs.length}`, role: "illustration", kind: artId, x: coords.x - atelier.transform.x, y: coords.y - atelier.transform.y, w: 140, h: 90, rotation: 0, locked: false, opacity: .9, nudged: true, originWidth: atelier.transform.width, behind: true }]);
                useEditorStore.getState().commitBlockMotifs(atelier.id, atelier);
                return;
              }
              if(artId) { useEditorStore.getState().addPublicationArtwork(artId as ArtworkKind,coords.x,coords.y); return; }
              const blockPayload = e.dataTransfer.getData("application/x-nexmaxx-block-payload");
              const blockId = e.dataTransfer.getData("application/x-nexmaxx-block-id");
              if (blockPayload || blockId) {
                let id = blockId;
                let subject: string | undefined = undefined;
                let grade: string | undefined = undefined;
                if (blockPayload) {
                  try {
                    const parsed = JSON.parse(blockPayload);
                    id = parsed.id || id;
                    subject = parsed.subject;
                    grade = parsed.grade;
                  } catch {}
                }
                const coords = getPageCoordinates(e);
                addEducationalBlock(id, coords.x, coords.y, { subject, grade });
                return;
              }
              const presetId = e.dataTransfer.getData("application/x-nexmaxx-preset");
              if (presetId) {
                applyPagePreset(presetId);
              }
            }}
            onClick={(e) => {
              if (
                (e.target === e.currentTarget || (e.target as HTMLElement).id === "page-artboard") &&
                (activeTool === "move" || !["hand", "zoom", "measure", "pen", "pencil", "shape", "table", "brush", "eraser"].includes(activeTool))
              ) {
                clearSelection();
              }
            }}
          >
            <PageFrameView book={book} page={leftPage}/>
            {/* Margin Guides (Cyan dashed) */}
            {showMargins && !pageFrameFor(book, leftPage) && (
              <div
                className="absolute border border-sky-400/30 border-dashed pointer-events-none"
                style={{
                  top: `${margins.topPt}pt`,
                  bottom: `${margins.bottomPt}pt`,
                  left: `${margins.insidePt}pt`,
                  right: `${margins.outsidePt}pt`,
                }}
              >
                <span className="absolute top-1 left-1 text-[6pt] text-sky-400 font-mono">
                  MARGIN
                </span>
              </div>
            )}

            {/* Column Grid Guides (Lavender tinted vertical columns) */}
            {columnGrid?.enabled && (
              <div
                className="absolute pointer-events-none flex z-20"
                style={{
                  top: `${margins.topPt}pt`,
                  bottom: `${margins.bottomPt}pt`,
                  left: `${margins.insidePt}pt`,
                  right: `${margins.outsidePt}pt`,
                  gap: `${columnGrid.gutterPt}pt`,
                }}
              >
                {Array.from({ length: Math.max(1, leftColumns) }).map((_, i) => (
                  <div
                    key={i}
                    className="flex-1 bg-indigo-500/[0.04] border-x border-indigo-400/25 relative"
                  >
                    <span className="absolute top-1 left-1 text-[5pt] text-indigo-400/60 font-mono">
                      COL {i + 1}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Baseline Grid (Subtle horizontal typographic rhythm) */}
            {baselineGrid?.enabled && (
              <div
                className="absolute inset-0 pointer-events-none z-20 overflow-hidden"
                style={{
                  backgroundImage: `linear-gradient(to bottom, rgba(99, 102, 241, 0.15) 1px, transparent 1px)`,
                  backgroundSize: `100% ${Math.max(4, baselineGrid.stepPt)}pt`,
                  backgroundPosition: `0 ${margins.topPt}pt`,
                }}
              />
            )}

            {/* Empty Page Assistant (Directive 38, Directive 85) */}
            {leftElements.length === 0 && (
              <EmptyPageAssistant pageId={activePage.id} />
            )}

            {/* Smart Overflow Warning Banner (Directive 17) */}
            {activePage.overflowWarning?.hasOverflow && (
              <div className="absolute bottom-5 left-6 right-6 z-40 bg-amber-500/95 backdrop-blur-md text-white px-3.5 py-2.5 rounded-xl shadow-2xl flex items-center justify-between text-[8.5pt] border border-amber-300/40 animate-in fade-in duration-150">
                <div className="flex items-center gap-2.5">
                  <span className="text-base">⚠️</span>
                  <div>
                    <span className="font-semibold">Content exceeds page capacity</span>
                    <span className="opacity-90 ml-1.5 font-mono text-[8pt]">
                      (+{Math.round(activePage.overflowWarning.overflowAmountPt || activePage.overflowWarning.exceededByPt || 0)} pt)
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => autoArrangeActivePage("balanced")}
                    className="px-2.5 py-1 rounded bg-white/20 hover:bg-white/30 font-medium transition-colors shadow-xs"
                    title="Auto-adjust spacing and element sizing to fit page"
                  >
                    Auto Rebalance
                  </button>
                  <button
                    onClick={() => {
                      useEditorStore.getState().flowPageOverflowToNextPage();
                    }}
                    className="px-2.5 py-1 rounded bg-black/30 hover:bg-black/45 font-medium transition-colors shadow-xs"
                    title="Move overflowing content to next page"
                  >
                    Flow to Next Page →
                  </button>
                </div>
              </div>
            )}

            {/* Magnetic Drop Zone Live Preview (Part 8) */}
            {hoveredDropZone && (
              <div
                className="absolute z-50 pointer-events-none transition-all duration-150 animate-in fade-in"
                style={{
                  left: `${hoveredDropZone.bounds.x}pt`,
                  top: `${hoveredDropZone.bounds.y}pt`,
                  width: `${hoveredDropZone.bounds.width}pt`,
                  height: `${hoveredDropZone.bounds.height}pt`,
                }}
              >
                <div className="w-full h-full border-2 border-dashed border-cyan-400 bg-cyan-400/15 rounded-xl flex flex-col items-center justify-center p-2 shadow-[0_0_24px_rgba(6,182,212,0.3)]">
                  <span className="bg-cyan-500 text-white font-mono font-bold text-[8pt] px-2.5 py-1 rounded-full shadow-md tracking-wider uppercase flex items-center gap-1.5">
                    <span>✦</span> {hoveredDropZone.label}
                  </span>
                  <span className="text-[7pt] text-cyan-900 font-medium mt-1 bg-white/80 backdrop-blur-sm px-2 py-0.5 rounded shadow-sm">
                    {hoveredDropZone.description}
                  </span>
                </div>
              </div>
            )}

            {/* Layout Variation Ghost Preview (Part 10 & 31) */}
            {previewTransforms && (
              <div className="absolute inset-0 pointer-events-none z-40">
                {Object.entries(previewTransforms).map(([elId, tr]) => {
                  const el = elements[elId];
                  if (!el) return null;
                  const x = tr.x ?? el.transform.x;
                  const y = tr.y ?? el.transform.y;
                  const w = tr.width ?? el.transform.width;
                  const h = tr.height ?? el.transform.height;
                  return (
                    <div
                      key={`preview-ghost-${elId}`}
                      className="absolute border-2 border-indigo-500/80 bg-indigo-500/15 rounded-xl transition-all duration-300 pointer-events-none shadow-lg flex items-start p-1.5"
                      style={{
                        left: `${x}pt`,
                        top: `${y}pt`,
                        width: `${w}pt`,
                        height: `${h}pt`,
                      }}
                    >
                      <span className="text-[6.5pt] font-mono font-bold bg-indigo-600 text-white px-1.5 py-0.5 rounded shadow-sm">
                        {el.displayName}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Text Wrap Exclusion Area Outlines (Part 4) */}
            {leftElements
              .filter((el) => {
                const wrapMode = effectiveTextWrap(el)?.mode;
                return selectedElementIds.includes(el.id) && wrapMode && !["none", "through", "floating"].includes(wrapMode);
              })
              .map((el) => {
                const wrap = effectiveTextWrap(el);
                const margin = wrap?.offsetPt ?? wrap?.wrapMarginPt ?? 12;
                const top = el.transform.y - (wrap?.topOffsetPt ?? margin);
                const left = el.transform.x - (wrap?.leftOffsetPt ?? margin);
                const width =
                  el.transform.width +
                  (wrap?.leftOffsetPt ?? margin) +
                  (wrap?.rightOffsetPt ?? margin);
                const height =
                  el.transform.height +
                  (wrap?.topOffsetPt ?? margin) +
                  (wrap?.bottomOffsetPt ?? margin);
                return (
                  <div
                    key={`wrap-exclusion-${el.id}`}
                    className="absolute border border-purple-400/60 border-dashed pointer-events-none rounded-lg"
                    style={{
                      left: `${left}pt`,
                      top: `${top}pt`,
                      width: `${width}pt`,
                      height: `${height}pt`,
                      transform: el.transform.rotation ? `rotate(${el.transform.rotation}deg)` : undefined,
                    }}
                  >
                    <span className="absolute -top-3 left-1 text-[6pt] text-purple-700 font-mono bg-purple-50 px-1 rounded shadow-xs">
                      Wrap: {wrap?.mode}
                    </span>
                  </div>
                );
              })}

            {/* Elements Layer */}
            {leftElements.map((el) => {
              const isSelected = selectedElementIds.includes(el.id);
              return (
                <div
                  key={el.id}
                  onClick={(e) => {
                    if (activeTool === "move" || !["hand", "zoom", "measure", "pen", "pencil", "shape", "table", "brush", "eraser"].includes(activeTool)) {
                      e.stopPropagation();
                      selectElement(el.id, e.shiftKey || e.metaKey);
                    }
                  }}
                >
                  <ElementRenderer element={el} isSelected={isSelected} zoom={zoom} />
                </div>
              );
            })}

            {/* User Custom Guide Lines */}
            {userGuides.map((g) => (
              <div
                key={g.id}
                className={`absolute group cursor-pointer ${
                  g.type === "horizontal"
                    ? "left-0 right-0 border-t border-cyan-400 z-40"
                    : "top-0 bottom-0 border-l border-cyan-400 z-40"
                }`}
                style={
                  g.type === "horizontal"
                    ? { top: `${g.positionPt}pt` }
                    : { left: `${g.positionPt}pt` }
                }
              >
                <div className="opacity-0 group-hover:opacity-100 bg-cyan-600 text-white text-[7pt] font-mono px-1 py-0.5 rounded shadow absolute top-0 left-0 flex items-center gap-1">
                  <span>{g.positionPt} pt</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeUserGuide(g.id);
                    }}
                    className="hover:text-rose-200"
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}

            {/* Active Measurement Line in Measure Tool Mode */}
            {activeMeasure && activeMeasure.start && activeMeasure.current && (
              <svg className="absolute inset-0 w-full h-full pointer-events-none z-50 overflow-visible">
                <line
                  x1={`${activeMeasure.start.x}pt`}
                  y1={`${activeMeasure.start.y}pt`}
                  x2={`${activeMeasure.current.x}pt`}
                  y2={`${activeMeasure.current.y}pt`}
                  stroke="#f59e0b"
                  strokeWidth="1.5"
                  strokeDasharray="4,3"
                />
                <circle cx={`${activeMeasure.start.x}pt`} cy={`${activeMeasure.start.y}pt`} r="3" fill="#f59e0b" />
                <circle cx={`${activeMeasure.current.x}pt`} cy={`${activeMeasure.current.y}pt`} r="3" fill="#f59e0b" />
                <text
                  x={`${(activeMeasure.start.x + activeMeasure.current.x) / 2}pt`}
                  y={`${(activeMeasure.start.y + activeMeasure.current.y) / 2 - 6}pt`}
                  fill="#f59e0b"
                  fontSize="8pt"
                  fontFamily="monospace"
                  fontWeight="bold"
                  textAnchor="middle"
                >
                  {activeMeasure.distancePt} pt ({activeMeasure.distanceMm} mm)
                </text>
              </svg>
            )}

            {/* Vector Node & Corner Tool Overlay */}
            {(activeTool === "node" || activeTool === "corner") &&
              selectedElements
                .filter((el) => el.type === "vector-curve" || Boolean(el.curveData))
                .map((el) => <NodeToolOverlay key={`node-overlay-${el.id}`} element={el} zoom={zoom} />)}

            {/* Pixel Studio Brush & Eraser Overlay */}
            {["brush", "eraser", "cloneStamp", "healing"].includes(activeTool) && (
              <PixelBrushOverlay
                activePageId={activePage.id}
                selectedElements={selectedElements}
                pageWidthPt={dimensions.widthPt}
                pageHeightPt={dimensions.heightPt}
                zoom={zoom}
              />
            )}

            {/* Vector Pen & Pencil Tool Overlay */}
            {["pen", "pencil"].includes(activeTool) && (
              <VectorPenOverlay zoom={zoom} />
            )}

            <PublisherFooterView book={book} page={leftPage} elements={elements}/>
          </div>

          {/* Right Page (In Spread Mode) */}
          {isSpread && rightPage && (
            <div
              className="relative bg-white shadow-[0_24px_70px_rgba(0,0,0,0.6),0_2px_8px_rgba(0,0,0,0.4)] rounded-[2px] transition-shadow overflow-hidden ring-1 ring-black/5"
              style={{
                width: `${dimensions.widthPt}pt`,
                height: `${dimensions.heightPt}pt`,
              }}
            >
              <PageFrameView book={book} page={rightPage}/>
              {/* Margin Guides */}
              {showMargins && !pageFrameFor(book, rightPage) && (
                <div
                  className="absolute border border-sky-400/30 border-dashed pointer-events-none"
                  style={{
                    top: `${rightMargins.topPt}pt`,
                    bottom: `${rightMargins.bottomPt}pt`,
                    left: `${rightMargins.insidePt}pt`,
                    right: `${rightMargins.outsidePt}pt`,
                  }}
                />
              )}

              {/* Column Grid Guides */}
              {columnGrid?.enabled && (
                <div
                  className="absolute pointer-events-none flex z-20"
                  style={{
                    top: `${rightMargins.topPt}pt`,
                    bottom: `${rightMargins.bottomPt}pt`,
                    left: `${rightMargins.insidePt}pt`,
                    right: `${rightMargins.outsidePt}pt`,
                    gap: `${columnGrid.gutterPt}pt`,
                  }}
                >
                  {Array.from({ length: Math.max(1, rightColumns) }).map((_, i) => (
                    <div
                      key={i}
                      className="flex-1 bg-indigo-500/[0.04] border-x border-indigo-400/25 relative"
                    >
                      <span className="absolute top-1 left-1 text-[5pt] text-indigo-400/60 font-mono">
                        COL {i + 1}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Baseline Grid */}
              {baselineGrid?.enabled && (
                <div
                  className="absolute inset-0 pointer-events-none z-20 overflow-hidden"
                  style={{
                    backgroundImage: `linear-gradient(to bottom, rgba(99, 102, 241, 0.15) 1px, transparent 1px)`,
                    backgroundSize: `100% ${Math.max(4, baselineGrid.stepPt)}pt`,
                    backgroundPosition: `0 ${rightMargins.topPt}pt`,
                  }}
                />
              )}

              {rightElements.map((el) => {
                const isSelected = selectedElementIds.includes(el.id);
                return (
                  <div
                    key={el.id}
                    onClick={(e) => {
                      if (activeTool === "move" || !["hand", "zoom", "measure", "pen", "pencil", "shape", "table", "brush", "eraser"].includes(activeTool)) {
                        e.stopPropagation();
                        selectElement(el.id, e.shiftKey || e.metaKey);
                      }
                    }}
                  >
                    <ElementRenderer element={el} isSelected={isSelected} zoom={zoom} />
                  </div>
                );
              })}

              <PublisherFooterView book={book} page={rightPage} elements={elements}/>
            </div>
          )}

          {/* Interactive Transform Overlay for Selected Elements */}
          {activeTool === "move" && (
            <>
              <TransformOverlay
                selectedElements={selectedElements}
                allPageElements={activeElements}
                pageDimensions={dimensions}
                margins={margins}
                bleed={bleed}
                zoom={zoom}
              />
              <SmartQuickActionBar
                selectedElements={selectedElements}
                zoom={zoom}
              />
            </>
          )}
        </div>
      </div>

      {/* Floating Layout Variation Control Pill (Part 10 & 31) */}
      {previewTransforms && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 bg-slate-900/90 backdrop-blur-xl border border-white/20 shadow-2xl rounded-2xl px-5 py-3 flex items-center gap-4 text-white text-xs animate-in slide-in-from-bottom duration-200">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-400 animate-ping" />
            <div>
              <div className="font-semibold text-slate-100 flex items-center gap-1.5">
                <span>✦</span> Previewing Layout Variation
              </div>
              <div className="text-[7pt] text-slate-400">Content preserved • Non-destructive composition</div>
            </div>
          </div>
          <div className="flex items-center gap-2 border-l border-white/10 pl-4">
            <button
              onClick={applyPreviewTransforms}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold shadow-lg shadow-indigo-500/25 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <span>✓</span> Apply Layout
            </button>
            <button
              onClick={cancelPreviewTransforms}
              className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 font-medium transition-colors cursor-pointer active:scale-95"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-40 flex items-center gap-1 rounded-xl border border-slate-200/90 dark:border-white/10 bg-white/95 dark:bg-slate-950 px-2 py-1 shadow-lg text-slate-700 dark:text-slate-300" onMouseDown={e=>e.stopPropagation()} onWheel={e=>e.stopPropagation()}>
        <button onClick={() => useUiStore.getState().setPageBorderModalOpen(true)} className="px-2 py-1.5 text-xs font-semibold rounded-lg hover:bg-indigo-500/10" title="Edit page borders" aria-label="Page borders">Page borders</button>
        <button className="studio-icon-button px-3 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white" aria-label="Zoom out" onClick={zoomOut}>−</button>
        <span className="text-xs text-slate-700 dark:text-slate-300 w-12 text-center font-medium" aria-live="polite">{Math.round(zoom*100)}%</span>
        <button className="studio-icon-button px-3 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white" aria-label="Zoom in" onClick={zoomIn}>+</button>
        <button className="publication-button !min-h-9 !text-xs" onClick={fitPage}>Fit page</button>
        <button className="publication-button !min-h-9 !text-xs" onClick={()=>{setZoom(1);setPanOffset({x:0,y:0});}}>100%</button>
      </div>
      {/* Canvas Right-Click Context Menu */}
      <CanvasContextMenu
        menuState={contextMenuState}
        onClose={() => setContextMenuState({ isOpen: false, x: 0, y: 0 })}
      />
    </div>
  );
};
