import { lazy, Suspense, useEffect, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useMessageNotifications } from "@/hooks/useMessageNotifications";
import { supabase } from "@/integrations/supabase/client";
import { ShieldBan } from "lucide-react";
import { Button } from "@/components/ui/button";

// BottomNav is tiny (≈2 KB) — import eagerly so its icon sub-chunks
// are merged into this bundle instead of creating a level-3 request chain.
import BottomNav from "./BottomNav";

// Lazy-loaded pages — only needed after navigation
const About = lazy(() => import("../pages/About"));
const Login = lazy(() => import("../pages/Login"));
const Register = lazy(() => import("../pages/Register"));
const ForgotPassword = lazy(() => import("../pages/ForgotPassword"));
const ResetPassword = lazy(() => import("../pages/ResetPassword"));
const Onboarding = lazy(() => import("../pages/Onboarding"));
const ActivitiesPage = lazy(() => import("../pages/ActivitiesPage"));
const HelpPage = lazy(() => import("../pages/HelpPage"));
const SuggestionsPage = lazy(() => import("../pages/SuggestionsPage"));
const ProfilePage = lazy(() => import("../pages/ProfilePage"));
const MessagesPage = lazy(() => import("../pages/MessagesPage"));
const ChatPage = lazy(() => import("../pages/ChatPage"));
const BlockedUsersPage = lazy(() => import("../pages/BlockedUsersPage"));
const ActivityChatPage = lazy(() => import("../pages/ActivityChatPage"));
const HelpChatPage = lazy(() => import("../pages/HelpChatPage"));
const NotFound = lazy(() => import("../pages/NotFound"));
const AdminLayout = lazy(() => import("../pages/admin/AdminLayout"));
const AdminDashboard = lazy(() => import("../pages/admin/AdminDashboard"));
const AdminUsers = lazy(() => import("../pages/admin/AdminUsers"));
const AdminContent = lazy(() => import("../pages/admin/AdminContent"));
const AdminReports = lazy(() => import("../pages/admin/AdminReports"));
const MentionsLegales = lazy(() => import("../pages/MentionsLegales"));
const PolitiqueConfidentialite = lazy(() => import("../pages/PolitiqueConfidentialite"));
const CGU = lazy(() => import("../pages/CGU"));

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <p className="text-lg text-muted-foreground">Chargement…</p>
  </div>
);

const SuspendedScreen = ({ onSignOut }: { onSignOut: () => void }) => (
  <div className="min-h-screen flex items-center justify-center bg-background px-6">
    <div className="max-w-sm text-center space-y-6">
      <div className="w-20 h-20 mx-auto rounded-full bg-destructive/10 flex items-center justify-center">
        <ShieldBan className="w-10 h-10 text-destructive" />
      </div>
      <h1 className="text-2xl font-serif font-bold text-foreground">Compte suspendu</h1>
      <p className="text-muted-foreground leading-relaxed">
        Votre compte a été suspendu par un administrateur suite à un non-respect des règles de la communauté.
      </p>
      <p className="text-sm text-muted-foreground">
        Si vous pensez qu'il s'agit d'une erreur, contactez-nous à{" "}
        <span className="font-medium text-primary">support@antyk.fr</span>
      </p>
      <Button variant="outline" className="w-full" onClick={onSignOut}>
        Se déconnecter
      </Button>
    </div>
  </div>
);

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading, signOut } = useAuth();
  const [onboardingDone, setOnboardingDone] = useState<boolean | null>(null);
  const [suspended, setSuspended] = useState<boolean | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("onboarding_completed, suspended")
      .eq("user_id", user.id)
      .single()
      .then(({ data }) => {
        setOnboardingDone(data?.onboarding_completed ?? false);
        setSuspended(data?.suspended ?? false);
      });
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-lg text-muted-foreground">Chargement…</p>
      </div>
    );
  }

  if (!user) return <Navigate to="/connexion" replace />;
  if (onboardingDone === null || suspended === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-lg text-muted-foreground">Chargement…</p>
      </div>
    );
  }
  if (suspended) return <SuspendedScreen onSignOut={signOut} />;
  if (!onboardingDone) return <Navigate to="/onboarding" replace />;

  return <>{children}</>;
};

const OnboardingRoute = () => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/connexion" replace />;
  return <Onboarding />;
};

const NotificationListener = () => {
  useMessageNotifications();
  return null;
};

const AppRoutes = () => (
  <>
    <NotificationListener />
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/a-propos" element={<About />} />
        <Route path="/mentions-legales" element={<MentionsLegales />} />
        <Route path="/confidentialite" element={<PolitiqueConfidentialite />} />
        <Route path="/cgu" element={<CGU />} />
        <Route path="/connexion" element={<Login />} />
        <Route path="/inscription" element={<Register />} />
        <Route path="/mot-de-passe-oublie" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/onboarding" element={<OnboardingRoute />} />
        <Route path="/suggestions" element={<ProtectedRoute><SuggestionsPage /></ProtectedRoute>} />
        <Route path="/activites" element={<ProtectedRoute><ActivitiesPage /></ProtectedRoute>} />
        <Route path="/activites/:activityId/discussion" element={<ProtectedRoute><ActivityChatPage /></ProtectedRoute>} />
        <Route path="/entraide" element={<ProtectedRoute><HelpPage /></ProtectedRoute>} />
        <Route path="/entraide/:requestId/discussion" element={<ProtectedRoute><HelpChatPage /></ProtectedRoute>} />
        <Route path="/messages" element={<ProtectedRoute><MessagesPage /></ProtectedRoute>} />
        <Route path="/messages/:matchId" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
        <Route path="/profil" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
        <Route path="/utilisateurs-bloques" element={<ProtectedRoute><BlockedUsersPage /></ProtectedRoute>} />
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="utilisateurs" element={<AdminUsers />} />
          <Route path="contenus" element={<AdminContent />} />
          <Route path="conflits" element={<AdminReports />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
      <BottomNav />
    </Suspense>
  </>
);

const AppShell = () => <AppRoutes />;

export default AppShell;
