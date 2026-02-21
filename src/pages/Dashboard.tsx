import { useNavigate } from "react-router-dom";
import { Eye, Ear, Brain, Video, Clock, ChevronRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useAppContext } from "@/context/AppContext";

const assessmentGroups = [
  {
    key: "vision" as const,
    title: "Vision Ability Assessment",
    icon: Eye,
    tests: 5,
    time: "25 min",
    path: "/assessment/vision",
    color: "text-clinical-info",
    bgColor: "bg-blue-50",
    description: "Object recognition, visual clarity, color differentiation, scene description, visual tracking",
  },
  {
    key: "hearing" as const,
    title: "Hearing & Speech Assessment",
    icon: Ear,
    tests: 4,
    time: "20 min",
    path: "/assessment/hearing",
    color: "text-clinical-warning",
    bgColor: "bg-amber-50",
    description: "Audio recognition, sound differentiation, speech repetition, pronunciation assessment",
  },
  {
    key: "cognitive" as const,
    title: "Cognitive & Learning Assessment",
    icon: Brain,
    tests: 4,
    time: "20 min",
    path: "/assessment/cognitive",
    color: "text-primary",
    bgColor: "bg-clinical-teal-light",
    description: "Reaction time, pattern matching, memory recall, comprehension speed",
  },
  {
    key: "behavioral" as const,
    title: "Behavioral & Emotional Video Assessment",
    icon: Video,
    tests: 1,
    time: "10 min",
    path: "/assessment/behavioral",
    color: "text-clinical-success",
    bgColor: "bg-emerald-50",
    description: "Facial expression, eye tracking, attention, posture stability, emotion recognition",
  },
];

const Dashboard = () => {
  const navigate = useNavigate();
  const { assessment } = useAppContext();

  return (
    <div className="p-8 animate-fade-in">
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold text-foreground">Assessment Overview</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Complete each assessment module to generate your comprehensive ability profile.
        </p>
      </div>

      <div className="grid gap-5">
        {assessmentGroups.map((group) => {
          const state = assessment[group.key];
          const progress = state.total > 0 ? (state.completed / state.total) * 100 : 0;

          return (
            <div key={group.key} className="clinical-card p-6">
              <div className="flex items-start gap-5">
                <div className={`w-12 h-12 rounded-xl ${group.bgColor} flex items-center justify-center flex-shrink-0`}>
                  <group.icon className={`w-6 h-6 ${group.color}`} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-display font-semibold text-foreground">{group.title}</h3>
                    <span className={`status-dot ${
                      state.status === "complete" ? "status-complete" :
                      state.status === "in-progress" ? "status-in-progress" : "status-pending"
                    }`} />
                    <span className="text-xs text-muted-foreground capitalize">{state.status}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">{group.description}</p>

                  <div className="flex items-center gap-6 text-xs text-muted-foreground mb-3">
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {group.tests} tests
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      {group.time}
                    </span>
                    <span>{state.completed}/{state.total} completed</span>
                  </div>

                  <Progress value={progress} className="h-1.5" />
                </div>

                <Button
                  onClick={() => navigate(group.path)}
                  className="flex-shrink-0"
                  size="sm"
                >
                  {state.status === "complete" ? "Review" : "Start Assessment"}
                  <ChevronRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Dashboard;
