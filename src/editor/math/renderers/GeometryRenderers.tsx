// ============================================================================
// NEX MAXX BOOK STUDIO - GEOMETRY & SHAPES LIBRARY
// Vector 2D, 3D isometric shapes, symmetry lines, angle arcs, perimeter & area
// ============================================================================

import React from "react";
import { MathRendererProps } from "../types";

/**
 * 13. 2D Vector Geometry Shape with Dimension & Vertex Labels
 */
export const Shape2DRenderer: React.FC<MathRendererProps> = ({ data, mode }) => {
  const shape = data.shape || "triangle"; // "triangle" | "rectangle" | "parallelogram" | "trapezium" | "hexagon"
  const widthLabel = mode === "student" ? "____" : (data.widthLabel || "8 cm");
  const heightLabel = mode === "student" ? "____" : (data.heightLabel || "5 cm");

  return (
    <div className="w-full h-full flex flex-col justify-between p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 select-none">
      <div className="flex items-center justify-between text-[10px] font-bold text-teal-600 dark:text-teal-400 mb-0.5">
        <span className="capitalize">{shape} Model</span>
        <span className="text-[8px] font-mono text-slate-400">GEOMETRY</span>
      </div>

      <div className="flex-1 w-full relative flex items-center justify-center p-2">
        <svg viewBox="0 0 100 80" className="w-full h-full overflow-visible">
          {shape === "triangle" && (
            <g>
              <polygon
                points="50,15 88,68 12,68"
                fill="#ccfbf1"
                stroke="#0f766e"
                strokeWidth="2"
                strokeLinejoin="round"
              />
              {/* Vertex points */}
              <circle cx="50" cy="15" r="2.5" fill="#0f766e" />
              <text x="50" y="10" textAnchor="middle" className="text-[7px] font-bold fill-slate-700">A</text>
              <circle cx="12" cy="68" r="2.5" fill="#0f766e" />
              <text x="7" y="74" textAnchor="middle" className="text-[7px] font-bold fill-slate-700">B</text>
              <circle cx="88" cy="68" r="2.5" fill="#0f766e" />
              <text x="93" y="74" textAnchor="middle" className="text-[7px] font-bold fill-slate-700">C</text>
              {/* Dimension label */}
              <text x="50" y="77" textAnchor="middle" className="text-[7px] font-mono font-bold fill-teal-800">
                {widthLabel}
              </text>
            </g>
          )}

          {shape === "rectangle" && (
            <g>
              <rect
                x="15"
                y="20"
                width="70"
                height="40"
                rx="2"
                fill="#ccfbf1"
                stroke="#0f766e"
                strokeWidth="2"
              />
              <text x="50" y="15" textAnchor="middle" className="text-[7px] font-mono font-bold fill-teal-800">
                length = {widthLabel}
              </text>
              <text x="92" y="42" textAnchor="middle" className="text-[7px] font-mono font-bold fill-teal-800">
                {heightLabel}
              </text>
            </g>
          )}

          {shape === "parallelogram" && (
            <g>
              <polygon
                points="25,20 90,20 75,60 10,60"
                fill="#ccfbf1"
                stroke="#0f766e"
                strokeWidth="2"
                strokeLinejoin="round"
              />
              {/* Dotted height altitude */}
              <line x1="25" y1="20" x2="25" y2="60" stroke="#0f766e" strokeWidth="1" strokeDasharray="2,2" />
              <text x="50" y="70" textAnchor="middle" className="text-[7px] font-mono font-bold fill-teal-800">
                base = {widthLabel}
              </text>
            </g>
          )}

          {shape === "hexagon" && (
            <g>
              <polygon
                points="50,10 85,28 85,62 50,80 15,62 15,28"
                fill="#ccfbf1"
                stroke="#0f766e"
                strokeWidth="2"
                strokeLinejoin="round"
              />
            </g>
          )}
        </svg>
      </div>

      <div className="text-[8px] text-center text-slate-500 font-medium">
        Vertices & Edges Labeled
      </div>
    </div>
  );
};

/**
 * 13. 3D Geometric Shape (Isometric Cube, Cylinder, Cone, Sphere)
 */
export const Shape3DRenderer: React.FC<MathRendererProps> = ({ data }) => {
  const shape = data.shape || "cube"; // "cube" | "cylinder" | "cone" | "sphere"

  return (
    <div className="w-full h-full flex flex-col justify-between p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 select-none">
      <div className="flex items-center justify-between text-[10px] font-bold text-teal-600 dark:text-teal-400 mb-0.5">
        <span className="capitalize">3D {shape}</span>
        <span className="text-[8px] font-mono text-slate-400">ISOMETRIC</span>
      </div>

      <div className="flex-1 w-full relative flex items-center justify-center p-2">
        <svg viewBox="0 0 100 80" className="w-full h-full overflow-visible">
          {shape === "cube" && (
            <g>
              {/* Top face */}
              <polygon points="50,15 80,30 50,45 20,30" fill="#99f6e4" stroke="#0f766e" strokeWidth="1.5" />
              {/* Left face */}
              <polygon points="20,30 50,45 50,75 20,60" fill="#5eead4" stroke="#0f766e" strokeWidth="1.5" />
              {/* Right face */}
              <polygon points="50,45 80,30 80,60 50,75" fill="#2dd4bf" stroke="#0f766e" strokeWidth="1.5" />
              {/* Hidden dotted edges */}
              <line x1="20" y1="60" x2="50" y2="45" stroke="#0f766e" strokeWidth="1" strokeDasharray="2,2" opacity="0.4" />
            </g>
          )}

          {shape === "cylinder" && (
            <g>
              <ellipse cx="50" cy="65" rx="30" ry="10" fill="#2dd4bf" stroke="#0f766e" strokeWidth="1.5" />
              <rect x="20" y="25" width="60" height="40" fill="#5eead4" />
              <line x1="20" y1="25" x2="20" y2="65" stroke="#0f766e" strokeWidth="1.5" />
              <line x1="80" y1="25" x2="80" y2="65" stroke="#0f766e" strokeWidth="1.5" />
              <ellipse cx="50" cy="25" rx="30" ry="10" fill="#99f6e4" stroke="#0f766e" strokeWidth="1.5" />
            </g>
          )}

          {shape === "cone" && (
            <g>
              <ellipse cx="50" cy="65" rx="30" ry="10" fill="#2dd4bf" stroke="#0f766e" strokeWidth="1.5" />
              <polygon points="50,15 80,65 20,65" fill="#5eead4" stroke="#0f766e" strokeWidth="1.5" />
            </g>
          )}
        </svg>
      </div>

      <div className="text-[8px] text-center text-slate-500 font-mono">
        Faces, Edges & Vertices Model
      </div>
    </div>
  );
};

/**
 * 13. Line of Symmetry
 */
export const SymmetryRenderer: React.FC<MathRendererProps> = () => {
  return (
    <div className="w-full h-full flex flex-col justify-between p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 select-none">
      <div className="flex items-center justify-between text-[10px] font-bold text-teal-600 dark:text-teal-400 mb-0.5">
        <span>Line of Symmetry</span>
      </div>

      <div className="flex-1 w-full relative flex items-center justify-center p-2">
        <svg viewBox="0 0 100 80" className="w-full h-full">
          {/* Butterfly or heart symmetric shape */}
          <path
            d="M 50,68 C 15,50 15,20 35,20 C 45,20 50,30 50,30 C 50,30 55,20 65,20 C 85,20 85,50 50,68 Z"
            fill="#ccfbf1"
            stroke="#0f766e"
            strokeWidth="2"
          />
          {/* Dashed Red Line of Symmetry */}
          <line x1="50" y1="10" x2="50" y2="76" stroke="#ef4444" strokeWidth="2" strokeDasharray="3,3" />
        </svg>
      </div>

      <div className="text-[8px] text-center text-rose-500 font-mono font-bold">
        --- Axis of Reflection ---
      </div>
    </div>
  );
};

/**
 * 13. Angle Representation with Arc
 */
export const AnglesRenderer: React.FC<MathRendererProps> = ({ data, mode }) => {
  const degrees = data.degrees ?? 60;
  const label = data.label || "Acute Angle";

  return (
    <div className="w-full h-full flex flex-col justify-between p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 select-none">
      <div className="flex items-center justify-between text-[10px] font-bold text-teal-600 mb-0.5">
        <span>{label}</span>
        <span className="font-mono text-xs font-bold text-teal-800">{mode === "student" ? "?°" : `${degrees}°`}</span>
      </div>

      <div className="flex-1 w-full relative flex items-center justify-center p-2">
        <svg viewBox="0 0 100 80" className="w-full h-full">
          {/* Base ray */}
          <line x1="20" y1="65" x2="85" y2="65" stroke="#0f766e" strokeWidth="2.5" strokeLinecap="round" />
          {/* Arm ray rotated by angle */}
          <line x1="20" y1="65" x2="65" y2="25" stroke="#0f766e" strokeWidth="2.5" strokeLinecap="round" />
          {/* Angle arc */}
          <path d="M 40,65 A 20 20 0 0 0 35,52" fill="none" stroke="#f59e0b" strokeWidth="2" />
          <circle cx="20" cy="65" r="3" fill="#0f766e" />
        </svg>
      </div>

      <div className="text-[8px] text-center text-slate-500">
        Vertex & Rays Diagram
      </div>
    </div>
  );
};
