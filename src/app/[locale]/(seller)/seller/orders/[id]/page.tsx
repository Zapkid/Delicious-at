import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/layout/page-header";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import { ChatPanel } from "@/features/chat/chat-panel";
import type { Order } from "@/types";

type OrderStatus = Order["status"];

interface OrderDetailPageProps {
  params: Promise<{ locale: string; id: string }>;
}

type OrderDetailData = Order & {
  items: { name: string; base_price: number };
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

const MESSAGE_TEMPLATES: readonly string[] = [
  "Thanks for your order!",
  "Ready for pickup.",
  "On the way.",
  "Please confirm payment when you can.",
] as const;

export default async function OrderDetailPage({
  params,
}: OrderDetailPageProps): Promise<React.ReactElement> {
  const { locale, id } = await params;
  const t = await getTranslations("seller.orders");
  const supabase = await createClient();

  const { data: order } = await supabase
    .from("orders")
    .select("*, items(name, base_price), profiles!consumer_id(full_name)")
    .eq("id", id)
    .single();

  if (!order) {
    return (
      <>
        <PageHeader title={t("detail")} showBack />
        <main className="p-4">
          <p className="text-muted-foreground">{t("orderNotFound")}</p>
        </main>
      </>
    );
  }

  const detail: OrderDetailData = order as unknown as OrderDetailData;

  return (
    <>
      <PageHeader title={t("detail")} showBack />
      <main className="flex flex-col gap-4 p-4">
        <Link
          href={`/${locale}/seller/orders/${id}/print`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-medium text-primary underline-offset-2 hover:underline"
        >
          {t("print")}
        </Link>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{detail.items?.name}</span>
              <Badge variant={STATUS_VARIANT[detail.status]}>
                {t(detail.status)}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("consumer")}</span>
              <span>{detail.profiles?.full_name ?? t("unknown")}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("price")}</span>
              <span>₪{detail.items?.base_price ?? 0}</span>
            </div>
            {detail.note && (
              <>
                <Separator />
                <div>
                  <span className="text-muted-foreground">{t("note")}</span>
                  <p className="mt-1">{detail.note}</p>
                </div>
              </>
            )}
            {detail.preferred_pickup_time && (
              <>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    {t("pickupTime")}
                  </span>
                  <span>
                    {new Date(detail.preferred_pickup_time).toLocaleString()}
                  </span>
                </div>
              </>
            )}
            {detail.wants_delivery && (
              <>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    {t("delivery")}
                  </span>
                  <Badge variant="secondary">{t("wantsDelivery")}</Badge>
                </div>
              </>
            )}
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("createdAt")}</span>
              <span>{new Date(detail.created_at).toLocaleDateString()}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("chat")}</CardTitle>
          </CardHeader>
          <CardContent>
            <ChatPanel
              orderId={id}
              messageTemplates={MESSAGE_TEMPLATES}
            />
          </CardContent>
        </Card>
      </main>
    </>
  );
}
