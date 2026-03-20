import {
  createClient as createSupabaseClient,
  type SupabaseClient,
} from "@supabase/supabase-js";
import type { Database } from "./types";

export function createAdminClient(): SupabaseClient<Database> {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
