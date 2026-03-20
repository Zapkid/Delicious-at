import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getManagerSession } from "@/lib/admin/manager-session";
import { createAdminClient } from "@/lib/supabase/admin";
import { PageHeader } from "@/components/layout/page-header";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { Shop, Profile, Item, Order } from "@/types";
import { ShopToggle } from "./shop-toggle";
import { AdminShopModeration } from "./admin-shop-moderation";

type ShopDetail = Shop & {
  profiles: Pick<Profile, "full_name" | "email"> | null;
  items: Pick<Item, "id" | "name" | "base_price" | "is_available_now">[];
  orders: Pick<Order, "id" | "status">[];
};

interface SellerDetailPageProps {
  params: Promise<{ locale: string; id: string }>;
}

export default async function SellerDetailPage({
  params,
}: SellerDetailPageProps): Promise<React.ReactElement> {
  const { id } = await params;
  const t = await getTranslations("admin.sellers");
  const manager = await getManagerSession();
  if (!manager) {
    notFound();
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("shops")
    .select(
      "*, profiles(full_name, email), items(id, name, base_price, is_available_now), orders(id, status)"
    )
    .eq("id", id)
    .maybeSingle();

  if (error || !data) {
    return (
      <>
        <PageHeader title={t("detail")} showBack />
        <main className="p-4">
          <p className="text-muted-foreground">Shop not found.</p>
        </main>
      </>
    );
  }

  const shop: ShopDetail = data as unknown as ShopDetail;

  const completedOrders: number = shop.orders.filter(
    (o) => o.status === "delivered" || o.status === "paid"
  ).length;

  return (
    <>
      <PageHeader title={t("detail")} showBack />
      <main className="flex flex-col gap-6 p-4">
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-2">
              <CardTitle>{shop.name}</CardTitle>
              <div className="flex flex-wrap gap-1">
                <Badge variant={shop.is_active ? "default" : "secondary"}>
                  {shop.is_active ? "Active" : "Inactive"}
                </Badge>
                {shop.suspended_at ? (
                  <Badge variant="destructive">Suspended</Badge>
                ) : null}
                {shop.is_featured ? (
                  <Badge variant="outline">Featured</Badge>
                ) : null}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <InfoRow
                label="Seller"
                value={shop.profiles?.full_name ?? shop.profiles?.email ?? "—"}
              />
              <InfoRow label="Address" value={shop.address ?? "—"} />
              <InfoRow label="Items" value={String(shop.items.length)} />
              <InfoRow label="Total Orders" value={String(shop.orders.length)} />
              <InfoRow label="Completed" value={String(completedOrders)} />
              <InfoRow
                label="Delivery"
                value={
                  shop.supports_delivery
                    ? `₪${shop.delivery_fee} · ~${shop.delivery_est_minutes ?? "?"}min`
                    : "Pickup only"
                }
              />
            </div>
          </CardContent>
        </Card>

        {shop.items.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Items</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="divide-y divide-border">
                {shop.items.map(
                  (
                    item: Pick<
                      Item,
                      "id" | "name" | "base_price" | "is_available_now"
                    >
                  ): React.ReactElement => (
                    <li
                      key={item.id}
                      className="flex items-center justify-between py-2.5 text-sm"
                    >
                      <span>{item.name}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-muted-foreground">
                          ₪{item.base_price}
                        </span>
                        <Badge
                          variant={
                            item.is_available_now ? "default" : "outline"
                          }
                        >
                          {item.is_available_now ? "Available" : "Unavailable"}
                        </Badge>
                      </div>
                    </li>
                  )
                )}
              </ul>
            </CardContent>
          </Card>
        )}

        <Separator />

        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <ShopToggle shopId={shop.id} isActive={shop.is_active} />
        </div>

        <AdminShopModeration
          shopId={shop.id}
          suspendedAt={shop.suspended_at}
          isFeatured={shop.is_featured}
        />
      </main>
    </>
  );
}

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string;
}): React.ReactElement {
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="text-sm">{value}</p>
    </div>
  );
}
