"use client";
import React, { useEffect, useRef, useState } from "react";
import { imageFilter, imageMaskPath } from "../educational/imageTreatment";
import { PageElement } from "../../domain/element/types";
import { useEditorStore } from "../stores/editorStore";
import { useUiStore } from "../stores/uiStore";

/** Crop gestures only commit on release: one undo action, no history churn. */
export function PublicationImage({ element }: { element: PageElement }) {
  const cropElementId = useUiStore((s) => s.cropElementId);
  const setCropElementId = useUiStore((s) => s.setCropElementId);
  const selected = useEditorStore((s) => s.selectedElementIds.includes(element.id));
  const cropping = cropElementId === element.id && selected;
  const setCropping = (value: boolean) => setCropElementId(value ? element.id : null);
  const [preview, setPreview] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (!cropping) return;
    const stop = (e: KeyboardEvent) => {
      if (e.key === "Escape") setCropElementId(null);
    };
    window.addEventListener("keydown", stop);
    return () => window.removeEventListener("keydown", stop);
  }, [cropping, setCropElementId]);

  const start = useRef<{ x: number; y: number; fx: number; fy: number; w: number; h: number } | null>(null);
  const c = element.content;
  const src = c.src || c.imageUrl || c.url;
  const focus = preview || { x: c.focalX ?? 0.5, y: c.focalY ?? 0.5 };
  const cropScale = c.cropScale || c.scale || 1;
  const flipX = c.flipX ? -1 : 1;
  const flipY = c.flipY ? -1 : 1;
  const alt = c.alt || c.imageAlt || c.caption || "";
  const maskPath = imageMaskPath(c, element.transform.width * 96 / 72, element.transform.height * 96 / 72);

  return (
    <div
      className="w-full h-full overflow-hidden rounded-[inherit] relative flex flex-col"
      onDoubleClick={(e) => {
        e.stopPropagation();
        if (!element.locked) setCropping(!cropping);
      }}
    >
      <div className="relative flex-1 w-full h-full overflow-hidden" style={{ clipPath: maskPath ? `path('${maskPath}')` : undefined, borderRadius: c.mask === 'rounded' ? `${element.style.borderRadius || 16}pt` : undefined }}>
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt={alt}
            draggable={false}
            style={{
              width: "100%",
              height: "100%",
              objectFit: element.style.objectFit || "cover",
              objectPosition: `${focus.x * 100}% ${focus.y * 100}%`,
              filter: imageFilter(c),
              transform: `scale(${cropScale * flipX}, ${cropScale * flipY})`,
              transformOrigin: `${focus.x * 100}% ${focus.y * 100}%`,
            }}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-slate-800/60 border border-dashed border-slate-600 text-slate-400 p-2 text-center text-xs">
            <span>📷 No image asset</span>
            <span className="text-[10px] text-slate-500 mt-1">Select block to upload photo in inspector</span>
          </div>
        )}

        {cropping && !element.locked && (
          <div
            role="button"
            tabIndex={0}
            aria-label="Drag image to reposition crop. Press Escape to finish."
            className="absolute inset-0 z-50 cursor-move border-2 border-amber-400 touch-none bg-black/10"
            onKeyDown={(e) => {
              if (e.key === "Escape") setCropping(false);
            }}
            onMouseDown={(e) => e.stopPropagation()}
            onPointerDown={(e) => {
              e.stopPropagation();
              e.currentTarget.setPointerCapture(e.pointerId);
              const rect = e.currentTarget.getBoundingClientRect();
              start.current = {
                x: e.clientX,
                y: e.clientY,
                fx: focus.x,
                fy: focus.y,
                w: rect.width,
                h: rect.height,
              };
            }}
            onPointerMove={(e) => {
              if (!start.current) return;
              e.stopPropagation();
              const s = start.current;
              setPreview({
                x: Math.max(0, Math.min(1, s.fx - (e.clientX - s.x) / s.w)),
                y: Math.max(0, Math.min(1, s.fy - (e.clientY - s.y) / s.h)),
              });
            }}
            onPointerUp={(e) => {
              e.stopPropagation();
              if (preview) {
                useEditorStore.getState().updateElementContent(element.id, {
                  focalX: preview.x,
                  focalY: preview.y,
                });
              }
              start.current = null;
              setPreview(null);
            }}
            onPointerCancel={() => {
              start.current = null;
              setPreview(null);
            }}
          >
            <div className="absolute top-2 left-2 bg-black/75 backdrop-blur-sm text-amber-200 rounded px-2 py-0.5 text-[10px] pointer-events-none">
              Drag to pan crop
            </div>
            <button
              className="absolute top-2 right-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-medium rounded px-3 py-1 text-xs shadow-md"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                setCropping(false);
              }}
            >
              Done cropping
            </button>
          </div>
        )}
      </div>

      {c.caption && (
        <div className="bg-white/95 text-slate-800 text-[7.5pt] px-2 py-1 border-t border-slate-200 truncate select-text shrink-0">
          {c.caption}
        </div>
      )}
    </div>
  );
}
