"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { Heart } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useUser } from "@/hooks/use-user";
import { useSupabase } from "@/hooks/use-supabase";
import type { Item, ItemPhoto, Shop } from "@/types";

type FavoriteRow = {
  item_id: string;
  items: Item & { item_photos: ItemPhoto[]; shops: Shop };
};

export default function FavoritesPage(): React.ReactElement {
  const t = useTranslations("favorites");
  const tNav = useTranslations("nav");
  const locale: string = useLocale();
  const { user } = useUser();
  const supabase = useSupabase();
  const [rows, setRows] = useState<FavoriteRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const load = useCallback(async (): Promise<void> => {
    if (!user) {
      setRows([]);
      setLoading(false);
      return;
    }
    const { data } = await supabase
      .from("favorites")
      .select("item_id, items(*, item_photos(*), shops(*))")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setRows((data as FavoriteRow[] | null) ?? []);
    setLoading(false);
  }, [supabase, user]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <>
      <PageHeader title={tNav("favorites")} />
      <main className="flex flex-col gap-4 p-4">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i: number) => (
              <Skeleton key={i} className="h-20 w-full rounded-xl" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <EmptyState
            icon={<Heart className="h-12 w-12" />}
            title={t("empty")}
            description={t("emptyDescription")}
          />
        ) : (
          <div className="flex flex-col gap-3">
            {rows.map((r: FavoriteRow) => {
              const item: Item & { item_photos: ItemPhoto[]; shops: Shop } =
                r.items;
              const photos: ItemPhoto[] = [...(item.item_photos ?? [])].sort(
                (a: ItemPhoto, b: ItemPhoto) => a.sort_order - b.sort_order
              );
              const url: string | null = photos[0]?.url ?? null;
              return (
                <Link key={r.item_id} href={`/${locale}/item/${item.id}`}>
                  <Card className="transition-shadow hover:shadow-md">
                    <CardContent className="flex gap-3 p-3">
                      {url ? (
                        <img
                          src={url}
                          alt={item.name}
                          className="h-16 w-16 shrink-0 rounded-md object-cover"
                        />
                      ) : (
                        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-md bg-muted/40 text-2xl">
                          🍽️
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {item.shops?.name}
                        </p>
                        <p className="text-sm font-semibold text-primary">
                          ₪{item.base_price}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </>
  );
}
