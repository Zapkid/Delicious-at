import { createClient } from "@/lib/supabase/server";
import { isManagerEmail } from "@/lib/constants";

export interface ManagerSession {
  userId: string;
  email: string;
}

export async function getManagerSession(): Promise<ManagerSession | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("email")
    .eq("id", user.id)
    .maybeSingle();

  const email: string = profile?.email ?? user.email ?? "";
  if (!isManagerEmail(email)) return null;

  return { userId: user.id, email };
}
