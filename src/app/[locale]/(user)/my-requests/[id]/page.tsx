import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { OrderFeedbackForm } from "@/features/orders/order-feedback-form";
import { BuyerOrderPanel } from "@/features/orders/buyer-order-panel";
import type { Item, ItemPhoto, Order, Rating, Shop } from "@/types";

interface RequestDetailPageProps {
  params: Promise<{ locale: string; id: string }>;
}

interface OrderDetailRow extends Order {
  items: Item & { item_photos: ItemPhoto[] };
  shops: Shop;
}

export default async function RequestDetailPage({
  params,
}: RequestDetailPageProps): Promise<React.ReactElement> {
  const { locale, id } = await params;
  const t = await getTranslations("order");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    notFound();
  }

  const { data: row } = await supabase
    .from("orders")
    .select("*, items(*, item_photos(*)), shops(*)")
    .eq("id", id)
    .eq("consumer_id", user.id)
    .maybeSingle();

  if (!row) {
    notFound();
  }

  const order: OrderDetailRow = row as unknown as OrderDetailRow;
  const photos: ItemPhoto[] = [...(order.items.item_photos ?? [])].sort(
    (a: ItemPhoto, b: ItemPhoto) => a.sort_order - b.sort_order
  );
  const photoUrl: string | null = photos[0]?.url ?? null;

  const { data: ratingData } = await supabase
    .from("ratings")
    .select("id, app_stars, stars, item_stars, comment, feedback_tags")
    .eq("order_id", id)
    .eq("from_user_id", user.id)
    .maybeSingle();

  const ratingRow: Pick<
    Rating,
    | "id"
    | "app_stars"
    | "stars"
    | "item_stars"
    | "comment"
    | "feedback_tags"
  > | null = ratingData as Pick<
    Rating,
    | "id"
    | "app_stars"
    | "stars"
    | "item_stars"
    | "comment"
    | "feedback_tags"
  > | null;

  const hasRating: boolean = Boolean(ratingRow);
  const showFeedback: boolean = order.status === "delivered" && !hasRating;

  return (
    <>
      <PageHeader title={t("detailTitle")} showBack />
      <main className="flex flex-1 flex-col gap-6 p-4">
        <Card>
          <CardContent className="flex flex-col gap-3 p-4">
            <div className="flex gap-3">
              {photoUrl ? (
                <img
                  src={photoUrl}
                  alt={order.items.name}
                  className="h-20 w-20 shrink-0 rounded-md object-cover"
                />
              ) : (
                <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-md bg-muted/40 text-2xl">
                  🍽️
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="font-medium">{order.items.name}</p>
                <Link
                  href={`/${locale}/shop/${order.shops.id}`}
                  className="text-sm text-muted-foreground underline-offset-2 hover:underline"
                >
                  {t("forShop")}: {order.shops.name}
                </Link>
                <div className="mt-2">
                  <Badge variant="secondary" data-testid="order-status">
                    {t(`status.${order.status}`)}
                  </Badge>
                </div>
              </div>
            </div>
            {order.note && (
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">{t("note")}:</span>{" "}
                {order.note}
              </p>
            )}
          </CardContent>
        </Card>

        {hasRating && ratingRow && (
          <div
            className="rounded-lg border border-border bg-muted/20 p-4 text-sm"
            data-testid="feedback-submitted"
          >
            <p className="font-medium">{t("thanksFeedback")}</p>
            <p className="mt-2 text-muted-foreground">
              {t("feedback.app")}: {ratingRow.app_stars}/5 · {t("feedback.seller")}:{" "}
              {ratingRow.stars}/5 · {t("feedback.item")}: {ratingRow.item_stars}/5
            </p>
            {ratingRow.comment && (
              <p className="mt-2 text-muted-foreground">{ratingRow.comment}</p>
            )}
            {ratingRow.feedback_tags && ratingRow.feedback_tags.length > 0 && (
              <p className="mt-2 text-xs text-muted-foreground">
                {ratingRow.feedback_tags.join(" · ")}
              </p>
            )}
          </div>
        )}

        {showFeedback && <OrderFeedbackForm orderId={id} />}

        <Separator />
        <BuyerOrderPanel
          orderId={id}
          initialStatus={order.status}
          reorder={{
            itemId: order.item_id,
            shopId: order.shop_id,
            portionId: order.portion_id,
            wantsDelivery: order.wants_delivery,
          }}
          showSupport={
            order.status !== "rejected" && order.status !== "cancelled"
          }
        />
      </main>
    </>
  );
}
