"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useUser } from "@/hooks/use-user";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";

export interface RequestPortionOption {
  id: string;
  label: string;
}

interface RequestItemButtonProps {
  locale: string;
  itemId: string;
  shopId: string;
  available: boolean;
  supportsDelivery: boolean;
  portions: RequestPortionOption[];
}

export function RequestItemButton({
  locale,
  itemId,
  shopId,
  available,
  supportsDelivery,
  portions,
}: RequestItemButtonProps): React.ReactElement {
  const t = useTranslations("order");
  const tItem = useTranslations("item");
  const router = useRouter();
  const { user, isLoading } = useUser();
  const [open, setOpen] = useState<boolean>(false);
  const [portionId, setPortionId] = useState<string | null>(
    portions[0]?.id ?? null
  );
  const [note, setNote] = useState<string>("");
  const [wantsDelivery, setWantsDelivery] = useState<boolean>(false);
  const [couponCode, setCouponCode] = useState<string>("");
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && !supportsDelivery) {
      setWantsDelivery(false);
    }
  }, [open, supportsDelivery]);

  async function submit(): Promise<void> {
    if (!user) return;
    setSubmitting(true);
    setError(null);
    const res: Response = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        item_id: itemId,
        shop_id: shopId,
        portion_id: portionId ?? undefined,
        note: note.trim() || undefined,
        wants_delivery: wantsDelivery,
        coupon_code: couponCode.trim() || undefined,
      }),
    });
    const json: unknown = await res.json().catch(() => ({}));
    if (!res.ok) {
      const msg: string =
        typeof json === "object" &&
        json !== null &&
        "error" in json &&
        typeof (json as { error: unknown }).error === "string"
          ? (json as { error: string }).error
          : t("requestFailed");
      setError(msg);
      setSubmitting(false);
      return;
    }
    const id: string | undefined =
      typeof json === "object" &&
      json !== null &&
      "id" in json &&
      typeof (json as { id: unknown }).id === "string"
        ? (json as { id: string }).id
        : undefined;
    setSubmitting(false);
    setOpen(false);
    if (id) {
      router.push(`/${locale}/my-requests/${id}`);
      router.refresh();
    }
  }

  if (!available) {
    return (
      <Button className="w-full" size="lg" disabled data-testid="request-item">
        {tItem("outOfStock")}
      </Button>
    );
  }

  if (isLoading) {
    return (
      <Button className="w-full" size="lg" disabled data-testid="request-item">
        {t("loading")}
      </Button>
    );
  }

  if (!user) {
    return (
      <Button className="w-full" size="lg" asChild data-testid="request-item">
        <Link href={`/${locale}/login`}>{t("loginToOrder")}</Link>
      </Button>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          className="w-full"
          size="lg"
          data-testid="request-item"
          type="button"
        >
          {tItem("request")}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("submitRequest")}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-2">
          {portions.length > 0 && (
            <div className="space-y-2">
              <Label>{t("portions")}</Label>
              <div className="flex flex-wrap gap-2">
                {portions.map((p: RequestPortionOption) => (
                  <Button
                    key={p.id}
                    type="button"
                    size="sm"
                    variant={portionId === p.id ? "default" : "outline"}
                    onClick={() => setPortionId(p.id)}
                  >
                    {p.label}
                  </Button>
                ))}
              </div>
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="order-note">{t("note")}</Label>
            <Textarea
              id="order-note"
              value={note}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setNote(e.target.value)
              }
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="coupon">{t("couponCode")}</Label>
            <Input
              id="coupon"
              value={couponCode}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setCouponCode(e.target.value)
              }
              autoComplete="off"
            />
          </div>
          <div className="flex items-center justify-between gap-2">
            <Label htmlFor="wants-delivery">{t("wantDelivery")}</Label>
            <Switch
              id="wants-delivery"
              checked={wantsDelivery}
              disabled={!supportsDelivery}
              onCheckedChange={(v: boolean) => {
                if (supportsDelivery) setWantsDelivery(v);
              }}
            />
          </div>
          {!supportsDelivery && (
            <p className="text-xs text-muted-foreground">
              {tItem("pickupOnlyHint")}
            </p>
          )}
          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
        </div>
        <DialogFooter>
          <Button
            type="button"
            onClick={() => void submit()}
            disabled={submitting}
            data-testid="confirm-request"
          >
            {submitting ? t("submitting") : t("confirmRequest")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
