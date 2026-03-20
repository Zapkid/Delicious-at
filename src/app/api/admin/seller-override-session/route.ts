import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { getManagerSession } from "@/lib/admin/manager-session";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/lib/supabase/types";

interface Body {
  email?: string;
  locale?: string;
}

function getHashedToken(
  linkData: unknown
): string | undefined {
  if (typeof linkData !== "object" || linkData === null) return undefined;
  const props: unknown = (linkData as { properties?: unknown }).properties;
  if (typeof props !== "object" || props === null) return undefined;
  const token: unknown = (props as { hashed_token?: unknown }).hashed_token;
  return typeof token === "string" ? token : undefined;
}

/**
 * Manager-only: sign the browser in as an approved seller (magic link via
 * service role, then seed password fallback for demo accounts).
 */
export async function POST(request: Request): Promise<NextResponse> {
  const manager: Awaited<ReturnType<typeof getManagerSession>> =
    await getManagerSession();
  if (!manager) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const seedPassword: string =
    process.env.SEED_USER_PASSWORD ?? "SeedPassword123!";

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const b: Body = body as Body;
  const rawEmail: string = typeof b.email === "string" ? b.email.trim() : "";
  const locale: string =
    typeof b.locale === "string" && b.locale.trim() !== ""
      ? b.locale.trim()
      : "he";

  if (!rawEmail) {
    return NextResponse.json({ error: "Email required" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: profile, error: profileErr } = await admin
    .from("profiles")
    .select("email")
    .eq("is_seller_approved", true)
    .eq("email", rawEmail)
    .maybeSingle();

  if (profileErr) {
    return NextResponse.json({ error: profileErr.message }, { status: 500 });
  }
  if (!profile?.email) {
    return NextResponse.json(
      { error: "Not an approved seller" },
      { status: 400 }
    );
  }

  const email: string = profile.email;
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
            ({
              name,
              value,
              options,
            }: {
              name: string;
              value: string;
              options: Record<string, unknown>;
            }) => cookieStore.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: linkData, error: linkErr } =
    await admin.auth.admin.generateLink({
      type: "magiclink",
      email,
    });

  const tokenHash: string | undefined = getHashedToken(linkData);
  if (!linkErr && tokenHash) {
    const { error: otpErr } = await supabase.auth.verifyOtp({
      type: "email",
      token_hash: tokenHash,
    });
    if (!otpErr) {
      const redirect: string = `/${locale}/seller/dashboard`;
      return NextResponse.json({ ok: true, redirect });
    }
  }

  const { error: pwErr } = await supabase.auth.signInWithPassword({
    email,
    password: seedPassword,
  });
  if (pwErr) {
    return NextResponse.json(
      {
        error:
          pwErr.message ||
          "Could not start seller session (magic link and seed password failed).",
      },
      { status: 400 }
    );
  }

  const redirect: string = `/${locale}/seller/dashboard`;
  return NextResponse.json({ ok: true, redirect });
}
