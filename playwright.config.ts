import path from "path";
import { config as loadEnv } from "dotenv";
import { defineConfig, devices } from "@playwright/test";

loadEnv({ path: path.resolve(process.cwd(), ".env.local") });

const baseURL: string = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000";

export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [["list"]],
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  webServer: {
    command: "npm run dev",
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
