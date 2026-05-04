import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import AppSidebar from "@/components/AppSidebar";

const SubjectsPage = lazy(() => import("@/pages/SubjectsPage"));
const SubjectWorkspace = lazy(() => import("@/pages/SubjectWorkspace"));
const MaterialsPage = lazy(() => import("@/pages/MaterialsPage"));
const ProgressPage = lazy(() => import("@/pages/ProgressPage"));
const ProfilePage = lazy(() => import("@/pages/ProfilePage"));
const TestsPage = lazy(() => import("@/pages/TestsPage"));
const NotFound = lazy(() => import("@/pages/NotFound"));

const queryClient = new QueryClient();

const AppLayout = ({ children }: { children: React.ReactNode }) => (
  <div className="flex h-screen overflow-hidden bg-[#fbfaf7]">
    <AppSidebar />
    <div className="flex-1 overflow-hidden">
      <div className="h-full animate-route-enter">{children}</div>
    </div>
  </div>
);

const PageFallback = () => (
  <div className="flex h-full items-center justify-center bg-[#fbfaf7] px-6">
    <div className="animate-surface-enter rounded-[24px] border border-[#ebe6dc] bg-white px-6 py-4 text-sm text-[#7282a0] shadow-[0_18px_40px_rgba(15,23,42,0.04)]">
      Загружаю страницу…
    </div>
  </div>
);

const withAppLayout = (page: React.ReactNode) => (
  <AppLayout>
    <Suspense fallback={<PageFallback />}>
      {page}
    </Suspense>
  </AppLayout>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={withAppLayout(<SubjectsPage />)} />
          <Route path="/subject/:subjectId" element={withAppLayout(<SubjectWorkspace />)} />
          <Route path="/tests" element={withAppLayout(<TestsPage />)} />
          <Route path="/materials" element={withAppLayout(<MaterialsPage />)} />
          <Route path="/progress" element={withAppLayout(<ProgressPage />)} />
          <Route path="/profile" element={withAppLayout(<ProfilePage />)} />
          <Route
            path="*"
            element={(
              <Suspense fallback={<PageFallback />}>
                <NotFound />
              </Suspense>
            )}
          />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
