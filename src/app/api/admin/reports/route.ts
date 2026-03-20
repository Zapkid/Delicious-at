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
    .from("reports")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    const msg: string = error.message;
    const missingReportsTable: boolean =
      msg.includes("reports") &&
      (msg.includes("does not exist") || msg.includes("schema cache"));
    if (missingReportsTable) {
      return NextResponse.json({ data: [] });
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  return NextResponse.json({ data: data ?? [] });
}
