import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

/**
 * Hook that listens for new messages via Realtime and triggers
 * browser notifications when the user is NOT on the relevant chat page.
 */
export const useMessageNotifications = () => {
  const { user } = useAuth();
  const location = useLocation();
  const locationRef = useRef(location.pathname);
  const permissionRef = useRef<NotificationPermission>("default");

  // Keep pathname ref up to date
  useEffect(() => {
    locationRef.current = location.pathname;
  }, [location.pathname]);

  // Request notification permission once
  useEffect(() => {
    if (!("Notification" in window)) return;
    if (Notification.permission === "granted") {
      permissionRef.current = "granted";
    } else if (Notification.permission !== "denied") {
      Notification.requestPermission().then((p) => {
        permissionRef.current = p;
      });
    }
  }, []);

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("msg-notifications")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        async (payload) => {
          const msg = payload.new as { sender_id: string; match_id: string; content: string };

          // Ignore own messages
          if (msg.sender_id === user.id) return;

          // Don't notify if user is already viewing this chat
          if (locationRef.current === `/messages/${msg.match_id}`) return;

          // Check permission
          if (permissionRef.current !== "granted") return;

          // Get sender name
          const { data: profile } = await supabase
            .from("profiles")
            .select("first_name")
            .eq("user_id", msg.sender_id)
            .single();

          const senderName = profile?.first_name || "Quelqu'un";
          const body = msg.content.length > 80 ? msg.content.slice(0, 80) + "…" : msg.content;

          new Notification(senderName, {
            body,
            icon: "/favicon.ico",
            tag: `msg-${msg.match_id}`,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);
};
