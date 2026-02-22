'use client';

import { useEffect, useRef, forwardRef } from 'react';

interface CameraFeedProps {
  onReady?: (video: HTMLVideoElement) => void;
  facingMode?: 'user' | 'environment';
  className?: string;
}

const CameraFeed = forwardRef<HTMLVideoElement, CameraFeedProps>(
  ({ onReady, facingMode = 'user', className = '' }, ref) => {
    const internalRef = useRef<HTMLVideoElement>(null);
    const videoRef = (ref as React.RefObject<HTMLVideoElement>) || internalRef;

    useEffect(() => {
      let stream: MediaStream | null = null;

      async function startCamera() {
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode,
              width: { ideal: 1280 },
              height: { ideal: 720 },
            },
            audio: false,
          });

          const video = videoRef.current;
          if (!video) return;

          video.srcObject = stream;
          video.onloadedmetadata = () => {
            video.play();
            onReady?.(video);
          };
        } catch (err) {
          console.error('[CameraFeed] Erro ao acessar câmera:', err);
        }
      }

      startCamera();

      return () => {
        stream?.getTracks().forEach(t => t.stop());
      };
    }, [facingMode, onReady, videoRef]);

    return (
      <video
        ref={videoRef}
        playsInline
        muted
        className={`object-cover ${className}`}
        style={{ transform: facingMode === 'user' ? 'scaleX(-1)' : 'none' }}
      />
    );
  }
);

CameraFeed.displayName = 'CameraFeed';
export default CameraFeed;
