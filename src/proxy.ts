import { type NextRequest, NextResponse } from "next/server";
import createIntlMiddleware from "next-intl/middleware";
import { createServerClient } from "@supabase/ssr";
import { routing } from "@/i18n/routing";
import {
  isGuestPublicRest,
  parseLocalePath,
} from "@/lib/auth/locale-path";

const intlMiddleware = createIntlMiddleware(routing);

function copyResponseCookies(from: NextResponse, to: NextResponse): void {
  from.cookies.getAll().forEach((cookie: { name: string; value: string }) => {
    to.cookies.set(cookie.name, cookie.value);
  });
}

function redirectWithCookies(
  request: NextRequest,
  pathname: string,
  intlResponse: NextResponse
): NextResponse {
  const target: URL = new URL(pathname, request.url);
  const redirectRes: NextResponse = NextResponse.redirect(target);
  copyResponseCookies(intlResponse, redirectRes);
  return redirectRes;
}

export default async function proxy(request: NextRequest): Promise<NextResponse> {
  const response: NextResponse = intlMiddleware(request);

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
            request.cookies.set(name, value);
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (response.headers.has("location")) {
    return response;
  }

  const parsed = parseLocalePath(request.nextUrl.pathname);
  if (!parsed) {
    return response;
  }

  const { locale, rest } = parsed;
  const firstSegment: string = rest.replace(/^\//, "").split("/")[0] ?? "";

  if (user !== null) {
    if (firstSegment === "" || firstSegment === "login") {
      return redirectWithCookies(
        request,
        `/${locale}/home`,
        response
      );
    }
    return response;
  }

  if (!isGuestPublicRest(rest)) {
    return redirectWithCookies(request, `/${locale}/login`, response);
  }

  return response;
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|auth|.*\\..*).*)"],
};
