import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { fetchSuggestions, recordInteraction } from "@/lib/suggestions";
import { Button } from "@/components/ui/button";
import { GOALS } from "@/lib/onboarding-data";
import { MessageCircle, X, Clock, MapPin, Heart, Users, HandHelping, CalendarHeart, Sparkles, Sparkle } from "lucide-react";
import ReportButton from "@/components/ReportButton";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import logoAntyk from "@/assets/logo-antyk.png";

type Profile = {
  user_id: string;
  first_name: string | null;
  age_range: string | null;
  city: string | null;
  postal_code: string | null;
  bio: string | null;
  avatar_url: string | null;
  goals: string[] | null;
  interests: string[] | null;
  score: number;
  compatibility: number;
  distanceKm: number | null;
  commonGoals: string[];
  commonInterests: string[];
};

const goalIcons: Record<string, typeof Heart> = {
  amitie: Users,
  activites: CalendarHeart,
  entraide: HandHelping,
  amour: Heart,
};

const SuggestionsPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [suggestions, setSuggestions] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (user) loadSuggestions();
  }, [user]);

  const loadSuggestions = async () => {
    if (!user) return;
    setLoading(true);
    const data = await fetchSuggestions(user.id, 50);
    setSuggestions(data);
    setCurrentIndex(0);
    setLoading(false);
  };

  const handleAction = async (action: "accept" | "pass" | "later") => {
    if (!user || !current) return;
    setActionLoading(true);

    const { matched } = await recordInteraction(user.id, current.user_id, action);

    if (matched) {
      toast({
        title: "🎉 C'est un match !",
        description: `Vous et ${current.first_name} pouvez maintenant discuter.`,
      });
    } else if (action === "accept") {
      toast({
        title: "Demande envoyée",
        description: `${current.first_name} sera notifié(e) de votre intérêt.`,
      });
    }

    setActionLoading(false);
    setCurrentIndex((prev) => prev + 1);
  };

  const current = suggestions[currentIndex];
  const hasMore = currentIndex < suggestions.length;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background pb-24">
        <p className="text-lg text-muted-foreground">Recherche de personnes proches…</p>
      </div>
    );
  }

  if (!hasMore) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background pb-24 px-6 text-center">
        <Sparkles className="w-16 h-16 text-primary/30 mb-6" />
        <h1 className="text-2xl font-serif font-bold text-foreground mb-3">
          {suggestions.length === 0 ? "Pas encore de suggestions" : "Vous avez vu toutes les suggestions !"}
        </h1>
        <p className="text-lg text-muted-foreground mb-8 max-w-sm">
          {suggestions.length === 0
            ? "Nous n'avons pas encore trouvé de personnes correspondant à vos critères. Revenez bientôt !"
            : "Vous avez vu toutes les suggestions disponibles. Revenez plus tard pour en découvrir de nouvelles."}
        </p>
        <Button variant="outline" className="btn-senior" onClick={loadSuggestions}>
          Actualiser
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="px-6 py-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src={logoAntyk} alt="ANTYK" className="h-8 w-auto" />
            <span className="text-lg text-muted-foreground font-medium">Suggestions</span>
          </div>
          <span className="text-muted-foreground font-medium">
            {currentIndex + 1} / {suggestions.length}
          </span>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-6 py-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={current.user_id}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.3 }}
            className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm"
          >
            {/* Photo */}
            <div className="h-64 bg-muted flex items-center justify-center">
              {current.avatar_url ? (
                <img src={current.avatar_url} alt={current.first_name || ""} className="w-full h-full object-cover" />
              ) : (
                <span className="text-6xl text-muted-foreground/50">
                  {(current.first_name || "?")[0]?.toUpperCase()}
                </span>
              )}
            </div>

            {/* Info */}
            <div className="p-6 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="text-2xl font-serif font-bold text-foreground">
                    {current.first_name}{current.age_range ? `, ${current.age_range} ans` : ""}
                  </h2>
                  {current.city && (
                    <p className="text-muted-foreground flex items-center gap-1 mt-1">
                      <MapPin className="w-4 h-4" /> {current.city}
                      {current.distanceKm !== null && current.distanceKm > 0 && (
                        <span className="text-sm">• ~{current.distanceKm} km</span>
                      )}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-bold"
                    aria-label={`Compatibilité ${current.compatibility} pour cent`}
                  >
                    <Sparkle className="w-4 h-4" />
                    {current.compatibility}%
                  </span>
                  <ReportButton reportedUserId={current.user_id} contentType="profile" onBlock={() => setCurrentIndex((prev) => prev + 1)} />
                </div>
              </div>

              {/* Common goals */}
              {current.commonGoals.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Objectifs en commun</p>
                  <div className="flex flex-wrap gap-2">
                    {current.commonGoals.map((g) => {
                      const goal = GOALS.find((x) => x.id === g);
                      const Icon = goalIcons[g] || Users;
                      return (
                        <span key={g} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium">
                          <Icon className="w-4 h-4" />
                          {goal?.label || g}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Common interests */}
              {current.commonInterests.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Intérêts en commun</p>
                  <div className="flex flex-wrap gap-2">
                    {current.commonInterests.slice(0, 5).map((i) => (
                      <span key={i} className="px-3 py-1.5 rounded-full bg-secondary text-secondary-foreground text-sm font-medium">
                        {i}
                      </span>
                    ))}
                    {current.commonInterests.length > 5 && (
                      <span className="px-3 py-1.5 rounded-full bg-muted text-muted-foreground text-sm">
                        +{current.commonInterests.length - 5}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Bio preview */}
              {current.bio && (
                <p className="text-muted-foreground leading-relaxed line-clamp-3">{current.bio}</p>
              )}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Actions */}
        <div className="flex gap-3 mt-6">
          <Button
            variant="outline"
            className="flex-1 btn-senior h-14"
            onClick={() => handleAction("pass")}
            disabled={actionLoading}
          >
            <X className="w-5 h-5 mr-2" /> Passer
          </Button>
          <Button
            variant="outline"
            className="flex-1 btn-senior h-14 text-muted-foreground"
            onClick={() => handleAction("later")}
            disabled={actionLoading}
          >
            <Clock className="w-5 h-5 mr-2" /> Plus tard
          </Button>
          <Button
            className="flex-1 btn-senior h-14"
            onClick={() => handleAction("accept")}
            disabled={actionLoading}
          >
            <MessageCircle className="w-5 h-5 mr-2" /> Discuter
          </Button>
        </div>
      </main>
    </div>
  );
};

export default SuggestionsPage;
