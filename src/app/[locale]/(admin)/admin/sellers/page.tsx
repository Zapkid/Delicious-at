"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { Store } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { Shop, Profile, Item } from "@/types";

type ShopWithSeller = Shop & {
  profiles: Pick<Profile, "full_name" | "email"> | null;
  items: Pick<Item, "id">[];
};

export default function AdminSellersPage(): React.ReactElement {
  const t = useTranslations("admin.sellers");
  const [shops, setShops] = useState<ShopWithSeller[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchShops = useCallback(async (): Promise<void> => {
    try {
      const res: Response = await fetch("/api/admin/shops");
      if (!res.ok) {
        setShops([]);
        return;
      }
      const json: { data?: ShopWithSeller[] } = await res.json();
      setShops(json.data ?? []);
    } catch {
      setShops([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchShops();
  }, [fetchShops]);

  return (
    <>
      <PageHeader title={t("title")} />
      <main className="flex flex-col gap-4 p-4">
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-32 w-full rounded-xl" />
            ))}
          </div>
        ) : shops.length === 0 ? (
          <EmptyState
            icon={<Store className="h-12 w-12" />}
            title={t("emptyState")}
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {shops.map(
              (shop: ShopWithSeller): React.ReactElement => (
                <Link
                  key={shop.id}
                  href={`/admin/sellers/${shop.id}`}
                  className="transition-opacity hover:opacity-80"
                >
                  <Card>
                    <CardHeader>
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-base">
                          {shop.name}
                        </CardTitle>
                        <Badge
                          variant={shop.is_active ? "default" : "secondary"}
                        >
                          {shop.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-1 text-sm text-muted-foreground">
                      <p>
                        {shop.profiles?.full_name ??
                          shop.profiles?.email ??
                          "—"}
                      </p>
                      <p>{shop.items.length} items</p>
                    </CardContent>
                  </Card>
                </Link>
              )
            )}
          </div>
        )}
      </main>
    </>
  );
}
