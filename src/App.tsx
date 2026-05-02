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
    <div className="flex-1 overflow-hidden">{children}</div>
  </div>
);

const PageFallback = () => (
  <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
    Загружаю страницу…
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
