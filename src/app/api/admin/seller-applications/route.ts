import { NextResponse } from "next/server";
import { getManagerSession } from "@/lib/admin/manager-session";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(): Promise<NextResponse> {
  const manager: Awaited<ReturnType<typeof getManagerSession>> =
    await getManagerSession();
  if (!manager) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("seller_applications")
    .select("*, profiles!user_id(full_name, email)")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: data ?? [] });
}
