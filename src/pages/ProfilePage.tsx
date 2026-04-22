import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useAdmin } from "@/hooks/useAdmin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { APP_NAME } from "@/lib/constants";
import { AGE_RANGES, GOALS, PREDEFINED_INTERESTS, DAYS, TIME_SLOTS } from "@/lib/onboarding-data";
import { Camera, LogOut, ShieldCheck, Check, X, Pencil, Save, Shield, UserX, Download, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import type { Tables } from "@/integrations/supabase/types";

type Profile = Tables<"profiles">;

const ProfilePage = () => {
  const { user, signOut } = useAuth();
  const { isAdmin } = useAdmin();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Editable fields
  const [firstName, setFirstName] = useState("");
  const [ageRange, setAgeRange] = useState("");
  const [city, setCity] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [radius, setRadius] = useState("10");
  const [bio, setBio] = useState("");
  const [goals, setGoals] = useState<string[]>([]);
  const [interests, setInterests] = useState<string[]>([]);
  const [customInterest, setCustomInterest] = useState("");
  const [availabilities, setAvailabilities] = useState<Record<string, string[]>>({});
  const [loveMode, setLoveMode] = useState(false);

  useEffect(() => {
    if (!user) return;
    fetchProfile();
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (data) {
      setProfile(data);
      populateForm(data);
    }
    setLoading(false);
  };

  const populateForm = (p: Profile) => {
    setFirstName(p.first_name || "");
    setAgeRange(p.age_range || "");
    setCity(p.city || "");
    setPostalCode(p.postal_code || "");
    setRadius(String(p.radius_km || 10));
    setBio(p.bio || "");
    setGoals(p.goals || []);
    setInterests(p.interests || []);
    setAvailabilities((p.availabilities as Record<string, string[]>) || {});
    setLoveMode(p.love_mode || false);
  };

  const isVerified = () => {
    if (!profile) return false;
    let count = 0;
    if (profile.first_name) count++;
    if (profile.age_range) count++;
    if (profile.city) count++;
    if (profile.bio) count++;
    if ((profile.goals?.length || 0) > 0) count++;
    const hasPhoto = !!profile.avatar_url;
    const emailVerified = !!user?.email_confirmed_at;
    return emailVerified && hasPhoto && count >= 3;
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
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
        love_mode: loveMode,
      })
      .eq("user_id", user.id);

    setSaving(false);
    if (error) {
      toast({ title: "Erreur", description: "Impossible de sauvegarder.", variant: "destructive" });
    } else {
      toast({ title: "Profil mis à jour !" });
      setEditing(false);
      fetchProfile();
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Fichier trop volumineux", description: "La photo doit faire moins de 5 Mo.", variant: "destructive" });
      return;
    }

    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${user.id}/avatar.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true });

    if (uploadError) {
      toast({ title: "Erreur d'upload", description: uploadError.message, variant: "destructive" });
      setUploading(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ avatar_url: `${publicUrl}?t=${Date.now()}` })
      .eq("user_id", user.id);

    setUploading(false);
    if (updateError) {
      toast({ title: "Erreur", description: "Photo uploadée mais profil non mis à jour.", variant: "destructive" });
    } else {
      toast({ title: "Photo mise à jour !" });
      fetchProfile();
    }
  };

  const toggleGoal = (id: string) => setGoals((prev) => prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]);
  const toggleInterest = (name: string) => setInterests((prev) => prev.includes(name) ? prev.filter((i) => i !== name) : [...prev, name]);
  const addCustomInterest = () => {
    const t = customInterest.trim().slice(0, 100);
    if (t && !interests.includes(t) && interests.length < 30) { setInterests((p) => [...p, t]); setCustomInterest(""); }
  };
  const toggleAvailability = (day: string, slot: string) => {
    setAvailabilities((prev) => {
      const c = prev[day] || [];
      return { ...prev, [day]: c.includes(slot) ? c.filter((s) => s !== slot) : [...c, slot] };
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background pb-20">
        <p className="text-lg text-muted-foreground">Chargement…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-border sticky top-0 bg-background z-40">
        <h1 className="text-2xl font-serif font-bold text-primary">Mon Profil</h1>
        <div className="flex gap-2">
          {editing ? (
            <>
              <Button variant="ghost" size="icon" className="min-h-[48px] min-w-[48px]" onClick={() => { setEditing(false); if (profile) populateForm(profile); }}>
                <X className="w-5 h-5" />
              </Button>
              <Button size="icon" className="min-h-[48px] min-w-[48px]" onClick={handleSave} disabled={saving}>
                <Save className="w-5 h-5" />
              </Button>
            </>
          ) : (
            <Button variant="outline" size="icon" className="min-h-[48px] min-w-[48px]" onClick={() => setEditing(true)}>
              <Pencil className="w-5 h-5" />
            </Button>
          )}
        </div>
      </header>

      <main className="max-w-lg mx-auto px-6 py-6 space-y-8">
        {/* Avatar + Badge */}
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-28 h-28 rounded-full bg-muted border-2 border-border overflow-hidden flex items-center justify-center">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="Photo de profil" className="w-full h-full object-cover" />
              ) : (
                <span className="text-4xl text-muted-foreground">{(firstName || "?")[0]?.toUpperCase()}</span>
              )}
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md"
              disabled={uploading}
            >
              <Camera className="w-5 h-5" />
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
          </div>

          <div className="text-center">
            <h2 className="text-2xl font-serif font-bold text-foreground">{firstName || "Votre prénom"}</h2>
            {ageRange && <p className="text-muted-foreground">{ageRange} ans • {city || "Ville"}</p>}
          </div>

          {isVerified() && (
            <div className="flex items-center gap-2 bg-nature-light text-accent px-4 py-2 rounded-full">
              <ShieldCheck className="w-5 h-5" />
              <span className="font-semibold text-sm">Profil vérifié</span>
            </div>
          )}
          {!isVerified() && (
            <p className="text-sm text-muted-foreground text-center max-w-xs">
              Complétez votre profil (photo + 3 infos) et vérifiez votre email pour obtenir le badge vérifié.
            </p>
          )}
        </div>

        {/* Love mode toggle */}
        <div className="flex items-center justify-between bg-card rounded-xl p-5 border border-border">
          <div>
            <p className="font-semibold text-foreground text-lg">Mode Amour</p>
            <p className="text-muted-foreground text-sm">Activez pour recevoir des suggestions amoureuses</p>
          </div>
          <Switch
            checked={loveMode}
            onCheckedChange={(v) => {
              setLoveMode(v);
              if (!editing) {
                // Save immediately
                supabase.from("profiles").update({ love_mode: v }).eq("user_id", user!.id).then(() => {
                  toast({ title: v ? "Mode amour activé 💕" : "Mode amour désactivé" });
                  fetchProfile();
                });
              }
            }}
          />
        </div>

        {/* Info sections */}
        {editing ? (
          <div className="space-y-6">
            {/* Basic info */}
            <section className="space-y-4">
              <h3 className="text-xl font-serif font-bold text-foreground">Informations</h3>
              <div className="space-y-2">
                <Label className="text-base">Prénom</Label>
                <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} className="h-14 text-lg" />
              </div>
              <div className="space-y-2">
                <Label className="text-base">Tranche d'âge</Label>
                <Select value={ageRange} onValueChange={setAgeRange}>
                  <SelectTrigger className="h-14 text-lg"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {AGE_RANGES.map((r) => <SelectItem key={r} value={r} className="text-lg">{r} ans</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-base">Ville</Label>
                <Input value={city} onChange={(e) => setCity(e.target.value)} className="h-14 text-lg" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-base">Code postal</Label>
                  <Input value={postalCode} onChange={(e) => setPostalCode(e.target.value)} className="h-14 text-lg" />
                </div>
                <div className="space-y-2">
                  <Label className="text-base">Rayon</Label>
                  <Select value={radius} onValueChange={setRadius}>
                    <SelectTrigger className="h-14 text-lg"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5" className="text-lg">5 km</SelectItem>
                      <SelectItem value="10" className="text-lg">10 km</SelectItem>
                      <SelectItem value="25" className="text-lg">25 km</SelectItem>
                      <SelectItem value="50" className="text-lg">50 km</SelectItem>
                      <SelectItem value="100" className="text-lg">100 km</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </section>

            {/* Bio */}
            <section className="space-y-3">
              <h3 className="text-xl font-serif font-bold text-foreground">À propos de moi</h3>
              <Textarea value={bio} onChange={(e) => setBio(e.target.value)} className="min-h-[120px] text-lg" maxLength={500} placeholder="Décrivez-vous en quelques mots…" />
              <p className="text-sm text-muted-foreground text-right">{bio.length}/500</p>
            </section>

            {/* Goals */}
            <section className="space-y-3">
              <h3 className="text-xl font-serif font-bold text-foreground">Mes objectifs</h3>
              <div className="space-y-3">
                {GOALS.map((g) => (
                  <button key={g.id} onClick={() => toggleGoal(g.id)} className={`w-full p-4 rounded-xl border-2 text-left transition-colors ${goals.includes(g.id) ? "border-primary bg-primary/5" : "border-border bg-card"}`}>
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-foreground">{g.label}</p>
                      {goals.includes(g.id) && <Check className="w-5 h-5 text-primary" />}
                    </div>
                  </button>
                ))}
              </div>
            </section>

            {/* Interests */}
            <section className="space-y-3">
              <h3 className="text-xl font-serif font-bold text-foreground">Centres d'intérêt</h3>
              <div className="flex flex-wrap gap-2">
                {PREDEFINED_INTERESTS.map((name) => (
                  <button key={name} onClick={() => toggleInterest(name)} className={`px-3 py-2 rounded-full text-sm font-medium border transition-colors ${interests.includes(name) ? "bg-primary text-primary-foreground border-primary" : "bg-card text-foreground border-border"}`}>
                    {name}
                  </button>
                ))}
                {interests.filter((i) => !PREDEFINED_INTERESTS.includes(i)).map((name) => (
                  <button key={name} onClick={() => toggleInterest(name)} className="px-3 py-2 rounded-full text-sm font-medium bg-primary text-primary-foreground border border-primary">
                    {name}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <Input value={customInterest} onChange={(e) => setCustomInterest(e.target.value)} placeholder="Ajouter…" className="h-12 text-lg" onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCustomInterest())} />
                <Button variant="outline" className="h-12" onClick={addCustomInterest}>+</Button>
              </div>
            </section>

            {/* Availabilities */}
            <section className="space-y-3">
              <h3 className="text-xl font-serif font-bold text-foreground">Disponibilités</h3>
              <div className="space-y-3">
                {DAYS.map((day) => (
                  <div key={day}>
                    <p className="font-medium text-foreground mb-1">{day}</p>
                    <div className="flex gap-2">
                      {TIME_SLOTS.map((slot) => {
                        const active = (availabilities[day] || []).includes(slot);
                        return (
                          <button key={slot} onClick={() => toggleAvailability(day, slot)} className={`flex-1 py-2.5 rounded-lg text-sm font-medium border ${active ? "bg-primary text-primary-foreground border-primary" : "bg-card text-foreground border-border"}`}>
                            {slot}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <Button className="btn-senior w-full text-lg h-14" onClick={handleSave} disabled={saving}>
              {saving ? "Enregistrement…" : "Enregistrer les modifications"}
            </Button>
          </div>
        ) : (
          /* View mode */
          <div className="space-y-6">
            {/* Bio */}
            {bio && (
              <section className="bg-card rounded-xl p-5 border border-border">
                <h3 className="font-semibold text-foreground mb-2">À propos</h3>
                <p className="text-muted-foreground leading-relaxed">{bio}</p>
              </section>
            )}

            {/* Goals */}
            {goals.length > 0 && (
              <section className="bg-card rounded-xl p-5 border border-border">
                <h3 className="font-semibold text-foreground mb-3">Objectifs</h3>
                <div className="flex flex-wrap gap-2">
                  {goals.map((g) => {
                    const goal = GOALS.find((x) => x.id === g);
                    return (
                      <span key={g} className="px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium">
                        {goal?.label || g}
                      </span>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Interests */}
            {interests.length > 0 && (
              <section className="bg-card rounded-xl p-5 border border-border">
                <h3 className="font-semibold text-foreground mb-3">Centres d'intérêt</h3>
                <div className="flex flex-wrap gap-2">
                  {interests.map((i) => (
                    <span key={i} className="px-3 py-1.5 rounded-full bg-secondary text-secondary-foreground text-sm font-medium">{i}</span>
                  ))}
                </div>
              </section>
            )}

            {/* Info */}
            <section className="bg-card rounded-xl p-5 border border-border space-y-3">
              <h3 className="font-semibold text-foreground">Informations</h3>
              {city && <p className="text-muted-foreground">📍 {city}{postalCode ? ` (${postalCode})` : ""} — rayon de {radius} km</p>}
              {ageRange && <p className="text-muted-foreground">🎂 {ageRange} ans</p>}
            </section>

            {/* Availabilities */}
            {Object.keys(availabilities).some((d) => (availabilities[d]?.length || 0) > 0) && (
              <section className="bg-card rounded-xl p-5 border border-border">
                <h3 className="font-semibold text-foreground mb-3">Disponibilités</h3>
                <div className="space-y-2">
                  {DAYS.filter((d) => (availabilities[d]?.length || 0) > 0).map((day) => (
                    <div key={day} className="flex items-center gap-3">
                      <span className="font-medium text-foreground w-24">{day}</span>
                      <div className="flex gap-2">
                        {(availabilities[day] || []).map((s) => (
                          <span key={s} className="px-2 py-1 rounded bg-sunshine-light text-foreground text-sm">{s}</span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}

        {/* Blocked users link */}
        <Link to="/utilisateurs-bloques">
          <Button variant="outline" className="btn-senior w-full text-foreground border-border hover:bg-muted">
            <UserX className="w-5 h-5 mr-2" /> Utilisateurs bloqués
          </Button>
        </Link>

        {/* Admin link */}
        {isAdmin && (
          <Link to="/admin">
            <Button variant="outline" className="btn-senior w-full text-accent border-accent/30 hover:bg-accent/5">
              <Shield className="w-5 h-5 mr-2" /> Panneau d'administration
            </Button>
          </Link>
        )}

        {/* GDPR section */}
        <section className="bg-card rounded-xl p-5 border border-border space-y-3">
          <h3 className="font-semibold text-foreground">Mes données (RGPD)</h3>
          <p className="text-sm text-muted-foreground">
            Vous pouvez à tout moment télécharger une copie de vos données ou supprimer définitivement votre compte.
          </p>
          <Button
            variant="outline"
            className="btn-senior w-full"
            onClick={async () => {
              if (!user) return;
              const { data } = await supabase.from("profiles").select("*").eq("user_id", user.id).single();
              const payload = {
                exported_at: new Date().toISOString(),
                account: { id: user.id, email: user.email },
                profile: data,
              };
              const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `antyk-mes-donnees-${new Date().toISOString().slice(0, 10)}.json`;
              a.click();
              URL.revokeObjectURL(url);
              toast({ title: "Données téléchargées" });
            }}
          >
            <Download className="w-5 h-5 mr-2" /> Télécharger mes données
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="btn-senior w-full text-destructive border-destructive/30 hover:bg-destructive/5">
                <Trash2 className="w-5 h-5 mr-2" /> Supprimer mon compte
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Supprimer définitivement votre compte ?</AlertDialogTitle>
                <AlertDialogDescription>
                  Cette action est irréversible. Toutes vos données (profil, messages, matches, activités, demandes d'entraide) seront supprimées immédiatement.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annuler</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  onClick={async () => {
                    const { error } = await supabase.rpc("delete_my_account");
                    if (error) {
                      toast({ title: "Erreur", description: error.message, variant: "destructive" });
                      return;
                    }
                    await supabase.auth.signOut();
                    toast({ title: "Compte supprimé", description: "Toutes vos données ont été effacées." });
                    window.location.href = "/";
                  }}
                >
                  Supprimer
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </section>

        {/* Logout */}
        <Button variant="outline" className="btn-senior w-full text-destructive border-destructive/30 hover:bg-destructive/5" onClick={signOut}>
          <LogOut className="w-5 h-5 mr-2" /> Se déconnecter
        </Button>
      </main>
    </div>
  );
};

export default ProfilePage;
