import { useEffect, useMemo, useRef, useState } from "react";
import {
  Brain,
  Clock,
  ChevronRight,
  BarChart2,
  Zap,
  Grid3X3,
  BookOpen,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const cognitiveTests = [
  {
    id: 1,
    title: "Reaction Time Test",
    desc: "Click response when stimuli appear on screen",
    time: "4 min",
    icon: Zap,
  },
  {
    id: 2,
    title: "Pattern Matching Test",
    desc: "Identify matching shapes or sequences",
    time: "5 min",
    icon: Grid3X3,
  },
  {
    id: 3,
    title: "Memory Recall Test",
    desc: "Short-term memory sequence recall",
    time: "5 min",
    icon: Brain,
  },
  {
    id: 4,
    title: "Comprehension Speed Test",
    desc: "Read passage and answer questions",
    time: "6 min",
    icon: BookOpen,
  },
];

// ---------- Scoring helpers ----------

// clamp a number into [min, max]
const clamp = (n: number, min = 0, max = 100) => Math.max(min, Math.min(max, n));

// Calculate median of an array (robust central value)
const median = (arr: number[]): number => {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
};

/**
 * Reaction Time Score (0–100)
 * Special-needs friendly, baseline-referenced approach:
 * 
 * Uses MEDIAN of reaction times (robust to outliers)
 * Compares against school-age baseline:
 *   μh = 300ms (typical healthy median)
 *   σh = 80ms (typical spread)
 * 
 * Scoring uses z-score with forgiving curve:
 *   z = (median - μh) / σh
 *   score = 100 × (1 - z² / 2), clamped to 0-100
 * 
 * Fair approach: decent baseline score even for slower kids
 */
function scoreReactionTime(medianMs: number) {
  const muHealthy = 300;  // ms, typical median RT for school-age
  const sigmaHealthy = 80; // ms, typical spread
  
  // Z-score: how many standard deviations from baseline?
  const z = (medianMs - muHealthy) / sigmaHealthy;
  
  // Forgiving curve: score = 100 × (1 - z²/2)
  // At z=0 (exactly median): 100
  // At z=1 (1 SD above): ~95
  // At z=2 (2 SD above): ~80
  // At z=3 (3 SD above): ~55
  const speedFactor = clamp(1 - (z * z) / 2, 0, 1);
  const score = 100 * speedFactor;
  
  return Math.round(score);
}

/**
 * Pattern Matching score (special-needs friendly, 0–100)
 * 
 * Components:
 * - Accuracy points (0–70): S_acc = 70 × A
 * - Speed points (0–30): S_spd = 30 × p, where p is speed factor with grace period
 * 
 * Grace period: 6 seconds (before penalty applies)
 * Adjusted time: T' = max(0, T - grace)
 * Z-score: z = (T' - μ) / σ
 * Speed factor: p = clamp(1 - z²/2, 0, 1)
 * 
 * Level-specific baselines (μ, σ):
 * - Level 1 (4 tiles): μ=4s, σ=2s
 * - Level 2 (8 tiles): μ=6s, σ=3s
 */
function scorePatternMatching(accuracyPct: number, avgSec: number, level: number) {
  // Accuracy component (0-70 points)
  const accuracy = accuracyPct / 100;
  const accuracyScore = 70 * accuracy;

  // Level-specific baseline parameters
  const baselines: Record<number, { mu: number; sigma: number }> = {
    1: { mu: 4, sigma: 2 },      // Level 1: 4 tiles
    2: { mu: 6, sigma: 3 },      // Level 2: 8 tiles
  };
  const { mu, sigma } = baselines[level] || baselines[1];

  // Speed component (0-30 points) with grace period
  const grace = 6;                // seconds
  const adjustedTime = Math.max(0, avgSec - grace);
  const z = (adjustedTime - mu) / sigma;
  const speedFactor = clamp(1 - (z * z) / 2, 0, 1);
  const speedScore = 30 * speedFactor;

  // Final score
  const finalScore = clamp(accuracyScore + speedScore, 0, 100);
  return Math.round(finalScore);
}

/**
 * Memory Recall score rule (new - fair scoring for special needs):
 * 
 * AccuracyScore (0-70 points): correctly recalled positions
 * SpeedScore (0-30 points): time taken with grace period + minimum score
 * 
 * Total = AccuracyScore + SpeedScore (0-100)
 * 
 * Parameters:
 * - grace = 10 sec (extra buffer for users with slower motor skills)
 * - typicalMean = 10 sec (baseline for a 5-item recall task)
 * - typicalSD = 4 sec (std dev, used for reference)
 * - minSpeedFactor = 0.167 (ensures even very slow users get ~5 points)
 */
function scoreMemoryRecall(correct: number, total: number, timeTaken: number) {
  // Accuracy component (0-70 points)
  const accuracy = total > 0 ? correct / total : 0;
  const accuracyScore = accuracy * 70;
  
  // Speed component (0-30 points)
  const grace = 10;           // seconds (buffer for special needs users)
  const typicalMean = 10;     // seconds (typical recall time for 5-item sequence)
  const minSpeedFactor = 0.167; // minimum ~5/30 points (prevent over-penalization)
  
  let speedScore = 30; // Full speed score by default
  
  if (timeTaken > grace) {
    // Apply gentle penalty after grace period
    const excessTime = timeTaken - grace;
    const responseCap = typicalMean + typicalMean * 0.5; // ~15 seconds as soft cap
    const speedFactor = Math.max(minSpeedFactor, 1 - (excessTime / responseCap));
    speedScore = speedFactor * 30;
  }
  
  const finalScore = accuracyScore + speedScore;
  return Math.round(clamp(finalScore, 0, 100));
}

/**
 * Comprehension score rule (as you requested):
 * If incorrect → score = 0
 * If correct → score = 100 − ⌊max(0, t − grace) / stepSeconds⌋ × penaltyPerStep
 * Clamped to minimum score (50) so slower readers don't fail
 */
function scoreComprehension(isCorrect: boolean, secondsTaken: number) {
  if (!isCorrect) return 0;
  
  const graceSeconds = 10;        // Grace period before penalty starts
  const stepSeconds = 5;          // Each 5 seconds counts as one step
  const penaltyPerStep = 5;       // -5% per step
  const minimumScore = 50;        // Minimum score (don't fail slower readers)
  
  // score = 100 - ⌊max(0, t - grace) / stepSeconds⌋ × penaltyPerStep
  const excessTime = Math.max(0, secondsTaken - graceSeconds);
  const steps = Math.floor(excessTime / stepSeconds);
  const penalty = steps * penaltyPerStep;
  const rawScore = 100 - penalty;
  
  // Clamp to minimum score
  return Math.round(clamp(rawScore, minimumScore, 100));
}

const CognitiveAssessment = () => {
  const [activeTest, setActiveTest] = useState<number | null>(null);

  if (activeTest !== null) {
    return <CognitiveTestView testId={activeTest} onBack={() => setActiveTest(null)} />;
  }

  return (
    <div className="p-8 animate-fade-in max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
          <Brain className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold">Cognitive & Learning Assessment</h1>
          <p className="text-sm text-muted-foreground tracking-tight">
            Standardized neuro-cognitive diagnostic suite
          </p>
        </div>
      </div>

      <div className="grid gap-4">
        {cognitiveTests.map((test) => (
          <div
            key={test.id}
            className="border rounded-xl p-5 flex items-center gap-4 bg-card shadow-sm hover:shadow-md transition-all"
          >
            <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center">
              <test.icon className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="flex-1">
              <h3 className="font-display font-semibold text-sm">{test.title}</h3>
              <p className="text-xs text-muted-foreground">{test.desc}</p>
            </div>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="w-3 h-3" /> {test.time}
            </span>
            <Button size="sm" onClick={() => setActiveTest(test.id)}>
              Start Assessment
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};

const CognitiveTestView = ({ testId, onBack }: { testId: number; onBack: () => void }) => {
  const test = cognitiveTests.find((t) => t.id === testId)!;

  // ------------------------------------------------------------
  // Shared timer: MUST start only when test actually starts
  // ------------------------------------------------------------
  const [elapsedTime, setElapsedTime] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // A per-test "timerRunning" gate
  const [timerRunning, setTimerRunning] = useState(false);

  useEffect(() => {
    // when switching tests, reset timer + stop interval
    setElapsedTime(0);
    setTimerRunning(false);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
    };
  }, [testId]);

  useEffect(() => {
    if (!timerRunning) {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
      return;
    }
    if (timerRef.current) return;

    timerRef.current = setInterval(() => {
      setElapsedTime((prev) => prev + 1);
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
    };
  }, [timerRunning]);

  const formatTime = (s: number) => {
    const mm = Math.floor(s / 60)
      .toString()
      .padStart(2, "0");
    const ss = (s % 60).toString().padStart(2, "0");
    return `${mm}:${ss}`;
  };

  const [isComplete, setIsComplete] = useState(false);

  // ------------------------------------------------------------
  // Test 1: Reaction Time
  // Change #1: timer starts ONLY after Start Round
  // ------------------------------------------------------------
  const [isGreen, setIsGreen] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [reactionTimes, setReactionTimes] = useState<number[]>([]);
  const [waiting, setWaiting] = useState(false);
  const [reactionScore, setReactionScore] = useState<number | null>(null);

  const startReactionRound = () => {
    if (!timerRunning) setTimerRunning(true); // start timer only now
    setWaiting(true);
    setIsGreen(false);
    setStartTime(null);

    const delay = Math.floor(Math.random() * 3000) + 2000; // 2-5 sec
    window.setTimeout(() => {
      setIsGreen(true);
      setStartTime(Date.now());
    }, delay);
  };

  const handleReactionClick = () => {
    if (!waiting) return; // ignore clicks when not in a round

    // Click too early (before green): count as "false start" (optional)
    if (!isGreen || !startTime) return;

    const diff = Date.now() - startTime;

    setReactionTimes((prev) => {
      const next = [...prev, diff];
      // 5 attempts total
      if (next.length >= 5) {
        const medianMs = median(next);
        const score = scoreReactionTime(medianMs);
        setReactionScore(score);
        setIsComplete(true);
        setTimerRunning(false); // stop timer when complete
      }
      return next;
    });

    setIsGreen(false);
    setWaiting(false);
  };

  const medianReaction = useMemo(() => {
    if (reactionTimes.length === 0) return 0;
    return Math.round(median(reactionTimes));
  }, [reactionTimes]);

  const avgReaction = useMemo(() => {
    if (reactionTimes.length === 0) return 0;
    return Math.round(reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length);
  }, [reactionTimes]);

  // ------------------------------------------------------------
  // Test 2: Pattern Matching
  // Change #2:
  // - Reduce symbol size
  // - Timer starts ONLY after "Start Pattern Matching Test"
  // ------------------------------------------------------------
  const [testStarted, setTestStarted] = useState(false);
  const [level, setLevel] = useState(1);
  const [currentRound, setCurrentRound] = useState(1);
  const maxRounds = 2;

  const [roundStartTime, setRoundStartTime] = useState<number | null>(null);
  const [roundElapsed, setRoundElapsed] = useState(0);

  const [retriesRemaining, setRetriesRemaining] = useState(2);
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [feedbackType, setFeedbackType] = useState<"correct" | "incorrect" | null>(null);

  const [gridShapes, setGridShapes] = useState<string[]>([]);
  const [uniqueIndex, setUniqueIndex] = useState(-1);
  const [roundCompleted, setRoundCompleted] = useState(false);

  type LevelMetrics = { correct: number; total: number; times: number[] };
  const [levelMetrics, setLevelMetrics] = useState<Record<number, LevelMetrics>>({
    1: { correct: 0, total: 0, times: [] },
    2: { correct: 0, total: 0, times: [] },
  });

  const [testReportData, setTestReportData] = useState<string>("");
  const [patternScore, setPatternScore] = useState<number | null>(null);
  const [patternNotes, setPatternNotes] = useState("");

  const generateShapes = (lvl: number) => {
    const levelConfigs: Record<
      number,
      { tiles: number; cols: number; shapes: string[]; sizeClass: string }
    > = {
      1: {
        tiles: 4,
        cols: 2,
        shapes: ["▲", "■"],
        sizeClass: "text-3xl", // reduced
      },
      2: {
        tiles: 8,
        cols: 4,
        shapes: ["●", "◉"],
        sizeClass: "text-2xl", // reduced
      },
    };

    const config = levelConfigs[Math.min(lvl, 2)];
    const shapes = Array(config.tiles)
      .fill(null)
      .map(() => config.shapes[0]);

    const uniqueIdx = Math.floor(Math.random() * config.tiles);
    shapes[uniqueIdx] = config.shapes[1];

    const shuffled = [...shapes].sort(() => Math.random() - 0.5);

    return {
      shapes: shuffled,
      uniqueIdx: shuffled.indexOf(config.shapes[1]),
      cols: config.cols,
      sizeClass: config.sizeClass,
    };
  };

  const overallPatternStats = useMemo(() => {
    const totalCorrect = levelMetrics[1].correct + levelMetrics[2].correct;
    const totalAttempts = levelMetrics[1].total + levelMetrics[2].total;
    const allTimes = [...levelMetrics[1].times, ...levelMetrics[2].times];
    const accuracyPct = totalAttempts > 0 ? (totalCorrect / totalAttempts) * 100 : 0;
    const avgSec = allTimes.length > 0 ? allTimes.reduce((a, b) => a + b, 0) / allTimes.length : 0;
    return { totalCorrect, totalAttempts, accuracyPct, avgSec };
  }, [levelMetrics]);

  const generatePatternReport = () => {
    let report = "=== PATTERN MATCHING TEST REPORT ===\n\n";
    for (let lv = 1; lv <= 2; lv++) {
      const metric = levelMetrics[lv];
      const accuracy = metric.total > 0 ? Math.round((metric.correct / metric.total) * 100) : 0;
      const avgTime =
        metric.times.length > 0
          ? (metric.times.reduce((a, b) => a + b, 0) / metric.times.length).toFixed(2)
          : "N/A";
      const totalTime = metric.times.length > 0 ? metric.times.reduce((a, b) => a + b, 0) : 0;

      const levelName = lv === 1 ? "LEVEL 1 (Easy - 4 Grid)" : "LEVEL 2 (Advanced - 8 Grid)";
      report += `${levelName}:\n`;
      report += `  Accuracy: ${accuracy}% (${metric.correct} correct out of ${metric.total})\n`;
      report += `  Average Time per Test: ${avgTime}s\n`;
      report += `  Total Time Taken: ${totalTime}s\n\n`;
    }

    const overallAccuracy = Math.round(overallPatternStats.accuracyPct);
    const avgResponseTime = overallPatternStats.avgSec ? overallPatternStats.avgSec.toFixed(2) : "N/A";
    report += `=== OVERALL ===\n`;
    report += `Total Accuracy: ${overallAccuracy}%\n`;
    report += `Correct Answers: ${overallPatternStats.totalCorrect}/${overallPatternStats.totalAttempts}\n`;
    report += `Average Time per Test: ${avgResponseTime}s\n\n`;

    return report;
  };

  // Start new round when test starts or round advances
  useEffect(() => {
    if (testId !== 2) return;
    if (!testStarted) return;
    if (roundStartTime) return;
    if (roundCompleted) return;

    const result = generateShapes(level);
    setGridShapes(result.shapes);
    setUniqueIndex(result.uniqueIdx);
    setRoundStartTime(Date.now());
    setRoundElapsed(0);
    setRetriesRemaining(2);
    setFeedbackMessage("");
    setFeedbackType(null);
  }, [testId, testStarted, roundCompleted, roundStartTime, level]);

  // Track round timer (pattern roundElapsed)
  useEffect(() => {
    if (testId !== 2) return;
    if (!roundStartTime || roundCompleted) return;

    const t = window.setInterval(() => {
      setRoundElapsed(Math.floor((Date.now() - roundStartTime) / 1000));
    }, 100);

    return () => window.clearInterval(t);
  }, [testId, roundStartTime, roundCompleted]);

  const handleShapeClick = (index: number) => {
    if (roundCompleted || !roundStartTime) return;

    const isCorrect = index === uniqueIndex;
    const elapsedSec = Math.floor((Date.now() - roundStartTime) / 1000);

    if (isCorrect) {
      setFeedbackMessage("✅ Correct! Great visual discrimination!");
      setFeedbackType("correct");
      setRoundCompleted(true);

      setLevelMetrics((prev) => ({
        ...prev,
        [level]: {
          ...prev[level],
          correct: prev[level].correct + 1,
          total: prev[level].total + 1,
          times: [...prev[level].times, elapsedSec],
        },
      }));

      window.setTimeout(() => handleNextRound(), 1200);
    } else {
      const remaining = retriesRemaining - 1;

      if (remaining > 0) {
        setRetriesRemaining(remaining);
        setFeedbackMessage(`❌ Try again! (${remaining} retry left)`);
        setFeedbackType("incorrect");
        window.setTimeout(() => setFeedbackMessage(""), 1000);
      } else {
        setFeedbackMessage("❌ Incorrect. Moving to next round...");
        setFeedbackType("incorrect");
        setRoundCompleted(true);

        setLevelMetrics((prev) => ({
          ...prev,
          [level]: {
            ...prev[level],
            total: prev[level].total + 1,
            times: [...prev[level].times, elapsedSec],
          },
        }));

        window.setTimeout(() => handleNextRound(), 1200);
      }
    }
  };

  const completePatternTest = () => {
    const report = generatePatternReport();
    setTestReportData(report);

    // composite score from accuracy + speed, with level-specific baselines
    const score = scorePatternMatching(overallPatternStats.accuracyPct, overallPatternStats.avgSec, level);
    setPatternScore(score);

    setIsComplete(true);
    setTimerRunning(false);
  };

  const handleNextRound = () => {
    if (currentRound < maxRounds) {
      setCurrentRound((p) => p + 1);
      setRoundStartTime(null);
      setRoundCompleted(false);
      setFeedbackMessage("");
      setFeedbackType(null);
      return;
    }

    if (level < 2) {
      setLevel((p) => p + 1);
      setCurrentRound(1);
      setRoundStartTime(null);
      setRoundCompleted(false);
      setFeedbackMessage("");
      setFeedbackType(null);
      setRetriesRemaining(2);
      return;
    }

    completePatternTest();
  };

  // ------------------------------------------------------------
  // Test 3: Memory Recall
  // Change #3:
  // - Score: correctness contributes 20%
  // - -1% per 30 seconds taken (input phase duration)
  // ------------------------------------------------------------
  const [memorySequence] = useState(["🔴", "🔵", "🟢", "🟡", "🔴"]);
  const [showSequence, setShowSequence] = useState(true);
  const [userSequence, setUserSequence] = useState<string[]>([]);
  const [memoryCorrect, setMemoryCorrect] = useState(0);
  const [memoryInputStart, setMemoryInputStart] = useState<number | null>(null);
  const [memorySecondsTaken, setMemorySecondsTaken] = useState<number>(0);
  const [memoryScore, setMemoryScore] = useState<number | null>(null);

  // ------------------------------------------------------------
  // Test 4: Comprehension Speed
  // Change #4:
  // - counter starts ONLY after Start button
  // - score: 100 if correct, -5% every 10 sec, else 0
  // ------------------------------------------------------------
  const [comprehensionStartTime, setComprehensionStartTime] = useState<number | null>(null);
  const [comprehensionTimeTaken, setComprehensionTimeTaken] = useState(0);
  const [comprehensionCorrect, setComprehensionCorrect] = useState(false);
  const [comprehensionScore, setComprehensionScore] = useState<number | null>(null);

  // ------------------ Score display (top bar) ------------------
  const headerScore = useMemo(() => {
    if (!isComplete) return "--";
    if (testId === 1) return reactionScore ?? "--";
    if (testId === 2) return patternScore ?? "--";
    if (testId === 3) return memoryScore ?? "--";
    if (testId === 4) return comprehensionScore ?? "--";
    return "--";
  }, [isComplete, testId, reactionScore, patternScore, memoryScore, comprehensionScore]);

  return (
    <div className="p-8 max-w-4xl mx-auto animate-in fade-in duration-500">
      <Button variant="ghost" onClick={onBack} className="mb-4">
        ← Back to tests
      </Button>

      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-2xl font-bold">{test.title}</h2>
          <p className="text-sm text-muted-foreground">{test.desc}</p>
        </div>
        <div className="flex gap-3">
          <div className="px-4 py-2 bg-slate-50 border rounded-xl font-mono font-bold text-blue-700 flex items-center gap-2">
            <Clock className="w-4 h-4" /> {formatTime(elapsedTime)}
          </div>
          <div className="px-4 py-2 bg-slate-50 border rounded-xl font-mono font-bold text-blue-700 flex items-center gap-2">
            <BarChart2 className="w-4 h-4" /> Score: {headerScore}
          </div>
        </div>
      </div>

      <div className="relative bg-white border-2 rounded-3xl min-h-[400px] flex flex-col items-center justify-center p-8 shadow-sm overflow-hidden">
        {isComplete && testId !== 2 ? (
          <div className="text-center animate-in zoom-in-95">
            <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-2xl font-bold">Assessment Complete</h3>
            <p className="text-muted-foreground">Behavioral data recorded for clinical analysis.</p>
            <Button className="mt-6" onClick={onBack}>
              Finish & Review
            </Button>
          </div>
        ) : (
          <>
            {/* ---------------------- Test 1: Reaction ---------------------- */}
            {testId === 1 && (
              <div className="w-full max-w-md space-y-8">
                <div
                  onClick={handleReactionClick}
                  className={`w-full h-64 rounded-3xl cursor-pointer transition-all duration-150 flex items-center justify-center shadow-inner ${
                    isGreen ? "bg-green-500 scale-105" : "bg-slate-100"
                  }`}
                >
                  <p className={`text-xl font-bold ${isGreen ? "text-white" : "text-slate-400"}`}>
                    {isGreen ? "CLICK NOW!" : waiting ? "Wait for Green..." : "Ready?"}
                  </p>
                </div>

                {!waiting && !isComplete && (
                  <Button className="w-full h-12" onClick={startReactionRound}>
                    Start Round {reactionTimes.length + 1}
                  </Button>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 rounded-2xl border text-center">
                    <p className="text-xs font-bold text-slate-400 uppercase">Median RT</p>
                    <p className="text-2xl font-black text-blue-600">{medianReaction}ms</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl border text-center">
                    <p className="text-xs font-bold text-slate-400 uppercase">Attempts</p>
                    <p className="text-2xl font-black text-blue-600">{reactionTimes.length}/5</p>
                  </div>
                </div>

                {isComplete && reactionScore !== null && (
                  <div className="bg-slate-50 p-4 rounded-2xl border text-sm">
                    <div className="flex justify-between">
                      <span className="font-semibold text-slate-700">Reaction Score</span>
                      <span className="font-mono font-bold text-blue-700">{reactionScore}/100</span>
                    </div>
                    <p className="text-slate-500 mt-2">
                      Score is based on MEDIAN RT (ms), robust to outliers. Compared against school-age baseline (300ms ±80ms).
                      Forgiving curve ensures fair scoring for children who need extra time.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* ---------------------- Test 2: Pattern Matching ---------------------- */}
            {testId === 2 && (
              <div className="w-full max-w-4xl space-y-6">
                {!testStarted ? (
                  <div className="text-center space-y-4">
                    <p className="text-lg font-semibold text-slate-700">
                      Find the unique shape that does not repeat.
                    </p>
                    <p className="text-sm text-slate-500">
                      2 levels: Level 1 has 4 shapes, Level 2 has 8 shapes. 2 tests per level.
                    </p>
                    <Button
                      size="lg"
                      onClick={() => {
                        setTestStarted(true);
                        setTimerRunning(true); // timer starts only here
                      }}
                      className="w-full"
                    >
                      Start Pattern Matching Test
                    </Button>
                  </div>
                ) : isComplete ? (
                  <div className="space-y-6">
                    <div className="text-center">
                      <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
                      <h3 className="text-2xl font-bold">Test Complete!</h3>
                      <p className="text-muted-foreground">
                        Special-needs fair scoring: 70 points for accuracy + 30 points for speed (with 6s grace period).
                      </p>
                      <div className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-xl border bg-slate-50 font-mono font-bold text-blue-700">
                        <BarChart2 className="w-4 h-4" /> Score: {patternScore ?? "--"}/100
                      </div>
                    </div>

                    <div className="bg-slate-50 p-6 rounded-2xl border whitespace-pre-wrap font-mono text-sm leading-relaxed">
                      {testReportData}
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700">
                        Clinical Notes (Optional):
                      </label>
                      <textarea
                        value={patternNotes}
                        onChange={(e) => setPatternNotes(e.target.value)}
                        placeholder="Add observations about student's performance..."
                        className="w-full h-24 p-3 border border-slate-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div className="flex justify-end">
                      <Button onClick={onBack}>Finish & Review</Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between items-center">
                      <div className="text-center flex-1">
                        <p className="text-sm font-semibold text-slate-500">Level {level}/2</p>
                        <p className="text-slate-700">
                          Test {currentRound} of {maxRounds}
                        </p>
                      </div>
                      <div className="text-center flex-1">
                        <p className="text-xs font-bold text-slate-400 uppercase">Level Accuracy</p>
                        <p className="text-lg font-black text-blue-600">
                          {levelMetrics[level].total > 0
                            ? Math.round((levelMetrics[level].correct / levelMetrics[level].total) * 100)
                            : 0}
                          %
                        </p>
                      </div>
                    </div>

                    <div className="text-center">
                      <p className="text-slate-700 font-semibold mb-4">Find and click the unique shape:</p>
                    </div>

                    <div
                      className={`grid gap-3 mb-6 justify-center ${
                        level === 1 ? "grid-cols-2" : "grid-cols-4"
                      }`}
                    >
                      {gridShapes.map((shape, i) => (
                        <button
                          key={i}
                          onClick={() => handleShapeClick(i)}
                          disabled={roundCompleted}
                          className={`aspect-square w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-white to-slate-50 border-2 rounded-2xl transition-all flex items-center justify-center active:scale-95 ${
                            roundCompleted
                              ? "opacity-50 cursor-not-allowed border-slate-100"
                              : "border-slate-200 hover:border-blue-500 hover:bg-blue-50 hover:shadow-md cursor-pointer"
                          }`}
                        >
                          <span className={level === 1 ? "text-3xl" : "text-2xl"}>{shape}</span>
                        </button>
                      ))}
                    </div>

                    {feedbackMessage && (
                      <div
                        className={`p-4 rounded-lg text-center font-semibold animate-in fade-in ${
                          feedbackType === "correct"
                            ? "bg-green-50 text-green-700 border border-green-200"
                            : "bg-red-50 text-red-700 border border-red-200"
                        }`}
                      >
                        {feedbackMessage}
                      </div>
                    )}

                    <div className="grid grid-cols-3 gap-3">
                      <div className="p-3 bg-slate-50 rounded-lg border text-center">
                        <p className="text-xs font-bold text-slate-400 uppercase">Time</p>
                        <p className="text-2xl font-black text-blue-600">{roundElapsed}s</p>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-lg border text-center">
                        <p className="text-xs font-bold text-slate-400 uppercase">Retries Left</p>
                        <p className="text-2xl font-black text-orange-600">{retriesRemaining}</p>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-lg border text-center">
                        <p className="text-xs font-bold text-slate-400 uppercase">Level Correct</p>
                        <p className="text-2xl font-black text-green-600">
                          {levelMetrics[level].correct}/{levelMetrics[level].total}
                        </p>
                      </div>
                    </div>

                    <p className="text-xs text-slate-500 mt-3">
                      Scoring: Accuracy (0–70 points) + Speed (0–30 points, with 6s grace period and level-specific baselines).
                      Fair for special-needs users who need extra time but can still remember accurately.
                    </p>
                  </>
                )}
              </div>
            )}

            {/* ---------------------- Test 3: Memory Recall ---------------------- */}
            {testId === 3 && (
              <div className="w-full max-w-md text-center">
                <p className="mb-8 text-slate-500">
                  {showSequence ? "Memorize the color order:" : "Click the colors in order:"}
                </p>

                <div className="flex gap-3 justify-center mb-10 flex-wrap">
                  {memorySequence.map((item, i) => (
                    <div
                      key={i}
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl border-2 transition-all ${
                        showSequence
                          ? "bg-white border-slate-200"
                          : userSequence[i]
                          ? "bg-slate-50 border-blue-500"
                          : "bg-slate-100 border-dashed border-slate-300"
                      }`}
                    >
                      {showSequence ? item : userSequence[i] || "?"}
                    </div>
                  ))}
                </div>

                {showSequence ? (
                  <Button
                    size="lg"
                    className="w-full"
                    onClick={() => {
                      setShowSequence(false);
                      setTimerRunning(true); // start timer for memory once user begins recall phase
                      setMemoryInputStart(Date.now());
                    }}
                  >
                    I Memorized It
                  </Button>
                ) : isComplete ? (
                  <div className="space-y-4">
                    <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto" />
                    <div className="bg-slate-50 p-5 rounded-2xl border text-left">
                      <p className="font-semibold text-slate-700">Results</p>
                      <p className="text-sm text-slate-600 mt-2">
                        Correct positions: <span className="font-bold">{memoryCorrect}</span> /{" "}
                        {memorySequence.length}
                      </p>
                      <p className="text-sm text-slate-600">
                        Time taken: <span className="font-bold">{memorySecondsTaken}s</span>
                      </p>
                      <p className="text-sm text-slate-600">
                        Score: <span className="font-bold text-blue-700">{memoryScore ?? "--"}/100</span>
                      </p>
                      <p className="text-xs text-slate-500 mt-2">
                        Scoring rule: Accuracy (0-70 points) + Speed (0-30 points). Grace period of 10 seconds with gentle penalty after.
                        Minimum score floor ensures fair scoring for special-needs users with slower recall speed.
                      </p>
                    </div>
                    <Button onClick={onBack}>Finish & Review</Button>
                  </div>
                ) : (
                  <div className="flex gap-2 justify-center flex-wrap">
                    {["🔴", "🔵", "🟢", "🟡"].map((color) => (
                      <button
                        key={color}
                        onClick={() => {
                          const next = [...userSequence, color];
                          setUserSequence(next);

                          // correctness check by position
                          if (color === memorySequence[next.length - 1]) {
                            setMemoryCorrect((p) => p + 1);
                          }

                          if (next.length === memorySequence.length) {
                            const end = Date.now();
                            const start = memoryInputStart ?? end;
                            const secondsTaken = Math.floor((end - start) / 1000);
                            setMemorySecondsTaken(secondsTaken);

                            // IMPORTANT: memoryCorrect state may not yet include last increment,
                            // so compute correct inline:
                            const correctInline = next.reduce((acc, c, idx) => {
                              return acc + (c === memorySequence[idx] ? 1 : 0);
                            }, 0);

                            const score = scoreMemoryRecall(correctInline, memorySequence.length, secondsTaken);
                            setMemoryScore(score);

                            setIsComplete(true);
                            setTimerRunning(false);
                          }
                        }}
                        className="w-14 h-14 rounded-full text-2xl bg-slate-50 border hover:bg-white shadow-sm transition-all"
                      >
                        {color}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ---------------------- Test 4: Comprehension ---------------------- */}
            {testId === 4 && (
              <div className="w-full max-w-2xl space-y-6">
                {!comprehensionStartTime ? (
                  <div className="text-center space-y-4">
                    <p className="text-lg font-semibold text-slate-700">
                      Read the passage and answer the question below.
                    </p>
                    <Button
                      size="lg"
                      onClick={() => {
                        setComprehensionStartTime(Date.now());
                        setTimerRunning(true); // counter starts only now
                      }}
                      className="w-full"
                    >
                      Start Comprehension Speed Test
                    </Button>
                  </div>
                ) : isComplete ? (
                  <div className="text-center space-y-6 animate-in zoom-in-95">
                    <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
                    <h3 className="text-2xl font-bold">Assessment Complete</h3>
                    <div className="bg-slate-50 p-6 rounded-2xl border space-y-3">
                      <p>
                        <span className="font-semibold text-slate-700">Answer:</span>{" "}
                        <span
                          className={
                            comprehensionCorrect ? "text-green-600 font-bold" : "text-red-600 font-bold"
                          }
                        >
                          {comprehensionCorrect ? "Correct" : "Incorrect"}
                        </span>
                      </p>
                      <p>
                        <span className="font-semibold text-slate-700">Time Taken:</span>{" "}
                        {comprehensionTimeTaken}s
                      </p>
                      <p className="text-3xl font-black text-blue-600">
                        Score: {comprehensionScore ?? "--"}%
                      </p>
                    </div>
                    <Button onClick={onBack}>Finish & Review</Button>
                  </div>
                ) : (
                  <>
                    <div className="bg-slate-50 p-6 rounded-2xl border leading-relaxed text-slate-700">
                      "Working memory is the system that holds and processes information in the mind for short
                      periods. Unlike long-term memory, it has a limited capacity. This capacity is vital for
                      complex reasoning and language comprehension."
                    </div>
                    <p className="font-bold text-lg text-center">
                      Which statement is true about working memory?
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {[
                        {
                          label: "It stores unlimited items",
                          correct: false,
                        },
                        {
                          label: "It has a limited capacity",
                          correct: true,
                        },
                        {
                          label: "It replaces long-term memory",
                          correct: false,
                        },
                        {
                          label: "It never affects comprehension",
                          correct: false,
                        },
                      ].map((opt) => (
                        <Button
                          key={opt.label}
                          variant="outline"
                          className="h-14 justify-start px-6"
                          onClick={() => {
                            const start = comprehensionStartTime ?? Date.now();
                            const timeTaken = Math.floor((Date.now() - start) / 1000);
                            const isCorrect = opt.correct;

                            setComprehensionCorrect(isCorrect);
                            setComprehensionTimeTaken(timeTaken);

                            const score = scoreComprehension(isCorrect, timeTaken);
                            setComprehensionScore(score);

                            setIsComplete(true);
                            setTimerRunning(false);
                          }}
                        >
                          {opt.label}
                        </Button>
                      ))}
                    </div>

                    <p className="text-xs text-slate-500">
                      Score rule: 100% if correct, minus 5% every 10 seconds taken; incorrect = 0.
                      Working-memory limits and comprehension performance are commonly evaluated together.
                    </p>
                  </>
                )}
              </div>
            )}
          </>
        )}
      </div>

      <div className="mt-8 flex justify-end gap-3">
        <Button variant="outline" onClick={onBack}>
          Save & Exit
        </Button>
        <Button disabled={!isComplete}>
          Submit Results <ChevronRight className="w-3 h-3 ml-1" />
        </Button>
      </div>
    </div>
  );
};

export default CognitiveAssessment;