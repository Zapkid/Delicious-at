import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supportTicketSchema } from "@/lib/validators/support-ticket";

interface RouteParams {
  params: Promise<{ id: string }>;
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

  const parsed = supportTicketSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { data: orderRow, error: orderErr } = await supabase
    .from("orders")
    .select("id, consumer_id")
    .eq("id", orderId)
    .maybeSingle();

  if (orderErr || !orderRow) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const consumerId: string = (orderRow as { consumer_id: string }).consumer_id;
  if (consumerId !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const photo: string | null = parsed.data.issue_photo_url ?? null;

  const { error: insertErr } = await supabase.from("support_tickets").insert({
    order_id: orderId,
    user_id: user.id,
    body: parsed.data.body,
    issue_photo_url: photo,
  } as never);

  if (insertErr) {
    return NextResponse.json({ error: insertErr.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
