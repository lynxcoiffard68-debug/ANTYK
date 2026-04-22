import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { MessageCircle, ShieldAlert } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type Match = Tables<"matches">;
type Profile = Tables<"profiles">;

interface ConversationItem {
  match: Match;
  otherProfile: Profile;
  lastMessage?: { content: string; created_at: string; sender_id: string };
  unreadCount: number;
}

const MessagesPage = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) loadConversations();
  }, [user]);

  const loadConversations = async () => {
    if (!user) return;

    // Parallel: blocks + matches
    const [{ data: blocksData }, { data: matches }] = await Promise.all([
      supabase.from("blocks").select("blocked_id").eq("blocker_id", user.id),
      supabase.from("matches").select("*")
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
        .eq("status", "active")
        .order("created_at", { ascending: false }),
    ]);

    const blockedUserIds = new Set((blocksData || []).map((b) => b.blocked_id));

    if (!matches || matches.length === 0) {
      setConversations([]);
      setLoading(false);
      return;
    }

    // Get other user IDs, filter blocked
    const otherUserIds: string[] = [];
    const matchMap = new Map<string, Match>();
    for (const match of matches) {
      const otherId = match.user1_id === user.id ? match.user2_id : match.user1_id;
      if (blockedUserIds.has(otherId)) continue;
      otherUserIds.push(otherId);
      matchMap.set(otherId, match);
    }

    if (otherUserIds.length === 0) {
      setConversations([]);
      setLoading(false);
      return;
    }

    const matchIds = [...matchMap.values()].map((m) => m.id);

    // Batch: profiles + all messages for these matches
    const [{ data: profiles }, { data: allMessages }] = await Promise.all([
      supabase.from("profiles").select("*").in("user_id", otherUserIds),
      supabase.from("messages")
        .select("match_id, content, created_at, sender_id, read_at")
        .in("match_id", matchIds)
        .order("created_at", { ascending: false }),
    ]);

    const profileMap = new Map<string, Profile>();
    (profiles || []).forEach((p) => profileMap.set(p.user_id, p));

    // Group messages by match_id, get last message and unread count
    const lastMsgMap = new Map<string, { content: string; created_at: string; sender_id: string }>();
    const unreadMap = new Map<string, number>();

    for (const msg of (allMessages || [])) {
      if (!lastMsgMap.has(msg.match_id)) {
        lastMsgMap.set(msg.match_id, { content: msg.content, created_at: msg.created_at, sender_id: msg.sender_id });
      }
      if (msg.sender_id !== user.id && !msg.read_at) {
        unreadMap.set(msg.match_id, (unreadMap.get(msg.match_id) || 0) + 1);
      }
    }

    const items: ConversationItem[] = [];
    for (const otherId of otherUserIds) {
      const match = matchMap.get(otherId);
      const profile = profileMap.get(otherId);
      if (!match || !profile) continue;

      items.push({
        match,
        otherProfile: profile,
        lastMessage: lastMsgMap.get(match.id),
        unreadCount: unreadMap.get(match.id) || 0,
      });
    }

    // Sort by last message date
    items.sort((a, b) => {
      const aTime = a.lastMessage?.created_at || a.match.created_at;
      const bTime = b.lastMessage?.created_at || b.match.created_at;
      return new Date(bTime).getTime() - new Date(aTime).getTime();
    });

    setConversations(items);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background pb-24">
        <p className="text-lg text-muted-foreground">Chargement…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24 overflow-x-hidden">
      <header className="px-4 sm:px-6 py-4 border-b border-border">
        <h1 className="text-2xl font-serif font-bold text-primary">Messages</h1>
      </header>

      {/* Security reminder */}
      <div className="mx-4 sm:mx-6 mt-4 flex items-start gap-3 bg-warm-light rounded-xl p-4">
        <ShieldAlert className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
        <p className="text-sm text-foreground">
          <strong>Rappel :</strong> ne partagez jamais vos informations bancaires et n'envoyez jamais d'argent.
        </p>
      </div>

      {conversations.length === 0 ? (
        <div className="flex flex-col items-center justify-center px-4 sm:px-6 py-16 text-center">
          <MessageCircle className="w-16 h-16 text-primary/20 mb-6" />
          <h2 className="text-xl font-serif font-bold text-foreground mb-2">Pas encore de conversations</h2>
          <p className="text-muted-foreground max-w-sm">
            Quand vous et une autre personne souhaitez discuter, votre conversation apparaîtra ici.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-border">
          {conversations.map((c) => (
            <li key={c.match.id}>
              <Link
                to={`/messages/${c.match.id}`}
                className="flex items-center gap-4 px-4 sm:px-6 py-4 hover:bg-muted/50 transition-colors"
              >
                {/* Avatar */}
                <div className="w-14 h-14 rounded-full bg-muted border border-border overflow-hidden flex-shrink-0 flex items-center justify-center">
                  {c.otherProfile.avatar_url ? (
                    <img src={c.otherProfile.avatar_url} alt="" className="w-full h-full object-cover" loading="lazy" />
                  ) : (
                    <span className="text-xl text-muted-foreground">
                      {(c.otherProfile.first_name || "?")[0]?.toUpperCase()}
                    </span>
                  )}
                </div>

                {/* Name + last message */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-foreground truncate">
                      {c.otherProfile.first_name || "Utilisateur"}
                    </p>
                    {c.lastMessage && (
                      <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">
                        {formatTime(c.lastMessage.created_at)}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground truncate">
                      {c.lastMessage
                        ? (c.lastMessage.sender_id === user?.id ? "Vous : " : "") + c.lastMessage.content
                        : "Nouvelle conversation — dites bonjour ! 👋"}
                    </p>
                    {c.unreadCount > 0 && (
                      <span className="flex-shrink-0 ml-2 w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold">
                        {c.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / 86400000);

  if (days === 0) {
    return date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  } else if (days === 1) {
    return "Hier";
  } else if (days < 7) {
    return date.toLocaleDateString("fr-FR", { weekday: "short" });
  }
  return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

export default MessagesPage;