import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { CheckCircle, XCircle, Eye, MessageCircle, Ban, ChevronDown, ChevronUp, Shield, AlertTriangle, X } from "lucide-react";
import { useState } from "react";
import type { Tables } from "@/integrations/supabase/types";

const statusColors: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  pending: "destructive",
  reviewed: "secondary",
  resolved: "default",
  dismissed: "outline",
};

const statusLabels: Record<string, string> = {
  pending: "En attente",
  reviewed: "Examiné",
  resolved: "Résolu",
  dismissed: "Rejeté",
};

const reasonLabels: Record<string, string> = {
  harassment: "Harcèlement",
  spam: "Spam",
  inappropriate: "Contenu inapproprié",
  fraud: "Fraude / Arnaque",
  other: "Autre",
};

interface ReportWithProfiles {
  id: string;
  reporter_id: string;
  reported_user_id: string | null;
  reported_content_type: string | null;
  reported_content_id: string | null;
  reason: string;
  description: string | null;
  admin_notes: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  reporter_profile?: { first_name: string | null; city: string | null; avatar_url: string | null };
  reported_profile?: { first_name: string | null; city: string | null; avatar_url: string | null; suspended: boolean | null };
}

type Message = Tables<"messages">;

const ConversationViewer = ({ reporterId, reportedUserId, onClose }: { reporterId: string; reportedUserId: string; onClose: () => void }) => {
  const { data: messages, isLoading } = useQuery({
    queryKey: ["admin-conversation", reporterId, reportedUserId],
    queryFn: async () => {
      // Find the match between the two users
      const { data: matches } = await supabase
        .from("matches")
        .select("id")
        .or(
          `and(user1_id.eq.${reporterId},user2_id.eq.${reportedUserId}),and(user1_id.eq.${reportedUserId},user2_id.eq.${reporterId})`
        );

      if (!matches || matches.length === 0) return [];

      const matchIds = matches.map((m) => m.id);
      const { data: msgs } = await supabase
        .from("messages")
        .select("*")
        .in("match_id", matchIds)
        .order("created_at", { ascending: true });

      return msgs ?? [];
    },
  });

  const { data: profiles } = useQuery({
    queryKey: ["admin-conv-profiles", reporterId, reportedUserId],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("user_id, first_name, avatar_url")
        .in("user_id", [reporterId, reportedUserId]);
      return data ?? [];
    },
  });

  const getName = (userId: string) => profiles?.find((p) => p.user_id === userId)?.first_name || "?";

  return (
    <div className="border border-border rounded-lg bg-background max-h-80 flex flex-col">
      <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-muted/50">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-foreground">Conversation</span>
        </div>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
        {isLoading && <p className="text-sm text-muted-foreground text-center py-4">Chargement…</p>}
        {!isLoading && (!messages || messages.length === 0) && (
          <p className="text-sm text-muted-foreground text-center py-4">Aucun message échangé</p>
        )}
        {messages?.map((msg) => (
          <div key={msg.id} className={`flex ${msg.sender_id === reporterId ? "justify-start" : "justify-end"}`}>
            <div className={`max-w-[75%] rounded-xl px-3 py-2 text-sm ${
              msg.sender_id === reporterId
                ? "bg-muted text-foreground"
                : "bg-primary/10 text-foreground"
            }`}>
              <p className="text-xs font-medium text-muted-foreground mb-0.5">{getName(msg.sender_id)}</p>
              <p>{msg.content}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {new Date(msg.created_at).toLocaleString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const AdminReports = () => {
  const queryClient = useQueryClient();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState<Record<string, string>>({});
  const [filter, setFilter] = useState<"all" | "pending" | "resolved" | "dismissed">("all");
  const [viewingConvId, setViewingConvId] = useState<string | null>(null);

  const { data: reports, isLoading } = useQuery({
    queryKey: ["admin-reports"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reports")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;

      // Enrich with profiles
      const reporterIds = [...new Set(data.map((r) => r.reporter_id))];
      const reportedIds = [...new Set(data.filter((r) => r.reported_user_id).map((r) => r.reported_user_id!))];
      const allIds = [...new Set([...reporterIds, ...reportedIds])];

      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, first_name, city, avatar_url, suspended")
        .in("user_id", allIds);

      return data.map((r) => ({
        ...r,
        reporter_profile: profiles?.find((p) => p.user_id === r.reporter_id),
        reported_profile: r.reported_user_id ? profiles?.find((p) => p.user_id === r.reported_user_id) : undefined,
      })) as ReportWithProfiles[];
    },
  });

  const { data: blocks } = useQuery({
    queryKey: ["admin-blocks"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blocks")
        .select("*")
        .order("created_at", { ascending: false });
      // Blocks table has RLS for blocker only, so this may return limited data for admin
      // We rely on report data instead
      return data ?? [];
    },
  });

  const updateReport = useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: string; notes?: string }) => {
      const update: Record<string, string> = { status };
      if (notes !== undefined) update.admin_notes = notes;
      const { error } = await supabase.from("reports").update(update).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-reports"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
      toast.success("Signalement mis à jour");
    },
  });

  const suspendUser = useMutation({
    mutationFn: async ({ userId, suspended }: { userId: string; suspended: boolean }) => {
      const { error } = await supabase.from("profiles").update({ suspended }).eq("user_id", userId);
      if (error) throw error;
    },
    onSuccess: (_, { suspended }) => {
      queryClient.invalidateQueries({ queryKey: ["admin-reports"] });
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success(suspended ? "Utilisateur suspendu" : "Utilisateur réactivé");
    },
  });

  const filteredReports = reports?.filter((r) => filter === "all" || r.status === filter) ?? [];
  const pendingCount = reports?.filter((r) => r.status === "pending").length ?? 0;

  if (isLoading) {
    return <div className="p-8 text-muted-foreground">Chargement…</div>;
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-serif text-foreground">Gestion des conflits</h1>
          <p className="text-muted-foreground mt-1">Gérez les signalements et résolvez les conflits entre utilisateurs</p>
        </div>
        {pendingCount > 0 && (
          <div className="flex items-center gap-2 bg-destructive/10 text-destructive px-4 py-2 rounded-full">
            <AlertTriangle className="w-4 h-4" />
            <span className="font-semibold text-sm">{pendingCount} en attente</span>
          </div>
        )}
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {[
          { label: "Total", value: reports?.length ?? 0, filterVal: "all" as const },
          { label: "En attente", value: pendingCount, filterVal: "pending" as const },
          { label: "Résolus", value: reports?.filter((r) => r.status === "resolved").length ?? 0, filterVal: "resolved" as const },
          { label: "Rejetés", value: reports?.filter((r) => r.status === "dismissed").length ?? 0, filterVal: "dismissed" as const },
        ].map((s) => (
          <Card
            key={s.label}
            className={`cursor-pointer transition-colors ${filter === s.filterVal ? "border-primary bg-primary/5" : "hover:bg-muted/50"}`}
            onClick={() => setFilter(s.filterVal)}
          >
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">{s.label}</p>
              <p className="text-2xl font-bold text-foreground">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Reports list */}
      {filteredReports.length === 0 ? (
        <div className="text-center py-12">
          <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">Aucun signalement {filter !== "all" ? statusLabels[filter]?.toLowerCase() : ""}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredReports.map((r) => {
            const isExpanded = expandedId === r.id;
            return (
              <Card key={r.id} className={`transition-all ${r.status === "pending" ? "border-destructive/30" : ""}`}>
                {/* Summary row */}
                <div
                  className="flex items-center gap-4 p-4 cursor-pointer hover:bg-muted/30 transition-colors"
                  onClick={() => setExpandedId(isExpanded ? null : r.id)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={statusColors[r.status] ?? "secondary"}>
                        {statusLabels[r.status] ?? r.status}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {r.reported_content_type || "Profil"}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(r.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}
                      </span>
                    </div>
                    <p className="font-medium text-foreground">
                      {reasonLabels[r.reason] || r.reason}
                    </p>
                    {r.description && (
                      <p className="text-sm text-muted-foreground truncate max-w-xl">{r.description}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    {/* Reporter → Reported */}
                    <div className="text-right text-sm">
                      <p className="text-muted-foreground">
                        <span className="font-medium text-foreground">{r.reporter_profile?.first_name || "?"}</span>
                        {" → "}
                        <span className="font-medium text-foreground">{r.reported_profile?.first_name || "?"}</span>
                      </p>
                    </div>
                    {isExpanded ? <ChevronUp className="w-5 h-5 text-muted-foreground" /> : <ChevronDown className="w-5 h-5 text-muted-foreground" />}
                  </div>
                </div>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="border-t border-border px-4 pb-4 pt-3 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Reporter info */}
                      <div className="bg-muted/50 rounded-lg p-3 space-y-1">
                        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Signalé par</p>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-muted border border-border overflow-hidden flex items-center justify-center">
                            {r.reporter_profile?.avatar_url ? (
                              <img src={r.reporter_profile.avatar_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-sm text-muted-foreground">{(r.reporter_profile?.first_name || "?")[0]}</span>
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{r.reporter_profile?.first_name || "Inconnu"}</p>
                            <p className="text-sm text-muted-foreground">{r.reporter_profile?.city || ""}</p>
                          </div>
                        </div>
                      </div>

                      {/* Reported user info */}
                      {r.reported_profile && (
                        <div className="bg-muted/50 rounded-lg p-3 space-y-1">
                          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Utilisateur signalé</p>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-muted border border-border overflow-hidden flex items-center justify-center">
                              {r.reported_profile.avatar_url ? (
                                <img src={r.reported_profile.avatar_url} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-sm text-muted-foreground">{(r.reported_profile.first_name || "?")[0]}</span>
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-foreground">{r.reported_profile.first_name || "Inconnu"}</p>
                              <p className="text-sm text-muted-foreground">{r.reported_profile.city || ""}</p>
                              {r.reported_profile.suspended && <Badge variant="destructive" className="mt-1">Suspendu</Badge>}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Description */}
                    {r.description && (
                      <div>
                        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-1">Description</p>
                        <p className="text-foreground bg-muted/30 rounded-lg p-3">{r.description}</p>
                      </div>
                    )}

                    {/* Conversation viewer */}
                    {r.reported_user_id && (
                      <div>
                        {viewingConvId === r.id ? (
                          <ConversationViewer
                            reporterId={r.reporter_id}
                            reportedUserId={r.reported_user_id}
                            onClose={() => setViewingConvId(null)}
                          />
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setViewingConvId(r.id)}
                          >
                            <MessageCircle className="w-4 h-4 mr-1" /> Voir la conversation
                          </Button>
                        )}
                      </div>
                    )}

                    <div>
                      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-1">Notes admin</p>
                      <Textarea
                        value={adminNotes[r.id] ?? r.admin_notes ?? ""}
                        onChange={(e) => setAdminNotes((prev) => ({ ...prev, [r.id]: e.target.value }))}
                        placeholder="Ajoutez vos notes de modération…"
                        className="min-h-[80px]"
                      />
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap gap-2">
                      {r.status === "pending" && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => updateReport.mutate({ id: r.id, status: "resolved", notes: adminNotes[r.id] ?? r.admin_notes ?? "" })}
                          >
                            <CheckCircle className="w-4 h-4 mr-1" /> Résoudre
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateReport.mutate({ id: r.id, status: "reviewed", notes: adminNotes[r.id] ?? r.admin_notes ?? "" })}
                          >
                            <Eye className="w-4 h-4 mr-1" /> Marquer examiné
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => updateReport.mutate({ id: r.id, status: "dismissed", notes: adminNotes[r.id] ?? r.admin_notes ?? "" })}
                          >
                            <XCircle className="w-4 h-4 mr-1" /> Rejeter
                          </Button>
                        </>
                      )}
                      {r.status === "reviewed" && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => updateReport.mutate({ id: r.id, status: "resolved", notes: adminNotes[r.id] ?? r.admin_notes ?? "" })}
                          >
                            <CheckCircle className="w-4 h-4 mr-1" /> Résoudre
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => updateReport.mutate({ id: r.id, status: "dismissed", notes: adminNotes[r.id] ?? r.admin_notes ?? "" })}
                          >
                            <XCircle className="w-4 h-4 mr-1" /> Rejeter
                          </Button>
                        </>
                      )}

                      {/* Save notes only */}
                      {adminNotes[r.id] !== undefined && adminNotes[r.id] !== (r.admin_notes ?? "") && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => updateReport.mutate({ id: r.id, status: r.status, notes: adminNotes[r.id] })}
                        >
                          Sauvegarder notes
                        </Button>
                      )}

                      {/* Suspend reported user */}
                      {r.reported_user_id && r.reported_profile && (
                        <Button
                          variant={r.reported_profile.suspended ? "outline" : "destructive"}
                          size="sm"
                          onClick={() => suspendUser.mutate({ userId: r.reported_user_id!, suspended: !r.reported_profile!.suspended })}
                        >
                          <Ban className="w-4 h-4 mr-1" />
                          {r.reported_profile.suspended ? "Réactiver" : "Suspendre"} l'utilisateur
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdminReports;
