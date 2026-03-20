"use client";

import { useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

export function useSupabase(): SupabaseClient<Database> {
  return useMemo(() => createClient(), []);
}
