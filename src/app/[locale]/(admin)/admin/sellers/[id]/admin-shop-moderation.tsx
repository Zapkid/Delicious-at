"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface AdminShopModerationProps {
  shopId: string;
  suspendedAt: string | null;
  isFeatured: boolean;
}

export function AdminShopModeration({
  shopId,
  suspendedAt,
  isFeatured,
}: AdminShopModerationProps): React.ReactElement {
  const t = useTranslations("admin.sellers");
  const router = useRouter();
  const [busy, setBusy] = useState<boolean>(false);
  const suspended: boolean = suspendedAt !== null;

  async function patch(body: Record<string, unknown>): Promise<void> {
    setBusy(true);
    await fetch(`/api/admin/shops/${shopId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setBusy(false);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-border p-4">
      <div className="flex items-center justify-between gap-4">
        <Label htmlFor="featured-shop">{t("featured")}</Label>
        <Switch
          id="featured-shop"
          checked={isFeatured}
          disabled={busy}
          onCheckedChange={(v: boolean) =>
            void patch({ is_featured: v })
          }
        />
      </div>
      <Button
        type="button"
        variant={suspended ? "default" : "destructive"}
        disabled={busy}
        onClick={() =>
          void patch(
            suspended
              ? { suspended_at: null }
              : { suspended_at: new Date().toISOString() }
          )
        }
      >
        {suspended ? t("unsuspend") : t("suspend")}
      </Button>
    </div>
  );
}
