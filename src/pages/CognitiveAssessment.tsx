import { useState } from "react";
import { Brain, Clock, ChevronRight, BarChart2, Zap, Grid3X3, BookOpen } from "lucide-react";
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
    <div className="p-8 animate-fade-in">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-clinical-teal-light flex items-center justify-center">
          <Brain className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Cognitive & Learning Assessment</h1>
          <p className="text-sm text-muted-foreground">4 diagnostic tests · ~20 minutes</p>
        </div>
      </div>

      <div className="space-y-4">
        {cognitiveTests.map((test) => (
          <div key={test.id} className="clinical-card p-5 flex items-center gap-4">
            <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center">
              <test.icon className="w-4 h-4 text-muted-foreground" />
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

const CognitiveTestView = ({ testId, onBack }: { testId: number; onBack: () => void }) => {
  const test = cognitiveTests.find((t) => t.id === testId)!;
  const [reactionActive, setReactionActive] = useState(false);
  const [memorySequence] = useState(["🔴", "🔵", "🟢", "🟡", "🔴"]);
  const [showSequence, setShowSequence] = useState(true);

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
            <span className="text-sm font-medium text-foreground">00:00</span>
          </div>
          <div className="clinical-card px-4 py-2 flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">Score: --</span>
          </div>
        </div>
      </div>

      {testId === 1 && (
        <div className="clinical-card p-8">
          <p className="text-sm text-muted-foreground mb-6 text-center">Click the button as soon as the circle turns green</p>
          <div className="flex flex-col items-center gap-6">
            <div
              className={`w-32 h-32 rounded-full transition-colors duration-300 ${
                reactionActive ? "bg-clinical-success" : "bg-destructive"
              }`}
            />
            <Button size="lg" onClick={() => setReactionActive(!reactionActive)}>
              {reactionActive ? "Click Now!" : "Wait..."}
            </Button>
            <div className="grid grid-cols-3 gap-8 mt-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-foreground">-- ms</p>
                <p className="text-xs text-muted-foreground">Avg. Reaction</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-foreground">-- ms</p>
                <p className="text-xs text-muted-foreground">Best Time</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-foreground">0/5</p>
                <p className="text-xs text-muted-foreground">Attempts</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {testId === 2 && (
        <div className="clinical-card p-6">
          <p className="text-sm text-muted-foreground mb-4">Select the shape that matches the pattern:</p>
          <div className="grid grid-cols-4 gap-4 mb-6">
            {["▲", "■", "●", "◆", "▲", "■", "▲", "●"].map((shape, i) => (
              <button key={i} className="aspect-square clinical-card flex items-center justify-center text-3xl hover:border-primary transition-colors">
                {shape}
              </button>
            ))}
          </div>
          <Progress value={0} className="h-1.5" />
        </div>
      )}

      {testId === 3 && (
        <div className="clinical-card p-6">
          <p className="text-sm text-muted-foreground mb-4">
            {showSequence ? "Memorize this sequence:" : "Now reproduce the sequence:"}
          </p>
          <div className="flex gap-4 justify-center mb-6">
            {memorySequence.map((item, i) => (
              <div key={i} className={`w-14 h-14 rounded-xl flex items-center justify-center text-2xl clinical-card ${
                !showSequence ? "bg-muted cursor-pointer" : ""
              }`}>
                {showSequence ? item : "?"}
              </div>
            ))}
          </div>
          <div className="text-center">
            <Button onClick={() => setShowSequence(!showSequence)}>
              {showSequence ? "I'm Ready — Hide Sequence" : "Show Again"}
            </Button>
          </div>
        </div>
      )}

      {testId === 4 && (
        <div className="clinical-card p-6">
          <p className="text-sm text-muted-foreground mb-4">Read the passage and answer the question:</p>
          <div className="bg-muted rounded-lg p-5 mb-5 text-sm text-foreground leading-relaxed">
            "The human brain processes visual information approximately 60,000 times faster than text. 
            This remarkable ability allows us to recognize faces, navigate complex environments, and 
            make split-second decisions based on visual cues."
          </div>
          <p className="font-medium text-foreground text-sm mb-3">How much faster does the brain process visual vs text information?</p>
          <div className="grid grid-cols-2 gap-3">
            {["1,000 times", "10,000 times", "60,000 times", "100,000 times"].map((opt) => (
              <Button key={opt} variant="outline" className="justify-start">{opt}</Button>
            ))}
          </div>
        </div>
      )}

      <div className="mt-6 flex gap-3">
        <Button variant="outline" onClick={onBack}>Save & Exit</Button>
        <Button>Submit & Next Test <ChevronRight className="w-3 h-3 ml-1" /></Button>
      </div>
    </div>
  );
};

export default CognitiveAssessment;
