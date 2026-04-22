import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { APP_NAME } from "@/lib/constants";
import logoAntyk from "@/assets/logo-antyk.png";
import { AGE_RANGES, GOALS, PREDEFINED_INTERESTS, DAYS, TIME_SLOTS, SAFETY_TIPS } from "@/lib/onboarding-data";
import { ArrowLeft, ArrowRight, ShieldCheck, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const TOTAL_STEPS = 6;

const Onboarding = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Step 1
  const [firstName, setFirstName] = useState("");
  const [ageRange, setAgeRange] = useState("");
  const [city, setCity] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [radius, setRadius] = useState("10");

  // Step 2
  const [bio, setBio] = useState("");

  // Step 3
  const [goals, setGoals] = useState<string[]>([]);

  // Step 4
  const [interests, setInterests] = useState<string[]>([]);
  const [customInterest, setCustomInterest] = useState("");

  // Step 5
  const [availabilities, setAvailabilities] = useState<Record<string, string[]>>({});

  // Step 6 - safety acknowledgement
  const [safetyAcknowledged, setSafetyAcknowledged] = useState(false);

  const toggleGoal = (id: string) => {
    setGoals((prev) => prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]);
  };

  const toggleInterest = (name: string) => {
    setInterests((prev) => prev.includes(name) ? prev.filter((i) => i !== name) : [...prev, name]);
  };

  const addCustomInterest = () => {
    const trimmed = customInterest.trim().slice(0, 100);
    if (trimmed && !interests.includes(trimmed) && interests.length < 30) {
      setInterests((prev) => [...prev, trimmed]);
      setCustomInterest("");
    }
  };

  const toggleAvailability = (day: string, slot: string) => {
    setAvailabilities((prev) => {
      const current = prev[day] || [];
      const updated = current.includes(slot)
        ? current.filter((s) => s !== slot)
        : [...current, slot];
      return { ...prev, [day]: updated };
    });
  };

  const handleFinish = async () => {
    if (!user) return;
    setLoading(true);

    const { error } = await supabase
      .from("profiles")
      .update({
        first_name: firstName,
        age_range: ageRange,
        city,
        postal_code: postalCode,
        radius_km: parseInt(radius),
        bio,
        goals,
        interests,
        availabilities,
        love_mode: goals.includes("amour"),
        onboarding_completed: true,
      })
      .eq("user_id", user.id);

    setLoading(false);
    if (error) {
      toast({ title: "Erreur", description: "Impossible de sauvegarder. Réessayez.", variant: "destructive" });
    } else {
      navigate("/suggestions");
    }
  };

  const canNext = () => {
    switch (step) {
      case 1: return firstName.trim() && ageRange && city.trim();
      case 2: return true; // bio optional
      case 3: return goals.length > 0;
      case 4: return interests.length >= 1;
      case 5: return true;
      case 6: return safetyAcknowledged;
      default: return false;
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="flex items-center justify-between px-6 py-4 border-b border-border">
        <div className="flex items-center gap-3">
          {step > 1 && (
            <Button variant="ghost" size="icon" className="min-h-[48px] min-w-[48px]" onClick={() => setStep(step - 1)}>
              <ArrowLeft className="w-6 h-6" />
            </Button>
          )}
          <img src={logoAntyk} alt={APP_NAME} className="h-8 w-auto" />
        </div>
        <span className="text-muted-foreground font-medium">Étape {step}/{TOTAL_STEPS}</span>
      </header>

      {/* Progress bar */}
      <div className="h-2 bg-muted">
        <div className="h-full bg-primary transition-all duration-300" style={{ width: `${(step / TOTAL_STEPS) * 100}%` }} />
      </div>

      <main className="flex-1 px-6 py-8 max-w-lg mx-auto w-full">
        {/* Step 1: Basic info */}
        {step === 1 && (
          <div className="space-y-6">
            <h1 className="text-2xl font-serif font-bold text-foreground">Parlez-nous de vous</h1>
            <p className="text-muted-foreground">Ces informations nous aideront à trouver des personnes près de chez vous.</p>

            <div className="space-y-2">
              <Label className="text-base">Prénom</Label>
              <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Votre prénom" className="h-14 text-lg" />
            </div>

            <div className="space-y-2">
              <Label className="text-base">Tranche d'âge</Label>
              <Select value={ageRange} onValueChange={setAgeRange}>
                <SelectTrigger className="h-14 text-lg"><SelectValue placeholder="Sélectionnez" /></SelectTrigger>
                <SelectContent>
                  {AGE_RANGES.map((r) => <SelectItem key={r} value={r} className="text-lg">{r} ans</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-base">Ville</Label>
              <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Votre ville" className="h-14 text-lg" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-base">Code postal</Label>
                <Input value={postalCode} onChange={(e) => setPostalCode(e.target.value)} placeholder="75001" className="h-14 text-lg" />
              </div>
              <div className="space-y-2">
                <Label className="text-base">Rayon (km)</Label>
                <Select value={radius} onValueChange={setRadius}>
                  <SelectTrigger className="h-14 text-lg"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5" className="text-lg">5 km</SelectItem>
                    <SelectItem value="10" className="text-lg">10 km</SelectItem>
                    <SelectItem value="25" className="text-lg">25 km</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Bio */}
        {step === 2 && (
          <div className="space-y-6">
            <h1 className="text-2xl font-serif font-bold text-foreground">Quelques mots sur vous</h1>
            <p className="text-muted-foreground">Optionnel, mais cela aide les autres à mieux vous connaître.</p>
            <Textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Ex : J'adore les balades en forêt et les bons petits plats…"
              className="min-h-[150px] text-lg"
              maxLength={500}
            />
            <p className="text-sm text-muted-foreground text-right">{bio.length}/500</p>
          </div>
        )}

        {/* Step 3: Goals */}
        {step === 3 && (
          <div className="space-y-6">
            <h1 className="text-2xl font-serif font-bold text-foreground">Que recherchez-vous ?</h1>
            <p className="text-muted-foreground">Vous pouvez choisir plusieurs options.</p>
            <div className="space-y-4">
              {GOALS.map((g) => (
                <button
                  key={g.id}
                  onClick={() => toggleGoal(g.id)}
                  className={`w-full p-5 rounded-xl border-2 text-left transition-colors ${
                    goals.includes(g.id) ? "border-primary bg-primary/5" : "border-border bg-card"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-lg font-semibold text-foreground">{g.label}</p>
                      <p className="text-muted-foreground">{g.description}</p>
                    </div>
                    {goals.includes(g.id) && <Check className="w-6 h-6 text-primary flex-shrink-0" />}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 4: Interests */}
        {step === 4 && (
          <div className="space-y-6">
            <h1 className="text-2xl font-serif font-bold text-foreground">Vos centres d'intérêt</h1>
            <p className="text-muted-foreground">Sélectionnez ceux qui vous parlent, ou ajoutez les vôtres.</p>
            <div className="flex flex-wrap gap-3">
              {PREDEFINED_INTERESTS.map((name) => (
                <button
                  key={name}
                  onClick={() => toggleInterest(name)}
                  className={`px-4 py-2.5 rounded-full text-base font-medium border transition-colors ${
                    interests.includes(name)
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-card text-foreground border-border hover:border-primary/50"
                  }`}
                >
                  {name}
                </button>
              ))}
              {interests.filter((i) => !PREDEFINED_INTERESTS.includes(i)).map((name) => (
                <button
                  key={name}
                  onClick={() => toggleInterest(name)}
                  className="px-4 py-2.5 rounded-full text-base font-medium bg-primary text-primary-foreground border border-primary"
                >
                  {name}
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              <Input
                value={customInterest}
                onChange={(e) => setCustomInterest(e.target.value)}
                placeholder="Ajouter un intérêt…"
                className="h-12 text-lg"
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCustomInterest())}
              />
              <Button variant="outline" className="h-12 px-5" onClick={addCustomInterest}>
                Ajouter
              </Button>
            </div>
          </div>
        )}

        {/* Step 5: Availabilities */}
        {step === 5 && (
          <div className="space-y-6">
            <h1 className="text-2xl font-serif font-bold text-foreground">Vos disponibilités</h1>
            <p className="text-muted-foreground">Quand êtes-vous généralement libre ? (Optionnel)</p>
            <div className="space-y-4">
              {DAYS.map((day) => (
                <div key={day} className="space-y-2">
                  <p className="font-semibold text-foreground">{day}</p>
                  <div className="flex gap-3">
                    {TIME_SLOTS.map((slot) => {
                      const active = (availabilities[day] || []).includes(slot);
                      return (
                        <button
                          key={slot}
                          onClick={() => toggleAvailability(day, slot)}
                          className={`flex-1 py-3 rounded-lg text-sm font-medium border transition-colors ${
                            active
                              ? "bg-primary text-primary-foreground border-primary"
                              : "bg-card text-foreground border-border"
                          }`}
                        >
                          {slot}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 6: Safety */}
        {step === 6 && (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-8 h-8 text-accent" />
              <h1 className="text-2xl font-serif font-bold text-foreground">Conseils de sécurité</h1>
            </div>
            <p className="text-muted-foreground">
              Votre sécurité est notre priorité. Prenez un instant pour lire ces conseils importants.
            </p>
            <div className="space-y-3 bg-warm-light rounded-xl p-6">
              {SAFETY_TIPS.map((tip, i) => (
                <div key={i} className="flex gap-3 items-start">
                  <span className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold">{i + 1}</span>
                  <p className="text-foreground leading-relaxed">{tip}</p>
                </div>
              ))}
            </div>
            <div className="flex items-start gap-3 pt-2">
              <Checkbox
                id="safety"
                checked={safetyAcknowledged}
                onCheckedChange={(v) => setSafetyAcknowledged(v === true)}
                className="mt-1 h-6 w-6"
              />
              <Label htmlFor="safety" className="text-base leading-relaxed cursor-pointer">
                J'ai lu et compris ces conseils de sécurité.
              </Label>
            </div>
          </div>
        )}
      </main>

      {/* Bottom action */}
      <div className="px-6 py-4 border-t border-border bg-background">
        <div className="max-w-lg mx-auto">
          {step < TOTAL_STEPS ? (
            <Button
              className="btn-senior w-full text-lg h-14"
              disabled={!canNext()}
              onClick={() => setStep(step + 1)}
            >
              Continuer <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          ) : (
            <Button
              className="btn-senior w-full text-lg h-14"
              disabled={!canNext() || loading}
              onClick={handleFinish}
            >
              {loading ? "Enregistrement…" : "Commencer l'aventure !"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
