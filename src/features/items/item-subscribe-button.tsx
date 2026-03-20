"use client";

import { Bell } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { useItemSubscription } from "@/hooks/use-item-subscription";
import { useUser } from "@/hooks/use-user";
import { cn } from "@/lib/utils";

interface ItemSubscribeButtonProps {
  itemId: string;
}

export function ItemSubscribeButton({
  itemId,
}: ItemSubscribeButtonProps): React.ReactElement {
  const t = useTranslations("item");
  const { user } = useUser();
  const { isSubscribed, toggle, isLoading } = useItemSubscription(itemId);

  if (!user) {
    return (
      <Button variant="outline" size="icon" disabled aria-label={t("subscribe")}>
        <Bell className="h-4 w-4" />
      </Button>
    );
  }

  return (
    <Button
      variant="outline"
      size="icon"
      aria-label={isSubscribed ? t("unsubscribe") : t("subscribe")}
      disabled={isLoading}
      onClick={() => void toggle()}
    >
      <Bell
        className={cn("h-4 w-4", isSubscribed && "fill-primary text-primary")}
      />
    </Button>
  );
}
