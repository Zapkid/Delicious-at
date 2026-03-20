import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { DEFAULT_LOCALE } from "@/lib/constants";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams, origin } = new URL(request.url);
  const code: string | null = searchParams.get("code");
  const next: string =
    searchParams.get("next") ?? `/${DEFAULT_LOCALE}/home`;

  if (code) {
    const response: NextResponse = NextResponse.redirect(`${origin}${next}`);

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll(): { name: string; value: string }[] {
            return request.cookies.getAll();
          },
          setAll(
            cookiesToSet: {
              name: string;
              value: string;
              options: Record<string, unknown>;
            }[]
          ): void {
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, options);
            });
          },
        },
      }
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return response;
    }
  }

  return NextResponse.redirect(`${origin}/${DEFAULT_LOCALE}?error=auth`);
}
