"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

interface ReorderButtonProps {
  itemId: string;
  shopId: string;
  portionId: string | null;
  wantsDelivery: boolean;
  disabled?: boolean;
}

export function ReorderButton({
  itemId,
  shopId,
  portionId,
  wantsDelivery,
  disabled = false,
}: ReorderButtonProps): React.ReactElement {
  const t = useTranslations("order");
  const locale: string = useLocale();
  const router = useRouter();
  const [busy, setBusy] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  async function handleReorder(): Promise<void> {
    setBusy(true);
    setError(null);
    const res: Response = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        item_id: itemId,
        shop_id: shopId,
        portion_id: portionId ?? undefined,
        wants_delivery: wantsDelivery,
      }),
    });
    setBusy(false);
    if (!res.ok) {
      setError(t("requestFailed"));
      return;
    }
    const j: unknown = await res.json();
    const id: string | undefined =
      typeof j === "object" &&
      j !== null &&
      "id" in j &&
      typeof (j as { id: unknown }).id === "string"
        ? (j as { id: string }).id
        : undefined;
    if (id) {
      router.push(`/${locale}/my-requests/${id}`);
      router.refresh();
    }
  }

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant="secondary"
        disabled={disabled || busy}
        onClick={() => void handleReorder()}
      >
        {busy ? t("submitting") : t("reorder")}
      </Button>
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
