import { useRef, useCallback } from "react";

const TRACKING_DURATION_MS = 20000; // 20 seconds
const SAMPLE_INTERVAL_MS = 150; // Sample every 150ms
const MATCH_THRESHOLD = 18; // Distance in % to count as "looking at dot"

// Iris landmark indices: 468-472 right eye, 473-477 left eye (MediaPipe 478 landmarks)
const RIGHT_IRIS_INDICES = [468, 469, 470, 471, 472];
const LEFT_IRIS_INDICES = [473, 474, 475, 476, 477];
// Fallback: eye region landmarks when iris not available (468-landmark model)
const RIGHT_EYE_INDICES = [33, 133, 160, 159, 158, 157, 173];
const LEFT_EYE_INDICES = [263, 362, 387, 386, 385, 384, 398];

export interface TrackingResult {
  totalSamples: number;
  matchCount: number;
  accuracyPercent: number;
  timeTaken: number;
}

export function useEyeTracking(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  getDotPosition: () => { x: number; y: number },
  isActive: boolean,
  onComplete: (result: TrackingResult) => void
) {
  const faceLandmarkerRef = useRef<any>(null);
  const detectionRef = useRef<number | null>(null);
  const samplesRef = useRef<{ matches: number; total: number }>({ matches: 0, total: 0 });
  const startTimeRef = useRef<number | null>(null);

  const lastSampleTimeRef = useRef<number>(0);

  const processFrame = useCallback(() => {
    const video = videoRef.current;
    const faceLandmarker = faceLandmarkerRef.current;
    const now = performance.now();
    if (!video || !faceLandmarker || video.readyState < 2 || !isActive) {
      detectionRef.current = requestAnimationFrame(processFrame);
      return;
    }

    // Throttle samples
    if (now - lastSampleTimeRef.current >= SAMPLE_INTERVAL_MS) {
      lastSampleTimeRef.current = now;
      try {
        const result = faceLandmarker.detectForVideo(video, now);
        if (result.faceLandmarks && result.faceLandmarks.length > 0) {
          const landmarks = result.faceLandmarks[0];
          const hasIris = landmarks.length >= 478;
          const rightIndices = hasIris ? RIGHT_IRIS_INDICES : RIGHT_EYE_INDICES;
          const leftIndices = hasIris ? LEFT_IRIS_INDICES : LEFT_EYE_INDICES;
          const divisor = hasIris ? 10 : 14; // 5+5 iris vs 7+7 eye points

          if (landmarks.length >= 468) {
            const rightCenter = rightIndices.reduce(
              (acc, i) => ({
                x: acc.x + landmarks[i].x,
                y: acc.y + landmarks[i].y,
              }),
              { x: 0, y: 0 }
            );
            const leftCenter = leftIndices.reduce(
              (acc, i) => ({
                x: acc.x + landmarks[i].x,
                y: acc.y + landmarks[i].y,
              }),
              { x: 0, y: 0 }
            );
            const gazeX = ((rightCenter.x + leftCenter.x) / divisor) * 100;
            const gazeY = ((rightCenter.y + leftCenter.y) / divisor) * 100;

            const dot = getDotPosition();
            const distance = Math.sqrt(
              Math.pow(dot.x - gazeX, 2) + Math.pow(dot.y - gazeY, 2)
            );
            samplesRef.current.total++;
            if (distance < MATCH_THRESHOLD) {
              samplesRef.current.matches++;
            }
          }
        }
      } catch (_) {
        // Ignore detection errors
      }
    }

    const elapsed = now - (startTimeRef.current ?? 0);
    if (elapsed >= TRACKING_DURATION_MS) {
      if (detectionRef.current) {
        cancelAnimationFrame(detectionRef.current);
        detectionRef.current = null;
      }
      const { matches, total } = samplesRef.current;
      onComplete({
        totalSamples: total,
        matchCount: matches,
        accuracyPercent: total > 0 ? Math.round((matches / total) * 100) : 0,
        timeTaken: Math.round(TRACKING_DURATION_MS / 1000),
      });
      return;
    }

    detectionRef.current = requestAnimationFrame(processFrame);
  }, [videoRef, getDotPosition, isActive, onComplete]);

  const startTracking = useCallback(async () => {
    if (faceLandmarkerRef.current) {
      startTimeRef.current = performance.now();
      samplesRef.current = { matches: 0, total: 0 };
      detectionRef.current = requestAnimationFrame(processFrame);
      return;
    }

    try {
      const { FilesetResolver, FaceLandmarker } = await import(
        "@mediapipe/tasks-vision"
      );
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
      );
      const faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
        },
        runningMode: "VIDEO",
        numFaces: 1,
      });
      faceLandmarkerRef.current = faceLandmarker;
      startTimeRef.current = performance.now();
      samplesRef.current = { matches: 0, total: 0 };
      detectionRef.current = requestAnimationFrame(processFrame);
    } catch (err) {
      console.error("Failed to load Face Landmarker:", err);
      onComplete({
        totalSamples: 0,
        matchCount: 0,
        accuracyPercent: 0,
        timeTaken: 20,
      });
    }
  }, [processFrame, onComplete]);

  const stopTracking = useCallback(() => {
    if (detectionRef.current) {
      cancelAnimationFrame(detectionRef.current);
      detectionRef.current = null;
    }
  }, []);

  return { startTracking, stopTracking };
}