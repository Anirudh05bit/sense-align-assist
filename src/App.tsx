import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppProvider } from "@/context/AppContext";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Dashboard from "./pages/Dashboard";
import UploadReport from "./pages/UploadReport";
import VisionAssessment from "./pages/VisionAssessment";
import HearingAssessment from "./pages/HearingAssessment";
import CognitiveAssessment from "./pages/CognitiveAssessment";
import BehavioralAssessment from "./pages/BehavioralAssessment";
import AbilityReport from "./pages/AbilityReport";
import AISupport from "./pages/AISupport";
import AssessmentLayout from "./components/layout/AssessmentLayout";
import VisualAssistant from "./pages/assistants/visual";
import SpeechAssistant from "./pages/assistants/speech";
import LearningAssistant from "./pages/assistants/learning";
import AssistantLayout from "@/components/layout/AssistantLayout";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AppProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />

              {/* Assessment Mode */}
              <Route element={<AssessmentLayout />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/upload" element={<UploadReport />} />
                <Route path="/assessment/vision" element={<VisionAssessment />} />
                <Route path="/assessment/hearing" element={<HearingAssessment />} />
                <Route path="/assessment/cognitive" element={<CognitiveAssessment />} />
                <Route path="/assessment/behavioral" element={<BehavioralAssessment />} />
                <Route path="/report" element={<AbilityReport />} />
                <Route path="/support" element={<AISupport />} />
              </Route>

              {/* ⭐ Assistant Mode — FULLSCREEN */}
              <Route element={<AssistantLayout />}>
                <Route path="/assistants/visual" element={<VisualAssistant />} />
                <Route path="/assistants/speech" element={<SpeechAssistant />} />
                <Route path="/assistants/learning" element={<LearningAssistant />} />
              </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AppProvider>
  </QueryClientProvider>
);

export default App;
