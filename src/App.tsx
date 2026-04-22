import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { lazy, Suspense } from "react";
import { AuthProvider } from "@/hooks/useAuth";

// Eagerly loaded — needed on first paint for all visitors
import Landing from "./pages/Landing";
import CookieConsent from "./components/CookieConsent";

// Lazy-loaded — all page routes, auth logic, notification hooks
// only parsed when the user navigates away from the landing page
const AppShell = lazy(() => import("./components/AppShell"));

const queryClient = new QueryClient();

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <p className="text-lg text-muted-foreground">Chargement…</p>
  </div>
);

/**
 * Redirect already-authenticated users away from the landing page.
 * We read the Supabase session key directly from localStorage — zero SDK
 * overhead on the critical path. The AuthProvider (loaded inside AppShell)
 * will take over for every other route.
 */
const LandingRoute = () => {
  // Supabase stores the session under a key that starts with "sb-" and ends with "-auth-token"
  const hasSession = Object.keys(localStorage).some(
    (k) => k.startsWith("sb-") && k.endsWith("-auth-token")
  );
  if (hasSession) return <Navigate to="/suggestions" replace />;
  return <Landing />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Landing has its own eager route — zero page-code overhead */}
            <Route path="/" element={<LandingRoute />} />
            {/* All other routes go through the lazy AppShell */}
            <Route
              path="/*"
              element={
                <Suspense fallback={<PageLoader />}>
                  <AppShell />
                </Suspense>
              }
            />
          </Routes>
        </AuthProvider>
        <CookieConsent />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
