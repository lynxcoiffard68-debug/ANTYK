import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Send, Mic, MicOff, ShieldAlert, AlertTriangle, Ban } from "lucide-react";
import ReportButton from "@/components/ReportButton";
import { useToast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";

type Message = Tables<"messages">;
type Profile = Tables<"profiles">;

const SENSITIVE_WORDS = ["argent", "virement", "carte bancaire", "iban", "rib", "western union", "mandat", "bitcoin", "crypto"];

const ChatPage = () => {
  const { matchId } = useParams<{ matchId: string }>();
  const { user } = useAuth();
  const { toast } = useToast();

  const [messages, setMessages] = useState<Message[]>([]);
  const [otherProfile, setOtherProfile] = useState<Profile | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isBlocked, setIsBlocked] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [sensitiveWarning, setSensitiveWarning] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const baseMessageRef = useRef("");

  // Load match info + messages
  useEffect(() => {
    if (!user || !matchId) return;
    loadChat();
  }, [user, matchId]);

  // Realtime subscription
  useEffect(() => {
    if (!matchId) return;

    const channel = supabase
      .channel(`chat-${matchId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `match_id=eq.${matchId}`,
        },
        (payload) => {
          const newMsg = payload.new as Message;
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });

          // Mark as read if from other user
          if (newMsg.sender_id !== user?.id) {
            supabase
              .from("messages")
              .update({ read_at: new Date().toISOString() })
              .eq("id", newMsg.id)
              .then();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [matchId, user]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadChat = async () => {
    if (!user || !matchId) return;

    // Get match
    const { data: match } = await supabase
      .from("matches")
      .select("*")
      .eq("id", matchId)
      .single();

    if (!match) return;

    const otherUserId = match.user1_id === user.id ? match.user2_id : match.user1_id;

    // Check if current user blocked the other user
    const { data: blockData } = await supabase
      .from("blocks")
      .select("id")
      .eq("blocker_id", user.id)
      .eq("blocked_id", otherUserId)
      .limit(1);

    if (blockData && blockData.length > 0) {
      setIsBlocked(true);
      setLoading(false);
      return;
    }

    // Get other profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", otherUserId)
      .single();

    setOtherProfile(profile);

    // Get messages
    const { data: msgs } = await supabase
      .from("messages")
      .select("*")
      .eq("match_id", matchId)
      .order("created_at", { ascending: true });

    setMessages(msgs || []);
    setLoading(false);

    // Mark unread messages as read
    if (msgs && msgs.length > 0) {
      const unread = msgs.filter((m) => m.sender_id !== user.id && !m.read_at);
      if (unread.length > 0) {
        await supabase
          .from("messages")
          .update({ read_at: new Date().toISOString() })
          .eq("match_id", matchId)
          .neq("sender_id", user.id)
          .is("read_at", null);
      }
    }
  };

  const checkSensitiveContent = (text: string): boolean => {
    const lower = text.toLowerCase();
    return SENSITIVE_WORDS.some((w) => lower.includes(w));
  };

  const handleSend = async () => {
    if (!newMessage.trim() || !user || !matchId) return;

    // Check for sensitive words
    if (checkSensitiveContent(newMessage)) {
      setSensitiveWarning(true);
      toast({
        title: "⚠️ Attention",
        description: "Ce message contient des mots sensibles. N'envoyez jamais d'argent à une personne rencontrée en ligne.",
        variant: "destructive",
      });
      // Still allow sending, just warn
    }

    setSending(true);
    const { error } = await supabase.from("messages").insert({
      match_id: matchId,
      sender_id: user.id,
      content: newMessage.trim(),
    });

    setSending(false);
    if (error) {
      toast({ title: "Erreur", description: "Impossible d'envoyer le message.", variant: "destructive" });
    } else {
      setNewMessage("");
      setSensitiveWarning(false);
    }
  };

  // Web Speech API for dictation
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

  if (isBlocked) {
    return (
      <div className="flex flex-col h-screen bg-background">
        <header className="flex items-center gap-3 px-4 py-3 border-b border-border bg-background z-10">
          <Button variant="ghost" size="icon" className="min-h-[48px] min-w-[48px]" asChild>
            <Link to="/messages"><ArrowLeft className="w-6 h-6" /></Link>
          </Button>
          <h2 className="text-lg font-semibold text-foreground">Conversation</h2>
        </header>
        <div className="flex-1 flex items-center justify-center px-6">
          <div className="max-w-sm text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-muted flex items-center justify-center">
              <Ban className="w-8 h-8 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-serif font-bold text-foreground">Conversation indisponible</h2>
            <p className="text-muted-foreground leading-relaxed">
              Cette conversation n'est plus accessible car l'un des utilisateurs a été bloqué.
            </p>
            <Button variant="outline" asChild>
              <Link to="/messages">Retour aux messages</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <header className="flex items-center gap-3 px-4 py-3 border-b border-border bg-background z-10">
        <Button variant="ghost" size="icon" className="min-h-[48px] min-w-[48px]" asChild>
          <Link to="/messages"><ArrowLeft className="w-6 h-6" /></Link>
        </Button>
        <div className="w-10 h-10 rounded-full bg-muted border border-border overflow-hidden flex items-center justify-center flex-shrink-0">
          {otherProfile?.avatar_url ? (
            <img src={otherProfile.avatar_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="text-sm text-muted-foreground">
              {(otherProfile?.first_name || "?")[0]?.toUpperCase()}
            </span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-semibold text-foreground truncate">
            {otherProfile?.first_name || "Conversation"}
          </h2>
        </div>
        {otherProfile && (
          <ReportButton reportedUserId={otherProfile.user_id} contentType="profile" onBlock={() => window.location.href = "/messages"} />
        )}
      </header>

      {/* Security banner */}
      <div className="flex items-center gap-2 px-4 py-2 bg-warm-light border-b border-border">
        <ShieldAlert className="w-4 h-4 text-primary flex-shrink-0" />
        <p className="text-xs text-foreground">Ne jamais envoyer d'argent — <Link to="/a-propos" className="underline text-primary">en savoir plus</Link></p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.length === 0 && (
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              Commencez la conversation ! Dites bonjour 👋
            </p>
          </div>
        )}

        {messages.map((msg) => {
          const isMine = msg.sender_id === user?.id;
          return (
            <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  isMine
                    ? "bg-primary text-primary-foreground rounded-br-md"
                    : "bg-card border border-border text-foreground rounded-bl-md"
                }`}
              >
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

      {/* Sensitive warning */}
      {sensitiveWarning && (
        <div className="flex items-center gap-2 px-4 py-2 bg-destructive/10 border-t border-destructive/20">
          <AlertTriangle className="w-4 h-4 text-destructive flex-shrink-0" />
          <p className="text-xs text-destructive font-medium">
            Attention : ne partagez jamais d'informations bancaires.
          </p>
        </div>
      )}

      {/* Input */}
      <div className="px-4 py-3 border-t border-border bg-background safe-area-bottom">
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
            onChange={(e) => {
              setNewMessage(e.target.value);
              if (sensitiveWarning && !checkSensitiveContent(e.target.value)) {
                setSensitiveWarning(false);
              } else if (!sensitiveWarning && checkSensitiveContent(e.target.value)) {
                setSensitiveWarning(true);
              }
            }}
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

export default ChatPage;
