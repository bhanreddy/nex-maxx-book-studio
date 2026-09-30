"use client";

import React, { useRef, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera, ContactShadows, Float } from "@react-three/drei";
import * as THREE from "three";
import { useUiStore } from "../../editor/stores/uiStore";
import { useEditorStore } from "../../editor/stores/editorStore";
import { X, RotateCw } from "lucide-react";

// 3D Hardcover Book Mesh
function BookMesh() {
  const meshRef = useRef<THREE.Group>(null);

  // Gentle floating animation
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = Math.sin(state.clock.getElapsedTime() * 0.4) * 0.15 - 0.2;
    }
  });

  // Dimensions for standard book (width, height, spine thickness)
  const width = 2.4;
  const height = 3.3;
  const thickness = 0.35;

  return (
    <group ref={meshRef} position={[0, 0, 0]}>
      {/* Front Cover Board */}
      <mesh position={[0, 0, thickness / 2]}>
        <boxGeometry args={[width, height, 0.04]} />
        <meshStandardMaterial
          color="#065f46"
          roughness={0.3}
          metalness={0.1}
        />
      </mesh>

      {/* Book Paper Block (Pages interior) */}
      <mesh position={[-0.05, 0, 0]}>
        <boxGeometry args={[width - 0.1, height - 0.1, thickness - 0.05]} />
        <meshStandardMaterial
          color="#fdfbf7"
          roughness={0.8}
        />
      </mesh>

      {/* Back Cover Board */}
      <mesh position={[0, 0, -thickness / 2]}>
        <boxGeometry args={[width, height, 0.04]} />
        <meshStandardMaterial
          color="#064e3b"
          roughness={0.3}
          metalness={0.1}
        />
      </mesh>

      {/* Spine Board */}
      <mesh position={[-width / 2, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
        <boxGeometry args={[thickness, height, 0.04]} />
        <meshStandardMaterial
          color="#047857"
          roughness={0.3}
        />
      </mesh>

      {/* Embossed Gold Title Foil Simulation */}
      <mesh position={[0, 0.6, thickness / 2 + 0.025]}>
        <planeGeometry args={[1.8, 0.5]} />
        <meshStandardMaterial
          color="#f59e0b"
          roughness={0.2}
          metalness={0.7}
        />
      </mesh>
    </group>
  );
}

export const Book3dPreviewModal: React.FC = () => {
  const { book3dPreviewOpen, setBook3dPreviewOpen } = useUiStore();
  const book = useEditorStore((s) => s.getActiveBook());

  if (!book3dPreviewOpen || !book) return null;

  return (
    <div
      className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4 select-none"
      onClick={() => setBook3dPreviewOpen(false)}
    >
      <div
        className="w-full max-w-3xl h-[620px] bg-[#0c1017] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between z-10 bg-gradient-to-b from-black/80 to-transparent pointer-events-auto">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-slate-100">{book.title}</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-medium">
                3D Press Mockup
              </span>
            </div>
            <span className="text-xs text-slate-400">
              {book.bindingType} • {book.grade} • {book.dimensions.name}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setBook3dPreviewOpen(false)}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 3D WebGL Canvas Scene */}
        <div className="flex-1 w-full h-full cursor-grab active:cursor-grabbing">
          <Canvas gl={{ antialias: true, alpha: true }}>
            <PerspectiveCamera makeDefault position={[0, 0.4, 5.5]} fov={40} />
            <OrbitControls
              enablePan={false}
              minDistance={3.5}
              maxDistance={7}
              maxPolarAngle={Math.PI / 1.7}
              minPolarAngle={Math.PI / 3}
            />

            {/* Studio Lighting */}
            <ambientLight intensity={0.7} />
            <directionalLight position={[4, 5, 4]} intensity={1.4} castShadow />
            <directionalLight position={[-4, 2, -2]} intensity={0.4} color="#60a5fa" />
            <pointLight position={[0, -2, 2]} intensity={0.3} color="#f59e0b" />

            <Suspense fallback={null}>
              <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.3}>
                <BookMesh />
              </Float>
              <ContactShadows
                position={[0, -1.8, 0]}
                opacity={0.6}
                scale={6}
                blur={2.4}
                far={4}
              />
            </Suspense>
          </Canvas>
        </div>

        {/* Footer Interaction Tips */}
        <div className="absolute bottom-4 left-0 right-0 flex items-center justify-center pointer-events-none">
          <div className="px-3.5 py-1.5 rounded-full bg-slate-900/80 backdrop-blur-md border border-white/10 text-[11px] text-slate-300 flex items-center gap-2 shadow-lg">
            <RotateCw className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
            <span>Click and drag to rotate book in 3D • Scroll to zoom</span>
          </div>
        </div>
      </div>
    </div>
  );
};
