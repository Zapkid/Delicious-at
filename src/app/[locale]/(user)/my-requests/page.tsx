"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { ClipboardList } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { useUser } from "@/hooks/use-user";
import { useSupabase } from "@/hooks/use-supabase";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { Order, Item, Shop, ItemPhoto } from "@/types";

interface OrderRow extends Order {
  items: Pick<Item, "name"> & { item_photos: Pick<ItemPhoto, "url">[] };
  shops: Pick<Shop, "name">;
}

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  requested: "outline",
  accepted: "default",
  rejected: "destructive",
  paid: "secondary",
  delivered: "secondary",
  cancelled: "destructive",
};

function OrderSkeleton(): React.ReactElement {
  return (
    <Card className="flex-row items-center gap-0 py-0 overflow-hidden">
      <Skeleton className="h-16 w-16 shrink-0 rounded-none" />
      <CardContent className="flex flex-1 flex-col gap-1.5 p-3">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-20" />
      </CardContent>
    </Card>
  );
}

export default function MyRequestsPage(): React.ReactElement {
  const t = useTranslations("order");
  const locale: string = useLocale();
  const supabase = useSupabase();
  const { user } = useUser();
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    async function fetchOrders(): Promise<void> {
      const { data } = await supabase
        .from("orders")
        .select("*, items(name, item_photos(url)), shops(name)")
        .eq("consumer_id", user!.id)
        .order("created_at", { ascending: false });

      setOrders((data as unknown as OrderRow[]) ?? []);
      setIsLoading(false);
    }

    fetchOrders();
  }, [supabase, user]);

  return (
    <>
      <PageHeader title={t("title")} />
      <main className="flex flex-1 flex-col p-4">
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i: number) => (
              <OrderSkeleton key={i} />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <EmptyState
            icon={<ClipboardList className="h-12 w-12" />}
            title={t("emptyState")}
            description={t("emptyStateDescription")}
            action={
              <Link href={`/${locale}/explore`}>
                <Button>{t("newRequest")}</Button>
              </Link>
            }
          />
        ) : (
          <div className="space-y-2">
            {orders.map((order: OrderRow) => {
              const photoUrl: string | undefined = order.items.item_photos?.[0]?.url;
              const date: string = new Date(order.created_at).toLocaleDateString(locale, {
                month: "short",
                day: "numeric",
              });

              return (
                <Link key={order.id} href={`/${locale}/my-requests/${order.id}`}>
                  <Card className="flex-row items-center gap-0 py-0 overflow-hidden transition-shadow hover:shadow-md">
                    {photoUrl ? (
                      <img
                        src={photoUrl}
                        alt={order.items.name}
                        className="h-16 w-16 shrink-0 object-cover"
                      />
                    ) : (
                      <div className="flex h-16 w-16 shrink-0 items-center justify-center bg-muted/40 text-xl">
                        🍽️
                      </div>
                    )}
                    <CardContent className="flex flex-1 items-center justify-between gap-2 p-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{order.items.name}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {order.shops.name} · {date}
                        </p>
                      </div>
                      <Badge variant={STATUS_VARIANT[order.status] ?? "outline"}>
                        {t(`status.${order.status}`)}
                      </Badge>
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
