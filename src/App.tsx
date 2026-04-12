import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import AppSidebar from "@/components/AppSidebar";
import SubjectsPage from "@/pages/SubjectsPage";
import SubjectWorkspace from "@/pages/SubjectWorkspace";
import MaterialsPage from "@/pages/MaterialsPage";
import ProgressPage from "@/pages/ProgressPage";
import ProfilePage from "@/pages/ProfilePage";
import TestsPage from "@/pages/TestsPage";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const AppLayout = ({ children }: { children: React.ReactNode }) => (
  <div className="flex h-screen overflow-hidden bg-background">
    <AppSidebar />
    <div className="flex-1 overflow-hidden">{children}</div>
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<AppLayout><SubjectsPage /></AppLayout>} />
          <Route path="/subject/:subjectId" element={<AppLayout><SubjectWorkspace /></AppLayout>} />
          <Route path="/tests" element={<AppLayout><TestsPage /></AppLayout>} />
          <Route path="/materials" element={<AppLayout><MaterialsPage /></AppLayout>} />
          <Route path="/progress" element={<AppLayout><ProgressPage /></AppLayout>} />
          <Route path="/profile" element={<AppLayout><ProfilePage /></AppLayout>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
