import { useState, useEffect, useRef, useCallback } from "react";
import { Eye, Check, Clock, ChevronRight, BarChart2, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useEyeTracking, type TrackingResult } from "@/hooks/useEyeTracking";

const TRACKING_DURATION_SEC = 20;

const COLOR_ROWS = [
  { colors: ["#e74c3c", "#e74c3c", "#e74c3c", "#c0392b"], oddIndex: 3 },
  { colors: ["#2ecc71", "#27ae60", "#2ecc71", "#2ecc71"], oddIndex: 1 },
  { colors: ["#3498db", "#3498db", "#3498db", "#2980b9"], oddIndex: 3 },
];

const visionTests = [
  { id: 1, title: "Object Recognition Test", desc: "Identify objects displayed in image grids", time: "5 min" },
  { id: 2, title: "Visual Clarity Test", desc: "Read text at decreasing font sizes", time: "4 min" },
  { id: 3, title: "Color Differentiation Test", desc: "Identify mismatched colors in pattern grids", time: "5 min" },
  { id: 4, title: "Scene Description Test", desc: "Describe real-life environment images", time: "6 min" },
  { id: 5, title: "Visual Tracking Simulation", desc: "Track moving objects with focus accuracy", time: "5 min" },
];

const VisionAssessment = () => {
  const [activeTest, setActiveTest] = useState<number | null>(null);

  if (activeTest !== null) {
    return <VisionTestView testId={activeTest} onBack={() => setActiveTest(null)} />;
  }

  return (
    <div className="p-8 animate-fade-in">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
          <Eye className="w-5 h-5 text-clinical-info" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Vision Ability Assessment</h1>
          <p className="text-sm text-muted-foreground">5 diagnostic tests · ~25 minutes</p>
        </div>
      </div>

      <div className="space-y-4">
        {visionTests.map((test) => (
          <div key={test.id} className="clinical-card p-5 flex items-center gap-4">
            <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center text-sm font-semibold text-muted-foreground">
              {test.id}
            </div>
            <div className="flex-1">
              <h3 className="font-display font-semibold text-sm text-foreground">{test.title}</h3>
              <p className="text-xs text-muted-foreground">{test.desc}</p>
            </div>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="w-3 h-3" /> {test.time}
            </span>
            <Button size="sm" onClick={() => setActiveTest(test.id)}>
              Start <ChevronRight className="w-3 h-3 ml-1" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};

const VisionTestView = ({ testId, onBack }: { testId: number; onBack: () => void }) => {
  const test = visionTests.find((t) => t.id === testId)!;
  const [selected, setSelected] = useState<number[]>([]);
  const [colorSelections, setColorSelections] = useState<Record<number, number>>({});
  const [claritySelection, setClaritySelection] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [dotPosition, setDotPosition] = useState({ x: 50, y: 50 });
  const [trackingResult, setTrackingResult] = useState<TrackingResult | null>(null);
  const [isTrackingComplete, setIsTrackingComplete] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const dotAnimationRef = useRef<number | null>(null);
  const dotPositionRef = useRef({ x: 50, y: 50 });

  const isObjectRecognition = testId === 1;
  const isClarity = testId === 2;
  const isColor = testId === 3;
  const isScene = testId === 4;
  const isTracking = testId === 5;

  useEffect(() => {
    if (testId === 2) {
      setClaritySelection(null);
      setElapsedTime(0);
    } else if (testId === 3) {
      setColorSelections({});
      setElapsedTime(0);
    }
  }, [testId]);

  const getDotPosition = useCallback(() => dotPositionRef.current, []);

  const stopRecording = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsRecording(false);
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  }, []);

  const handleTrackingComplete = useCallback(
    (result: TrackingResult) => {
      setTrackingResult(result);
      setIsTrackingComplete(true);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      setIsRecording(false);
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    },
    []
  );

  const { startTracking, stopTracking, completeWithCurrentResult } = useEyeTracking(
    videoRef,
    getDotPosition,
    isRecording && isTracking && !isTrackingComplete,
    handleTrackingComplete
  );

  // Start timer and camera recording for Visual Tracking Simulation
  useEffect(() => {
    if (isTracking && !streamRef.current) {
      startRecording();
    }

    return () => {
      if (!isTracking) {
        stopTracking();
        stopRecording();
      }
    };
  }, [isTracking]);

  // Timer effect: 20-second countdown for tracking, elapsed for color/other tests
  useEffect(() => {
    if (isRecording && isTracking && !isTrackingComplete) {
      timerIntervalRef.current = setInterval(() => {
        setElapsedTime((prev) => {
          if (prev >= TRACKING_DURATION_SEC - 1) {
            return TRACKING_DURATION_SEC;
          }
          return prev + 1;
        });
      }, 1000);
    } else if (isColor || isClarity) {
      timerIntervalRef.current = setInterval(() => {
        setElapsedTime((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    }

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [isRecording, isTracking, isTrackingComplete, isColor, isClarity]);

  // Auto-submit when 20 seconds reached - stop dot, show result
  useEffect(() => {
    if (isTracking && isRecording && elapsedTime >= TRACKING_DURATION_SEC && !isTrackingComplete) {
      completeWithCurrentResult(elapsedTime);
    }
  }, [elapsedTime, isTracking, isRecording, isTrackingComplete, completeWithCurrentResult]);

  // Moving dot animation for Visual Tracking
  useEffect(() => {
    if (isRecording && isTracking && !isTrackingComplete) {
      let startTime = Date.now();
      const animate = () => {
        const elapsed = (Date.now() - startTime) / 1000;
        const pos = {
          x: 50 + Math.sin(elapsed * 0.5) * 30,
          y: 50 + Math.cos(elapsed * 0.7) * 20,
        };
        dotPositionRef.current = pos;
        setDotPosition(pos);
        dotAnimationRef.current = requestAnimationFrame(animate);
      };
      dotAnimationRef.current = requestAnimationFrame(animate);
    } else {
      if (dotAnimationRef.current) {
        cancelAnimationFrame(dotAnimationRef.current);
        dotAnimationRef.current = null;
      }
    }

    return () => {
      if (dotAnimationRef.current) {
        cancelAnimationFrame(dotAnimationRef.current);
      }
    };
  }, [isRecording, isTracking, isTrackingComplete]);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }

      streamRef.current = stream;
      setIsRecording(true);
      setElapsedTime(0);
      setTrackingResult(null);
      setIsTrackingComplete(false);
      // Start eye tracking after video is ready
      setTimeout(() => startTracking(), 500);
    } catch (error) {
      console.error("Error accessing camera:", error);
      alert("Unable to access camera. Please ensure camera permissions are granted.");
    }
  }, [startTracking]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const colorCorrect = Object.keys(colorSelections).filter(
    (ri) => colorSelections[Number(ri)] === COLOR_ROWS[Number(ri)].oddIndex
  ).length;
  const colorAnswered = Object.keys(colorSelections).length;
  const colorAccuracy = colorAnswered > 0 ? Math.round((colorCorrect / colorAnswered) * 100) : 0;

  const clarityAccuracy = claritySelection !== null ? 100 : 0;

  return (
    <div className="p-8 animate-fade-in">
      <button onClick={onBack} className="text-sm text-primary hover:underline mb-4 block">← Back to tests</button>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-display text-xl font-bold text-foreground">{test.title}</h2>
          <p className="text-sm text-muted-foreground">{test.desc}</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="clinical-card px-4 py-2 flex items-center gap-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">
              {isTracking && isRecording && !isTrackingComplete
                ? formatTime(Math.max(0, TRACKING_DURATION_SEC - elapsedTime))
                : formatTime(elapsedTime)}
            </span>
          </div>
          <div className="clinical-card px-4 py-2 flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">
              {isClarity
                ? claritySelection !== null
                  ? "Score: 100%"
                  : "Score: --"
                : isColor
                  ? colorAnswered > 0
                    ? `Score: ${colorAccuracy}%`
                    : "Score: --"
                  : trackingResult
                    ? `Score: ${trackingResult.accuracyPercent}%`
                    : "Score: --"}
            </span>
          </div>
        </div>
      </div>

      {/* Test Area */}
      {isObjectRecognition && (
        <div>
          <p className="text-sm text-muted-foreground mb-4">Select all objects you can identify in the grid below:</p>
          <div className="grid grid-cols-4 gap-3 mb-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <button
                key={i}
                onClick={() => setSelected((s) => s.includes(i) ? s.filter((x) => x !== i) : [...s, i])}
                className={`aspect-square rounded-xl border-2 flex items-center justify-center text-2xl transition-colors ${
                  selected.includes(i) ? "border-primary bg-clinical-teal-light" : "border-border bg-muted"
                }`}
              >
                {["🍎", "🚗", "📱", "🌳", "✈️", "🏠", "⌚", "📚"][i]}
              </button>
            ))}
          </div>
        </div>
      )}

      {isClarity && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground mb-4">Indicate the smallest text size you can comfortably read. Click &quot;I can read this&quot; on the smallest size you can read:</p>
          {[32, 24, 18, 14, 11, 8].map((size) => {
            const isSelected = claritySelection === size;
            return (
              <div
                key={size}
                className={`clinical-card p-4 flex items-center justify-between transition-colors ${
                  isSelected ? "ring-2 ring-clinical-success border-clinical-success" : ""
                }`}
              >
                <span style={{ fontSize: size }} className="text-foreground">
                  The quick brown fox jumps over the lazy dog
                </span>
                <Button
                  variant={isSelected ? "default" : "outline"}
                  size="sm"
                  onClick={() => setClaritySelection(size)}
                >
                  {isSelected ? "✓ Selected" : "I can read this"}
                </Button>
              </div>
            );
          })}
        </div>
      )}

      {isColor && (
        <div>
          <p className="text-sm text-muted-foreground mb-4">Identify the mismatched color in each row. Click the odd one out:</p>
          <div className="space-y-4">
            {COLOR_ROWS.map((row, ri) => {
              const selectedIdx = colorSelections[ri];
              const isCorrect = selectedIdx !== undefined && selectedIdx === row.oddIndex;
              return (
                <div key={ri} className="flex gap-3 items-center">
                  {row.colors.map((c, ci) => {
                    const isSelected = selectedIdx === ci;
                    return (
                      <button
                        key={ci}
                        onClick={() =>
                          setColorSelections((prev) => ({ ...prev, [ri]: ci }))
                        }
                        className={`w-16 h-16 rounded-xl border-2 transition-colors ${
                          isSelected
                            ? isCorrect
                              ? "border-clinical-success ring-2 ring-clinical-success"
                              : "border-destructive ring-2 ring-destructive"
                            : "border-border hover:border-primary"
                        }`}
                        style={{ backgroundColor: c }}
                      />
                    );
                  })}
                  {selectedIdx !== undefined && (
                    <span className="text-sm font-medium">
                      {isCorrect ? (
                        <span className="text-clinical-success">✓ Correct</span>
                      ) : (
                        <span className="text-destructive">✗ Try again</span>
                      )}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {isScene && (
        <div>
          <p className="text-sm text-muted-foreground mb-4">Describe what you see in the image below:</p>
          <div className="clinical-card p-8 bg-muted mb-4 text-center text-muted-foreground text-sm rounded-xl h-48 flex items-center justify-center">
            [Scene image placeholder — real environment image will be displayed here]
          </div>
          <textarea
            className="w-full p-4 rounded-xl border border-border bg-card text-sm text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-ring"
            rows={4}
            placeholder="Type your description of the scene..."
          />
        </div>
      )}

      {isTracking && (
        <div>
          <p className="text-sm text-muted-foreground mb-4">
            {isTrackingComplete
              ? "Test complete. Your tracking accuracy has been recorded below."
              : "Follow the moving dot with your eyes and turn your head slightly toward it. Your face is being recorded for analysis."}
          </p>
          <div className="clinical-card bg-muted rounded-xl h-96 flex items-center justify-center relative overflow-hidden">
            {isTrackingComplete ? (
              <div className="text-center p-8">
                <Check className="w-16 h-16 text-clinical-success mx-auto mb-4" />
                <p className="font-display font-semibold text-foreground text-lg mb-2">Visual Tracking Complete</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Accuracy: {trackingResult?.accuracyPercent ?? 0}% · {trackingResult?.matchCount ?? 0} correct samples
                </p>
                <p className="text-xs text-muted-foreground">See Response Accuracy panel below for full results.</p>
              </div>
            ) : isRecording ? (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover rounded-xl"
                />
                <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/50 px-3 py-1.5 rounded-lg">
                  <div className="w-3 h-3 rounded-full bg-destructive animate-pulse-soft" />
                  <span className="text-xs text-white font-medium">Recording</span>
                </div>
                <div className="absolute top-4 right-4 bg-black/50 px-3 py-1.5 rounded-lg">
                  <span className="text-xs text-white font-medium">
                    {formatTime(Math.max(0, TRACKING_DURATION_SEC - elapsedTime))}
                  </span>
                </div>
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/50 px-4 py-2 rounded-lg">
                  <p className="text-xs text-white">
                    Focus accuracy: {trackingResult ? `${trackingResult.accuracyPercent}%` : "--"}
                  </p>
                </div>
                {/* Moving dot overlay */}
                <div
                  className="absolute w-6 h-6 rounded-full bg-primary shadow-lg pointer-events-none z-10"
                  style={{
                    top: `${dotPosition.y}%`,
                    left: `${dotPosition.x}%`,
                    transform: "translate(-50%, -50%)",
                    transition: "all 0.1s ease-out",
                  }}
                />
              </>
            ) : (
              <div className="text-center text-muted-foreground">
                <Video className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">Starting camera...</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Response Accuracy Panel */}
      <div className="mt-8 clinical-card p-5">
        <h4 className="font-display font-semibold text-sm text-foreground mb-3">Response Accuracy</h4>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-foreground">
              {isClarity
                ? claritySelection !== null
                  ? "1"
                  : "--"
                : isColor
                  ? colorAnswered > 0
                    ? colorCorrect
                    : "--"
                  : isTracking && trackingResult
                    ? trackingResult.matchCount
                    : "--"}
            </p>
            <p className="text-xs text-muted-foreground">Correct</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-foreground">
              {isClarity
                ? claritySelection !== null
                  ? "100%"
                  : "--"
                : isColor
                  ? colorAnswered > 0
                    ? `${colorAccuracy}%`
                    : "--"
                  : isTracking && trackingResult
                    ? `${trackingResult.accuracyPercent}%`
                    : "--"}
            </p>
            <p className="text-xs text-muted-foreground">Accuracy %</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-foreground">
              {isClarity || isColor
                ? formatTime(elapsedTime)
                : isTracking && trackingResult
                  ? `${trackingResult.timeTaken}s`
                  : "--"}
            </p>
            <p className="text-xs text-muted-foreground">Time Taken</p>
          </div>
        </div>
        <Progress
          value={
            isClarity
              ? clarityAccuracy
              : isColor
                ? colorAccuracy
                : isTracking && trackingResult
                  ? trackingResult.accuracyPercent
                  : 0
          }
          className="mt-4 h-1.5"
        />
      </div>

      <div className="mt-6 flex gap-3">
        <Button
          variant="outline"
          onClick={() => {
            stopTracking();
            stopRecording();
            onBack();
          }}
        >
          Save & Exit
        </Button>
        <Button
          onClick={() => {
            stopTracking();
            stopRecording();
          }}
        >
          Submit & Next Test <ChevronRight className="w-3 h-3 ml-1" />
        </Button>
      </div>
    </div>
  );
};

export default VisionAssessment;
