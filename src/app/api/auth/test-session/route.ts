import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/lib/supabase/types";

interface Body {
  secret?: string;
  email?: string;
  password?: string;
}

/**
 * E2E only: establishes a Supabase session via email/password and sets cookies.
 * Disabled unless E2E_TEST_SECRET is set; requires matching secret in JSON body.
 */
export async function POST(request: Request): Promise<NextResponse> {
  const expected: string | undefined = process.env.E2E_TEST_SECRET;
  if (!expected) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const b: Body = body as Body;
  if (b.secret !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const email: string = typeof b.email === "string" ? b.email.trim() : "";
  const password: string = typeof b.password === "string" ? b.password : "";
  if (!email || !password) {
    return NextResponse.json({ error: "Missing credentials" }, { status: 400 });
  }

  const cookieStore = await cookies();
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll(): { name: string; value: string }[] {
          return cookieStore.getAll();
        },
        setAll(
          cookiesToSet: {
            name: string;
            value: string;
            options: Record<string, unknown>;
          }[]
        ): void {
          cookiesToSet.forEach(
            ({ name, value, options }: { name: string; value: string; options: Record<string, unknown> }) =>
              cookieStore.set(name, value, options)
          );
        },
      },
    }
  );

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
