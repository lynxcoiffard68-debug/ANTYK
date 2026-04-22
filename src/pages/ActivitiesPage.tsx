import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { CalendarHeart, Plus, MapPin, Users, Calendar, Filter, X, MessageCircle, Search } from "lucide-react";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

const CATEGORIES = [
  { value: "sport", label: "Sport & Bien-être" },
  { value: "culture", label: "Culture & Sorties" },
  { value: "nature", label: "Nature & Plein air" },
  { value: "jeux", label: "Jeux & Loisirs" },
  { value: "cuisine", label: "Cuisine & Repas" },
  { value: "apprentissage", label: "Apprentissage" },
  { value: "autre", label: "Autre" },
];

interface Activity {
  id: string;
  creator_id: string;
  title: string;
  description: string | null;
  category: string;
  city: string | null;
  location: string | null;
  activity_date: string | null;
  max_participants: number | null;
  created_at: string;
  participant_count?: number;
  is_joined?: boolean;
  creator_name?: string;
}

const ActivitiesPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreate, setShowCreate] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("autre");
  const [city, setCity] = useState("");
  const [location, setLocation] = useState("");
  const [activityDate, setActivityDate] = useState("");
  const [maxParticipants, setMaxParticipants] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user) loadActivities();
  }, [user, filterCategory]);

  const loadActivities = async () => {
    if (!user) return;

    let query = supabase
      .from("activities")
      .select("*")
      .order("activity_date", { ascending: true, nullsFirst: false });

    if (filterCategory !== "all") {
      query = query.eq("category", filterCategory);
    }

    const { data } = await query;
    if (!data || data.length === 0) { setActivities([]); setLoading(false); return; }

    // Batch: get all participants in one query
    const activityIds = data.map((a) => a.id);
    const [{ data: allParticipants }, { data: myParticipations }] = await Promise.all([
      supabase.from("activity_participants").select("activity_id").in("activity_id", activityIds),
      supabase.from("activity_participants").select("activity_id").in("activity_id", activityIds).eq("user_id", user.id),
    ]);

    // Count participants per activity
    const countMap: Record<string, number> = {};
    (allParticipants || []).forEach((p) => {
      countMap[p.activity_id] = (countMap[p.activity_id] || 0) + 1;
    });
    const joinedSet = new Set((myParticipations || []).map((p) => p.activity_id));

    // Batch: get all creator profiles in one query
    const creatorIds = [...new Set(data.map((a) => a.creator_id))];
    const { data: creatorProfiles } = await supabase
      .from("profiles")
      .select("user_id, first_name")
      .in("user_id", creatorIds);

    const nameMap: Record<string, string> = {};
    (creatorProfiles || []).forEach((p) => {
      nameMap[p.user_id] = p.first_name || "Quelqu'un";
    });

    const enriched: Activity[] = data.map((act) => ({
      ...act,
      participant_count: countMap[act.id] || 0,
      is_joined: joinedSet.has(act.id),
      creator_name: nameMap[act.creator_id] || "Quelqu'un",
    }));

    setActivities(enriched);
    setLoading(false);
  };

  const handleCreate = async () => {
    if (!title.trim() || !user) return;
    setSubmitting(true);

    const { error } = await supabase.from("activities").insert({
      creator_id: user.id,
      title: title.trim(),
      description: description.trim() || null,
      category,
      city: city.trim() || null,
      location: location.trim() || null,
      activity_date: activityDate || null,
      max_participants: maxParticipants ? parseInt(maxParticipants) : null,
    });

    setSubmitting(false);
    if (error) {
      toast({ title: "Erreur", description: "Impossible de créer l'activité.", variant: "destructive" });
    } else {
      toast({ title: "✅ Activité créée !" });
      setShowCreate(false);
      setTitle(""); setDescription(""); setCategory("autre"); setCity(""); setLocation(""); setActivityDate(""); setMaxParticipants("");
      loadActivities();
    }
  };

  const handleJoin = async (activityId: string) => {
    if (!user) return;
    const { error } = await supabase.from("activity_participants").insert({
      activity_id: activityId,
      user_id: user.id,
    });
    if (error) {
      toast({ title: "Erreur", description: "Impossible de rejoindre.", variant: "destructive" });
    } else {
      toast({ title: "✅ Vous participez !" });
      loadActivities();
    }
  };

  const handleLeave = async (activityId: string) => {
    if (!user) return;
    await supabase
      .from("activity_participants")
      .delete()
      .eq("activity_id", activityId)
      .eq("user_id", user.id);
    toast({ title: "Vous ne participez plus." });
    loadActivities();
  };

  const getCategoryLabel = (val: string) => CATEGORIES.find((c) => c.value === val)?.label || val;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background pb-24">
        <p className="text-lg text-muted-foreground">Chargement…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24 overflow-x-hidden">
      <header className="px-4 sm:px-6 py-4 border-b border-border flex items-center justify-between">
        <h1 className="text-2xl font-serif font-bold text-primary">Activités</h1>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button size="sm" className="btn-senior gap-2">
              <Plus className="w-5 h-5" /> Créer
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-serif">Nouvelle activité</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <Input placeholder="Titre *" value={title} onChange={(e) => setTitle(e.target.value)} className="h-12 text-lg" />
              <Textarea placeholder="Description (optionnel)" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="h-12"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                </SelectContent>
              </Select>
              <Input placeholder="Ville" value={city} onChange={(e) => setCity(e.target.value)} className="h-12" />
              <Input placeholder="Lieu précis (optionnel)" value={location} onChange={(e) => setLocation(e.target.value)} className="h-12" />
              <Input type="datetime-local" value={activityDate} onChange={(e) => setActivityDate(e.target.value)} className="h-12" />
              <Input type="number" placeholder="Nombre max de participants" value={maxParticipants} onChange={(e) => setMaxParticipants(e.target.value)} className="h-12" min={2} />
              <Button onClick={handleCreate} disabled={!title.trim() || submitting} className="w-full btn-senior">
                {submitting ? "Création…" : "Créer l'activité"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </header>

      {/* Search */}
      <div className="px-4 sm:px-6 pt-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
          <Input
            type="search"
            placeholder="Rechercher une activité, une ville…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-12 pl-11 text-base"
            aria-label="Rechercher une activité"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-9 w-9"
              onClick={() => setSearchQuery("")}
              aria-label="Effacer la recherche"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="px-4 sm:px-6 py-3 flex items-center gap-2 overflow-x-auto">
        <Filter className="w-4 h-4 text-muted-foreground flex-shrink-0" />
        <Badge
          variant={filterCategory === "all" ? "default" : "outline"}
          className="cursor-pointer flex-shrink-0"
          onClick={() => setFilterCategory("all")}
        >
          Toutes
        </Badge>
        {CATEGORIES.map((c) => (
          <Badge
            key={c.value}
            variant={filterCategory === c.value ? "default" : "outline"}
            className="cursor-pointer flex-shrink-0"
            onClick={() => setFilterCategory(c.value)}
          >
            {c.label}
          </Badge>
        ))}
      </div>

      {(() => {
        const q = searchQuery.trim().toLowerCase();
        const filtered = q
          ? activities.filter((a) =>
              [a.title, a.description, a.city, a.location, a.creator_name, getCategoryLabel(a.category)]
                .filter(Boolean)
                .some((v) => (v as string).toLowerCase().includes(q))
            )
          : activities;

        if (filtered.length === 0) {
          return (
            <div className="flex flex-col items-center justify-center px-4 sm:px-6 py-16 text-center">
              <CalendarHeart className="w-16 h-16 text-primary/20 mb-6" />
              <h2 className="text-xl font-serif font-bold text-foreground mb-2">
                {q ? "Aucun résultat" : "Aucune activité"}
              </h2>
              <p className="text-muted-foreground max-w-sm">
                {q
                  ? `Aucune activité ne correspond à « ${searchQuery} ». Essayez un autre mot ou changez de catégorie.`
                  : "Créez la première activité pour rassembler des personnes autour d'un intérêt commun !"}
              </p>
            </div>
          );
        }

        return (
          <ul className="px-4 sm:px-6 py-4 space-y-4">
            {filtered.map((act) => {
            const isMine = act.creator_id === user?.id;
            const isFull = act.max_participants ? act.participant_count! >= act.max_participants : false;

            return (
              <li key={act.id} className="bg-card border border-border rounded-2xl p-4 sm:p-5 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="text-lg font-semibold text-foreground truncate">{act.title}</h3>
                    <p className="text-sm text-muted-foreground">par {isMine ? "vous" : act.creator_name}</p>
                  </div>
                  <Badge variant="secondary" className="flex-shrink-0">{getCategoryLabel(act.category)}</Badge>
                </div>

                {act.description && <p className="text-foreground leading-relaxed">{act.description}</p>}

                <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                  {act.city && (
                    <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {act.city}{act.location ? ` — ${act.location}` : ""}</span>
                  )}
                  {act.activity_date && (
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {new Date(act.activity_date).toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    {act.participant_count} participant{act.participant_count !== 1 ? "s" : ""}
                    {act.max_participants && ` / ${act.max_participants}`}
                  </span>
                </div>

                <div className="flex flex-col gap-2">
                  {(act.is_joined || isMine) && (
                    <Button variant="secondary" size="sm" className="btn-senior w-full gap-2" asChild>
                      <Link to={`/activites/${act.id}/discussion`}>
                        <MessageCircle className="w-4 h-4" /> Discussion du groupe
                      </Link>
                    </Button>
                  )}

                  {!isMine && (
                    act.is_joined ? (
                      <Button variant="outline" size="sm" className="btn-senior w-full" onClick={() => handleLeave(act.id)}>
                        <X className="w-4 h-4 mr-2" /> Se retirer
                      </Button>
                    ) : (
                      <Button size="sm" className="btn-senior w-full" onClick={() => handleJoin(act.id)} disabled={isFull}>
                        {isFull ? "Complet" : "Participer"}
                      </Button>
                    )
                  )}
                </div>
              </li>
            );
          })}
        </ul>
        );
      })()}
    </div>
  );
};

export default ActivitiesPage;