"use client";

import { useEffect, useState, useCallback } from "react";
import { Heart } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { useSupabase } from "@/hooks/use-supabase";
import { useUser } from "@/hooks/use-user";
import { cn } from "@/lib/utils";

interface ItemFavoriteButtonProps {
  itemId: string;
}

export function ItemFavoriteButton({
  itemId,
}: ItemFavoriteButtonProps): React.ReactElement {
  const t = useTranslations("item");
  const { user } = useUser();
  const supabase = useSupabase();
  const [active, setActive] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  const refresh = useCallback(async (): Promise<void> => {
    if (!user) {
      setActive(false);
      setLoading(false);
      return;
    }
    const { data } = await supabase
      .from("favorites")
      .select("item_id")
      .eq("user_id", user.id)
      .eq("item_id", itemId)
      .maybeSingle();
    setActive(!!data);
    setLoading(false);
  }, [supabase, user, itemId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function toggle(): Promise<void> {
    if (!user) return;
    if (active) {
      await supabase
        .from("favorites")
        .delete()
        .eq("user_id", user.id)
        .eq("item_id", itemId);
      setActive(false);
    } else {
      await supabase
        .from("favorites")
        .insert({ user_id: user.id, item_id: itemId } as never);
      setActive(true);
    }
  }

  if (!user) {
    return (
      <Button variant="outline" size="icon" disabled aria-label={t("favorite")}>
        <Heart className="h-4 w-4" />
      </Button>
    );
  }

  return (
    <Button
      variant="outline"
      size="icon"
      aria-label={t("favorite")}
      disabled={loading}
      onClick={() => void toggle()}
    >
      <Heart
        className={cn("h-4 w-4", active && "fill-primary text-primary")}
      />
    </Button>
  );
}
