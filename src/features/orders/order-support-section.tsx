"use client";

import { useState, useRef } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useSupabase } from "@/hooks/use-supabase";
import { useUser } from "@/hooks/use-user";

interface OrderSupportSectionProps {
  orderId: string;
}

export function OrderSupportSection({
  orderId,
}: OrderSupportSectionProps): React.ReactElement {
  const t = useTranslations("order.support");
  const supabase = useSupabase();
  const { user } = useUser();
  const fileRef = useRef<HTMLInputElement>(null);
  const [body, setBody] = useState<string>("");
  const [busy, setBusy] = useState<boolean>(false);
  const [done, setDone] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    const text: string = body.trim();
    if (!text || !user) return;
    setBusy(true);
    setError(null);

    let issuePhotoPath: string | null = null;
    const file: File | undefined = fileRef.current?.files?.[0];
    if (file) {
      const path: string = `${user.id}/${orderId}/${Date.now()}-${file.name}`;
      const { error: upErr } = await supabase.storage
        .from("issue-photos")
        .upload(path, file);
      if (upErr) {
        setError(t("uploadFailed"));
        setBusy(false);
        return;
      }
      issuePhotoPath = path;
    }

    const res: Response = await fetch(`/api/orders/${orderId}/support-ticket`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        body: text,
        issue_photo_url: issuePhotoPath,
      }),
    });
    setBusy(false);
    if (!res.ok) {
      const j: unknown = await res.json().catch(() => ({}));
      const msg: string =
        typeof j === "object" &&
        j !== null &&
        "error" in j &&
        typeof (j as { error: unknown }).error === "string"
          ? (j as { error: string }).error
          : t("submitFailed");
      setError(msg);
      return;
    }
    setDone(true);
    setBody("");
    if (fileRef.current) fileRef.current.value = "";
  }

  if (done) {
    return (
      <p className="rounded-lg border border-border bg-muted/20 p-3 text-sm">
        {t("thanks")}
      </p>
    );
  }

  return (
    <form
      onSubmit={(e) => void submit(e)}
      className="space-y-3 rounded-lg border border-border bg-muted/10 p-4"
    >
      <h3 className="text-sm font-semibold">{t("title")}</h3>
      <div className="space-y-2">
        <Label htmlFor="support-body">{t("describe")}</Label>
        <Textarea
          id="support-body"
          value={body}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
            setBody(e.target.value)
          }
          rows={3}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="support-photo">{t("photoOptional")}</Label>
        <input
          id="support-photo"
          ref={fileRef}
          type="file"
          accept="image/*"
          className="text-sm"
        />
      </div>
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      <Button type="submit" disabled={busy || !body.trim()}>
        {busy ? t("submitting") : t("submit")}
      </Button>
    </form>
  );
}
