import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Flag } from "lucide-react";
import { toast } from "sonner";

interface ReportButtonProps {
  reportedUserId?: string;
  contentType?: string;
  contentId?: string;
  onBlock?: () => void;
}

const reasons = [
  "Contenu inapproprié",
  "Harcèlement",
  "Faux profil",
  "Arnaque / fraude",
  "Spam",
  "Autre",
];

const ReportButton = ({ reportedUserId, contentType, contentId, onBlock }: ReportButtonProps) => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [blockUser, setBlockUser] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!user || !reason) return;
    setSubmitting(true);

    // Send report
    const { error } = await supabase.from("reports").insert({
      reporter_id: user.id,
      reported_user_id: reportedUserId || null,
      reported_content_type: contentType || "profile",
      reported_content_id: contentId || null,
      reason,
      description: description || null,
    });

    if (error) {
      setSubmitting(false);
      toast.error("Erreur lors de l'envoi du signalement");
      return;
    }

    // Block user if checked
    if (blockUser && reportedUserId) {
      await supabase.from("blocks").insert({
        blocker_id: user.id,
        blocked_id: reportedUserId,
      });
    }

    setSubmitting(false);
    toast.success(
      blockUser
        ? "Signalement envoyé et utilisateur bloqué"
        : "Signalement envoyé, merci !"
    );
    setOpen(false);
    setReason("");
    setDescription("");
    setBlockUser(true);

    if (blockUser && onBlock) onBlock();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-muted-foreground">
          <Flag className="w-4 h-4 mr-1" /> Signaler
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Signaler un contenu</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div>
            <Label>Raison</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger>
                <SelectValue placeholder="Choisir une raison" />
              </SelectTrigger>
              <SelectContent>
                {reasons.map((r) => (
                  <SelectItem key={r} value={r}>{r}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Description (optionnel)</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Décrivez le problème…"
              rows={3}
            />
          </div>
          {reportedUserId && (
            <div className="flex items-center gap-3 rounded-lg border border-border p-3 bg-muted/50">
              <Checkbox
                id="block-user"
                checked={blockUser}
                onCheckedChange={(v) => setBlockUser(v === true)}
              />
              <Label htmlFor="block-user" className="text-sm cursor-pointer leading-snug">
                Bloquer cette personne (vous ne verrez plus son profil)
              </Label>
            </div>
          )}
          <Button onClick={handleSubmit} disabled={!reason || submitting} className="w-full">
            {submitting ? "Envoi…" : "Envoyer le signalement"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReportButton;
