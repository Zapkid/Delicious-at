import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { orderFeedbackSchema } from "@/lib/validators/order";

interface RouteParams {
  params: Promise<{ id: string }>;
}

interface OrderWithShop {
  id: string;
  consumer_id: string;
  shop_id: string;
  status: string;
  shops: { seller_id: string };
}

export async function POST(
  request: Request,
  { params }: RouteParams
): Promise<NextResponse> {
  const { id: orderId } = await params;
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

  const parsed = orderFeedbackSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { data: row, error: orderError } = await supabase
    .from("orders")
    .select("id, consumer_id, shop_id, status, shops(seller_id)")
    .eq("id", orderId)
    .maybeSingle();

  if (orderError || !row) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const order: OrderWithShop = row as unknown as OrderWithShop;
  if (order.consumer_id !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (order.status !== "delivered") {
    return NextResponse.json({ error: "Order not delivered" }, { status: 400 });
  }

  const { data: existing } = await supabase
    .from("ratings")
    .select("id")
    .eq("order_id", orderId)
    .eq("from_user_id", user.id)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ error: "Already rated" }, { status: 400 });
  }

  const sellerId: string = order.shops?.seller_id;
  if (!sellerId) {
    return NextResponse.json({ error: "Invalid order" }, { status: 500 });
  }

  const tags: string[] = parsed.data.feedback_tags ?? [];

  const { error: insertError } = await supabase.from("ratings").insert({
    order_id: orderId,
    from_user_id: user.id,
    to_user_id: sellerId,
    stars: parsed.data.seller_stars,
    app_stars: parsed.data.app_stars,
    item_stars: parsed.data.item_stars,
    comment: parsed.data.comment ?? null,
    feedback_tags: tags,
  } as never);

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
