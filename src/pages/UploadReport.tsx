import { useState, useCallback } from "react";
import { Upload, FileText, X, Image, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const UploadReport = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [extractedText, setExtractedText] = useState("");

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

  return (
    <div className="p-8 max-w-4xl animate-fade-in">
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold text-foreground">Upload Medical Report</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Upload existing clinical reports to skip assessments and generate your adaptive profile directly.
        </p>
      </div>

      {/* Drop Zone */}
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

      {/* File List */}
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

      {/* Extracted Summary */}
      {files.length > 0 && (
        <div className="mt-8 space-y-6">
          <div className="clinical-card p-6">
            <h3 className="font-display font-semibold text-foreground mb-1">Extracted Diagnosis Summary</h3>
            <p className="text-xs text-muted-foreground mb-4">AI-extracted content from your uploaded reports</p>
            <div className="bg-muted rounded-lg p-4 mb-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Processing document... Diagnosis classification will appear here.</span>
              </div>
            </div>
            <Textarea
              value={extractedText}
              onChange={(e) => setExtractedText(e.target.value)}
              placeholder="Editable extracted text section..."
              rows={4}
            />
          </div>

          {/* Classification Placeholders */}
          <div className="grid md:grid-cols-3 gap-4">
            {["Visual Impairment", "Hearing/Speech", "Cognitive/Learning"].map((cat) => (
              <div key={cat} className="clinical-card p-4 text-center">
                <p className="text-xs text-muted-foreground mb-1">Classification</p>
                <p className="font-display font-semibold text-foreground text-sm">{cat}</p>
                <p className="text-xs text-muted-foreground mt-1">Awaiting analysis...</p>
              </div>
            ))}
          </div>

          <Button size="lg" className="w-full">
            <Check className="w-4 h-4 mr-2" />
            Generate Adaptive Profile
          </Button>
        </div>
      )}
    </div>
  );
};

export default UploadReport;
