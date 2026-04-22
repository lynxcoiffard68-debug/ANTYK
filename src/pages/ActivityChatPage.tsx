import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, Link, Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Send, Mic, MicOff, Users, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ActivityMessage {
  id: string;
  activity_id: string;
  sender_id: string;
  content: string;
  created_at: string;
}

interface SenderProfile {
  user_id: string;
  first_name: string | null;
  avatar_url: string | null;
}

const ActivityChatPage = () => {
  const { activityId } = useParams<{ activityId: string }>();
  const { user } = useAuth();
  const { toast } = useToast();

  const [messages, setMessages] = useState<ActivityMessage[]>([]);
  const [activityTitle, setActivityTitle] = useState("");
  const [participantCount, setParticipantCount] = useState(0);
  const [profiles, setProfiles] = useState<Record<string, SenderProfile>>({});
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [isListening, setIsListening] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const baseMessageRef = useRef("");

  useEffect(() => {
    if (!user || !activityId) return;
    checkAccessAndLoad();
  }, [user, activityId]);

  // Realtime subscription
  useEffect(() => {
    if (!activityId || !hasAccess) return;

    const channel = supabase
      .channel(`activity-chat-${activityId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "activity_messages",
          filter: `activity_id=eq.${activityId}`,
        },
        (payload) => {
          const newMsg = payload.new as ActivityMessage;
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
          if (!profiles[newMsg.sender_id]) {
            loadProfile(newMsg.sender_id);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activityId, hasAccess, profiles]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadProfile = async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("user_id, first_name, avatar_url")
      .eq("user_id", userId)
      .single();
    if (data) {
      setProfiles((prev) => ({ ...prev, [data.user_id]: data }));
    }
  };

  const checkAccessAndLoad = async () => {
    if (!user || !activityId) return;

    // Check if user is a participant or the creator
    const { data: participation } = await supabase
      .from("activity_participants")
      .select("id")
      .eq("activity_id", activityId)
      .eq("user_id", user.id)
      .maybeSingle();

    const { data: activity } = await supabase
      .from("activities")
      .select("title, creator_id")
      .eq("id", activityId)
      .single();

    const isParticipant = !!participation;
    const isCreator = activity?.creator_id === user.id;

    if (!isParticipant && !isCreator) {
      setHasAccess(false);
      setLoading(false);
      return;
    }

    setHasAccess(true);
    if (activity) setActivityTitle(activity.title);

    // Get participant count
    const { count } = await supabase
      .from("activity_participants")
      .select("*", { count: "exact", head: true })
      .eq("activity_id", activityId);

    setParticipantCount(count || 0);

    const { data: msgs } = await supabase
      .from("activity_messages")
      .select("*")
      .eq("activity_id", activityId)
      .order("created_at", { ascending: true });

    const typedMsgs = (msgs || []) as ActivityMessage[];
    setMessages(typedMsgs);

    // Load all sender profiles
    if (typedMsgs.length > 0) {
      const uniqueSenders = [...new Set(typedMsgs.map((m) => m.sender_id))];
      const { data: senderProfiles } = await supabase
        .from("profiles")
        .select("user_id, first_name, avatar_url")
        .in("user_id", uniqueSenders);

      if (senderProfiles) {
        const map: Record<string, SenderProfile> = {};
        senderProfiles.forEach((p) => { map[p.user_id] = p; });
        setProfiles(map);
      }
    }

    setLoading(false);
  };

  const handleSend = async () => {
    if (!newMessage.trim() || !user || !activityId) return;
    setSending(true);

    const { error } = await supabase.from("activity_messages").insert({
      activity_id: activityId,
      sender_id: user.id,
      content: newMessage.trim(),
    });

    setSending(false);
    if (error) {
      toast({ title: "Erreur", description: "Impossible d'envoyer le message.", variant: "destructive" });
    } else {
      setNewMessage("");
    }
  };

  const toggleDictation = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast({ title: "Non supporté", description: "La dictée vocale n'est pas disponible sur ce navigateur.", variant: "destructive" });
      return;
    }

    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
      return;
    }

    baseMessageRef.current = newMessage;

    const recognition = new SpeechRecognition();
    recognition.lang = "fr-FR";
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event: any) => {
      let finalTranscript = "";
      let interimTranscript = "";
      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
        } else {
          interimTranscript += result[0].transcript;
        }
      }
      const base = baseMessageRef.current;
      const separator = base && !base.endsWith(" ") ? " " : "";
      baseMessageRef.current = base + separator + finalTranscript;
      setNewMessage(baseMessageRef.current + (interimTranscript ? (baseMessageRef.current ? " " : "") + interimTranscript : ""));
    };

    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }, [isListening, toast, newMessage]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-lg text-muted-foreground">Chargement…</p>
      </div>
    );
  }

  if (hasAccess === false) {
    return (
      <div className="flex flex-col h-[100dvh] bg-background">
        <header className="flex items-center gap-3 px-4 py-3 border-b border-border bg-background z-10">
          <Button variant="ghost" size="icon" className="min-h-[48px] min-w-[48px]" asChild>
            <Link to="/activites"><ArrowLeft className="w-6 h-6" /></Link>
          </Button>
          <h2 className="text-lg font-semibold text-foreground">Discussion</h2>
        </header>
        <div className="flex-1 flex items-center justify-center px-6">
          <div className="max-w-sm text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-muted flex items-center justify-center">
              <Lock className="w-8 h-8 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-serif font-bold text-foreground">Accès réservé</h2>
            <p className="text-muted-foreground leading-relaxed">
              Seuls les participants de cette activité peuvent accéder au groupe de discussion.
            </p>
            <Button variant="outline" asChild>
              <Link to="/activites">Retour aux activités</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[100dvh] min-h-0 overflow-hidden bg-background">
      {/* Header */}
      <header className="flex items-center gap-3 px-4 py-3 border-b border-border bg-background z-10">
        <Button variant="ghost" size="icon" className="min-h-[48px] min-w-[48px]" asChild>
          <Link to="/activites"><ArrowLeft className="w-6 h-6" /></Link>
        </Button>
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-semibold text-foreground truncate">{activityTitle}</h2>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Users className="w-3 h-3" />
            {participantCount} participant{participantCount !== 1 ? "s" : ""}
          </p>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4 space-y-3">
        {messages.length === 0 && (
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              Lancez la discussion du groupe ! 💬
            </p>
          </div>
        )}

        {messages.map((msg) => {
          const isMine = msg.sender_id === user?.id;
          const sender = profiles[msg.sender_id];
          return (
            <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
              {!isMine && (
                <div className="w-8 h-8 rounded-full bg-muted border border-border overflow-hidden flex items-center justify-center flex-shrink-0 mr-2 mt-1">
                  {sender?.avatar_url ? (
                    <img src={sender.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      {(sender?.first_name || "?")[0]?.toUpperCase()}
                    </span>
                  )}
                </div>
              )}
              <div
                className={`max-w-[75%] rounded-2xl px-4 py-3 ${
                  isMine
                    ? "bg-primary text-primary-foreground rounded-br-md"
                    : "bg-card border border-border text-foreground rounded-bl-md"
                }`}
              >
                {!isMine && (
                  <p className="text-xs font-medium text-primary mb-1">
                    {sender?.first_name || "Quelqu'un"}
                  </p>
                )}
                <p className="leading-relaxed">{msg.content}</p>
                <p className={`text-xs mt-1 ${isMine ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                  {new Date(msg.created_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="shrink-0 px-4 py-3 border-t border-border bg-background pb-[calc(env(safe-area-inset-bottom,0px)+0.75rem)]">
        <div className="flex items-center gap-2 max-w-lg mx-auto">
          <Button
            variant={isListening ? "default" : "outline"}
            size="icon"
            className="min-h-[48px] min-w-[48px] flex-shrink-0"
            onClick={toggleDictation}
          >
            {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </Button>
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Votre message…"
            className="h-12 text-lg flex-1"
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), handleSend())}
          />
          <Button
            size="icon"
            className="min-h-[48px] min-w-[48px] flex-shrink-0"
            onClick={handleSend}
            disabled={!newMessage.trim() || sending}
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ActivityChatPage;
