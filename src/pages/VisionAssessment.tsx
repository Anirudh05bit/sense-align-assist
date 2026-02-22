import { useState, useEffect, useRef, useCallback } from "react";
import { Eye, Check, Clock, ChevronRight, BarChart2, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useEyeTracking, type TrackingResult } from "@/hooks/useEyeTracking";
import umagepng from "../public/image.png";

const TRACKING_DURATION_SEC = 20;

// Object Recognition Test Data
const OBJECTS = [
  { id: 1, label: "apple", category: "food", emoji: "🍎" },
  { id: 2, label: "car", category: "vehicle", emoji: "🚗" },
  { id: 3, label: "phone", category: "device", emoji: "📱" },
  { id: 4, label: "tree", category: "nature", emoji: "🌳" },
  { id: 5, label: "airplane", category: "vehicle", emoji: "✈️" },
  { id: 6, label: "house", category: "building", emoji: "🏠" },
  { id: 7, label: "clock", category: "device", emoji: "⏰" },
  { id: 8, label: "books", category: "education", emoji: "📚" },
];

const RECOGNITION_CATEGORIES = ["vehicle", "device", "nature"];

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

  const handleNextTest = (currentTestId: number) => {
    if (currentTestId < 5) {
      setActiveTest(currentTestId + 1);
    } else {
      setActiveTest(null);
    }
  };

  if (activeTest !== null) {
    return <VisionTestView testId={activeTest} onBack={() => setActiveTest(null)} onNext={handleNextTest} />;
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

const VisionTestView = ({ testId, onBack, onNext }: { testId: number; onBack: () => void; onNext: (currentTestId: number) => void }) => {
  const test = visionTests.find((t) => t.id === testId)!;
  const [selected, setSelected] = useState<number[]>([]);
  const [colorSelections, setColorSelections] = useState<Record<number, number>>({});
  const [claritySelection, setClaritySelection] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [sceneDescriptionText, setSceneDescriptionText] = useState<string>("");
  const [sceneAccuracy, setSceneAccuracy] = useState<number | null>(null);
  const [objectRecognitionRound, setObjectRecognitionRound] = useState(1);
  const [objectRecognitionTargetLabel, setObjectRecognitionTargetLabel] = useState<string>("");
  const [objectRecognitionStartTime, setObjectRecognitionStartTime] = useState<number | null>(null);
  const [objectRecognitionRoundStartTime, setObjectRecognitionRoundStartTime] = useState<number | null>(null);
  const [objectRecognitionRoundTimes, setObjectRecognitionRoundTimes] = useState<number[]>([]);
  const [objectRecognitionCorrectCount, setObjectRecognitionCorrectCount] = useState(0);
  const [objectRecognitionShowCorrect, setObjectRecognitionShowCorrect] = useState(false);
  const [objectRecognitionMetrics, setObjectRecognitionMetrics] = useState<any>(null);
  const [dotPosition, setDotPosition] = useState({ x: 50, y: 50 });
  const [trackingResult, setTrackingResult] = useState<TrackingResult | null>(null);
  const [isTrackingComplete, setIsTrackingComplete] = useState(false);
  const [isTestSubmitted, setIsTestSubmitted] = useState(false);
  const [testFinalScore, setTestFinalScore] = useState<number>(0);
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

  // Calculate scene description accuracy based on key elements
  const calculateSceneAccuracy = (text: string): number => {
    const lowerText = text.toLowerCase();
    const keyElements = [
      { keywords: ["women", "mothers", "mother", "female", "lady", "ladies"], weight: 0.25 },
      { keywords: ["children", "kids", "kid", "boys", "girls", "child"], weight: 0.25 },
      { keywords: ["football", "soccer", "ball", "playing"], weight: 0.25 },
      { keywords: ["field", "grass", "ground", "pitch", "outdoor"], weight: 0.25 },
    ];
    
    let accuracy = 0;
    keyElements.forEach(element => {
      const hasKeyword = element.keywords.some(keyword => lowerText.includes(keyword));
      if (hasKeyword) {
        accuracy += element.weight * 100;
      }
    });
    
    return Math.round(accuracy);
  };

  // Object Recognition: Generate random label for the round
  const generateRandomLabel = (): string => {
    const randomObj = OBJECTS[Math.floor(Math.random() * OBJECTS.length)];
    return randomObj.label;
  };

  // Object Recognition: Calculate metrics from completed rounds
  const calculateObjectRecognitionMetrics = (correctCount: number, roundTimes: number[]) => {
    const totalTime = roundTimes.reduce((a, b) => a + b, 0);
    const avgTimePerRound = totalTime / roundTimes.length;
    const accuracyScore = (correctCount / 3) * 100;
    
    // Time score: faster times get higher scores
    let timeScore = 100;
    if (avgTimePerRound <= 3) timeScore = 100;
    else if (avgTimePerRound <= 5) timeScore = 90;
    else if (avgTimePerRound <= 10) timeScore = 80;
    else if (avgTimePerRound <= 15) timeScore = 70;
    else timeScore = 50;
    
    return {
      correctCount,
      totalRounds: 3,
      accuracyScore: Math.round(accuracyScore),
      totalTime: totalTime.toFixed(1),
      avgTimePerRound: avgTimePerRound.toFixed(1),
      timeScore,
      finalScore: Math.round((accuracyScore * 0.7) + (timeScore * 0.3)),
    };
  };

  // Object Recognition: Calculate time-based cognitive score
  const calculateTimeScore = (responseTime: number): number => {
    if (responseTime <= 5) return 100;
    if (responseTime <= 10) return 80;
    if (responseTime <= 20) return 60;
    return 40;
  };

  // Object Recognition: Generate feedback based on metrics
  const generateObjectRecognitionFeedback = (accuracyScore: number, timeScore: number, responseTime: number): string => {
    const highAccuracy = accuracyScore >= 75;
    const highSpeed = timeScore >= 80;
    
    if (highAccuracy && highSpeed) {
      return "Excellent! Quick and accurate visual identification.";
    } else if (highAccuracy && !highSpeed) {
      return "Good visual identification. Processing speed can improve with practice.";
    } else if (!highAccuracy && highSpeed) {
      return "May be responding impulsively. Encourage careful observation.";
    } else {
      return "Needs structured guidance. Visual discrimination training recommended.";
    }
  };

  // Object Recognition: Get cognitive speed rating
  const getCognitiveSpeedRating = (timeScore: number): string => {
    if (timeScore >= 80) return "Fast";
    if (timeScore >= 60) return "Moderate";
    return "Slow";
  };

  // Handle scene description text change
  const handleSceneDescriptionChange = (text: string) => {
    setSceneDescriptionText(text);
    if (text.trim().length > 0) {
      const accuracy = calculateSceneAccuracy(text);
      setSceneAccuracy(accuracy);
    } else {
      setSceneAccuracy(null);
    }
  };

  useEffect(() => {
    if (testId === 2) {
      setClaritySelection(null);
      setElapsedTime(0);
    } else if (testId === 3) {
      setColorSelections({});
      setElapsedTime(0);
    } else if (testId === 4) {
      setSceneDescriptionText("");
      setSceneAccuracy(null);
    } else if (testId === 1) {
      setSelected([]);
      setObjectRecognitionRound(1);
      setObjectRecognitionTargetLabel(generateRandomLabel());
      setObjectRecognitionStartTime(Date.now());
      setObjectRecognitionRoundStartTime(Date.now());
      setObjectRecognitionRoundTimes([]);
      setObjectRecognitionCorrectCount(0);
      setObjectRecognitionShowCorrect(false);
      setObjectRecognitionMetrics(null);
    }
    setIsTestSubmitted(false);
    setTestFinalScore(0);
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
    } else if (isColor || isClarity || isScene) {
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
  }, [isRecording, isTracking, isTrackingComplete, isColor, isClarity, isScene]);

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

  const clarityAccuracy = (() => {
    if (claritySelection === null) return 0;
    const maxSize = 32;
    const minSize = 8;
    // smaller text size -> higher score (8px -> 100%, 32px -> 0%)
    const pct = Math.round(((maxSize - claritySelection) / (maxSize - minSize)) * 100);
    return Math.max(0, Math.min(100, pct));
  })();

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
                : isScene || isClarity || isColor
                  ? formatTime(elapsedTime)
                  : formatTime(elapsedTime)}
            </span>
          </div>
          <div className="clinical-card px-4 py-2 flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">
              {isClarity
                ? claritySelection !== null
                  ? `Score: ${clarityAccuracy}%`
                  : "Score: --"
                : isColor
                  ? colorAnswered > 0
                    ? `Score: ${colorAccuracy}%`
                    : "Score: --"
                  : isScene
                    ? sceneAccuracy !== null
                      ? `Score: ${sceneAccuracy}%`
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
          {!objectRecognitionMetrics ? (
            <>
              <div className="mb-8">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Round {objectRecognitionRound} of 3</p>
                    <p className="text-sm text-foreground font-semibold">Find and select:</p>
                  </div>
                  <div className="text-5xl">{OBJECTS.find(obj => obj.label === objectRecognitionTargetLabel)?.emoji}</div>
                </div>
                <p className="text-2xl font-bold text-clinical-info capitalize text-center py-4 bg-blue-50 rounded-xl border-2 border-blue-200">
                  {objectRecognitionTargetLabel}
                </p>
              </div>

              {objectRecognitionShowCorrect && (
                <div className="mb-6 p-4 bg-green-50 border-2 border-green-300 rounded-xl text-center animate-pulse">
                  <Check className="w-8 h-8 text-clinical-success mx-auto mb-2" />
                  <p className="text-green-700 font-semibold">Correct! ✓</p>
                </div>
              )}
              
              <div className="grid grid-cols-4 gap-3 mb-6">
                {OBJECTS.map((obj) => {
                  const isTarget = obj.label === objectRecognitionTargetLabel && objectRecognitionShowCorrect;
                  return (
                    <button
                      key={obj.id}
                      onClick={() => {
                        if (!objectRecognitionRoundStartTime) {
                          setObjectRecognitionRoundStartTime(Date.now());
                        }
                        
                        if (obj.label === objectRecognitionTargetLabel) {
                          // Correct selection
                          const roundTime = (Date.now() - (objectRecognitionRoundStartTime || Date.now())) / 1000;
                          setObjectRecognitionShowCorrect(true);
                          setObjectRecognitionCorrectCount(objectRecognitionCorrectCount + 1);
                          
                          // Move to next round after 1.5 seconds
                          setTimeout(() => {
                            if (objectRecognitionRound < 3) {
                              setObjectRecognitionRound(objectRecognitionRound + 1);
                              setObjectRecognitionTargetLabel(generateRandomLabel());
                              setObjectRecognitionRoundStartTime(Date.now());
                              setObjectRecognitionShowCorrect(false);
                              setObjectRecognitionRoundTimes([...objectRecognitionRoundTimes, roundTime]);
                            } else {
                              // All 3 rounds complete
                              const finalTimes = [...objectRecognitionRoundTimes, roundTime];
                              const metrics = calculateObjectRecognitionMetrics(objectRecognitionCorrectCount + 1, finalTimes);
                              setObjectRecognitionMetrics(metrics);
                            }
                          }, 1500);
                        }
                      }}
                      disabled={objectRecognitionShowCorrect}
                      className={`aspect-square rounded-xl border-2 flex items-center justify-center text-3xl transition-all ${
                        isTarget
                          ? "border-clinical-success bg-green-50 ring-2 ring-clinical-success scale-110"
                          : "border-border bg-muted hover:border-primary disabled:opacity-50"
                      }`}
                      title={obj.label}
                    >
                      {obj.emoji}
                    </button>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="space-y-4">
              <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
                <h4 className="font-display font-semibold text-foreground mb-4">Label Recognition Results</h4>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-white rounded-lg p-3">
                    <p className="text-xs text-muted-foreground">Accuracy</p>
                    <p className="text-2xl font-bold text-clinical-info">{objectRecognitionMetrics.accuracyScore}%</p>
                    <p className="text-xs text-muted-foreground mt-1">{objectRecognitionMetrics.correctCount}/3 Correct</p>
                  </div>
                  <div className="bg-white rounded-lg p-3">
                    <p className="text-xs text-muted-foreground">Total Time</p>
                    <p className="text-2xl font-bold text-foreground">{objectRecognitionMetrics.totalTime}s</p>
                  </div>
                  <div className="bg-white rounded-lg p-3">
                    <p className="text-xs text-muted-foreground">Avg Time per Round</p>
                    <p className="text-2xl font-bold text-foreground">{objectRecognitionMetrics.avgTimePerRound}s</p>
                  </div>
                  <div className="bg-white rounded-lg p-3">
                    <p className="text-xs text-muted-foreground">Speed Score</p>
                    <p className="text-2xl font-bold text-foreground">{objectRecognitionMetrics.timeScore}%</p>
                  </div>
                </div>

                <div className="bg-white rounded-lg p-4 mb-4">
                  <p className="text-sm text-muted-foreground mb-2">Performance Feedback</p>
                  <div className="space-y-2">
                    {objectRecognitionMetrics.correctCount === 3 && objectRecognitionMetrics.avgTimePerRound <= 5 && (
                      <p className="text-sm text-green-700 font-semibold">✓ Excellent recognition and quick response time!</p>
                    )}
                    {objectRecognitionMetrics.correctCount === 3 && objectRecognitionMetrics.avgTimePerRound > 5 && (
                      <p className="text-sm text-blue-700 font-semibold">✓ All correct, but try to respond faster.</p>
                    )}
                    {objectRecognitionMetrics.correctCount < 3 && objectRecognitionMetrics.correctCount > 0 && (
                      <p className="text-sm text-orange-700 font-semibold">⊝ {objectRecognitionMetrics.correctCount}/3 correct. Pay closer attention to object matching.</p>
                    )}
                    {objectRecognitionMetrics.correctCount === 0 && (
                      <p className="text-sm text-red-700 font-semibold">✗ Needs more practice. Match the label carefully before selecting.</p>
                    )}
                  </div>
                </div>

                <div className="bg-gradient-to-r from-blue-100 to-blue-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-foreground">Final Score</span>
                    <span className="text-3xl font-bold text-clinical-info">{objectRecognitionMetrics.finalScore} / 100</span>
                  </div>
                  <Progress value={objectRecognitionMetrics.finalScore} className="mt-3 h-2" />
                </div>
              </div>
            </div>
          )}
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
          <p className="text-sm text-muted-foreground mb-4"></p>
          <div className="clinical-card p-0 mb-4 rounded-xl overflow-hidden h-96 flex items-center justify-center bg-muted">
            <img 
              src="/Images/image.png" 
              alt="Scene description test image"
              className="w-full h-full object-cover"
            />
          </div>
          <textarea
            className="w-full p-4 rounded-xl border border-border bg-card text-sm text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-ring"
            rows={4}
            placeholder="Type your description of the scene..."
            value={sceneDescriptionText}
            onChange={(e) => handleSceneDescriptionChange(e.target.value)}
          />
          {sceneAccuracy !== null && (
            <div className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-200">
              
              

              <p className="text-xs text-blue-700 mt-2">
                {sceneAccuracy === 100
                  ? "Perfect! You identified all key elements."
                  : sceneAccuracy >= 75
                  ? "Great! You identified most key elements."
                  : sceneAccuracy >= 50
                  ? "Good! You identified several key elements."
                  : "Keep looking for more details in the scene."}
              </p>
            </div>
          )}
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
              {isObjectRecognition && !objectRecognitionMetrics
                ? `${objectRecognitionRound}/3`
                : isClarity
                  ? claritySelection !== null
                    ? "1"
                    : "--"
                  : isColor
                    ? colorAnswered > 0
                      ? colorCorrect
                      : "--"
                    : isScene
                      ? sceneDescriptionText.length > 0
                        ? "1"
                        : "--"
                      : isTracking && trackingResult
                        ? trackingResult.matchCount
                        : "--"}
            </p>
            <p className="text-xs text-muted-foreground">{isObjectRecognition && !objectRecognitionMetrics ? "Round" : "Response"}</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-foreground">
              {isObjectRecognition && !objectRecognitionMetrics
                ? "--"
                : isClarity
                  ? claritySelection !== null
                    ? `${clarityAccuracy}%`
                    : "--"
                  : isColor
                    ? colorAnswered > 0
                      ? `${colorAccuracy}%`
                      : "--"
                    : isScene
                      ? sceneAccuracy !== null
                        ? `${sceneAccuracy}%`
                        : "--"
                      : isTracking && trackingResult
                        ? `${trackingResult.accuracyPercent}%`
                        : "--"}
            </p>
            <p className="text-xs text-muted-foreground">Accuracy %</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-foreground">
              {isObjectRecognition && objectRecognitionRoundStartTime
                ? `${((Date.now() - objectRecognitionRoundStartTime) / 1000).toFixed(1)}s`
                : isClarity || isColor
                  ? formatTime(elapsedTime)
                  : isScene
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
            isObjectRecognition && !objectRecognitionMetrics
              ? (objectRecognitionCorrectCount / 3) * 100
              : isClarity
                ? clarityAccuracy
                : isColor
                  ? colorAccuracy
                  : isScene
                    ? sceneAccuracy || 0
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
        {!isObjectRecognition && (
          <Button
            onClick={() => {
              // Calculate final score based on test type
              let finalScore = 0;
              let testName = test.title;
              
              if (isClarity && claritySelection !== null) {
                finalScore = clarityAccuracy;
              } else if (isColor && colorAnswered > 0) {
                finalScore = colorAccuracy;
              } else if (isScene && sceneAccuracy !== null) {
                finalScore = sceneAccuracy;
              } else if (isTracking && trackingResult) {
                finalScore = trackingResult.accuracyPercent;
              }
              
              console.log(`✓ Test Complete - ${testName} - Accuracy: ${finalScore}%`);
              
              // Stop timer and recording
              if (timerIntervalRef.current) {
                clearInterval(timerIntervalRef.current);
                timerIntervalRef.current = null;
              }
              stopTracking();
              stopRecording();
              
              // Show completion screen
              setTestFinalScore(finalScore);
              setIsTestSubmitted(true);
            }}
          >
            Submit & Next Test <ChevronRight className="w-3 h-3 ml-1" />
          </Button>
        )}
        {isObjectRecognition && objectRecognitionMetrics && (
          <Button
            onClick={() => {
              console.log(`✓ Test Complete - ${test.title} - Accuracy: ${objectRecognitionMetrics.accuracyScore}%`);
              
              // Stop timer and recording
              if (timerIntervalRef.current) {
                clearInterval(timerIntervalRef.current);
                timerIntervalRef.current = null;
              }
              stopTracking();
              stopRecording();
              
              // Show completion screen
              setTestFinalScore(objectRecognitionMetrics.finalScore);
              setIsTestSubmitted(true);
            }}
          >
            Submit & Next Test <ChevronRight className="w-3 h-3 ml-1" />
          </Button>
        )}
      </div>

      {/* Test Completion Screen */}
      {isTestSubmitted && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-card rounded-2xl p-8 max-w-md w-full mx-4 clinical-card shadow-2xl">
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-clinical-success" />
              </div>
             
            </div>
            
            
            
            <Button
              onClick={() => {
                setIsTestSubmitted(false);
                onNext(testId);
              }}
              className="w-full"
            >
              Go to Next Test <ChevronRight className="w-3 h-3 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default VisionAssessment;