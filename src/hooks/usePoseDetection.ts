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
  const detectorRef  = useRef<PoseDetector | null>(null);
  const [landmarks, setLandmarks] = useState<PoseLandmarks | null>(null);
  const [isReady, setIsReady]     = useState(false);
  const [error, setError]         = useState<string | null>(null);

  // Ref estável — evita re-criação do PoseDetector a cada render
  const onResultRef = useRef<(lm: PoseLandmarks | null) => void>(
    (lm) => setLandmarks(lm)
  );

  useEffect(() => {
    // Passa wrapper estável; o ref interno aponta sempre para setLandmarks atual
    const detector = new PoseDetector((lm) => onResultRef.current(lm));
    detectorRef.current = detector;

    detector
      .init()
      .then(() => setIsReady(true))
      .catch(err => setError(String(err)));

    return () => {
      detector.destroy();
    };
  }, []); // deps vazio — executa só uma vez, sem loop

  const startDetection = useCallback((video: HTMLVideoElement) => {
    detectorRef.current?.start(video);
  }, []);

  const stopDetection = useCallback(() => {
    detectorRef.current?.stop();
  }, []);

  return { landmarks, isReady, error, startDetection, stopDetection };
}
