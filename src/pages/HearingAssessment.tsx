import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Ear,
  Clock,
  ChevronRight,
  BarChart2,
  Mic,
  Play,
  Square,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * ---------------------------------------------
 * DATA
 * ---------------------------------------------
 */

const hearingTests = [
  { id: 1, title: "Audio Recognition Test", desc: "Select correct interpretation of audio clips", time: "5 min" },
  { id: 2, title: "Sound Differentiation Test", desc: "Identify pitch, tone, or background noise differences", time: "5 min" },
  { id: 3, title: "Speech Repetition Recording", desc: "Repeat spoken words and record response", time: "5 min" },
  { id: 4, title: "Pronunciation Assessment", desc: "Record and evaluate speech clarity", time: "5 min" },
] as const;

const audioRecognitionQuestions = [
  {
    id: 1,
    audioSrc: "/audio/recognition_speech.mp3",
    prompt: "Listen to the clip and identify it:",
    options: ["Speech", "Music", "Nature Sound", "Silence"],
    correctIndex: 1,
  }
] as const;

const soundDiffQuestions = [
  {
    id: 1,
    prompt: "Play all three clips. Which one sounds different?",
    clips: ["/audio/diff_nature_1.mp3", "/audio/diff_nature_2.mp3", "/audio/diff_nature_3.mp3"],
    correctIndex: 2, // Clip 3 is the odd one out
  },
] as const;

const repetitionWords = ["assessment", "hospital", "rehabilitation", "confidence"] as const;

const pronunciationSentence = "I can read clearly and respond confidently in class.";

/**
 * ---------------------------------------------
 * UTILS (scoring)
 * ---------------------------------------------
 */

const normalize = (s: string) =>
  s.toLowerCase().replace(/[^a-z\s]/g, "").trim();

const levenshtein = (a: string, b: string) => {
  const m = a.length,
    n = b.length;
  const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
    }
  }
  return dp[m][n];
};

const similarityScore = (expected: string, actual: string) => {
  const a = normalize(expected);
  const b = normalize(actual);
  if (!b) return 0;
  const dist = levenshtein(a, b);
  const maxLen = Math.max(a.length, b.length) || 1;
  return Math.max(0, Math.round((1 - dist / maxLen) * 100));
};

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

/**
 * ---------------------------------------------
 * SPEECH RECOGNITION HOOK (Web Speech API)
 * ---------------------------------------------
 */


type SpeechStatus = "idle" | "starting" | "listening" | "processing" | "error";

type SpeechHook = {
  supported: boolean;
  listening: boolean;
  transcript: string;
  confidence: number;
  error: string | null;
  status: SpeechStatus;
  start: (lang?: string, onFinal?: () => void, opts?: { interim?: boolean; retryOnce?: boolean }) => void;
  stop: () => void;
  reset: () => void;
};

const useSpeechRecognizer = (): SpeechHook => {
  const recognitionRef = useRef<any>(null);
  const noSpeechTimerRef = useRef<number | null>(null);
  const retriedRef = useRef(false);

  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [confidence, setConfidence] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<SpeechStatus>("idle");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    setSupported(!!SR);
  }, []);

  const clearNoSpeechTimer = () => {
    if (noSpeechTimerRef.current) {
      window.clearTimeout(noSpeechTimerRef.current);
      noSpeechTimerRef.current = null;
    }
  };

  const reset = () => {
    clearNoSpeechTimer();
    retriedRef.current = false;
    setTranscript("");
    setConfidence(0);
    setError(null);
    setStatus("idle");
  };

  const stop = () => {
    clearNoSpeechTimer();
    try {
      recognitionRef.current?.stop?.();
    } catch {}
    setListening(false);
    setStatus("idle");
  };

  const start = (
    lang = "en-IN",
    onFinal?: () => void,
    opts?: { interim?: boolean; retryOnce?: boolean }
  ) => {
    if (typeof window === "undefined") return;

    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      setError("Speech recognition not supported. Please type the word.");
      setStatus("error");
      return;
    }

    const interim = opts?.interim ?? false;       // default false (more stable)
    const retryOnce = opts?.retryOnce ?? true;    // default true

    // kill any previous instance
    try {
      recognitionRef.current?.abort?.();
    } catch {}

    const recog = new SR();
    recognitionRef.current = recog;

    recog.lang = lang;
    recog.interimResults = interim;
    recog.continuous = false;
    recog.maxAlternatives = 1;

    // fresh run
    clearNoSpeechTimer();
    setTranscript("");
    setConfidence(0);
    setError(null);
    setListening(false);
    setStatus("starting");

    // If user doesn’t speak quickly, show guidance (before browser throws no-speech)
    noSpeechTimerRef.current = window.setTimeout(() => {
      // Don't force stop; just guide the user
      setError("Speak immediately after pressing Start (within 1 second)");
    }, 1500);

    recog.onstart = () => {
      setListening(true);
      setStatus("listening");
      setError(null);
    };

    recog.onspeechstart = () => {
      clearNoSpeechTimer(); // speech actually detected
      setError(null);
    };

    recog.onresult = (e: any) => {
      // pick the best result from the last event
      const res = e.results[e.results.length - 1];
      const alt = res?.[0];
      const t = (alt?.transcript ?? "").trim();
      const c = alt?.confidence ?? 0;

      // If interim=false this will typically be final already.
      setTranscript(t);
      setConfidence(c);
      setError(null);

      if (res?.isFinal) {
        setStatus("processing");
        // stop shortly after final
        setTimeout(() => {
          try {
            recog.stop();
          } catch {}
        }, 250);
      }
    };

    recog.onerror = (e: any) => {
      clearNoSpeechTimer();
      setListening(false);

      const code = e?.error;
      // Retry once on no-speech (helps a lot)
      if (code === "no-speech" && retryOnce && !retriedRef.current) {
        retriedRef.current = true;
        setStatus("starting");
        setError("No speech detected. Retrying… speak immediately.");
        setTimeout(() => {
          try {
            recog.start();
          } catch {
            setStatus("error");
            setError("Failed to restart speech recognition.");
          }
        }, 250);
        return;
      }

      setStatus("error");

      if (code === "not-allowed") {
        setError("Microphone permission blocked. Allow mic access in browser site settings.");
      } else if (code === "network") {
        setError("Speech recognition needs internet in this browser. Check your connection.");
      } else if (code === "no-speech") {
        setError("No speech detected. Speak immediately after pressing Start.");
      } else {
        setError(`Speech recognition error: ${code || "unknown"}`);
      }
    };

    recog.onend = () => {
      clearNoSpeechTimer();
      setListening(false);
      // If we ended without a transcript and no hard error, show gentle guidance
      setStatus("idle");
      onFinal?.();
    };

    try {
      recog.start();
    } catch (err) {
      clearNoSpeechTimer();
      setListening(false);
      setStatus("error");
      setError("Failed to start speech recognition. Try reloading or use manual typing.");
    }
  };

  return { supported, listening, transcript, confidence, error, status, start, stop, reset };
};

/**
 * ---------------------------------------------
 * SMALL UI HELPERS
 * ---------------------------------------------
 */

const AudioClipButton = ({
  src,
  label,
  onEnded,
  onPlay,
}: {
  src: string;
  label: string;
  onEnded: () => void;
  onPlay?: (audioRef: HTMLAudioElement) => void;
}) => {
  const ref = useRef<HTMLAudioElement | null>(null);
  
  return (
    <div className="flex flex-col gap-2">
      <audio ref={ref} src={src} onEnded={onEnded} />
      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          if (ref.current) {
            onPlay?.(ref.current);
            ref.current.play().catch(() => {
              // If play fails, still mark as played so user can proceed
              onEnded();
            });
            // Mark as played immediately when clicked
            setTimeout(() => onEnded(), 100);
          }
        }}
        className="gap-2"
      >
        <Play className="w-4 h-4" /> {label}
      </Button>
    </div>
  );
};

const MicMeter = () => {
  const [level, setLevel] = useState(0);
  const rafRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  const start = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: true },
      });
      streamRef.current = stream;

      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      analyserRef.current = analyser;
      source.connect(analyser);

      const data = new Uint8Array(analyser.frequencyBinCount);

      const tick = () => {
        analyser.getByteTimeDomainData(data);
        // compute RMS
        let sum = 0;
        for (let i = 0; i < data.length; i++) {
          const v = (data[i] - 128) / 128;
          sum += v * v;
        }
        const rms = Math.sqrt(sum / data.length);
        setLevel(Math.min(100, Math.round(rms * 200)));
        rafRef.current = requestAnimationFrame(tick);
      };
      tick();
    } catch (e) {
      console.error("MicMeter start error:", e);
    }
  };

  const stop = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setLevel(0);
  };

  return (
    <div className="w-full max-w-md mx-auto p-3 rounded-lg border border-border bg-card">
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm font-medium">Mic Level</div>
        <div className="text-xs text-muted-foreground">{level}/100</div>
      </div>
      <div className="h-2 w-full bg-muted rounded">
        <div className="h-2 bg-primary rounded" style={{ width: `${level}%` }} />
      </div>
      <div className="mt-3 flex gap-2">
        <Button size="sm" variant="outline" onClick={start}>Test Mic</Button>
        <Button size="sm" variant="outline" onClick={stop}>Stop</Button>
      </div>
      <p className="text-xs text-muted-foreground mt-2">
        Speak near the mic. The bar must move. If it stays near 0, Chrome is not getting audio.
      </p>
    </div>
  );
};

/**
 * ---------------------------------------------
 * MAIN PAGE
 * ---------------------------------------------
 */

const HearingAssessment = () => {
  const [activeTest, setActiveTest] = useState<number | null>(null);
  

  if (activeTest !== null) {
    return <HearingTestView testId={activeTest} onBack={() => setActiveTest(null)} />;
  }

  return (
    <div className="p-8 animate-fade-in">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
          <Ear className="w-5 h-5 text-clinical-warning" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">
            Hearing & Speech Assessment
          </h1>
          <p className="text-sm text-muted-foreground">4 diagnostic tests · ~20 minutes</p>
        </div>
      </div>

      <div className="space-y-4">
        {hearingTests.map((test) => (
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
            {/* STEP 3 - DATA ATTR ADDED */}
            <Button 
                size="sm" 
                data-test={test.id}
                onClick={() => setActiveTest(test.id)}
            >
              Start <ChevronRight className="w-3 h-3 ml-1" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * ---------------------------------------------
 * TEST VIEW
 * ---------------------------------------------
 */

const HearingTestView = ({ testId, onBack }: { testId: number; onBack: () => void }) => {
  const test = hearingTests.find((t) => t.id === testId)!;
  // STEP 1 - STATE INJECTED
  const [showModal, setShowModal] = useState(false); 
  // Speech (used by tests 3 & 4)
  const recognizer = useSpeechRecognizer();
  const [manualSentence, setManualSentence] = useState("");
  // Global “score” display (simple placeholder)
  const [scoreDisplay, setScoreDisplay] = useState<string>("--");
  // Track currently playing audio across all clips
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);

// STEP 2 - IMPROVED FUNCTION REPLACED
const handleSubmitAndNext = () => {
  setShowModal(true);

  setTimeout(() => {
    setShowModal(false);

    // go to next test safely
    if (testId < hearingTests.length) {
      const nextId = testId + 1;
      onBack(); // go to list first

      setTimeout(() => {
        const btn = document.querySelector(`[data-test="${nextId}"]`);
        (btn as HTMLButtonElement)?.click();
      }, 300);
    } else {
      alert("All tests completed 🎉");
      onBack();
    }
  }, 1800);
};

  const handleAudioPlay = (audioElement: HTMLAudioElement) => {
    // Stop currently playing audio
    if (currentAudioRef.current && currentAudioRef.current !== audioElement) {
      currentAudioRef.current.pause();
      currentAudioRef.current.currentTime = 0;
    }
    // Set new audio as current
    currentAudioRef.current = audioElement;
  };
  /**
   * -------------------------
   * TEST 1: Audio Recognition
   * -------------------------
   */
  const [recQIndex, setRecQIndex] = useState(0);
  const recQ = audioRecognitionQuestions[recQIndex];

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [audioDone, setAudioDone] = useState(false);

  const [selected, setSelected] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

/**
   * -------------------------
   * IMPROVED TEST 1 LOGIC
   * -------------------------
   */
  const playAudio = async () => {
  if (!audioRef.current) return;

  try {
    audioRef.current.currentTime = 0;
    await audioRef.current.play();

    // 🔥 ENABLE OPTIONS IMMEDIATELY AFTER CLICK
    setAudioDone(true);

  } catch (err) {
    console.error("Playback failed:", err);
    setAudioDone(true); // fallback unlock
  }
};

const submitRecAnswer = () => {
  if (selected === null) return;

  setSubmitted(true);

  const ok = selected === recQ.correctIndex; // correctIndex = 1 (Music)
  setIsCorrect(ok);

  // Since only 1 question
  setScoreDisplay(ok ? "1/1" : "0/1");
};


  /**
   * -----------------------------
   * TEST 2: Sound Differentiation
   * -----------------------------
   */
  const diffQ = soundDiffQuestions[0];
  const [playedClips, setPlayedClips] = useState<boolean[]>([false, false, false]);
  const allPlayed = playedClips.every(Boolean);

  const markPlayed = (i: number) => {
    setPlayedClips((prev) => {
      const copy = [...prev];
      copy[i] = true;
      return copy;
    });
  };

  const submitDiffAnswer = () => {
    if (selected === null) return;
    setSubmitted(true);
    const ok = selected === diffQ.correctIndex;
    setIsCorrect(ok);
    setScoreDisplay(ok ? "1/1" : "0/1");
  };

  /**
   * --------------------------------
   * TEST 3: Speech Repetition (words)
   * --------------------------------
   */
  const [wordIndex, setWordIndex] = useState(0);
  const targetWord = repetitionWords[wordIndex];

  const [wordScores, setWordScores] = useState<number[]>([]);
  const [finalWordScore, setFinalWordScore] = useState<number | null>(null);
  const [manualInput, setManualInput] = useState(""); // Fallback for manual input

  const computeClarity = (expected: string) => {
  const expectedNorm = expected.trim().toLowerCase();
  const inputRaw = (recognizer.transcript || manualInput || "").trim().toLowerCase();
  if (!inputRaw) return 0;

  const sim = similarityScore(expectedNorm, inputRaw); // 0..100 assumed
  const conf = recognizer.transcript
    ? Math.round((recognizer.confidence || 0) * 100)
    : 85;

  return clamp(Math.round(sim * 0.7 + conf * 0.3), 0, 100);
};

  const nextWord = () => {
  const clarity = computeClarity(targetWord);

  // build the updated scores safely in one place
  const updatedScores = (() => {
    const copy = [...wordScores];
    copy[wordIndex] = clarity;
    return copy;
  })();

  setWordScores(updatedScores);

  recognizer.reset();
  setManualInput("");

  if (wordIndex < repetitionWords.length - 1) {
    setWordIndex((p) => p + 1);
  } else {
    const sum = updatedScores.reduce((a, b) => a + (b || 0), 0);
    const avg = Math.round(sum / repetitionWords.length);
    setFinalWordScore(avg);
    setScoreDisplay(`${avg}/100`);
  }
};

  /**
   * -------------------------------
   * TEST 4: Pronunciation (sentence)
   * -------------------------------
   */
const sentenceScores = useMemo(() => {
  const spoken = (recognizer.transcript || manualSentence || "").trim();
  if (!spoken) return null;

  const sim = similarityScore(pronunciationSentence, spoken);
  const conf = recognizer.transcript
    ? Math.round((recognizer.confidence || 0) * 100)
    : 85;

  const clarity = clamp(Math.round(sim * 0.75 + conf * 0.25), 0, 100);
  return { sim, conf, clarity, spoken };
}, [recognizer.transcript, recognizer.confidence, manualSentence]);

  /**
   * ---------------------------------------------
   * RESET STATE WHEN TEST CHANGES
   * ---------------------------------------------
   */
  useEffect(() => {
    // Reset shared states
    setSelected(null);
    setSubmitted(false);
    setIsCorrect(null);
    setScoreDisplay("--");

    // Reset test 1
    setRecQIndex(0);
    setAudioDone(false);

    // Reset test 2
    setPlayedClips([false, false, false]);

    // Reset test 3
    setWordIndex(0);
    setWordScores([]);
    setFinalWordScore(null);
    setManualInput("");
    setManualSentence("");

    // Reset speech
    recognizer.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [testId]);

  // Also reset on recQ change (test1 only)
  useEffect(() => {
    setSelected(null);
    setSubmitted(false);
    setIsCorrect(null);
    setAudioDone(false);
  }, [recQIndex]);

  return (
    <div className="p-8 animate-fade-in">
      <button onClick={onBack} className="text-sm text-primary hover:underline mb-4 block">
        ← Back to tests
      </button>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-display text-xl font-bold text-foreground">{test.title}</h2>
          <p className="text-sm text-muted-foreground">{test.desc}</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="clinical-card px-4 py-2 flex items-center gap-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">00:00</span>
          </div>
          <div className="clinical-card px-4 py-2 flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">Score: {scoreDisplay}</span>
          </div>
        </div>
      </div>

      {/* ------------------- TEST 1 ------------------- */}
      {testId === 1 && (
        <div className="clinical-card p-6 mb-6">
          <p className="text-sm text-muted-foreground mb-4">{recQ.prompt}</p>

          <audio ref={audioRef} src={recQ.audioSrc} onEnded={() => setAudioDone(true)} />

          <div
            className={`rounded-xl p-6 flex items-center gap-4 mb-4 transition ${
              audioDone ? "bg-emerald-900/30 border border-emerald-700" : "bg-muted"
            }`}
          >
            <Button variant="outline" size="sm" className="gap-2" onClick={playAudio}>
              <Play className="w-4 h-4" /> Play Audio
            </Button>

            <div className="text-xs text-muted-foreground flex items-center gap-2">
              {audioDone ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Completed
                </>
              ) : (
                "Play and finish the audio to unlock answers"
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {recQ.options.map((opt, idx) => {
              const selectedStyle = selected === idx ? "ring-2 ring-primary" : "";

              let resultStyle = "";
              if (submitted) {
                if (idx === recQ.correctIndex) resultStyle = "bg-emerald-600/20 border-emerald-600";
                else if (selected === idx) resultStyle = "bg-red-600/20 border-red-600";
              }

              return (
                <Button
                  key={opt}
                  variant="outline"
                  className={`justify-start text-sm ${selectedStyle} ${resultStyle}`}
                  onClick={() => !submitted && setSelected(idx)}
                  disabled={!audioDone || submitted}
                >
                  {opt}
                </Button>
              );
            })}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Button onClick={submitRecAnswer} disabled={!audioDone || selected === null || submitted}>
              Submit
            </Button>

                 {submitted && (
              <span className="text-sm">
                {isCorrect ? (
                  <span className="text-emerald-600">Correct</span>
                ) : (
                  <span className="text-red-500">Incorrect</span>
                )}
              </span>
            )}

            <span className="text-xs text-muted-foreground ml-auto">
              Question {recQIndex + 1} / {audioRecognitionQuestions.length}
            </span>
          </div>
        </div>
      )}

      {/* ------------------- TEST 2 ------------------- */}
      {testId === 2 && (
        <div className="clinical-card p-6 mb-6">
          <p className="text-sm text-muted-foreground mb-4">{diffQ.prompt}</p>

          <div
            className={`rounded-xl p-5 mb-4 transition ${
              allPlayed ? "bg-emerald-900/30 border border-emerald-700" : "bg-muted"
            }`}
          >
            <div className="grid grid-cols-3 gap-3">
              {diffQ.clips.map((src, i) => (
                <AudioClipButton
                  key={src}
                  src={src}
                  label={`Play Clip ${i + 1}`}
                  onEnded={() => markPlayed(i)}
                  onPlay={handleAudioPlay}
                />
              ))}
            </div>

            <p className="text-xs text-muted-foreground mt-3">
              {allPlayed ? (
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" /> All clips completed
                </span>
              ) : (
                "Play the clips to compare them (optional)"
              )}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[0, 1, 2].map((idx) => {
              let resultStyle = "";
              if (submitted) {
                if (idx === diffQ.correctIndex) resultStyle = "bg-emerald-600/20 border-emerald-600";
                else if (selected === idx) resultStyle = "bg-red-600/20 border-red-600";
              }

              return (
                <Button
                  key={idx}
                  variant="outline"
                  className={`text-sm ${selected === idx ? "ring-2 ring-primary" : ""} ${resultStyle}`}
                  onClick={() => !submitted && setSelected(idx)}
                >
                  Option {idx + 1}
                </Button>
              );
            })}
          </div>

          <div className="mt-4 flex items-center gap-3">
            <Button onClick={submitDiffAnswer} disabled={selected === null || submitted}>
              Submit
            </Button>

            {submitted && (
              <span className="text-sm">
                {isCorrect ? (
                  <span className="text-emerald-600">Correct</span>
                ) : (
                  <span className="text-red-500">Incorrect</span>
                )}
              </span>
            )}
          </div>

          <p className="text-xs text-muted-foreground mt-4">
            Tip: use subtle “nature” clips (rain / wind / birds) with slight differences.
          </p>
        </div>
      )}

      {/* ------------------- TEST 3 ------------------- */}
      {testId === 3 && (
        <div className="clinical-card p-6 mb-6">
          <div className="text-center mb-6">
            <p className="text-sm text-muted-foreground mb-2">Say this word clearly:</p>
            <p className="font-display text-3xl font-bold text-foreground">"{targetWord}"</p>
            <p className="text-xs text-muted-foreground mt-2">
              Recognition: <span className="font-medium">{recognizer.transcript || manualInput || "--"}</span>
            </p>
          </div>

          <div className="bg-muted rounded-xl p-8 flex flex-col items-center gap-4">
           <Button
  onClick={() => {
    if (recognizer.listening) recognizer.stop();
    else recognizer.start("en-IN", undefined, { interim: false, retryOnce: true });
  }}
  variant={recognizer.listening ? "destructive" : "default"}
  size="lg"
  className="gap-2"
  disabled={!recognizer.supported}
>
  {recognizer.listening ? (
    <>
      <Square className="w-4 h-4" /> Stop
    </>
  ) : (
    <>
      <Mic className="w-4 h-4" /> Start
    </>
  )}
</Button>

            {recognizer.listening && (
  <div className="flex items-center gap-3">
    <div className="w-3 h-3 rounded-full bg-destructive animate-pulse" />
    <span className="text-sm font-medium text-foreground">Listening... Speak now</span>
  </div>
)}

            {recognizer.error && (
              <div className="w-full text-center">
                <p className="text-xs text-red-600 mb-3 font-medium">
                  ⚠️ {recognizer.error}
                </p>
                <p className="text-xs text-muted-foreground mb-3">
                  
                </p>
                
              </div>
            )}

            {!recognizer.supported && !recognizer.error && (
              <div className="w-full text-center">
                <p className="text-xs text-amber-600 mb-3">
                  Speech recognition not available. Use manual input below:
                </p>
                <input
                  type="text"
                  placeholder={`Type: ${targetWord}`}
                  value={manualInput}
                  onChange={(e) => setManualInput(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-card text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            )}
          </div>

          <div className="mt-4 grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-muted rounded-lg border border-border">
              <p className="text-2xl font-bold text-foreground">
                {recognizer.transcript || manualInput ? (
                  <span className={computeClarity(targetWord) >= 70 ? "text-emerald-600" : "text-amber-600"}>
                    {computeClarity(targetWord)}
                  </span>
                ) : "--"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Clarity Score (0–100)</p>
              {(recognizer.transcript || manualInput) && (
                <p className="text-xs text-muted-foreground mt-2">
                  You said: <span className="font-medium">{recognizer.transcript || manualInput}</span>
                </p>
              )}
            </div>
            <div className="text-center p-4 bg-muted rounded-lg border border-border">
              <p className="text-2xl font-bold text-foreground">
                {recognizer.transcript ? (
                  <span className={Math.round((recognizer.confidence || 0) * 100) >= 70 ? "text-emerald-600" : "text-amber-600"}>
                    {Math.round((recognizer.confidence || 0) * 100)}%
                  </span>
                ) : manualInput ? (
                  <span className="text-emerald-600">85%</span>
                ) : "--"}
              </p>
              <p className="text-xs text-muted-foreground">Confidence</p>
            </div>
          </div>

          <div className="mt-6 flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              Word {wordIndex + 1} / {repetitionWords.length}
            </p>
            <Button onClick={nextWord} disabled={!recognizer.transcript && !manualInput}>
              {wordIndex === repetitionWords.length - 1 ? "Finish" : "Next"}
              <ChevronRight className="w-3 h-3 ml-1" />
            </Button>
          </div>

          {finalWordScore !== null && (
            <div className="mt-6 clinical-card p-4">
              <p className="font-semibold">Overall Clarity (Average): {finalWordScore}/100</p>
              <p className="text-xs text-muted-foreground mt-1">
                Note: This is an approximate clarity score using transcript similarity + recognition confidence (en-IN).
              </p>
            </div>
          )}
        </div>
      )}

      {/* ------------------- TEST 4 ------------------- */}
      {testId === 4 && (
        <div className="clinical-card p-6 mb-6">
          <div className="text-center mb-6">
            <p className="text-sm text-muted-foreground mb-2">Read the sentence clearly:</p>
            <p className="font-display text-xl font-bold text-foreground">"{pronunciationSentence}"</p>
            <p className="text-xs text-muted-foreground mt-3">
              Recognition: <span className="font-medium">{recognizer.transcript || "--"}</span>
            </p>
          </div>

          <div className="bg-muted rounded-xl p-8 flex flex-col items-center gap-4">
           <Button
  onClick={() => {
    if (recognizer.listening) recognizer.stop();
    else recognizer.start("en-IN", undefined, { interim: false, retryOnce: true });
  }}
  variant={recognizer.listening ? "destructive" : "default"}
  size="lg"
  className="gap-2"
  disabled={!recognizer.supported}
>
  {recognizer.listening ? (
    <>
      <Square className="w-4 h-4" /> Stop
    </>
  ) : (
    <>
      <Mic className="w-4 h-4" /> Start
    </>
  )}
</Button>

            {!recognizer.supported && (
              <p className="text-xs text-red-500">
                Speech recognition not supported here. Use Chrome on desktop/mobile.
              </p>
            )}
          </div>

          {sentenceScores && (
            <div className="mt-4 grid grid-cols-3 gap-4">
              <div className="text-center p-3 bg-muted rounded-lg">
                <p className="text-lg font-bold text-foreground">{sentenceScores.clarity}</p>
                <p className="text-xs text-muted-foreground">Clarity Score</p>
              </div>
              <div className="text-center p-3 bg-muted rounded-lg">
                <p className="text-lg font-bold text-foreground">{sentenceScores.sim}</p>
                <p className="text-xs text-muted-foreground">Transcript Match</p>
              </div>
              <div className="text-center p-3 bg-muted rounded-lg">
                <p className="text-lg font-bold text-foreground">{sentenceScores.conf}</p>
                <p className="text-xs text-muted-foreground">Confidence</p>
              </div>
            </div>
          )}

          <p className="text-xs text-muted-foreground mt-4">
            Tip: For more accurate “Indian English” pronunciation scoring, you’ll need a backend model that scores phonemes.
          </p>
        </div>
      )}
      

      {/* Footer controls */}
      <div className="mt-6 flex gap-3">
        <Button variant="outline" onClick={onBack}>
          Save & Exit
        </Button>
        {/* STEP 4 - BUTTON REPLACED */}
        <Button onClick={handleSubmitAndNext}>
          Submit & Next Test <ChevronRight className="w-3 h-3 ml-1" />
        </Button>
      </div>

      {/* STEP 5 - POPUP UI INJECTED */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card rounded-xl p-8 shadow-xl w-[380px] text-center animate-fade-in">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Test Submitted Successfully</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Moving to next test...
            </p>

            <div className="h-1 w-full bg-muted rounded overflow-hidden">
              <div className="h-1 bg-emerald-500 animate-pulse w-full" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default HearingAssessment;