"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface ApplicationActionsProps {
  applicationId: string;
}

export function ApplicationActions({
  applicationId,
}: ApplicationActionsProps): React.ReactElement {
  const t = useTranslations("admin.applications");
  const router = useRouter();
  const [note, setNote] = useState<string>("");
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);

  async function handleAction(
    status: "approved" | "rejected"
  ): Promise<void> {
    setSubmitting(true);
    await fetch(`/api/admin/seller-applications/${applicationId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status,
        admin_note: note || null,
      }),
    });
    setSubmitting(false);
    setDialogOpen(false);
    router.refresh();
  }

  return (
    <div className="flex gap-3">
      <Button
        onClick={() => void handleAction("approved")}
        disabled={submitting}
      >
        <Check className="h-4 w-4" />
        {t("approve")}
      </Button>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="destructive">
            <X className="h-4 w-4" />
            {t("reject")}
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("reject")}</DialogTitle>
            <DialogDescription>{t("note")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="reject-note">{t("note")}</Label>
            <Textarea
              id="reject-note"
              value={note}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setNote(e.target.value)
              }
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button
              variant="destructive"
              onClick={() => void handleAction("rejected")}
              disabled={submitting}
            >
              {t("reject")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
