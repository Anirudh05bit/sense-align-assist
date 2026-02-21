import { useNavigate } from "react-router-dom";
import { Brain, FileText, ArrowRight, Shield, Activity, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <header className="clinical-gradient text-primary-foreground">
        <div className="container mx-auto px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-foreground/10 backdrop-blur flex items-center justify-center">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-display font-bold text-lg">ADAPT-AI</h1>
              <p className="text-xs opacity-80">Multimodal Adaptive Ability Assessment</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs opacity-70">
            
          </div>
        </div>

        <div className="container mx-auto px-6 py-16 pb-24 text-center">
          <div className="inline-flex items-center gap-2 bg-primary-foreground/10 backdrop-blur rounded-full px-4 py-1.5 text-xs mb-6">
            <Activity className="w-3.5 h-3.5" />
            <span>Clinical-Grade Assistive Intelligence</span>
          </div>
          <h2 className="font-display text-4xl md:text-5xl font-bold max-w-3xl mx-auto leading-tight mb-4">
            Multimodal Adaptive Ability Assessment & Assistive Intelligence
          </h2>
          <p className="text-lg opacity-85 max-w-2xl mx-auto mb-8">
            Comprehensive diagnostic assessments for visual, auditory, cognitive, and behavioral abilities 
            — powered by adaptive AI technology.
          </p>
          <div className="flex items-center justify-center gap-3 text-sm opacity-70">
            <span className="flex items-center gap-1.5"><Heart className="w-3.5 h-3.5" /> Empathetic</span>
            <span className="w-1 h-1 rounded-full bg-current opacity-50" />
            <span className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5" /> Secure</span>
            <span className="w-1 h-1 rounded-full bg-current opacity-50" />
            <span className="flex items-center gap-1.5"><Activity className="w-3.5 h-3.5" /> Adaptive</span>
          </div>
        </div>
      </header>

      {/* Pathway Cards */}
      <div className="container mx-auto px-6 -mt-12">
        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {/* New Assessment */}
          <button
            onClick={() => navigate("/dashboard")}
            className="clinical-card p-8 text-left group cursor-pointer"
          >
            <div className="w-14 h-14 rounded-2xl bg-clinical-teal-light flex items-center justify-center mb-5">
              <Activity className="w-7 h-7 text-primary" />
            </div>
            <h3 className="font-display text-xl font-bold text-foreground mb-2">
              Start New Ability Assessment
            </h3>
            <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
              Begin a comprehensive multimodal diagnostic assessment across vision, hearing, 
              cognitive, and behavioral domains.
            </p>
            <div className="flex items-center gap-2 text-primary font-medium text-sm group-hover:gap-3 transition-all">
              <span>Begin Assessment</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </button>

          {/* Upload Report */}
          <button
            onClick={() => navigate("/upload")}
            className="clinical-card p-8 text-left group cursor-pointer"
          >
            <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center mb-5">
              <FileText className="w-7 h-7 text-muted-foreground" />
            </div>
            <h3 className="font-display text-xl font-bold text-foreground mb-2">
              Upload Existing Medical Report
            </h3>
            <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
              Already have clinical reports? Upload hospital records, diagnostic reports, or 
              assessments to generate your adaptive profile directly.
            </p>
            <div className="flex items-center gap-2 text-primary font-medium text-sm group-hover:gap-3 transition-all">
              <span>Upload Report</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </button>
        </div>

        {/* Features */}
        <div className="max-w-4xl mx-auto mt-16 mb-20">
          <h3 className="font-display text-center text-lg font-semibold text-foreground mb-8">
            Supporting Three Disability Categories
          </h3>
          <div className="grid md:grid-cols-3 gap-5">
            {[
              { icon: "👁️", title: "Visual Impairment", desc: "Object recognition, visual clarity, color differentiation, and tracking assessments" },
              { icon: "👂", title: "Hearing & Speech", desc: "Audio recognition, sound differentiation, speech repetition, and pronunciation analysis" },
              { icon: "🧠", title: "Cognitive & Learning", desc: "Reaction time, pattern matching, memory recall, and comprehension evaluations" },
            ].map((cat) => (
              <div key={cat.title} className="clinical-card p-6 text-center">
                <span className="text-3xl mb-3 block">{cat.icon}</span>
                <h4 className="font-display font-semibold text-foreground mb-2">{cat.title}</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">{cat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
