import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Heart, MessageCircle, CalendarHeart, Flag, HandHeart } from "lucide-react";

const StatCard = ({ title, value, icon: Icon, color }: { title: string; value: number | string; icon: React.ElementType; color: string }) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between pb-2">
      <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      <Icon className={`w-5 h-5 ${color}`} />
    </CardHeader>
    <CardContent>
      <p className="text-3xl font-bold text-foreground">{value}</p>
    </CardContent>
  </Card>
);

const AdminDashboard = () => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [profiles, matches, messages, activities, helpRequests, reports] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("matches").select("*", { count: "exact", head: true }),
        supabase.from("messages").select("*", { count: "exact", head: true }),
        supabase.from("activities").select("*", { count: "exact", head: true }),
        supabase.from("help_requests").select("*", { count: "exact", head: true }),
        supabase.from("reports").select("*", { count: "exact", head: true }).eq("status", "pending"),
      ]);
      return {
        users: profiles.count ?? 0,
        matches: matches.count ?? 0,
        messages: messages.count ?? 0,
        activities: activities.count ?? 0,
        helpRequests: helpRequests.count ?? 0,
        pendingReports: reports.count ?? 0,
      };
    },
  });

  if (isLoading) {
    return <div className="p-8 text-muted-foreground">Chargement des statistiques…</div>;
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold font-serif text-foreground mb-6">Tableau de bord</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard title="Utilisateurs" value={stats?.users ?? 0} icon={Users} color="text-primary" />
        <StatCard title="Matchs" value={stats?.matches ?? 0} icon={Heart} color="text-destructive" />
        <StatCard title="Messages" value={stats?.messages ?? 0} icon={MessageCircle} color="text-accent" />
        <StatCard title="Activités" value={stats?.activities ?? 0} icon={CalendarHeart} color="text-primary" />
        <StatCard title="Demandes d'entraide" value={stats?.helpRequests ?? 0} icon={HandHeart} color="text-accent" />
        <StatCard title="Signalements en attente" value={stats?.pendingReports ?? 0} icon={Flag} color="text-destructive" />
      </div>
    </div>
  );
};

export default AdminDashboard;
