import { useState } from "react";
import { Video, Clock, Camera, Eye, Smile, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

const BehavioralAssessment = () => {
  const [isRecording, setIsRecording] = useState(false);

  return (
    <div className="p-8 animate-fade-in">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
          <Video className="w-5 h-5 text-clinical-success" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Behavioral & Emotional Analysis</h1>
          <p className="text-sm text-muted-foreground">Webcam-based assessment · ~10 minutes</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Camera Preview */}
        <div className="lg:col-span-2 space-y-5">
          <div className="clinical-card overflow-hidden">
            <div className="aspect-video bg-clinical-navy flex items-center justify-center relative">
              {isRecording ? (
                <>
                  <div className="text-clinical-navy-foreground text-sm flex flex-col items-center gap-2">
                    <Camera className="w-8 h-8 opacity-50" />
                    <span className="opacity-70">Live Camera Preview</span>
                  </div>
                  <div className="absolute top-4 left-4 flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-destructive animate-pulse-soft" />
                    <span className="text-xs text-clinical-navy-foreground">Recording</span>
                  </div>
                  <div className="absolute top-4 right-4 clinical-card px-3 py-1 flex items-center gap-1.5">
                    <Clock className="w-3 h-3 text-muted-foreground" />
                    <span className="text-xs font-medium text-foreground">00:00</span>
                  </div>
                </>
              ) : (
                <div className="text-clinical-navy-foreground text-sm flex flex-col items-center gap-3">
                  <Camera className="w-12 h-12 opacity-30" />
                  <span className="opacity-50">Camera preview will appear here</span>
                  <Button onClick={() => setIsRecording(true)} className="mt-2">
                    <Camera className="w-4 h-4 mr-2" /> Start Recording
                  </Button>
                </div>
              )}
            </div>
          </div>

          {isRecording && (
            <div className="flex gap-3">
              <Button variant="destructive" onClick={() => setIsRecording(false)}>Stop Recording</Button>
              <Button variant="outline">Pause</Button>
            </div>
          )}
        </div>

        {/* Analysis Indicators */}
        <div className="space-y-4">
          {[
            { label: "Facial Expression", icon: Smile, value: "--", sub: "Neutral" },
            { label: "Eye Focus Tracking", icon: Eye, value: "--", sub: "No data" },
            { label: "Attention Engagement", icon: Activity, value: "--", sub: "Measuring..." },
            { label: "Posture Stability", icon: Activity, value: "--", sub: "Awaiting input" },
            { label: "Emotion Recognition", icon: Smile, value: "--", sub: "Processing..." },
          ].map((indicator) => (
            <div key={indicator.label} className="clinical-card p-4">
              <div className="flex items-center gap-3 mb-2">
                <indicator.icon className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs font-medium text-foreground">{indicator.label}</span>
              </div>
              <p className="text-xl font-bold text-foreground">{indicator.value}</p>
              <p className="text-xs text-muted-foreground">{indicator.sub}</p>
              <Progress value={0} className="mt-2 h-1" />
            </div>
          ))}
        </div>
      </div>

      {/* Behavioral Scoring Dashboard */}
      <div className="mt-8 clinical-card p-6">
        <h3 className="font-display font-semibold text-foreground mb-4">Behavioral Scoring Dashboard</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { label: "Expression Score", value: "--" },
            { label: "Focus Score", value: "--" },
            { label: "Engagement", value: "--" },
            { label: "Posture Score", value: "--" },
            { label: "Emotional State", value: "--" },
          ].map((s) => (
            <div key={s.label} className="text-center p-3 bg-muted rounded-lg">
              <p className="text-xl font-bold text-foreground">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BehavioralAssessment;
