import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Ban, CheckCircle } from "lucide-react";

const AdminUsers = () => {
  const queryClient = useQueryClient();

  const { data: users, isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;

      const { data: roles } = await supabase
        .from("user_roles")
        .select("user_id, role");

      const adminUserIds = new Set(
        (roles ?? []).filter((r) => r.role === "admin").map((r) => r.user_id)
      );

      return (profiles ?? []).map((p) => ({
        ...p,
        isAdmin: adminUserIds.has(p.user_id),
      }));
    },
  });

  const toggleSuspend = useMutation({
    mutationFn: async ({ userId, suspended }: { userId: string; suspended: boolean }) => {
      const { error } = await supabase
        .from("profiles")
        .update({ suspended })
        .eq("user_id", userId);
      if (error) throw error;
    },
    onSuccess: (_, { suspended }) => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success(suspended ? "Utilisateur suspendu" : "Utilisateur réactivé");
    },
    onError: () => toast.error("Erreur lors de la mise à jour"),
  });

  if (isLoading) {
    return <div className="p-8 text-muted-foreground">Chargement…</div>;
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold font-serif text-foreground mb-6">Gestion des utilisateurs</h1>
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Prénom</TableHead>
              <TableHead>Ville</TableHead>
              <TableHead>Inscription</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users?.map((u) => (
              <TableRow key={u.id}>
                <TableCell className="font-medium">{u.first_name || "—"}</TableCell>
                <TableCell>{u.city || "—"}</TableCell>
                <TableCell>{new Date(u.created_at).toLocaleDateString("fr-FR")}</TableCell>
                <TableCell>
                  {u.isAdmin ? (
                    <Badge variant="outline" className="border-primary text-primary">Admin</Badge>
                  ) : u.suspended ? (
                    <Badge variant="destructive">Suspendu</Badge>
                  ) : (
                    <Badge variant="secondary">Actif</Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  {u.isAdmin ? (
                    <span className="text-xs text-muted-foreground italic">Protégé</span>
                  ) : (
                    <Button
                      variant={u.suspended ? "outline" : "destructive"}
                      size="sm"
                      onClick={() =>
                        toggleSuspend.mutate({ userId: u.user_id, suspended: !u.suspended })
                      }
                    >
                      {u.suspended ? (
                        <>
                          <CheckCircle className="w-4 h-4 mr-1" /> Réactiver
                        </>
                      ) : (
                        <>
                          <Ban className="w-4 h-4 mr-1" /> Suspendre
                        </>
                      )}
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default AdminUsers;
