import { Outlet, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export default function AssistantLayout() {
  const navigate = useNavigate();

  return (
    <div className="fixed inset-0 z-50">

      {/* Floating Exit Button */}
      <button
        onClick={() => navigate("/dashboard")}
        className="
          absolute top-6 right-6 z-50
          flex items-center gap-2
          px-5 py-2.5
          rounded-xl
          text-sm font-medium
          text-white
          bg-gradient-to-r from-indigo-600 to-blue-600
          shadow-lg shadow-blue-900/40
          hover:scale-105 hover:shadow-xl
          transition-all duration-300
          backdrop-blur-lg border border-white/20
        "
      >
        <ArrowLeft size={16} />
        Exit Assistant
      </button>

      {/* Assistant content */}
      <Outlet />

    </div>
  );
}