import { test, expect } from "@playwright/test";
import { establishTestSession } from "./helpers";

const secret: string | undefined = process.env.E2E_TEST_SECRET;
const password: string = process.env.SEED_USER_PASSWORD ?? "SeedPassword123!";
const baseURL: string = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000";

test.describe("consumer order and feedback", () => {
  test.skip(
    !secret,
    "Set E2E_TEST_SECRET in .env.local and run npm run seed:demo"
  );

  test("place order, seller fulfills, buyer rates", async ({ page }) => {
    await establishTestSession(
      page.request,
      baseURL,
      "buyer@seed.local",
      password,
      secret!
    );

    await page.goto("/he/explore");
    await expect(page.getByPlaceholder(/חפש|search/i)).toBeVisible({
      timeout: 30_000,
    });

    await page.getByText("Maya's Home Kitchen").first().click();
    await page.getByText("Sourdough loaf").first().click();

    await page.getByTestId("request-item").click();
    await page.getByTestId("confirm-request").click();

    await expect(page).toHaveURL(/\/he\/my-requests\//, { timeout: 15_000 });
    const orderUrl: string = page.url();
    await expect(page.getByTestId("order-status")).toContainText(/requested|ממתין/i);

    await establishTestSession(
      page.request,
      baseURL,
      "seller1@seed.local",
      password,
      secret!
    );

    await page.goto("/he/seller/orders");
    await page.getByRole("button", { name: /accept|אשר/i }).first().click();
    await page.getByTestId("mark-paid").click();
    await page.getByTestId("mark-delivered").click();

    await establishTestSession(
      page.request,
      baseURL,
      "buyer@seed.local",
      password,
      secret!
    );

    await page.goto(orderUrl);
    await expect(page.getByTestId("order-feedback-form")).toBeVisible({
      timeout: 15_000,
    });

    await page.getByTestId("app-star-5").click();
    await page.getByTestId("seller-star-5").click();
    await page.getByTestId("item-star-4").click();
    await page.getByTestId("submit-feedback").click();

    await expect(page.getByTestId("feedback-submitted")).toBeVisible({
      timeout: 10_000,
    });
  });
});
