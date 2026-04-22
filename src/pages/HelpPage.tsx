import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { HandHeart, Plus, MapPin, Filter, MessageCircle, CheckCircle2, MessagesSquare, Search, X } from "lucide-react";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

const CATEGORIES = [
  { value: "courses", label: "Courses" },
  { value: "transport", label: "Transport" },
  { value: "administratif", label: "Administratif" },
  { value: "bricolage", label: "Bricolage" },
  { value: "numerique", label: "Numérique" },
  { value: "compagnie", label: "Compagnie" },
  { value: "autre", label: "Autre" },
];

interface HelpRequest {
  id: string;
  creator_id: string;
  title: string;
  description: string | null;
  category: string;
  city: string | null;
  status: string;
  created_at: string;
  creator_name?: string;
  response_count?: number;
  has_responded?: boolean;
}

interface HelpResponse {
  id: string;
  responder_id: string;
  message: string;
  created_at: string;
  responder_name?: string;
}

const HelpPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [requests, setRequests] = useState<HelpRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [expandedRequest, setExpandedRequest] = useState<string | null>(null);
  const [responses, setResponses] = useState<HelpResponse[]>([]);
  const [newResponse, setNewResponse] = useState("");

  // Form
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("autre");
  const [city, setCity] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user) loadRequests();
  }, [user, filterCategory]);

  const loadRequests = async () => {
    if (!user) return;

    let query = supabase
      .from("help_requests")
      .select("*")
      .eq("status", "open")
      .order("created_at", { ascending: false });

    if (filterCategory !== "all") {
      query = query.eq("category", filterCategory);
    }

    const { data } = await query;
    if (!data || data.length === 0) { setRequests([]); setLoading(false); return; }

    // Batch: get all creator profiles
    const creatorIds = [...new Set(data.map((r) => r.creator_id))];
    const requestIds = data.map((r) => r.id);

    const [{ data: creatorProfiles }, { data: allResponses }, { data: myResponses }] = await Promise.all([
      supabase.from("profiles").select("user_id, first_name").in("user_id", creatorIds),
      supabase.from("help_responses").select("request_id").in("request_id", requestIds),
      supabase.from("help_responses").select("request_id").in("request_id", requestIds).eq("responder_id", user.id),
    ]);

    const nameMap: Record<string, string> = {};
    (creatorProfiles || []).forEach((p) => { nameMap[p.user_id] = p.first_name || "Quelqu'un"; });

    const countMap: Record<string, number> = {};
    (allResponses || []).forEach((r) => { countMap[r.request_id] = (countMap[r.request_id] || 0) + 1; });

    const myRespondedSet = new Set((myResponses || []).map((r) => r.request_id));

    const enriched: HelpRequest[] = data.map((req) => ({
      ...req,
      creator_name: nameMap[req.creator_id] || "Quelqu'un",
      response_count: countMap[req.id] || 0,
      has_responded: myRespondedSet.has(req.id),
    }));

    setRequests(enriched);
    setLoading(false);
  };

  const handleCreate = async () => {
    if (!title.trim() || !user) return;
    setSubmitting(true);

    const { error } = await supabase.from("help_requests").insert({
      creator_id: user.id,
      title: title.trim(),
      description: description.trim() || null,
      category,
      city: city.trim() || null,
    });

    setSubmitting(false);
    if (error) {
      toast({ title: "Erreur", description: "Impossible de créer la demande.", variant: "destructive" });
    } else {
      toast({ title: "✅ Demande publiée !" });
      setShowCreate(false);
      setTitle(""); setDescription(""); setCategory("autre"); setCity("");
      loadRequests();
    }
  };

  const loadResponses = async (requestId: string) => {
    if (expandedRequest === requestId) {
      setExpandedRequest(null);
      return;
    }

    const { data } = await supabase
      .from("help_responses")
      .select("*")
      .eq("request_id", requestId)
      .order("created_at", { ascending: true });

    if (!data || data.length === 0) {
      setResponses([]);
      setExpandedRequest(requestId);
      return;
    }

    // Batch profile fetch
    const responderIds = [...new Set(data.map((r) => r.responder_id))];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, first_name")
      .in("user_id", responderIds);

    const nameMap: Record<string, string> = {};
    (profiles || []).forEach((p) => { nameMap[p.user_id] = p.first_name || "Quelqu'un"; });

    const enriched: HelpResponse[] = data.map((r) => ({
      ...r,
      responder_name: nameMap[r.responder_id] || "Quelqu'un",
    }));

    setResponses(enriched);
    setExpandedRequest(requestId);
  };

  const handleRespond = async (requestId: string) => {
    if (!newResponse.trim() || !user) return;

    const { error } = await supabase.from("help_responses").insert({
      request_id: requestId,
      responder_id: user.id,
      message: newResponse.trim(),
    });

    if (error) {
      toast({ title: "Erreur", description: "Impossible d'envoyer.", variant: "destructive" });
    } else {
      setNewResponse("");
      loadResponses(requestId);
      loadRequests();
    }
  };

  const handleResolve = async (requestId: string) => {
    await supabase.from("help_requests").update({ status: "resolved" }).eq("id", requestId);
    toast({ title: "✅ Marquée comme résolue" });
    loadRequests();
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
        <h1 className="text-2xl font-serif font-bold text-primary">Entraide</h1>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button size="sm" className="btn-senior gap-2">
              <Plus className="w-5 h-5" /> Demander
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-serif">Demande d'aide</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <Input placeholder="Titre *" value={title} onChange={(e) => setTitle(e.target.value)} className="h-12 text-lg" />
              <Textarea placeholder="Décrivez votre besoin (optionnel)" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="h-12"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                </SelectContent>
              </Select>
              <Input placeholder="Ville" value={city} onChange={(e) => setCity(e.target.value)} className="h-12" />
              <Button onClick={handleCreate} disabled={!title.trim() || submitting} className="w-full btn-senior">
                {submitting ? "Publication…" : "Publier la demande"}
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
            placeholder="Rechercher une demande, une ville…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-12 pl-11 text-base"
            aria-label="Rechercher une demande d'aide"
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
          ? requests.filter((r) =>
              [r.title, r.description, r.city, r.creator_name, getCategoryLabel(r.category)]
                .filter(Boolean)
                .some((v) => (v as string).toLowerCase().includes(q))
            )
          : requests;

        if (filtered.length === 0) {
          return (
            <div className="flex flex-col items-center justify-center px-4 sm:px-6 py-16 text-center">
              <HandHeart className="w-16 h-16 text-primary/20 mb-6" />
              <h2 className="text-xl font-serif font-bold text-foreground mb-2">
                {q ? "Aucun résultat" : "Aucune demande"}
              </h2>
              <p className="text-muted-foreground max-w-sm">
                {q
                  ? `Aucune demande ne correspond à « ${searchQuery} ».`
                  : "Publiez une demande d'aide ou attendez que quelqu'un en publie une."}
              </p>
            </div>
          );
        }

        return (
          <ul className="px-4 sm:px-6 py-4 space-y-4">
            {filtered.map((req) => {
            const isMine = req.creator_id === user?.id;
            const isExpanded = expandedRequest === req.id;

            return (
              <li key={req.id} className="bg-card border border-border rounded-2xl p-4 sm:p-5 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="text-lg font-semibold text-foreground truncate">{req.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      par {isMine ? "vous" : req.creator_name} · {new Date(req.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                    </p>
                  </div>
                  <Badge variant="secondary" className="flex-shrink-0">{getCategoryLabel(req.category)}</Badge>
                </div>

                {req.description && <p className="text-foreground leading-relaxed">{req.description}</p>}

                <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                  {req.city && (
                    <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {req.city}</span>
                  )}
                  <span className="flex items-center gap-1">
                    <MessageCircle className="w-4 h-4" /> {req.response_count} réponse{req.response_count !== 1 ? "s" : ""}
                  </span>
                </div>

                <div className="flex flex-col gap-2">
                  {(isMine || req.has_responded) && (
                    <Button variant="secondary" size="sm" className="btn-senior w-full gap-2" asChild>
                      <Link to={`/entraide/${req.id}/discussion`}>
                        <MessagesSquare className="w-4 h-4" /> Discussion du groupe
                      </Link>
                    </Button>
                  )}
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => loadResponses(req.id)}>
                      {isExpanded ? "Masquer" : "Voir les réponses"}
                    </Button>
                    {isMine && (
                      <Button variant="outline" size="sm" onClick={() => handleResolve(req.id)} className="gap-1">
                        <CheckCircle2 className="w-4 h-4" /> Résolu
                      </Button>
                    )}
                  </div>
                </div>

                {/* Responses */}
                {isExpanded && (
                  <div className="border-t border-border pt-3 space-y-3">
                    {responses.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-2">Aucune réponse encore.</p>
                    )}
                    {responses.map((r) => (
                      <div key={r.id} className="bg-muted rounded-xl p-3">
                        <p className="text-sm font-medium text-foreground">{r.responder_name}</p>
                        <p className="text-foreground mt-1">{r.message}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(r.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    ))}
                    {!isMine && (
                      <div className="flex gap-2">
                        <Input
                          placeholder="Votre réponse…"
                          value={newResponse}
                          onChange={(e) => setNewResponse(e.target.value)}
                          className="h-12 flex-1"
                          onKeyDown={(e) => e.key === "Enter" && handleRespond(req.id)}
                        />
                        <Button size="icon" className="min-h-[48px] min-w-[48px]" onClick={() => handleRespond(req.id)} disabled={!newResponse.trim()}>
                          <MessageCircle className="w-5 h-5" />
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
        );
      })()}
    </div>
  );
};

export default HelpPage;