"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import { ShoppingBag } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import { useUser } from "@/hooks/use-user";
import { useSupabase } from "@/hooks/use-supabase";
import type { Order } from "@/types";

type OrderStatus = Order["status"];

type SellerOrderRow = Order & {
  items: { name: string; item_photos: { url: string }[] };
  profiles: { full_name: string | null };
};

const STATUS_VARIANT: Record<
  OrderStatus,
  "default" | "secondary" | "destructive" | "outline"
> = {
  requested: "outline",
  accepted: "secondary",
  paid: "default",
  delivered: "default",
  rejected: "destructive",
  cancelled: "destructive",
};

const TAB_STATUSES: Record<string, OrderStatus[]> = {
  all: [],
  pending: ["requested"],
  active: ["accepted", "paid"],
  completed: ["delivered", "rejected", "cancelled"],
};

export default function SellerOrdersPage(): React.ReactElement {
  const t = useTranslations("seller.orders");
  const locale: string = useLocale();
  const { user } = useUser();
  const supabase = useSupabase();

  const [loading, setLoading] = useState<boolean>(true);
  const [orders, setOrders] = useState<SellerOrderRow[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const fetchOrders = useCallback(async (): Promise<void> => {
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
        .from("orders")
        .select(
          "*, items(name, item_photos(url)), profiles!consumer_id(full_name)"
        )
        .eq("shop_id", shop.id)
        .order("created_at", { ascending: false });

      setOrders((data ?? []) as unknown as SellerOrderRow[]);
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [user, supabase]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  async function updateStatus(
    orderId: string,
    status: OrderStatus
  ): Promise<void> {
    await supabase
      .from("orders")
      .update({ status } as never)
      .eq("id", orderId);

    setOrders((prev) =>
      prev.map((o: SellerOrderRow) =>
        o.id === orderId ? { ...o, status } : o
      )
    );
  }

  function toggleSelected(orderId: string): void {
    setSelected((prev: Set<string>) => {
      const next: Set<string> = new Set(prev);
      if (next.has(orderId)) next.delete(orderId);
      else next.add(orderId);
      return next;
    });
  }

  async function bulkMarkPaid(): Promise<void> {
    const ids: string[] = [...selected].filter((oid: string) => {
      const o: SellerOrderRow | undefined = orders.find(
        (x: SellerOrderRow) => x.id === oid
      );
      return o?.status === "accepted";
    });
    for (const oid of ids) {
      await updateStatus(oid, "paid");
    }
    setSelected(new Set());
  }

  function filterOrders(tab: string): SellerOrderRow[] {
    const statuses: OrderStatus[] = TAB_STATUSES[tab];
    if (!statuses || statuses.length === 0) return orders;
    return orders.filter((o: SellerOrderRow) => statuses.includes(o.status));
  }

  function renderOrderList(filtered: SellerOrderRow[]): React.ReactElement {
    if (filtered.length === 0) {
      return (
        <EmptyState
          icon={<ShoppingBag className="h-12 w-12" />}
          title={t("emptyState")}
        />
      );
    }

    return (
      <div className="flex flex-col gap-3">
        {filtered.map((order: SellerOrderRow) => (
          <Card key={order.id}>
            <CardContent className="flex flex-col gap-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex min-w-0 flex-1 items-start gap-2">
                  <Checkbox
                    checked={selected.has(order.id)}
                    onCheckedChange={() => toggleSelected(order.id)}
                    aria-label="Select order"
                  />
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/${locale}/seller/orders/${order.id}`}
                      className="font-medium hover:underline"
                    >
                      {order.items?.name}
                    </Link>
                    <p className="text-sm text-muted-foreground">
                      {order.profiles?.full_name ?? t("unknown")}
                    </p>
                  </div>
                </div>
                <Badge variant={STATUS_VARIANT[order.status]}>
                  {t(order.status)}
                </Badge>
              </div>
              <div className="text-xs text-muted-foreground">
                {new Date(order.created_at).toLocaleDateString()}
              </div>
              {order.status === "requested" && (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => updateStatus(order.id, "accepted")}
                  >
                    {t("accept")}
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => updateStatus(order.id, "rejected")}
                  >
                    {t("reject")}
                  </Button>
                </div>
              )}
              {order.status === "accepted" && (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => updateStatus(order.id, "paid")}
                  data-testid="mark-paid"
                >
                  {t("markPaid")}
                </Button>
              )}
              {order.status === "paid" && (
                <Button
                  size="sm"
                  onClick={() => updateStatus(order.id, "delivered")}
                  data-testid="mark-delivered"
                >
                  {t("markDelivered")}
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <>
      <PageHeader title={t("title")} />
      <main className="flex flex-col gap-4 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            disabled={selected.size === 0}
            onClick={() => void bulkMarkPaid()}
          >
            {t("bulkMarkPaid")}
          </Button>
        </div>
        {loading ? (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="space-y-2">
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-4 w-24" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Tabs defaultValue="all">
            <TabsList className="w-full">
              {Object.keys(TAB_STATUSES).map((tab: string) => (
                <TabsTrigger key={tab} value={tab}>
                  {t(tab)}
                </TabsTrigger>
              ))}
            </TabsList>
            {Object.keys(TAB_STATUSES).map((tab: string) => (
              <TabsContent key={tab} value={tab}>
                {renderOrderList(filterOrders(tab))}
              </TabsContent>
            ))}
          </Tabs>
        )}
      </main>
    </>
  );
}
