"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

interface ShopToggleProps {
  shopId: string;
  isActive: boolean;
}

export function ShopToggle({
  shopId,
  isActive,
}: ShopToggleProps): React.ReactElement {
  const t = useTranslations("admin.sellers");
  const router = useRouter();
  const [submitting, setSubmitting] = useState<boolean>(false);

  async function handleToggle(): Promise<void> {
    setSubmitting(true);
    await fetch(`/api/admin/shops/${shopId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: !isActive }),
    });
    setSubmitting(false);
    router.refresh();
  }

  return (
    <Button
      variant={isActive ? "destructive" : "default"}
      onClick={() => void handleToggle()}
      disabled={submitting}
    >
      {isActive ? t("deactivate") : t("activate")}
    </Button>
  );
}
