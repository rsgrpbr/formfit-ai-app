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
  const latestLmRef  = useRef<PoseLandmarks | null>(null); // escrito pelo detector (60fps)
  const prevLmRef    = useRef<PoseLandmarks | null>(null); // última versão enviada ao state
  const rafRef       = useRef<number | null>(null);

  const [landmarks, setLandmarks] = useState<PoseLandmarks | null>(null);
  const [isReady, setIsReady]     = useState(false);
  const [error, setError]         = useState<string | null>(null);

  useEffect(() => {
    const detector = new PoseDetector((lm) => {
      latestLmRef.current = lm;
    });
    detectorRef.current = detector;

    const syncLoop = () => {
      const next = latestLmRef.current;

      // Só chama setLandmarks se o objeto realmente mudou (nova referência do detector)
      // ou se o estado nulo ↔ detectado mudou
      if (next !== prevLmRef.current) {
        prevLmRef.current = next;
        setLandmarks(next);
      }

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
  }, []);

  const startDetection = useCallback((video: HTMLVideoElement) => {
    detectorRef.current?.start(video);
  }, []);

  const stopDetection = useCallback(() => {
    detectorRef.current?.stop();
  }, []);

  return { landmarks, isReady, error, startDetection, stopDetection };
}
