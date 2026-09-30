"use client";

import React, { useState, useRef } from "react";
import { PageElement } from "../../domain/element/types";
import { CurveNode, CurveNodeType } from "../../domain/creative/types";
import { useEditorStore } from "../../editor/stores/editorStore";
import { useUiStore } from "../../editor/stores/uiStore";

interface NodeToolOverlayProps {
  element: PageElement;
  zoom: number;
}

export const NodeToolOverlay: React.FC<NodeToolOverlayProps> = ({ element, zoom }) => {
  const { updateCurveNode, applyCornerFilletToNode } = useEditorStore();
  const { selectedNodeIds, setSelectedNodeIds, activeTool } = useUiStore();

  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [draggingHandle, setDraggingHandle] = useState<{
    nodeId: string;
    type: "in" | "out";
  } | null>(null);

  const startDragRef = useRef<{ mouseX: number; mouseY: number; initialNode: CurveNode }>({
    mouseX: 0,
    mouseY: 0,
    initialNode: { id: "", x: 0, y: 0, type: "sharp" },
  });

  if (!element.curveData || !element.curveData.nodes) {
    return null;
  }

  const nodes = element.curveData.nodes;
  const isCornerTool = activeTool === "corner";

  // Handle pointer down on a node
  const handleNodePointerDown = (e: React.PointerEvent, node: CurveNode) => {
    e.stopPropagation();
    e.preventDefault();

    if (e.shiftKey) {
      if (selectedNodeIds.includes(node.id)) {
        setSelectedNodeIds(selectedNodeIds.filter((id) => id !== node.id));
      } else {
        setSelectedNodeIds([...selectedNodeIds, node.id]);
      }
    } else {
      setSelectedNodeIds([node.id]);
    }

    if (isCornerTool) {
      // Corner fillet tool: apply 12pt fillet on click/drag
      applyCornerFilletToNode(element.id, node.id, 12, "rounded");
      return;
    }

    setDraggingNodeId(node.id);
    startDragRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      initialNode: { ...node },
    };

    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handleNodePointerMove = (e: React.PointerEvent, node: CurveNode) => {
    if (draggingNodeId !== node.id) return;
    e.stopPropagation();

    const dx = (e.clientX - startDragRef.current.mouseX) / zoom;
    const dy = (e.clientY - startDragRef.current.mouseY) / zoom;

    const newX = Math.round((startDragRef.current.initialNode.x + dx) * 10) / 10;
    const newY = Math.round((startDragRef.current.initialNode.y + dy) * 10) / 10;

    updateCurveNode(element.id, node.id, { x: newX, y: newY });
  };

  const handleNodePointerUp = (e: React.PointerEvent) => {
    if (draggingNodeId) {
      setDraggingNodeId(null);
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // pointer capture fallback
      }
    }
  };

  // Handle pointer down on a Bézier handle (handleIn or handleOut)
  const handleHandlePointerDown = (
    e: React.PointerEvent,
    node: CurveNode,
    type: "in" | "out"
  ) => {
    e.stopPropagation();
    e.preventDefault();

    setDraggingHandle({ nodeId: node.id, type });
    startDragRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      initialNode: { ...node },
    };

    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handleHandlePointerMove = (e: React.PointerEvent, node: CurveNode) => {
    if (!draggingHandle || draggingHandle.nodeId !== node.id) return;
    e.stopPropagation();

    const dx = (e.clientX - startDragRef.current.mouseX) / zoom;
    const dy = (e.clientY - startDragRef.current.mouseY) / zoom;

    const baseHandle =
      draggingHandle.type === "in"
        ? startDragRef.current.initialNode.handleIn || { x: -20, y: 0 }
        : startDragRef.current.initialNode.handleOut || { x: 20, y: 0 };

    const newHx = Math.round((baseHandle.x + dx) * 10) / 10;
    const newHy = Math.round((baseHandle.y + dy) * 10) / 10;

    if (draggingHandle.type === "in") {
      const updates: Partial<CurveNode> = { handleIn: { x: newHx, y: newHy } };
      // If smooth or smart, keep handleOut collinear
      if (node.type === "smooth" || node.type === "smart") {
        updates.handleOut = { x: -newHx, y: -newHy };
      }
      updateCurveNode(element.id, node.id, updates);
    } else {
      const updates: Partial<CurveNode> = { handleOut: { x: newHx, y: newHy } };
      if (node.type === "smooth" || node.type === "smart") {
        updates.handleIn = { x: -newHx, y: -newHy };
      }
      updateCurveNode(element.id, node.id, updates);
    }
  };

  const handleHandlePointerUp = (e: React.PointerEvent) => {
    if (draggingHandle) {
      setDraggingHandle(null);
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // pointer capture fallback
      }
    }
  };

  // Double click toggles between sharp and smooth
  const handleNodeDoubleClick = (e: React.MouseEvent, node: CurveNode) => {
    e.stopPropagation();
    const nextType: CurveNodeType = node.type === "sharp" ? "smooth" : "sharp";
    if (nextType === "smooth") {
      updateCurveNode(element.id, node.id, {
        type: "smooth",
        handleIn: { x: -24, y: 0 },
        handleOut: { x: 24, y: 0 },
      });
    } else {
      updateCurveNode(element.id, node.id, {
        type: "sharp",
        handleIn: undefined,
        handleOut: undefined,
      });
    }
  };

  return (
    <div
      className="absolute pointer-events-none z-50 overflow-visible"
      style={{
        left: `${element.transform.x}pt`,
        top: `${element.transform.y}pt`,
        width: `${element.transform.width}pt`,
        height: `${element.transform.height}pt`,
      }}
    >
      <svg className="w-full h-full overflow-visible pointer-events-none">
        {/* Render Handle Control Lines and Handles */}
        {nodes.map((node) => {
          const isSelected = selectedNodeIds.includes(node.id);
          if (!isSelected) return null;

          return (
            <g key={`handles-${node.id}`}>
              {/* Handle In Line & Control Point */}
              {node.handleIn && (
                <>
                  <line
                    x1={node.x}
                    y1={node.y}
                    x2={node.x + node.handleIn.x}
                    y2={node.y + node.handleIn.y}
                    stroke="#38bdf8"
                    strokeWidth={1 / zoom}
                    strokeDasharray="2,2"
                  />
                  <circle
                    cx={node.x + node.handleIn.x}
                    cy={node.y + node.handleIn.y}
                    r={3.5 / zoom}
                    fill="#38bdf8"
                    stroke="#0284c7"
                    strokeWidth={1 / zoom}
                    className="pointer-events-auto cursor-pointer hover:scale-125 transition-transform"
                    onPointerDown={(e) => handleHandlePointerDown(e, node, "in")}
                    onPointerMove={(e) => handleHandlePointerMove(e, node)}
                    onPointerUp={handleHandlePointerUp}
                  />
                </>
              )}

              {/* Handle Out Line & Control Point */}
              {node.handleOut && (
                <>
                  <line
                    x1={node.x}
                    y1={node.y}
                    x2={node.x + node.handleOut.x}
                    y2={node.y + node.handleOut.y}
                    stroke="#38bdf8"
                    strokeWidth={1 / zoom}
                    strokeDasharray="2,2"
                  />
                  <circle
                    cx={node.x + node.handleOut.x}
                    cy={node.y + node.handleOut.y}
                    r={3.5 / zoom}
                    fill="#38bdf8"
                    stroke="#0284c7"
                    strokeWidth={1 / zoom}
                    className="pointer-events-auto cursor-pointer hover:scale-125 transition-transform"
                    onPointerDown={(e) => handleHandlePointerDown(e, node, "out")}
                    onPointerMove={(e) => handleHandlePointerMove(e, node)}
                    onPointerUp={handleHandlePointerUp}
                  />
                </>
              )}
            </g>
          );
        })}

        {/* Render Node Anchors */}
        {nodes.map((node) => {
          const isSelected = selectedNodeIds.includes(node.id);
          const size = (isSelected ? 7 : 5.5) / zoom;
          const half = size / 2;

          return (
            <g
              key={node.id}
              className="pointer-events-auto cursor-move"
              onPointerDown={(e) => handleNodePointerDown(e, node)}
              onPointerMove={(e) => handleNodePointerMove(e, node)}
              onPointerUp={handleNodePointerUp}
              onDoubleClick={(e) => handleNodeDoubleClick(e, node)}
            >
              {/* Sharp Node: Square */}
              {node.type === "sharp" && (
                <rect
                  x={node.x - half}
                  y={node.y - half}
                  width={size}
                  height={size}
                  fill={isSelected ? "#0284c7" : "#ffffff"}
                  stroke={isSelected ? "#38bdf8" : "#0284c7"}
                  strokeWidth={1.5 / zoom}
                  className="transition-colors hover:fill-sky-400"
                />
              )}

              {/* Smooth Node: Circle */}
              {node.type === "smooth" && (
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={half}
                  fill={isSelected ? "#0284c7" : "#ffffff"}
                  stroke={isSelected ? "#38bdf8" : "#0284c7"}
                  strokeWidth={1.5 / zoom}
                  className="transition-colors hover:fill-sky-400"
                />
              )}

              {/* Smart Node: Diamond */}
              {node.type === "smart" && (
                <polygon
                  points={`${node.x},${node.y - half} ${node.x + half},${node.y} ${node.x},${node.y + half} ${node.x - half},${node.y}`}
                  fill={isSelected ? "#f59e0b" : "#ffffff"}
                  stroke={isSelected ? "#fbbf24" : "#d97706"}
                  strokeWidth={1.5 / zoom}
                  className="transition-colors hover:fill-amber-400"
                />
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
};
