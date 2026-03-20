import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const response: NextResponse = NextResponse.redirect(
    new URL("/he", request.url)
  );

  request.cookies.getAll().forEach(({ name }) => {
    if (name.startsWith("sb-")) {
      response.cookies.set(name, "", { maxAge: 0, path: "/" });
    }
  });

  return response;
}
