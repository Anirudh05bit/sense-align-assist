import { useState, useEffect, useRef } from "react";
import { Brain, Clock, ChevronRight, BarChart2, Zap, Grid3X3, BookOpen, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

const cognitiveTests = [
  { id: 1, title: "Reaction Time Test", desc: "Click response when stimuli appear on screen", time: "4 min", icon: Zap },
  { id: 2, title: "Pattern Matching Test", desc: "Identify matching shapes or sequences", time: "5 min", icon: Grid3X3 },
  { id: 3, title: "Memory Recall Test", desc: "Short-term memory sequence recall", time: "5 min", icon: Brain },
  { id: 4, title: "Comprehension Speed Test", desc: "Read passage and answer questions", time: "6 min", icon: BookOpen },
];

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
          <p className="text-sm text-muted-foreground tracking-tight">Standardized neuro-cognitive diagnostic suite</p>
        </div>
      </div>

      <div className="grid gap-4">
        {cognitiveTests.map((test) => (
          <div key={test.id} className="border rounded-xl p-5 flex items-center gap-4 bg-card shadow-sm hover:shadow-md transition-all">
            <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center">
              <test.icon className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="flex-1">
              <h3 className="font-display font-semibold text-sm">{test.title}</h3>
              <p className="text-xs text-muted-foreground">{test.desc}</p>
            </div>
            <span className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3" /> {test.time}</span>
            <Button size="sm" onClick={() => setActiveTest(test.id)}>Start Assessment</Button>
          </div>
        ))}
      </div>
    </div>
  );
};

const CognitiveTestView = ({ testId, onBack }: { testId: number; onBack: () => void }) => {
  const test = cognitiveTests.find((t) => t.id === testId)!;
  
  // Shared functional states
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Test 1: Reaction States
  const [isGreen, setIsGreen] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [reactionTimes, setReactionTimes] = useState<number[]>([]);
  const [waiting, setWaiting] = useState(false);

  // Test 3: Memory States
  const [memorySequence] = useState(["🔴", "🔵", "🟢", "🟡", "🔴"]);
  const [showSequence, setShowSequence] = useState(true);
  const [userSequence, setUserSequence] = useState<string[]>([]);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  // Logic for Reaction Test (Test 1)
  const startReactionRound = () => {
    setWaiting(true);
    setIsGreen(false);
    const delay = Math.floor(Math.random() * 3000) + 2000; // 2-5 second random wait
    setTimeout(() => {
      setIsGreen(true);
      setStartTime(Date.now());
    }, delay);
  };

  const handleReactionClick = () => {
    if (isGreen && startTime) {
      const diff = Date.now() - startTime;
      setReactionTimes(prev => [...prev, diff]);
      setIsGreen(false);
      setWaiting(false);
      if (reactionTimes.length >= 4) setIsComplete(true);
    }
  };

  const avgReaction = reactionTimes.length > 0 
    ? Math.round(reactionTimes.reduce((a, b) => a + b) / reactionTimes.length) 
    : 0;

  const formatTime = (s: number) => `0${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  return (
    <div className="p-8 max-w-4xl mx-auto animate-in fade-in duration-500">
      <Button variant="ghost" onClick={onBack} className="mb-4">← Back to tests</Button>
      
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
            <BarChart2 className="w-4 h-4" /> Score: {isComplete ? "88%" : "--"}
          </div>
        </div>
      </div>

      <div className="relative bg-white border-2 rounded-3xl min-h-[400px] flex flex-col items-center justify-center p-8 shadow-sm overflow-hidden">
        {isComplete ? (
          <div className="text-center animate-in zoom-in-95">
            <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-2xl font-bold">Assessment Complete</h3>
            <p className="text-muted-foreground">Behavioral data recorded for clinical analysis.</p>
            <Button className="mt-6" onClick={onBack}>Finish & Review</Button>
          </div>
        ) : (
          <>
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
                {!waiting && <Button className="w-full h-12" onClick={startReactionRound}>Start Round {reactionTimes.length + 1}</Button>}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 rounded-2xl border text-center">
                    <p className="text-xs font-bold text-slate-400 uppercase">Avg Reaction</p>
                    <p className="text-2xl font-black text-blue-600">{avgReaction}ms</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl border text-center">
                    <p className="text-xs font-bold text-slate-400 uppercase">Attempts</p>
                    <p className="text-2xl font-black text-blue-600">{reactionTimes.length}/5</p>
                  </div>
                </div>
              </div>
            )}

            {testId === 2 && (
              <div className="w-full max-w-2xl text-center">
                <p className="mb-6 text-slate-500">Find the unique shape that does not repeat:</p>
                <div className="grid grid-cols-4 gap-4 mb-8">
                  {["▲", "■", "●", "◆", "▲", "■", "★", "●"].map((shape, i) => (
                    <button 
                      key={i} 
                      onClick={() => shape === "★" && setIsComplete(true)}
                      className="aspect-square bg-slate-50 border-2 border-slate-100 rounded-2xl text-4xl hover:border-blue-500 hover:bg-blue-50 transition-all flex items-center justify-center"
                    >
                      {shape}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {testId === 3 && (
              <div className="w-full max-w-md text-center">
                <p className="mb-8 text-slate-500">{showSequence ? "Memorize the color order:" : "Click the colors in order:"}</p>
                <div className="flex gap-4 justify-center mb-10">
                  {memorySequence.map((item, i) => (
                    <div key={i} className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl border-2 transition-all ${
                      showSequence ? "bg-white border-slate-200" : userSequence[i] ? "bg-slate-50 border-blue-500" : "bg-slate-100 border-dashed border-slate-300"
                    }`}>
                      {showSequence ? item : userSequence[i] || "?"}
                    </div>
                  ))}
                </div>
                {showSequence ? (
                  <Button size="lg" className="w-full" onClick={() => setShowSequence(false)}>I Memorized It</Button>
                ) : (
                  <div className="flex gap-2 justify-center">
                    {["🔴", "🔵", "🟢", "🟡"].map(color => (
                      <button 
                        key={color} 
                        onClick={() => {
                          const next = [...userSequence, color];
                          setUserSequence(next);
                          if (next.length === memorySequence.length) setIsComplete(true);
                        }}
                        className="w-16 h-16 rounded-full text-3xl bg-slate-50 border hover:bg-white shadow-sm transition-all"
                      >{color}</button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {testId === 4 && (
              <div className="w-full max-w-2xl space-y-6">
                <div className="bg-slate-50 p-6 rounded-2xl border leading-relaxed text-slate-700">
                  "Working memory is the system that holds and processes information in the mind for short periods. 
                  Unlike long-term memory, it has a limited capacity, usually holding about **seven** items at once. 
                  This capacity is vital for complex reasoning and language comprehension."
                </div>
                <p className="font-bold text-lg text-center">How many items can working memory typically hold?</p>
                <div className="grid grid-cols-2 gap-3">
                  {["Three", "Seven", "Twenty", "Unlimited"].map((opt) => (
                    <Button key={opt} variant="outline" className="h-14 justify-start px-6" onClick={() => opt === "Seven" && setIsComplete(true)}>
                      {opt}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <div className="mt-8 flex justify-end gap-3">
        <Button variant="outline" onClick={onBack}>Save & Exit</Button>
        <Button disabled={!isComplete}>Submit Results <ChevronRight className="w-3 h-3 ml-1" /></Button>
      </div>
    </div>
  );
};

export default CognitiveAssessment;