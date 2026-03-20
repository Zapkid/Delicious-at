"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { Search, Store } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { useSupabase } from "@/hooks/use-supabase";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { Shop, ItemPhoto } from "@/types";

interface ShopWithItemPreview extends Shop {
  items: {
    id: string;
    name: string;
    base_price: number;
    is_available_now: boolean;
    is_vegan: boolean;
    allergens: string[];
    item_photos: ItemPhoto[];
  }[];
}

function ShopCardSkeleton(): React.ReactElement {
  return (
    <Card className="gap-0 py-0 overflow-hidden">
      <Skeleton className="h-32 w-full rounded-none" />
      <CardContent className="space-y-2 p-3">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <div className="flex gap-1.5">
          <Skeleton className="h-5 w-14 rounded-full" />
          <Skeleton className="h-5 w-14 rounded-full" />
        </div>
      </CardContent>
    </Card>
  );
}

export default function ExplorePage(): React.ReactElement {
  const t = useTranslations("explore");
  const locale: string = useLocale();
  const supabase = useSupabase();
  const [shops, setShops] = useState<ShopWithItemPreview[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [query, setQuery] = useState<string>("");
  const [veganOnly, setVeganOnly] = useState<boolean>(false);
  const [maxPrice, setMaxPrice] = useState<string>("");

  useEffect(() => {
    async function fetchShops(): Promise<void> {
      const { data } = await supabase
        .from("shops")
        .select(
          "*, is_featured, items(id, name, base_price, is_available_now, is_vegan, allergens, item_photos(url, sort_order))"
        )
        .eq("is_active", true);

      setShops((data as ShopWithItemPreview[]) ?? []);
      setIsLoading(false);
    }

    fetchShops();
  }, [supabase]);

  const filtered: ShopWithItemPreview[] = useMemo(() => {
    const q: string = query.trim().toLowerCase();
    const max: number | null = maxPrice ? Number(maxPrice) : null;
    const maxOk: boolean = max === null || !Number.isNaN(max);

    let list: ShopWithItemPreview[] = shops.filter((s: ShopWithItemPreview) => {
      const matchesText: boolean =
        !q ||
        s.name.toLowerCase().includes(q) ||
        Boolean(s.tagline?.toLowerCase().includes(q)) ||
        s.items.some((i) => i.name.toLowerCase().includes(q));
      if (!matchesText) return false;

      if (veganOnly && !s.items.some((i) => i.is_vegan)) return false;

      if (maxOk && max !== null) {
        const anyInRange: boolean = s.items.some(
          (i) => i.base_price <= max
        );
        if (!anyInRange) return false;
      }

      return true;
    });

    list = [...list].sort(
      (a: ShopWithItemPreview, b: ShopWithItemPreview) =>
        Number(Boolean(b.is_featured)) - Number(Boolean(a.is_featured))
    );
    return list;
  }, [shops, query, veganOnly, maxPrice]);

  return (
    <>
      <PageHeader title={t("title")} />
      <main className="flex flex-1 flex-col gap-4 p-4">
        <div className="relative">
          <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder={t("searchPlaceholder")}
            value={query}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
            className="ps-10"
          />
        </div>

        <div className="flex flex-col gap-3 rounded-lg border border-border p-3">
          <p className="text-sm font-medium">{t("filters")}</p>
          <div className="flex items-center justify-between gap-2">
            <Label htmlFor="vegan-only">{t("vegan")}</Label>
            <Switch
              id="vegan-only"
              checked={veganOnly}
              onCheckedChange={setVeganOnly}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="max-p">{t("priceRange")}</Label>
            <Input
              id="max-p"
              type="number"
              min={0}
              step={1}
              placeholder="Max ₪"
              value={maxPrice}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setMaxPrice(e.target.value)
              }
            />
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i: number) => (
              <ShopCardSkeleton key={i} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<Store className="h-12 w-12" />}
            title={t("emptyState")}
            description={t("emptyStateDescription")}
          />
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {filtered.map((shop: ShopWithItemPreview) => {
              const coverUrl: string | null = shop.cover_photo_url;
              const itemCount: number = shop.items.length;

              return (
                <Link key={shop.id} href={`/${locale}/shop/${shop.id}`}>
                  <Card className="gap-0 py-0 overflow-hidden transition-shadow hover:shadow-md">
                    {coverUrl ? (
                      <img
                        src={coverUrl}
                        alt={shop.name}
                        className="h-32 w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-32 items-center justify-center bg-muted/40 text-4xl">
                        🏪
                      </div>
                    )}
                    <CardContent className="space-y-1.5 p-3">
                      <p className="truncate text-sm font-semibold">{shop.name}</p>
                      {shop.tagline && (
                        <p className="truncate text-xs text-muted-foreground">
                          {shop.tagline}
                        </p>
                      )}
                      <div className="flex flex-wrap items-center gap-1.5">
                        <Badge variant="secondary" className="text-[10px]">
                          {t("pickup")}
                        </Badge>
                        {shop.supports_delivery && (
                          <Badge variant="outline" className="text-[10px]">
                            {t("delivery")}
                          </Badge>
                        )}
                        <span className="ms-auto text-xs text-muted-foreground">
                          {itemCount} {itemCount === 1 ? "item" : "items"}
                        </span>
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
