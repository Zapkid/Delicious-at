import { createAdminClient } from "@/lib/supabase/admin";
import { COMMISSION_RATE } from "@/lib/constants";

function monthStartUtc(d: Date): string {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1))
    .toISOString()
    .slice(0, 10);
}

/** Aggregates delivered orders for the previous calendar month into `seller_monthly_fees`. */
export async function runMonthlyFeeAggregationForPreviousMonth(): Promise<{
  shopsUpdated: number;
  month: string;
}> {
  const now: Date = new Date();
  const prev: Date = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 15)
  );
  const start: string = monthStartUtc(prev);
  const end: Date = new Date(
    Date.UTC(prev.getUTCFullYear(), prev.getUTCMonth() + 1, 1)
  );

  const admin = createAdminClient();
  const { data: orders, error } = await admin
    .from("orders")
    .select("shop_id, items(base_price)")
    .eq("status", "delivered")
    .gte("created_at", start)
    .lt("created_at", end.toISOString());

  if (error) {
    throw new Error(error.message);
  }

  type Row = { shop_id: string; items: { base_price: number } | null };
  const byShop: Map<string, number> = new Map();

  for (const row of (orders ?? []) as Row[]) {
    const price: number = row.items?.base_price ?? 0;
    byShop.set(row.shop_id, (byShop.get(row.shop_id) ?? 0) + price);
  }

  for (const [shopId, total] of byShop) {
    const fee: number = Math.round(total * COMMISSION_RATE * 100) / 100;
    await admin.from("seller_monthly_fees").upsert(
      {
        shop_id: shopId,
        month: start,
        total_order_value: total,
        fee_amount: fee,
        status: "pending",
      } as never,
      { onConflict: "shop_id,month" }
    );
  }

  return { shopsUpdated: byShop.size, month: start };
}
