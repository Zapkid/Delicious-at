import type { APIRequestContext } from "@playwright/test";

export async function establishTestSession(
  request: APIRequestContext,
  baseURL: string,
  email: string,
  password: string,
  secret: string
): Promise<void> {
  const res = await request.post(`${baseURL}/api/auth/test-session`, {
    data: { email, password, secret },
  });
  if (!res.ok()) {
    throw new Error(
      `test-session failed: ${res.status()} ${await res.text()}`
    );
  }
}
