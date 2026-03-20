import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createOrderSchema } from "@/lib/validators/order";

interface ItemShopRow {
  id: string;
  shop_id: string;
  is_available_now: boolean;
  shops: { is_active: boolean; supports_delivery: boolean };
}

export async function POST(request: Request): Promise<NextResponse> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = createOrderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const {
    item_id,
    shop_id,
    portion_id,
    note,
    preferred_pickup_time,
    wants_delivery,
    coupon_code,
  } = parsed.data;

  const { data: row, error: fetchError } = await supabase
    .from("items")
    .select(
      "id, shop_id, is_available_now, shops!inner(is_active, supports_delivery)"
    )
    .eq("id", item_id)
    .maybeSingle();

  if (fetchError || !row) {
    return NextResponse.json({ error: "Item not found" }, { status: 404 });
  }

  const typed: ItemShopRow = row as unknown as ItemShopRow;
  if (!typed.shops?.is_active) {
    return NextResponse.json({ error: "Shop unavailable" }, { status: 400 });
  }
  if (typed.shop_id !== shop_id) {
    return NextResponse.json({ error: "Shop mismatch" }, { status: 400 });
  }
  if (!typed.is_available_now) {
    return NextResponse.json({ error: "Item not available" }, { status: 400 });
  }

  if (wants_delivery && !typed.shops?.supports_delivery) {
    return NextResponse.json(
      { error: "Shop does not offer delivery" },
      { status: 400 }
    );
  }

  let couponId: string | null = null;
  const rawCoupon: string | undefined = coupon_code?.trim();
  if (rawCoupon) {
    const admin = createAdminClient();
    const norm: string = rawCoupon.toLowerCase();
    const { data: couponRows, error: couponErr } = await admin
      .from("coupons")
      .select("id, code, expires_at, is_active")
      .eq("shop_id", shop_id)
      .eq("is_active", true);
    if (couponErr) {
      return NextResponse.json({ error: couponErr.message }, { status: 500 });
    }
    const rows: { id: string; code: string; expires_at: string | null }[] =
      (couponRows ?? []) as {
        id: string;
        code: string;
        expires_at: string | null;
      }[];
    const match = rows.find(
      (c: { id: string; code: string; expires_at: string | null }): boolean =>
        c.code.toLowerCase() === norm &&
        (!c.expires_at || new Date(c.expires_at) > new Date())
    );
    if (!match) {
      return NextResponse.json({ error: "Invalid coupon" }, { status: 400 });
    }
    couponId = match.id;
  }

  if (portion_id) {
    const { data: portion } = await supabase
      .from("item_portions")
      .select("id")
      .eq("id", portion_id)
      .eq("item_id", item_id)
      .maybeSingle();
    if (!portion) {
      return NextResponse.json({ error: "Invalid portion" }, { status: 400 });
    }
  }

  const { data: inserted, error: insertError } = await supabase
    .from("orders")
    .insert({
      consumer_id: user.id,
      shop_id,
      item_id,
      portion_id: portion_id ?? null,
      note: note ?? null,
      preferred_pickup_time: preferred_pickup_time || null,
      wants_delivery,
      status: "requested",
      coupon_id: couponId,
    } as never)
    .select("id")
    .single();

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  const id: string = (inserted as { id: string }).id;

  if (couponId) {
    const admin = createAdminClient();
    await admin.from("order_coupon_redemptions").insert({
      order_id: id,
      coupon_id: couponId,
    } as never);
  }

  return NextResponse.json({ id });
}
