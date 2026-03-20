import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

export interface ApprovedApplicationShopFields {
  business_name: string;
  address: string;
  bio: string | null;
}

/**
 * Creates a shop row when a seller is approved if they do not already have one.
 * Uses service-role client (bypasses RLS). Safe to call multiple times.
 */
export async function ensureShopForApprovedSeller(
  admin: SupabaseClient<Database>,
  userId: string,
  application: ApprovedApplicationShopFields
): Promise<{ error: Error | null }> {
  const { data: existing } = await admin
    .from("shops")
    .select("id")
    .eq("seller_id", userId)
    .maybeSingle();

  if (existing) {
    return { error: null };
  }

  const { error } = await admin.from("shops").insert({
    seller_id: userId,
    name: application.business_name,
    address: application.address,
    description: application.bio ?? null,
  } as never);

  if (error) {
    return { error: new Error(error.message) };
  }
  return { error: null };
}
