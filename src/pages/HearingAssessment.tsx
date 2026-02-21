import { useState } from "react";
import { Ear, Clock, ChevronRight, BarChart2, Mic, Play, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

const hearingTests = [
  { id: 1, title: "Audio Recognition Test", desc: "Select correct interpretation of audio clips", time: "5 min" },
  { id: 2, title: "Sound Differentiation Test", desc: "Identify pitch, tone, or background noise differences", time: "5 min" },
  { id: 3, title: "Speech Repetition Recording", desc: "Repeat spoken words and record response", time: "5 min" },
  { id: 4, title: "Pronunciation Assessment", desc: "Record and evaluate speech clarity", time: "5 min" },
];

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
          <h1 className="font-display text-2xl font-bold text-foreground">Hearing & Speech Assessment</h1>
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
            <Button size="sm" onClick={() => setActiveTest(test.id)}>
              Start <ChevronRight className="w-3 h-3 ml-1" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};

const HearingTestView = ({ testId, onBack }: { testId: number; onBack: () => void }) => {
  const test = hearingTests.find((t) => t.id === testId)!;
  const [isRecording, setIsRecording] = useState(false);

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

      {/* Audio Playback */}
      {(testId === 1 || testId === 2) && (
        <div className="clinical-card p-6 mb-6">
          <p className="text-sm text-muted-foreground mb-4">
            {testId === 1 ? "Listen to the audio clip and select the correct interpretation:" : "Identify the differences in the audio samples:"}
          </p>
          <div className="bg-muted rounded-xl p-6 flex items-center justify-center gap-6 mb-4">
            <Button variant="outline" size="sm" className="gap-2">
              <Play className="w-4 h-4" /> Play Audio
            </Button>
            <div className="flex-1 h-12 bg-card rounded-lg flex items-center px-4">
              <div className="w-full h-6 flex items-end gap-0.5">
                {Array.from({ length: 40 }).map((_, i) => (
                  <div key={i} className="flex-1 bg-primary/30 rounded-t" style={{ height: `${Math.random() * 100}%` }} />
                ))}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {["Option A: Speech", "Option B: Music", "Option C: Nature Sound", "Option D: Silence"].map((opt) => (
              <Button key={opt} variant="outline" className="justify-start text-sm">{opt}</Button>
            ))}
          </div>
        </div>
      )}

      {/* Recording UI */}
      {(testId === 3 || testId === 4) && (
        <div className="clinical-card p-6 mb-6">
          <div className="text-center mb-6">
            <p className="text-sm text-muted-foreground mb-2">
              {testId === 3 ? "Listen and repeat the following word:" : "Read the following word clearly:"}
            </p>
            <p className="font-display text-3xl font-bold text-foreground">"Assessment"</p>
          </div>

          <div className="bg-muted rounded-xl p-8 flex flex-col items-center gap-4">
            {/* Waveform */}
            <div className="w-full h-16 flex items-center justify-center gap-0.5">
              {Array.from({ length: 50 }).map((_, i) => (
                <div
                  key={i}
                  className={`w-1 rounded-full transition-all ${isRecording ? "bg-destructive" : "bg-primary/30"}`}
                  style={{ height: isRecording ? `${Math.random() * 100}%` : "20%" }}
                />
              ))}
            </div>
            <Button
              onClick={() => setIsRecording(!isRecording)}
              variant={isRecording ? "destructive" : "default"}
              size="lg"
              className="gap-2"
            >
              {isRecording ? <><Square className="w-4 h-4" /> Stop Recording</> : <><Mic className="w-4 h-4" /> Start Recording</>}
            </Button>
          </div>

          {/* Clarity Score */}
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-muted rounded-lg">
              <p className="text-lg font-bold text-foreground">--</p>
              <p className="text-xs text-muted-foreground">Clarity Score</p>
            </div>
            <div className="text-center p-3 bg-muted rounded-lg">
              <p className="text-lg font-bold text-foreground">--</p>
              <p className="text-xs text-muted-foreground">Match Accuracy</p>
            </div>
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

export default HearingAssessment;
