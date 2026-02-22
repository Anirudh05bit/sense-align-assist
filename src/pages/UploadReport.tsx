import { useState, useCallback } from "react";
import { Upload, FileText, X, Image, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const UploadReport = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [extractedText, setExtractedText] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);
  const [assistantRoute, setAssistantRoute] = useState(""); // NEW STATE
  const [error, setError] = useState("");

  const uploadToBackend = async () => {
    if (files.length === 0) return;

    setIsUploading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", files[0]);

      const res = await fetch("http://localhost:8000/analyze-report", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Upload failed");

      const data = await res.json();

      // Store analysis
      setAnalysis(data.analysis);

      // Store assistant type instead of redirecting immediately
      setAssistantRoute(data.assistant_to_load);

      // Show nicely formatted summary instead of raw JSON
      setExtractedText(
        `Primary Disability: ${data.analysis.primary_disability}
          Confidence: ${data.analysis.confidence}%
          Recommended Assistant: ${data.assistant_to_load}`
      );

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const dropped = Array.from(e.dataTransfer.files);
    setFiles((prev) => [...prev, ...dropped]);
    setExtractedText("Extracted diagnosis summary will appear here after AI processing...");
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
      setExtractedText("Extracted diagnosis summary will appear here after AI processing...");
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const openAssistant = () => {
    if (assistantRoute === "visual_assistant") {
      window.location.href = "/assistants/visual";
    }
    if (assistantRoute === "speech_assistant") {
      window.location.href = "/assistants/speech";
    }
    if (assistantRoute === "learning_assistant") {
      window.location.href = "/assistants/learning";
    }
  };

  const formatLabel = (value: string) => {
    return value.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div className="p-8 max-w-4xl animate-fade-in">
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold text-foreground">Upload Medical Report</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Upload existing clinical reports to skip assessments and generate your adaptive profile directly.
        </p>
      </div>

      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`clinical-card p-12 border-2 border-dashed text-center cursor-pointer transition-colors ${
          isDragging ? "border-primary bg-clinical-teal-light" : "border-border"
        }`}
        onClick={() => document.getElementById("file-input")?.click()}
      >
        <Upload className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
        <p className="font-medium text-foreground mb-1">Drag & drop your medical reports here</p>
        <p className="text-sm text-muted-foreground mb-3">Supports PDF, JPG, PNG, and scanned documents</p>
        <Button variant="outline" size="sm" type="button">Browse Files</Button>
        <input id="file-input" type="file" multiple accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={handleFileSelect} />
      </div>

      {files.length > 0 && (
        <div className="mt-6 space-y-3">
          <h3 className="font-display font-semibold text-sm text-foreground">Uploaded Files</h3>
          {files.map((file, i) => (
            <div key={i} className="clinical-card p-4 flex items-center gap-3">
              {file.type.includes("image") ? (
                <Image className="w-5 h-5 text-clinical-info" />
              ) : (
                <FileText className="w-5 h-5 text-primary" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{file.name}</p>
                <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
              </div>
              <button onClick={() => removeFile(i)} className="text-muted-foreground hover:text-destructive">
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {files.length > 0 && (
        <div className="mt-8 space-y-6">
          <div className="clinical-card p-6">
            <h3 className="font-display font-semibold text-foreground mb-1">Extracted Diagnosis Summary</h3>
            <p className="text-xs text-muted-foreground mb-4">AI-extracted content from your uploaded reports</p>
            {analysis && (
              <div className="mb-4 bg-white rounded-lg border p-4 shadow-sm">
                <div className="grid md:grid-cols-3 gap-4">

                  {/* Primary Disability */}
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground mb-1">Primary Condition</p>
                    <p className="font-semibold text-lg text-primary">
                      {formatLabel(analysis.primary_disability)}
                    </p>
                  </div>

                  {/* Confidence */}
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground mb-1">Confidence Level</p>
                    <div className="w-full bg-muted rounded-full h-2 mt-2">
                      <div
                        className="bg-green-500 h-2 rounded-full"
                        style={{ width: `${analysis.confidence}%` }}
                      />
                    </div>
                    <p className="text-sm mt-1">
                      {analysis.confidence}%
                    </p>
                  </div>

                  {/* Assistant */}
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground mb-1">Recommended Assistant</p>
                    <p className="font-semibold text-lg text-green-600">
                      {formatLabel(assistantRoute.replace("_assistant", ""))}
                    </p>
                  </div>

                </div>
              </div>
            )}
          
          </div>

          <Button size="lg" className="w-full" onClick={uploadToBackend} disabled={isUploading}>
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Analyzing Report...
              </>
            ) : (
              <>
                <Check className="w-4 h-4 mr-2" />
                Generate Adaptive Profile
              </>
            )}
          </Button>

          {assistantRoute && (
            <Button size="lg" className="w-full mt-4" onClick={openAssistant}>
              Open Your Personalized Assistant →
            </Button>
          )}

          {error && (
            <p className="text-red-500 text-sm mt-2">{error}</p>
          )}
        </div>
      )}
    </div>
  );
};

export default UploadReport;