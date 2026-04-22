import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { APP_NAME } from "@/lib/constants";
import { Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Check for recovery token in URL
    const hash = window.location.hash;
    if (!hash.includes("type=recovery")) {
      navigate("/connexion");
    }
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast({ title: "Erreur", description: "Les mots de passe ne correspondent pas.", variant: "destructive" });
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Mot de passe mis à jour", description: "Vous pouvez maintenant vous connecter." });
      navigate("/connexion");
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="px-6 py-4 border-b border-border">
        <h2 className="text-2xl font-serif font-bold text-primary">{APP_NAME}</h2>
      </header>
      <main className="flex-1 flex items-center justify-center px-6">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <h1 className="text-3xl font-serif font-bold text-foreground">Nouveau mot de passe</h1>
            <p className="text-lg text-muted-foreground mt-2">Choisissez un nouveau mot de passe sécurisé.</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="password" className="text-base">Nouveau mot de passe</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Au moins 6 caractères"
                  className="h-14 text-lg pr-14"
                  required
                />
                <Button type="button" variant="ghost" size="icon" className="absolute right-2 top-2 min-h-[40px] min-w-[40px]" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm" className="text-base">Confirmer</Label>
              <Input id="confirm" type={showPassword ? "text" : "password"} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Retapez le mot de passe" className="h-14 text-lg" required />
            </div>
            <Button type="submit" className="btn-senior w-full text-lg h-14" disabled={loading}>
              {loading ? "Mise à jour…" : "Mettre à jour le mot de passe"}
            </Button>
          </form>
        </div>
      </main>
    </div>
  );
};

export default ResetPassword;
