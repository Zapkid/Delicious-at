"use client";

import { useTranslations } from "next-intl";
import { useRealtimeOrder } from "@/hooks/use-realtime-order";
import { ChatPanel } from "@/features/chat/chat-panel";
import { OrderStatusTimeline } from "@/features/orders/order-status-timeline";
import { ReorderButton } from "@/features/orders/reorder-button";
import { OrderSupportSection } from "@/features/orders/order-support-section";
import type { Order } from "@/types";

export interface ReorderPayload {
  itemId: string;
  shopId: string;
  portionId: string | null;
  wantsDelivery: boolean;
}

interface BuyerOrderPanelProps {
  orderId: string;
  initialStatus: Order["status"];
  reorder: ReorderPayload | null;
  showSupport: boolean;
}

export function BuyerOrderPanel({
  orderId,
  initialStatus,
  reorder,
  showSupport,
}: BuyerOrderPanelProps): React.ReactElement {
  const t = useTranslations("order");
  const { order } = useRealtimeOrder(orderId);
  const status: Order["status"] = order?.status ?? initialStatus;

  return (
    <div className="flex flex-col gap-6">
      <OrderStatusTimeline status={status} />
      {reorder !== null && status === "delivered" ? (
        <ReorderButton
          itemId={reorder.itemId}
          shopId={reorder.shopId}
          portionId={reorder.portionId}
          wantsDelivery={reorder.wantsDelivery}
        />
      ) : null}
      {showSupport ? <OrderSupportSection orderId={orderId} /> : null}
      <section>
        <h2 className="mb-2 text-base font-semibold">{t("chat")}</h2>
        <div className="min-h-[200px] overflow-hidden rounded-lg border border-border">
          <ChatPanel orderId={orderId} />
        </div>
      </section>
    </div>
  );
}
