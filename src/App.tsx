import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { ThemeProvider } from "next-themes";
import { AppSidebar } from "@/components/AppSidebar";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Header } from "@/components/Header";
import { MobileHomeButton } from "@/components/MobileHomeButton";
import { DashboardFAB } from "@/components/DashboardFAB";
import { RouteLoadingIndicator } from "@/components/RouteLoadingIndicator";
import { AnimatedRoutes } from "@/components/AnimatedRoutes";
import { useAuthSync } from "@/hooks/useAuthSync";
import { useScrollToTop } from "@/hooks/useScrollToTop";
import Auth from "./pages/Auth";
import AuthReset from "./pages/AuthReset";
import ForgotPassword from "./pages/ForgotPassword";

// Configure QueryClient with optimal settings for caching and real-time updates
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Stale time: How long data is considered fresh (won't refetch during this time)
      staleTime: 1000 * 60 * 5, // 5 minutes default
      
      // GC time: How long unused data stays in cache before being garbage collected
      // Previously known as 'cacheTime' in older versions
      gcTime: 1000 * 60 * 30, // 30 minutes default
      
      // Refetch on window focus - great for real-time feel
      refetchOnWindowFocus: true,
      
      // Refetch on reconnect - ensures fresh data after connection loss
      refetchOnReconnect: true,
      
      // Retry failed requests (useful for network issues)
      retry: 1,
      
      // Retry delay
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      // Retry mutations on network errors
      retry: 1,
    },
  },
});

// Helper component to use hooks that need to be inside Router
const RouterContent = () => {
  useAuthSync();
  useScrollToTop();
  
  return (
    <>
      <RouteLoadingIndicator />
      <Routes>
        <Route path="/auth" element={<Auth />} />
        <Route path="/auth/reset" element={<AuthReset />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <SidebarProvider>
                <div className="min-h-screen flex w-full bg-background">
                  <AppSidebar />
                  <div className="flex-1 flex flex-col min-w-0">
                    <Header />
                      <main className="flex-1 overflow-visible relative">
                        <AnimatedRoutes />
                      </main>
                      <MobileHomeButton />
                      <DashboardFAB />
                  </div>
                </div>
              </SidebarProvider>
            </ProtectedRoute>
          }
        />
      </Routes>
    </>
  );
};

// Component to sync auth state with cache
const AppContent = () => {
  return (
    <>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <RouterContent />
      </BrowserRouter>
    </>
  );
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <TooltipProvider>
          <AppContent />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
