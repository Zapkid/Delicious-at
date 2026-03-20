"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useTranslations, useLocale } from "next-intl";
import { Plus, Package } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useUser } from "@/hooks/use-user";
import { useSupabase } from "@/hooks/use-supabase";
import type { ItemWithPhotos } from "@/types";

export default function SellerItemsPage(): React.ReactElement {
  const t = useTranslations("seller.items");
  const locale: string = useLocale();
  const { user } = useUser();
  const supabase = useSupabase();

  const [loading, setLoading] = useState<boolean>(true);
  const [items, setItems] = useState<ItemWithPhotos[]>([]);

  const fetchItems = useCallback(async (): Promise<void> => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data: shopRow } = await supabase
        .from("shops")
        .select("id")
        .eq("seller_id", user.id)
        .single();
      const shop = shopRow as { id: string } | null;
      if (!shop) {
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from("items")
        .select("*, item_photos(*), item_portions(*)")
        .eq("shop_id", shop.id)
        .order("sort_order");

      setItems((data ?? []) as unknown as ItemWithPhotos[]);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [user, supabase]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  async function toggleAvailability(
    itemId: string,
    current: boolean
  ): Promise<void> {
    await supabase
      .from("items")
      .update({ is_available_now: !current } as never)
      .eq("id", itemId);

    setItems((prev) =>
      prev.map((item) =>
        item.id === itemId
          ? { ...item, is_available_now: !current }
          : item
      )
    );
  }

  return (
    <>
      <PageHeader
        title={t("title")}
        actions={
          <Button asChild size="sm">
            <Link href={`/${locale}/seller/items/new`}>
              <Plus className="h-4 w-4" />
              {t("addItem")}
            </Link>
          </Button>
        }
      />
      <main className="flex flex-col gap-4 p-4">
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="flex gap-4">
                  <Skeleton className="h-20 w-20 shrink-0 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            icon={<Package className="h-12 w-12" />}
            title={t("emptyState")}
            description={t("emptyStateDescription")}
            action={
              <Button asChild>
                <Link href={`/${locale}/seller/items/new`}>
                  <Plus className="h-4 w-4" />
                  {t("addItem")}
                </Link>
              </Button>
            }
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {items.map((item) => {
              const photo: string | undefined = item.item_photos?.[0]?.url;
              return (
                <Card key={item.id}>
                  <CardContent className="flex gap-4">
                    {photo ? (
                      <Image
                        src={photo}
                        alt={item.name}
                        width={80}
                        height={80}
                        className="h-20 w-20 shrink-0 rounded-lg object-cover"
                        unoptimized
                      />
                    ) : (
                      <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-lg bg-muted">
                        <Package className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex flex-1 flex-col gap-1">
                      <Link
                        href={`/${locale}/seller/items/${item.id}`}
                        className="font-medium hover:underline"
                      >
                        {item.name}
                      </Link>
                      <span className="text-sm text-muted-foreground">
                        ₪{item.base_price}
                      </span>
                      <div className="mt-auto flex items-center justify-between">
                        <Badge
                          variant={
                            item.is_available_now ? "default" : "secondary"
                          }
                        >
                          {item.is_available_now
                            ? t("available")
                            : t("unavailable")}
                        </Badge>
                        <Switch
                          checked={item.is_available_now}
                          onCheckedChange={() =>
                            toggleAvailability(item.id, item.is_available_now)
                          }
                          size="sm"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </>
  );
}
