'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { PoseDetector } from '@/lib/mediapipe/poseDetector';
import type { PoseLandmarks } from '@/lib/mediapipe/landmarks';

interface UsePoseDetectionReturn {
  landmarks: PoseLandmarks | null;
  isReady: boolean;
  error: string | null;
  startDetection: (video: HTMLVideoElement) => void;
  stopDetection: () => void;
}

export function usePoseDetection(): UsePoseDetectionReturn {
  const detectorRef = useRef<PoseDetector | null>(null);
  const latestLmRef = useRef<PoseLandmarks | null>(null); // buffer — escrito pelo detector, SEM setState
  const rafRef      = useRef<number | null>(null);

  const [landmarks, setLandmarks] = useState<PoseLandmarks | null>(null);
  const [isReady, setIsReady]     = useState(false);
  const [error, setError]         = useState<string | null>(null);

  useEffect(() => {
    // O callback do detector apenas grava no ref — zero setState, zero re-render
    const detector = new PoseDetector((lm) => {
      latestLmRef.current = lm;
    });
    detectorRef.current = detector;

    // Loop rAF independente: sincroniza ref → state uma vez por frame
    // React 18 agrupa este setState com outros do mesmo frame (batching automático)
    const syncLoop = () => {
      setLandmarks(latestLmRef.current);
      rafRef.current = requestAnimationFrame(syncLoop);
    };
    rafRef.current = requestAnimationFrame(syncLoop);

    detector
      .init()
      .then(() => setIsReady(true))
      .catch((err) => setError(String(err)));

    return () => {
      detector.destroy();
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, []); // deps vazio — executa uma única vez

  const startDetection = useCallback((video: HTMLVideoElement) => {
    detectorRef.current?.start(video);
  }, []);

  const stopDetection = useCallback(() => {
    detectorRef.current?.stop();
  }, []);

  return { landmarks, isReady, error, startDetection, stopDetection };
}
