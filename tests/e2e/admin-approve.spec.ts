import { test, expect } from "@playwright/test";
import { establishTestSession } from "./helpers";

const secret: string | undefined = process.env.E2E_TEST_SECRET;
const password: string = process.env.SEED_USER_PASSWORD ?? "SeedPassword123!";
const adminEmail: string =
  process.env.E2E_ADMIN_EMAIL ?? "rowan.kendal@gmail.com";
const baseURL: string = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000";

test.describe("admin approves pending application", () => {
  test.skip(
    !secret,
    "Set E2E_TEST_SECRET in .env.local and run npm run seed:demo"
  );

  test("approve Pending Demo Kitchen", async ({ page }) => {
    await establishTestSession(
      page.request,
      baseURL,
      adminEmail,
      password,
      secret!
    );

    await page.goto("/he/admin/applications");
    await expect(
      page.getByText("Pending Demo Kitchen").first()
    ).toBeVisible({ timeout: 30_000 });

    const patchPromise = page.waitForResponse(
      (r) =>
        r.url().includes("/api/admin/seller-applications/") &&
        r.request().method() === "PATCH" &&
        r.ok()
    );
    await page.getByTestId("approve-application").first().click();
    await patchPromise;
  });
});
