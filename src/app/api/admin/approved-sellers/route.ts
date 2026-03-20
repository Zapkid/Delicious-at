import { NextResponse } from "next/server";
import { getManagerSession } from "@/lib/admin/manager-session";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ApprovedSellerRow } from "@/types";

function firstShop(
  shops: { id: string; name: string } | { id: string; name: string }[] | null
): { id: string; name: string } | null {
  if (shops === null || shops === undefined) return null;
  if (Array.isArray(shops)) {
    return shops[0] ?? null;
  }
  return shops;
}

export async function GET(): Promise<NextResponse> {
  const manager: Awaited<ReturnType<typeof getManagerSession>> =
    await getManagerSession();
  if (!manager) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("profiles")
    .select("id, email, full_name, shops(id, name)")
    .eq("is_seller_approved", true)
    .order("email");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rows: ApprovedSellerRow[] = (data ?? []).map(
    (r: {
      id: string;
      email: string;
      full_name: string | null;
      shops: { id: string; name: string } | { id: string; name: string }[] | null;
    }): ApprovedSellerRow => {
      const shop = firstShop(r.shops);
      return {
        userId: r.id,
        email: r.email,
        fullName: r.full_name,
        shopId: shop?.id ?? null,
        shopName: shop?.name ?? null,
      };
    }
  );

  return NextResponse.json({ data: rows });
}
