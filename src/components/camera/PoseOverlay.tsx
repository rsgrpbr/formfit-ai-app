'use client';

import { useEffect, useRef, useState } from 'react';
import type { PoseLandmarks } from '@/lib/mediapipe/landmarks';

const CONNECTIONS: [number, number][] = [
  [11, 12], // ombros
  [11, 13], [13, 15], // braço esquerdo
  [12, 14], [14, 16], // braço direito
  [11, 23], [12, 24], // tronco
  [23, 24], // quadril
  [23, 25], [25, 27], // perna esquerda
  [24, 26], [26, 28], // perna direita
  [27, 29], [29, 31], // pé esquerdo
  [28, 30], [30, 32], // pé direito
];

interface PoseOverlayProps {
  landmarks: PoseLandmarks | null;
  width: number;
  height: number;
  score?: number;
  mirrored?: boolean;
}

export default function PoseOverlay({
  landmarks,
  width,
  height,
  score = 100,
  mirrored = true,
}: PoseOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [showSkeleton, setShowSkeleton] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, width, height);
    if (!landmarks || !showSkeleton) return;

    const color = score >= 80 ? '#22c55e' : score >= 50 ? '#f59e0b' : '#ef4444';

    if (mirrored) {
      ctx.save();
      ctx.translate(width, 0);
      ctx.scale(-1, 1);
    }

    // Conexões do esqueleto
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    CONNECTIONS.forEach(([a, b]) => {
      const pA = landmarks[a];
      const pB = landmarks[b];
      if (!pA || !pB) return;
      ctx.beginPath();
      ctx.moveTo(pA.x * width, pA.y * height);
      ctx.lineTo(pB.x * width, pB.y * height);
      ctx.stroke();
    });

    // Pontos articulares
    ctx.fillStyle = '#ffffff';
    landmarks.forEach(lm => {
      if ((lm.visibility ?? 1) < 0.5) return;
      ctx.beginPath();
      ctx.arc(lm.x * width, lm.y * height, 4, 0, 2 * Math.PI);
      ctx.fill();
    });

    if (mirrored) ctx.restore();
  }, [landmarks, width, height, score, mirrored, showSkeleton]);

  return (
    <div className="absolute inset-0 pointer-events-none">
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="absolute inset-0"
      />
      {/* fixed escapa o overflow-hidden do container da câmera — visível no mobile */}
      <button
        onClick={() => setShowSkeleton(v => !v)}
        title={showSkeleton ? 'Ocultar esqueleto' : 'Mostrar esqueleto'}
        className={`fixed bottom-6 right-4 z-50 pointer-events-auto
          min-w-[48px] min-h-[48px] px-4 py-3
          rounded-xl text-sm font-semibold
          shadow-lg backdrop-blur-sm transition-all
          flex items-center justify-center gap-1
          ${showSkeleton
            ? 'bg-green-600/90 text-white'
            : 'bg-gray-900/90 text-gray-300 hover:text-white hover:bg-gray-700/90'
          }`}
      >
        🦴 {showSkeleton ? 'ON' : 'OFF'}
      </button>
    </div>
  );
}
