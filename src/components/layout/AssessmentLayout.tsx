import { Outlet, useLocation, Link } from "react-router-dom";
import { 
  Eye, Ear, Brain, Video, FileText, BarChart3, 
  MessageCircle, Lightbulb, Home, ChevronRight 
} from "lucide-react";
import { useAppContext } from "@/context/AppContext";
import { Progress } from "@/components/ui/progress";

const navItems = [
  { title: "Dashboard", path: "/dashboard", icon: Home },
  { title: "Vision Assessment", path: "/assessment/vision", icon: Eye },
  { title: "Hearing & Speech", path: "/assessment/hearing", icon: Ear },
  { title: "Cognitive & Learning", path: "/assessment/cognitive", icon: Brain },
  { title: "Behavioral Analysis", path: "/assessment/behavioral", icon: Video },
  { title: "Upload Reports", path: "/upload", icon: FileText },
  { title: "Ability Report", path: "/report", icon: BarChart3 },
  { title: "AI Support", path: "/support", icon: MessageCircle },
];

const AssessmentLayout = () => {
  const location = useLocation();
  const { assessment } = useAppContext();

  const totalCompleted =
    assessment.vision.completed +
    assessment.hearing.completed +
    assessment.cognitive.completed +
    assessment.behavioral.completed;
  const totalTests =
    assessment.vision.total +
    assessment.hearing.total +
    assessment.cognitive.total +
    assessment.behavioral.total;
  const overallProgress = totalTests > 0 ? (totalCompleted / totalTests) * 100 : 0;

  return (
    <div className="flex min-h-screen w-full">
      {/* Sidebar */}
      <aside className="w-64 bg-clinical-navy text-clinical-navy-foreground flex-shrink-0 flex flex-col">
        <div className="p-5 border-b border-sidebar-border">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Brain className="w-4 h-4 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-display font-bold text-sm text-sidebar-primary-foreground">ADAPT-AI</h1>
              <p className="text-[10px] text-sidebar-foreground opacity-70">Ability Assessment System</p>
            </div>
          </Link>
        </div>

        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + "/");
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  isActive
                    ? "bg-sidebar-accent text-sidebar-primary"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                }`}
              >
                <item.icon className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">{item.title}</span>
                {isActive && <ChevronRight className="w-3 h-3 ml-auto" />}
              </Link>
            );
          })}
        </nav>

        {/* Progress Summary */}
        <div className="p-4 border-t border-sidebar-border">
          <p className="text-xs text-sidebar-foreground mb-2">Overall Progress</p>
          <Progress value={overallProgress} className="h-2 bg-sidebar-accent" />
          <p className="text-xs text-sidebar-foreground mt-1.5">
            {totalCompleted}/{totalTests} tests completed
          </p>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto bg-background">
        <Outlet />
      </main>
    </div>
  );
};

export default AssessmentLayout;
