import { NavLink, useLocation } from "react-router-dom";
import { Sparkles, CalendarHeart, HandHeart, MessageCircle, UserCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

const tabs = [
  { to: "/suggestions", label: "Suggestions", icon: Sparkles },
  { to: "/activites", label: "Activités", icon: CalendarHeart },
  { to: "/entraide", label: "Entraide", icon: HandHeart },
  { to: "/messages", label: "Messages", icon: MessageCircle },
  { to: "/profil", label: "Profil", icon: UserCircle },
];

const BottomNav = () => {
  const location = useLocation();
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const isChatPage = /^\/messages\/.+/.test(location.pathname);
  const isGroupChatPage = /^\/(activites|entraide)\/.+\/discussion/.test(location.pathname);
  const isAdminPage = location.pathname.startsWith("/admin");
  const isAppRoute = !isChatPage && !isGroupChatPage && !isAdminPage && tabs.some((t) => location.pathname.startsWith(t.to));

  useEffect(() => {
    if (!user) return;

    let mounted = true;

    const fetchUnread = async () => {
      const { data: matches } = await supabase
        .from("matches")
        .select("id")
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
        .eq("status", "active");

      if (!mounted) return;

      if (!matches || matches.length === 0) {
        setUnreadCount(0);
        return;
      }

      const matchIds = matches.map((m) => m.id);
      const { count } = await supabase
        .from("messages")
        .select("*", { count: "exact", head: true })
        .in("match_id", matchIds)
        .neq("sender_id", user.id)
        .is("read_at", null);

      if (mounted) setUnreadCount(count || 0);
    };

    fetchUnread();

    // Listen for both new messages (INSERT) and read status changes (UPDATE)
    const channel = supabase
      .channel("unread-badge")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        () => fetchUnread()
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "messages" },
        () => fetchUnread()
      )
      .subscribe();

    // Also refetch when navigating back to a page (covers tab switches)
    const handleVisibility = () => {
      if (document.visibilityState === "visible") fetchUnread();
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [user]);

  if (!isAppRoute) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background border-t-2 border-border z-50 safe-area-bottom">
      <div className="flex justify-around items-center h-20 max-w-lg mx-auto">
        {tabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            className={({ isActive }) =>
              cn(
                "flex flex-col items-center justify-center gap-1.5 flex-1 h-full transition-colors relative min-w-[60px]",
                isActive ? "text-primary font-bold" : "text-muted-foreground"
              )
            }
          >
            <div className="relative">
              <tab.icon className="w-7 h-7" />
              {tab.to === "/messages" && unreadCount > 0 && (
                <span className="absolute -top-1.5 -right-3 w-6 h-6 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center font-bold">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </div>
            <span className="text-xs font-semibold">{tab.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
};

export default BottomNav;