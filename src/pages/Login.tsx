import { useState } from "react";
import { Link, useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { APP_NAME } from "@/lib/constants";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import logoAntyk from "@/assets/logo-antyk.png";
import { useToast } from "@/hooks/use-toast";

const Login = () => {
  const { user } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [stayLoggedIn, setStayLoggedIn] = useState(true);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    const { error } = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    setGoogleLoading(false);
    if (error) {
      toast({
        title: "Connexion Google impossible",
        description: (error as Error).message,
        variant: "destructive",
      });
    }
  };

  const handleAppleLogin = async () => {
    setAppleLoading(true);
    const { error } = await lovable.auth.signInWithOAuth("apple", {
      redirect_uri: window.location.origin,
    });
    setAppleLoading(false);
    if (error) {
      toast({
        title: "Connexion Apple impossible",
        description: (error as Error).message,
        variant: "destructive",
      });
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);

    if (error) {
      toast({
        title: "Connexion impossible",
        description: error.message === "Invalid login credentials"
          ? "Email ou mot de passe incorrect. Veuillez réessayer."
          : error.message,
        variant: "destructive",
      });
    } else {
      if (!stayLoggedIn) {
        // Mark session as temporary — cleared when browser closes
        localStorage.setItem("antyk_session_only", "1");
        sessionStorage.setItem("antyk_session_alive", "1");
      } else {
        localStorage.removeItem("antyk_session_only");
      }
      navigate("/suggestions");
    }
  };

  if (user) return <Navigate to="/suggestions" replace />;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="flex items-center gap-4 px-6 py-4 border-b border-border">
        <Button variant="ghost" size="icon" className="min-h-[48px] min-w-[48px]" asChild>
          <Link to="/"><ArrowLeft className="w-6 h-6" /></Link>
        </Button>
        <img src={logoAntyk} alt={APP_NAME} className="h-9 w-auto" />
      </header>

      <main className="flex-1 flex items-center justify-center px-6">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <h1 className="text-3xl font-serif font-bold text-foreground">Content de vous revoir !</h1>
            <p className="text-lg text-muted-foreground mt-2">Connectez-vous à votre compte</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-base">Adresse email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="votre@email.fr"
                className="h-14 text-lg"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-base">Mot de passe</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Votre mot de passe"
                  className="h-14 text-lg pr-14"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-2 min-h-[40px] min-w-[40px]"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Checkbox
                id="stay-logged-in"
                checked={stayLoggedIn}
                onCheckedChange={(v) => setStayLoggedIn(v === true)}
              />
              <Label htmlFor="stay-logged-in" className="text-base cursor-pointer">
                Rester connecté
              </Label>
            </div>

            <Button type="submit" className="btn-senior w-full text-lg h-14" disabled={loading}>
              {loading ? "Connexion en cours…" : "Se connecter"}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-background px-3 text-muted-foreground">ou</span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            className="btn-senior w-full text-lg h-14 flex items-center gap-3"
            onClick={handleGoogleLogin}
            disabled={googleLoading}
          >
            <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            {googleLoading ? "Connexion…" : "Continuer avec Google"}
          </Button>

          <Button
            type="button"
            variant="outline"
            className="btn-senior w-full text-lg h-14 flex items-center gap-3 bg-foreground text-background hover:bg-foreground/90 border-foreground"
            onClick={handleAppleLogin}
            disabled={appleLoading}
          >
            <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
            </svg>
            {appleLoading ? "Connexion…" : "Continuer avec Apple"}
          </Button>

          <div className="text-center space-y-4">
            <Link to="/mot-de-passe-oublie" className="text-primary text-lg hover:underline block">
              Mot de passe oublié ?
            </Link>
            <p className="text-muted-foreground text-lg">
              Pas encore de compte ?{" "}
              <Link to="/inscription" className="text-primary font-semibold hover:underline">
                S'inscrire
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Login;
