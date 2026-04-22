import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { APP_NAME } from "@/lib/constants";
import { ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);

    if (error) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } else {
      setSent(true);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="flex items-center gap-4 px-6 py-4 border-b border-border">
        <Button variant="ghost" size="icon" className="min-h-[48px] min-w-[48px]" asChild>
          <Link to="/connexion"><ArrowLeft className="w-6 h-6" /></Link>
        </Button>
        <h2 className="text-2xl font-serif font-bold text-primary">{APP_NAME}</h2>
      </header>

      <main className="flex-1 flex items-center justify-center px-6">
        <div className="w-full max-w-md space-y-8">
          {sent ? (
            <div className="text-center space-y-4">
              <h1 className="text-3xl font-serif font-bold text-foreground">Email envoyé !</h1>
              <p className="text-lg text-muted-foreground">
                Vérifiez votre boîte mail et cliquez sur le lien pour réinitialiser votre mot de passe.
              </p>
              <Button variant="outline" className="btn-senior" asChild>
                <Link to="/connexion">Retour à la connexion</Link>
              </Button>
            </div>
          ) : (
            <>
              <div className="text-center">
                <h1 className="text-3xl font-serif font-bold text-foreground">Mot de passe oublié</h1>
                <p className="text-lg text-muted-foreground mt-2">
                  Entrez votre adresse email, nous vous enverrons un lien de réinitialisation.
                </p>
              </div>
              <form onSubmit={handleSubmit} className="space-y-6">
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
                <Button type="submit" className="btn-senior w-full text-lg h-14" disabled={loading}>
                  {loading ? "Envoi en cours…" : "Envoyer le lien"}
                </Button>
              </form>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default ForgotPassword;
