import { useState } from "react";
import { Upload, FileText, Video, Type, Eye, Ear, Brain, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const modes = [
  { key: "vision", label: "Vision Support", icon: Eye, desc: "High contrast, screen reader optimized, magnified content" },
  { key: "hearing", label: "Hearing/Speech Support", icon: Ear, desc: "Captions, visual cues, sign language references" },
  { key: "cognitive", label: "Cognitive Learning", icon: Brain, desc: "Simplified language, step-by-step, visual aids" },
];

const AssistantWorkspace = () => {
  const [activeMode, setActiveMode] = useState("vision");
  const [textInput, setTextInput] = useState("");

  return (
    <div className="p-8 animate-fade-in">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-foreground">Adaptive Understanding Assistant</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Upload content and receive explanations adapted to your needs.
        </p>
      </div>

      {/* Adaptation Mode Selector */}
      <div className="mb-6">
        <p className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wide">Active Adaptation Mode</p>
        <div className="grid md:grid-cols-3 gap-3">
          {modes.map((mode) => (
            <button
              key={mode.key}
              onClick={() => setActiveMode(mode.key)}
              className={`clinical-card p-4 text-left transition-all ${
                activeMode === mode.key ? "ring-2 ring-primary border-primary" : ""
              }`}
            >
              <mode.icon className={`w-5 h-5 mb-2 ${activeMode === mode.key ? "text-primary" : "text-muted-foreground"}`} />
              <p className="font-display font-semibold text-sm text-foreground">{mode.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{mode.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Input Area */}
      <Tabs defaultValue="text" className="mb-6">
        <TabsList>
          <TabsTrigger value="text"><Type className="w-3.5 h-3.5 mr-1.5" /> Paste Text</TabsTrigger>
          <TabsTrigger value="document"><FileText className="w-3.5 h-3.5 mr-1.5" /> Upload Document</TabsTrigger>
          <TabsTrigger value="video"><Video className="w-3.5 h-3.5 mr-1.5" /> Upload Video</TabsTrigger>
        </TabsList>

        <TabsContent value="text" className="mt-4">
          <textarea
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder="Paste your text content here for adaptive explanation..."
            className="w-full p-4 rounded-xl border border-border bg-card text-sm text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-ring"
            rows={6}
          />
          <Button className="mt-3">Generate Adaptive Explanation</Button>
        </TabsContent>

        <TabsContent value="document" className="mt-4">
          <div className="clinical-card border-2 border-dashed p-12 text-center">
            <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-foreground font-medium">Drop your document here</p>
            <p className="text-xs text-muted-foreground mt-1">PDF, DOCX, TXT supported</p>
          </div>
        </TabsContent>

        <TabsContent value="video" className="mt-4">
          <div className="clinical-card border-2 border-dashed p-12 text-center">
            <Video className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-foreground font-medium">Drop your video here</p>
            <p className="text-xs text-muted-foreground mt-1">MP4, WebM, MOV supported</p>
          </div>
        </TabsContent>
      </Tabs>

      {/* Explanation Panels */}
      <div className="grid md:grid-cols-2 gap-5">
        <div className="clinical-card p-6">
          <h3 className="font-display font-semibold text-foreground mb-2">Simplified Explanation</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Adaptive simplified content will appear here based on your input and selected support mode.
          </p>
        </div>
        <div className="clinical-card p-6">
          <h3 className="font-display font-semibold text-foreground mb-2">Step-by-Step Breakdown</h3>
          <div className="space-y-3">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center flex-shrink-0">
                  {step}
                </div>
                <p className="text-sm text-muted-foreground">Step {step} explanation placeholder...</p>
              </div>
            ))}
          </div>
        </div>
        <div className="clinical-card p-6">
          <h3 className="font-display font-semibold text-foreground mb-2">🔊 Audio Explanation</h3>
          <p className="text-xs text-muted-foreground mb-3">Listen to the content explained audibly</p>
          <div className="bg-muted rounded-lg p-4 flex items-center gap-3">
            <Button variant="outline" size="sm">▶ Play</Button>
            <div className="flex-1 h-2 bg-border rounded-full">
              <div className="h-2 bg-primary rounded-full" style={{ width: "0%" }} />
            </div>
            <span className="text-xs text-muted-foreground">0:00</span>
          </div>
        </div>
        <div className="clinical-card p-6">
          <h3 className="font-display font-semibold text-foreground mb-2">📊 Visual Diagram</h3>
          <p className="text-xs text-muted-foreground mb-3">Visual representation of the content</p>
          <div className="bg-muted rounded-lg p-8 text-center text-sm text-muted-foreground">
            [Visual explanation diagram placeholder]
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssistantWorkspace;
