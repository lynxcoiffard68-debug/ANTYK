import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

const AdminContent = () => {
  const queryClient = useQueryClient();

  const { data: activities } = useQuery({
    queryKey: ["admin-activities"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("activities")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
  });

  const { data: helpRequests } = useQuery({
    queryKey: ["admin-help-requests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("help_requests")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
  });

  const deleteActivity = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("activities").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-activities"] });
      toast.success("Activité supprimée");
    },
  });

  const deleteHelpRequest = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("help_requests").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-help-requests"] });
      toast.success("Demande supprimée");
    },
  });

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold font-serif text-foreground mb-6">Modération des contenus</h1>
      <Tabs defaultValue="activities">
        <TabsList>
          <TabsTrigger value="activities">Activités ({activities?.length ?? 0})</TabsTrigger>
          <TabsTrigger value="help">Entraide ({helpRequests?.length ?? 0})</TabsTrigger>
        </TabsList>

        <TabsContent value="activities" className="mt-4">
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Titre</TableHead>
                  <TableHead>Catégorie</TableHead>
                  <TableHead>Ville</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activities?.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="font-medium">{a.title}</TableCell>
                    <TableCell>{a.category}</TableCell>
                    <TableCell>{a.city || "—"}</TableCell>
                    <TableCell>{a.activity_date ? new Date(a.activity_date).toLocaleDateString("fr-FR") : "—"}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="destructive" size="sm" onClick={() => deleteActivity.mutate(a.id)}>
                        <Trash2 className="w-4 h-4 mr-1" /> Supprimer
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="help" className="mt-4">
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Titre</TableHead>
                  <TableHead>Catégorie</TableHead>
                  <TableHead>Ville</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {helpRequests?.map((h) => (
                  <TableRow key={h.id}>
                    <TableCell className="font-medium">{h.title}</TableCell>
                    <TableCell>{h.category}</TableCell>
                    <TableCell>{h.city || "—"}</TableCell>
                    <TableCell>{h.status}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="destructive" size="sm" onClick={() => deleteHelpRequest.mutate(h.id)}>
                        <Trash2 className="w-4 h-4 mr-1" /> Supprimer
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminContent;
