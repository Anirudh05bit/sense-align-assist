import { Eye, Ear, Brain, Smile, Download, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  Radar, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid
} from "recharts";

const radarData = [
  { subject: "Visual Acuity", score: 72 },
  { subject: "Color Vision", score: 85 },
  { subject: "Audio Processing", score: 60 },
  { subject: "Speech Clarity", score: 68 },
  { subject: "Reaction Time", score: 78 },
  { subject: "Memory", score: 65 },
  { subject: "Comprehension", score: 82 },
  { subject: "Emotional State", score: 70 },
];

const barData = [
  { name: "Vision", score: 74 },
  { name: "Hearing", score: 64 },
  { name: "Cognitive", score: 75 },
  { name: "Behavioral", score: 70 },
];

const sections = [
  {
    title: "Vision Ability Analysis",
    icon: Eye,
    color: "text-clinical-info",
    scores: [
      { label: "Object Recognition", value: 78 },
      { label: "Visual Clarity", value: 72 },
      { label: "Color Differentiation", value: 85 },
      { label: "Scene Description", value: 68 },
      { label: "Visual Tracking", value: 70 },
    ],
  },
  {
    title: "Hearing & Speech Analysis",
    icon: Ear,
    color: "text-clinical-warning",
    scores: [
      { label: "Audio Recognition", value: 62 },
      { label: "Sound Differentiation", value: 58 },
      { label: "Speech Repetition", value: 68 },
      { label: "Pronunciation Clarity", value: 65 },
    ],
  },
  {
    title: "Cognitive Ability Analysis",
    icon: Brain,
    color: "text-primary",
    scores: [
      { label: "Reaction Time", value: 78 },
      { label: "Pattern Matching", value: 82 },
      { label: "Memory Recall", value: 65 },
      { label: "Comprehension Speed", value: 75 },
    ],
  },
  {
    title: "Behavioral Emotional Analysis",
    icon: Smile,
    color: "text-clinical-success",
    scores: [
      { label: "Facial Expression", value: 72 },
      { label: "Eye Focus", value: 68 },
      { label: "Attention Engagement", value: 70 },
      { label: "Emotional Stability", value: 74 },
    ],
  },
];

const AbilityReport = () => {
  return (
    <div className="p-8 animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Ability Assessment Report</h1>
          <p className="text-sm text-muted-foreground">Comprehensive diagnostic analysis results</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm"><Share2 className="w-3.5 h-3.5 mr-1.5" /> Share</Button>
          <Button size="sm"><Download className="w-3.5 h-3.5 mr-1.5" /> Download PDF</Button>
        </div>
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        <div className="clinical-card p-6">
          <h3 className="font-display font-semibold text-foreground mb-4">Overall Ability Profile</h3>
          <ResponsiveContainer width="100%" height={280}>
            <RadarChart data={radarData}>
              <PolarGrid strokeDasharray="3 3" />
              <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: "hsl(210 12% 50%)" }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10 }} />
              <Radar name="Score" dataKey="score" stroke="hsl(174 62% 32%)" fill="hsl(174 62% 32%)" fillOpacity={0.2} strokeWidth={2} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        <div className="clinical-card p-6">
          <h3 className="font-display font-semibold text-foreground mb-4">Domain Scores</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={barData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={80} />
              <Tooltip />
              <Bar dataKey="score" fill="hsl(174 62% 32%)" radius={[0, 6, 6, 0]} barSize={24} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detailed Sections */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {sections.map((section) => (
          <div key={section.title} className="clinical-card p-6">
            <div className="flex items-center gap-2 mb-4">
              <section.icon className={`w-5 h-5 ${section.color}`} />
              <h3 className="font-display font-semibold text-foreground">{section.title}</h3>
            </div>
            <div className="space-y-3">
              {section.scores.map((s) => (
                <div key={s.label}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">{s.label}</span>
                    <span className="font-medium text-foreground">{s.value}%</span>
                  </div>
                  <Progress value={s.value} className="h-2" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Empathetic Summary */}
      <div className="clinical-card p-8 clinical-gradient-light">
        <h3 className="font-display text-lg font-semibold text-foreground mb-3">Diagnostic Insights</h3>
        <p className="text-sm text-foreground leading-relaxed mb-4">
          Your assessment reveals a strong foundation across multiple ability domains. While some areas show 
          opportunities for targeted support, your overall profile demonstrates considerable capability and 
          potential for growth.
        </p>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Remember: this assessment identifies areas where adaptive support can enhance your experience — 
          it reflects your unique abilities, not limitations. Every individual's profile is different, and 
          understanding yours is the first step toward personalized assistance.
        </p>
      </div>
    </div>
  );
};

export default AbilityReport;
