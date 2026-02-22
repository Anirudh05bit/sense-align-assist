import { useRef, useCallback } from "react";

const TRACKING_DURATION_MS = 20000; // 20 seconds
const SAMPLE_INTERVAL_MS = 150; // Sample every 150ms
const MATCH_THRESHOLD = 40; // Distance in % to count as "looking at dot" (wider for head-based tracking)

// Iris landmark indices: 468-472 right eye, 473-477 left eye (MediaPipe 478 landmarks - if available)
const RIGHT_IRIS_INDICES = [468, 469, 470, 471, 472];
const LEFT_IRIS_INDICES = [473, 474, 475, 476, 477];
// Nose tip (index 1) - moves with head direction when looking at screen; works with 468-landmark model
const NOSE_TIP_INDEX = 1;

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
    const now = performance.now();
    const elapsed = now - (startTimeRef.current ?? 0);

    // Always check elapsed first - complete after 20 seconds regardless of video state
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

    const video = videoRef.current;
    const faceLandmarker = faceLandmarkerRef.current;
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

          if (landmarks.length >= 468) {
            let gazeX: number;
            let gazeY: number;

            if (landmarks.length >= 478) {
              // Iris landmarks available - use iris center (most accurate for gaze)
              const rightIris = RIGHT_IRIS_INDICES.reduce(
                (acc, i) => ({ x: acc.x + landmarks[i].x, y: acc.y + landmarks[i].y }),
                { x: 0, y: 0 }
              );
              const leftIris = LEFT_IRIS_INDICES.reduce(
                (acc, i) => ({ x: acc.x + landmarks[i].x, y: acc.y + landmarks[i].y }),
                { x: 0, y: 0 }
              );
              gazeX = ((rightIris.x + leftIris.x) / 10) * 100;
              gazeY = ((rightIris.y + leftIris.y) / 10) * 100;
            } else {
              // 468-landmark model: use nose tip - it moves with head direction when looking at screen
              // Turn your head slightly toward the dot as you follow it for best accuracy
              const nose = landmarks[NOSE_TIP_INDEX];
              gazeX = nose.x * 100;
              gazeY = nose.y * 100;
            }

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

  const completeWithCurrentResult = useCallback(
    (overrideTimeTaken?: number) => {
      if (detectionRef.current) {
        cancelAnimationFrame(detectionRef.current);
        detectionRef.current = null;
      }
      const { matches, total } = samplesRef.current;
      const startTime = startTimeRef.current;
      const elapsedMs = startTime != null ? performance.now() - startTime : TRACKING_DURATION_MS;
      const computedTime = Math.max(1, Math.round(elapsedMs / 1000));
      onComplete({
        totalSamples: total,
        matchCount: matches,
        accuracyPercent: total > 0 ? Math.round((matches / total) * 100) : 0,
        timeTaken: overrideTimeTaken ?? computedTime,
      });
    },
    [onComplete]
  );

  return { startTracking, stopTracking, completeWithCurrentResult };
}
