import { createContext, useContext, useState, ReactNode } from "react";

export interface AssessmentState {
  vision: { completed: number; total: number; status: "pending" | "in-progress" | "complete" };
  hearing: { completed: number; total: number; status: "pending" | "in-progress" | "complete" };
  cognitive: { completed: number; total: number; status: "pending" | "in-progress" | "complete" };
  behavioral: { completed: number; total: number; status: "pending" | "in-progress" | "complete" };
}

interface AppContextType {
  assessment: AssessmentState;
  setAssessment: React.Dispatch<React.SetStateAction<AssessmentState>>;
  uploadedReport: File | null;
  setUploadedReport: (file: File | null) => void;
}

const defaultAssessment: AssessmentState = {
  vision: { completed: 0, total: 5, status: "pending" },
  hearing: { completed: 0, total: 4, status: "pending" },
  cognitive: { completed: 0, total: 4, status: "pending" },
  behavioral: { completed: 0, total: 1, status: "pending" },
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [assessment, setAssessment] = useState<AssessmentState>(defaultAssessment);
  const [uploadedReport, setUploadedReport] = useState<File | null>(null);

  return (
    <AppContext.Provider value={{ assessment, setAssessment, uploadedReport, setUploadedReport }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useAppContext must be used within AppProvider");
  return context;
};
