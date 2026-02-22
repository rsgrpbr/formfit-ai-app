import {
  PoseLandmarker,
  FilesetResolver,
  type PoseLandmarkerResult,
} from '@mediapipe/tasks-vision';
import type { PoseLandmarks } from './landmarks';

export type OnResultCallback = (landmarks: PoseLandmarks | null) => void;

export class PoseDetector {
  private landmarker: PoseLandmarker | null = null;
  private lastVideoTime = -1;
  private animFrameId: number | null = null;
  private onResult: OnResultCallback;
  private running = false;

  constructor(onResult: OnResultCallback) {
    this.onResult = onResult;
  }

  async init(): Promise<void> {
    const vision = await FilesetResolver.forVisionTasks(
      'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.32/wasm'
    );

    this.landmarker = await PoseLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath:
          'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
        delegate: 'GPU',
      },
      runningMode: 'VIDEO',
      numPoses: 1,
      minPoseDetectionConfidence: 0.5,
      minPosePresenceConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });
  }

  start(video: HTMLVideoElement): void {
    if (!this.landmarker || this.running) return;
    this.running = true;
    this.processFrame(video);
  }

  private processFrame(video: HTMLVideoElement): void {
    if (!this.running || !this.landmarker) return;

    const now = performance.now();
    if (video.currentTime !== this.lastVideoTime) {
      this.lastVideoTime = video.currentTime;
      const result: PoseLandmarkerResult = this.landmarker.detectForVideo(video, now);
      if (result.landmarks.length > 0) {
        this.onResult(result.landmarks[0] as PoseLandmarks);
      } else {
        this.onResult(null);
      }
    }

    this.animFrameId = requestAnimationFrame(() => this.processFrame(video));
  }

  stop(): void {
    this.running = false;
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
  }

  async destroy(): Promise<void> {
    this.stop();
    await this.landmarker?.close();
    this.landmarker = null;
  }
}
