import { useState } from "react";
import { Eye, Check, Clock, ChevronRight, BarChart2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

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

  const isObjectRecognition = testId === 1;
  const isClarity = testId === 2;
  const isColor = testId === 3;
  const isScene = testId === 4;
  const isTracking = testId === 5;

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
          <p className="text-sm text-muted-foreground mb-4">Indicate the smallest text size you can comfortably read:</p>
          {[32, 24, 18, 14, 11, 8].map((size) => (
            <div key={size} className="clinical-card p-4 flex items-center justify-between">
              <span style={{ fontSize: size }} className="text-foreground">The quick brown fox jumps over the lazy dog</span>
              <Button variant="outline" size="sm">I can read this</Button>
            </div>
          ))}
        </div>
      )}

      {isColor && (
        <div>
          <p className="text-sm text-muted-foreground mb-4">Identify the mismatched color in each row:</p>
          <div className="space-y-4">
            {[
              { colors: ["#e74c3c", "#e74c3c", "#e74c3c", "#c0392b"], odd: 3 },
              { colors: ["#2ecc71", "#27ae60", "#2ecc71", "#2ecc71"], odd: 1 },
              { colors: ["#3498db", "#3498db", "#3498db", "#2980b9"], odd: 3 },
            ].map((row, ri) => (
              <div key={ri} className="flex gap-3">
                {row.colors.map((c, ci) => (
                  <button
                    key={ci}
                    className="w-16 h-16 rounded-xl border-2 border-border hover:border-primary transition-colors"
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            ))}
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
          <p className="text-sm text-muted-foreground mb-4">Follow the moving dot with your eyes. Click when it stops.</p>
          <div className="clinical-card bg-muted rounded-xl h-64 flex items-center justify-center relative overflow-hidden">
            <div className="w-6 h-6 rounded-full bg-primary animate-pulse-soft" />
            <p className="absolute bottom-4 text-xs text-muted-foreground">Focus accuracy: --</p>
          </div>
        </div>
      )}

      {/* Response Accuracy Panel */}
      <div className="mt-8 clinical-card p-5">
        <h4 className="font-display font-semibold text-sm text-foreground mb-3">Response Accuracy</h4>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-foreground">--</p>
            <p className="text-xs text-muted-foreground">Correct</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-foreground">--</p>
            <p className="text-xs text-muted-foreground">Accuracy %</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-foreground">--</p>
            <p className="text-xs text-muted-foreground">Time Taken</p>
          </div>
        </div>
        <Progress value={0} className="mt-4 h-1.5" />
      </div>

      <div className="mt-6 flex gap-3">
        <Button variant="outline" onClick={onBack}>Save & Exit</Button>
        <Button>Submit & Next Test <ChevronRight className="w-3 h-3 ml-1" /></Button>
      </div>
    </div>
  );
};

export default VisionAssessment;
