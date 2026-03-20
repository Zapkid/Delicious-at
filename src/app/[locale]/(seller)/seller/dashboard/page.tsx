"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import { Package, ShoppingBag, DollarSign, Store, Ticket } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useUser } from "@/hooks/use-user";
import { useSupabase } from "@/hooks/use-supabase";

export default function SellerDashboardPage(): React.ReactElement {
  const t = useTranslations("seller.dashboard");
  const locale: string = useLocale();
  const { user } = useUser();
  const supabase = useSupabase();

  const [loading, setLoading] = useState<boolean>(true);
  const [activeItems, setActiveItems] = useState<number>(0);
  const [pendingOrders, setPendingOrders] = useState<number>(0);
  const [monthlyEarnings, setMonthlyEarnings] = useState<number>(0);
  const [conversionText, setConversionText] = useState<string>("—");
  const [topSnippet, setTopSnippet] = useState<string>("—");
  const [onboarding, setOnboarding] = useState<{
    shopOk: boolean;
    pmOk: boolean;
    itemOk: boolean;
    availOk: boolean;
  }>({
    shopOk: false,
    pmOk: false,
    itemOk: false,
    availOk: false,
  });

  const fetchDashboard = useCallback(async (): Promise<void> => {
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

      const now: Date = new Date();
      const startOfMonth: string = new Date(
        now.getFullYear(),
        now.getMonth(),
        1
      ).toISOString();
      const start30: string = new Date(
        Date.now() - 30 * 24 * 60 * 60 * 1000
      ).toISOString();

      const [itemsRes, ordersRes, earningsRes] = await Promise.all([
        supabase
          .from("items")
          .select("id", { count: "exact", head: true })
          .eq("shop_id", shop.id)
          .eq("is_available_now", true),
        supabase
          .from("orders")
          .select("id", { count: "exact", head: true })
          .eq("shop_id", shop.id)
          .eq("status", "requested"),
        supabase
          .from("orders")
          .select("items(base_price)")
          .eq("shop_id", shop.id)
          .eq("status", "delivered")
          .gte("created_at", startOfMonth),
      ]);

      setActiveItems(itemsRes.count ?? 0);
      setPendingOrders(ordersRes.count ?? 0);

      type EarningsRow = { items: { base_price: number } | null };
      const total: number = (
        (earningsRes.data ?? []) as EarningsRow[]
      ).reduce(
        (sum: number, row: EarningsRow) => sum + (row.items?.base_price ?? 0),
        0
      );
      setMonthlyEarnings(total);

      const [{ count: req30 }, { count: del30 }] = await Promise.all([
        supabase
          .from("orders")
          .select("id", { count: "exact", head: true })
          .eq("shop_id", shop.id)
          .eq("status", "requested")
          .gte("created_at", start30),
        supabase
          .from("orders")
          .select("id", { count: "exact", head: true })
          .eq("shop_id", shop.id)
          .eq("status", "delivered")
          .gte("created_at", start30),
      ]);
      const r30: number = req30 ?? 0;
      const d30: number = del30 ?? 0;
      setConversionText(
        r30 + d30 > 0
          ? `${Math.round((d30 / (r30 + d30)) * 100)}%`
          : "—"
      );

      const { data: delRows } = await supabase
        .from("orders")
        .select("item_id, items(name)")
        .eq("shop_id", shop.id)
        .eq("status", "delivered")
        .gte("created_at", start30);

      type DelRow = { item_id: string; items: { name: string } | null };
      const counts: Map<string, { name: string; n: number }> = new Map();
      for (const row of (delRows ?? []) as DelRow[]) {
        const name: string = row.items?.name ?? "Item";
        const cur: { name: string; n: number } | undefined = counts.get(
          row.item_id
        );
        counts.set(row.item_id, {
          name,
          n: (cur?.n ?? 0) + 1,
        });
      }
      const top: [string, { name: string; n: number }][] = [...counts].sort(
        (a, b) => b[1].n - a[1].n
      );
      setTopSnippet(
        top
          .slice(0, 3)
          .map(([, v]) => `${v.name}: ${v.n}`)
          .join(" · ") || "—"
      );

      const { data: shopFull } = await supabase
        .from("shops")
        .select("name, cover_photo_url")
        .eq("id", shop.id)
        .single();
      const { data: pmRows } = await supabase
        .from("seller_payment_methods")
        .select("id")
        .eq("shop_id", shop.id);
      const { count: itemTotal } = await supabase
        .from("items")
        .select("id", { count: "exact", head: true })
        .eq("shop_id", shop.id);
      const { data: itemIdRows } = await supabase
        .from("items")
        .select("id")
        .eq("shop_id", shop.id);
      const idList: string[] =
        (itemIdRows ?? []).map((x: { id: string }) => x.id) ?? [];
      let avCount: number = 0;
      if (idList.length > 0) {
        const { count } = await supabase
          .from("item_availability")
          .select("id", { count: "exact", head: true })
          .in("item_id", idList);
        avCount = count ?? 0;
      }

      const sf: { name: string; cover_photo_url: string | null } | null =
        shopFull as {
          name: string;
          cover_photo_url: string | null;
        } | null;

      setOnboarding({
        shopOk: Boolean(sf?.name?.trim() && sf?.cover_photo_url),
        pmOk: (pmRows?.length ?? 0) > 0,
        itemOk: (itemTotal ?? 0) > 0,
        availOk: (itemsRes.count ?? 0) > 0 || avCount > 0,
      });
    } catch {
      // No shop data available
    } finally {
      setLoading(false);
    }
  }, [user, supabase]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const cards: { label: string; value: string; icon: React.ReactNode }[] = [
    {
      label: t("activeItems"),
      value: String(activeItems),
      icon: <Package className="h-5 w-5" />,
    },
    {
      label: t("pendingOrders"),
      value: String(pendingOrders),
      icon: <ShoppingBag className="h-5 w-5" />,
    },
    {
      label: t("monthlyEarnings"),
      value: `₪${monthlyEarnings.toFixed(0)}`,
      icon: <DollarSign className="h-5 w-5" />,
    },
  ];

  return (
    <>
      <PageHeader title={t("title")} />
      <main className="flex flex-col gap-4 p-4">
        <div className="grid gap-4 sm:grid-cols-3">
          {cards.map((card) => (
            <Card key={card.label}>
              <CardContent>
                {loading ? (
                  <>
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="mt-3 h-8 w-16" />
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      {card.icon}
                      <span className="text-sm">{card.label}</span>
                    </div>
                    <p className="mt-2 text-2xl font-semibold">{card.value}</p>
                  </>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {!loading && (
          <div className="grid gap-3 sm:grid-cols-2">
            <Card>
              <CardContent className="p-4 text-sm">
                <p className="font-medium">{t("conversion")}</p>
                <p className="mt-2 text-2xl font-semibold">{conversionText}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-sm">
                <p className="font-medium">{t("topItems")}</p>
                <p className="mt-2 text-muted-foreground">{topSnippet}</p>
              </CardContent>
            </Card>
          </div>
        )}

        {!loading && (
          <Card>
            <CardContent className="space-y-2 p-4 text-sm">
              <p className="font-medium">{t("onboarding")}</p>
              <ul className="list-inside list-disc text-muted-foreground">
                <li className={onboarding.shopOk ? "text-foreground" : ""}>
                  {t("onboardingShop")}
                </li>
                <li className={onboarding.pmOk ? "text-foreground" : ""}>
                  {t("onboardingPayment")}
                </li>
                <li className={onboarding.itemOk ? "text-foreground" : ""}>
                  {t("onboardingItem")}
                </li>
                <li className={onboarding.availOk ? "text-foreground" : ""}>
                  {t("onboardingAvailability")}
                </li>
              </ul>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Link
            href={`/${locale}/seller/shop`}
            className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-4 text-sm font-medium shadow-sm transition-colors hover:bg-muted/40"
          >
            <Store className="h-5 w-5 text-primary" />
            {t("editShop")}
          </Link>
          <Link
            href={`/${locale}/seller/items`}
            className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-4 text-sm font-medium shadow-sm transition-colors hover:bg-muted/40"
          >
            <Package className="h-5 w-5 text-primary" />
            {t("manageItems")}
          </Link>
          <Link
            href={`/${locale}/seller/coupons`}
            className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-4 text-sm font-medium shadow-sm transition-colors hover:bg-muted/40"
          >
            <Ticket className="h-5 w-5 text-primary" />
            {t("couponsCta")}
          </Link>
        </div>
      </main>
    </>
  );
}
