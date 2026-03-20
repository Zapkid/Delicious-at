import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const reportSchema = z.object({
  body: z.string().min(1).max(2000),
  shop_id: z.string().uuid().nullable().optional(),
  item_id: z.string().uuid().nullable().optional(),
});

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

  const parsed = reportSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const shopId: string | null = parsed.data.shop_id ?? null;
  const itemId: string | null = parsed.data.item_id ?? null;

  const { error } = await supabase.from("reports").insert({
    reporter_id: user.id,
    shop_id: shopId,
    item_id: itemId,
    body: parsed.data.body,
  } as never);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
