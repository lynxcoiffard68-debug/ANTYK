import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { ArrowLeft, UserX, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

interface BlockedUser {
  id: string;
  blocked_id: string;
  created_at: string;
  profile?: {
    first_name: string | null;
    avatar_url: string | null;
    city: string | null;
  };
}

const BlockedUsersPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [blocks, setBlocks] = useState<BlockedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [unblocking, setUnblocking] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    fetchBlocks();
  }, [user]);

  const fetchBlocks = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("blocks")
      .select("id, blocked_id, created_at")
      .eq("blocker_id", user.id)
      .order("created_at", { ascending: false });

    if (!data || data.length === 0) {
      setBlocks([]);
      setLoading(false);
      return;
    }

    // Fetch profiles for blocked users
    const blockedIds = data.map((b) => b.blocked_id);
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, first_name, avatar_url, city")
      .in("user_id", blockedIds);

    const enriched: BlockedUser[] = data.map((b) => ({
      ...b,
      profile: profiles?.find((p) => p.user_id === b.blocked_id) || undefined,
    }));

    setBlocks(enriched);
    setLoading(false);
  };

  const handleUnblock = async (block: BlockedUser) => {
    setUnblocking(block.id);
    const { error } = await supabase.from("blocks").delete().eq("id", block.id);
    setUnblocking(null);

    if (error) {
      toast({ title: "Erreur", description: "Impossible de débloquer.", variant: "destructive" });
    } else {
      toast({ title: "Utilisateur débloqué" });
      setBlocks((prev) => prev.filter((b) => b.id !== block.id));
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="flex items-center gap-3 px-6 py-4 border-b border-border sticky top-0 bg-background z-40">
        <Button variant="ghost" size="icon" className="min-h-[48px] min-w-[48px]" onClick={() => navigate("/profil")}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-2xl font-serif font-bold text-primary">Utilisateurs bloqués</h1>
      </header>

      <main className="max-w-lg mx-auto px-6 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : blocks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <UserX className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium text-foreground">Aucun utilisateur bloqué</p>
            <p className="text-muted-foreground mt-1">Vous n'avez bloqué personne pour le moment.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {blocks.map((block) => (
              <div key={block.id} className="flex items-center gap-4 bg-card rounded-xl p-4 border border-border">
                <div className="w-12 h-12 rounded-full bg-muted border border-border overflow-hidden flex items-center justify-center shrink-0">
                  {block.profile?.avatar_url ? (
                    <img src={block.profile.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-lg text-muted-foreground">
                      {(block.profile?.first_name || "?")[0]?.toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground truncate">
                    {block.profile?.first_name || "Utilisateur"}
                  </p>
                  {block.profile?.city && (
                    <p className="text-sm text-muted-foreground">{block.profile.city}</p>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="shrink-0 text-destructive border-destructive/30 hover:bg-destructive/5"
                  onClick={() => handleUnblock(block)}
                  disabled={unblocking === block.id}
                >
                  {unblocking === block.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Débloquer"
                  )}
                </Button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default BlockedUsersPage;
