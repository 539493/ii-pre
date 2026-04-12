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
  <div className="relative flex h-screen overflow-hidden p-3 md:p-4">
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute left-[6%] top-[2%] h-72 w-72 rounded-full bg-sky-300/20 blur-3xl" />
      <div className="absolute bottom-[6%] right-[8%] h-80 w-80 rounded-full bg-cyan-200/20 blur-3xl" />
      <div className="absolute left-[35%] top-[18%] h-56 w-56 rounded-full bg-indigo-200/15 blur-3xl" />
    </div>
    <div className="app-shell-shadow relative flex w-full overflow-hidden rounded-[34px] border border-white/70 bg-white/45 backdrop-blur-xl">
      <AppSidebar />
      <div className="min-w-0 flex-1 overflow-hidden">{children}</div>
    </div>
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
