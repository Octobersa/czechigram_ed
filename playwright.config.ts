import { defineConfig, devices } from "@playwright/test";

const port = Number(process.env.PLAYWRIGHT_PORT ?? 3010);
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? `http://127.0.0.1:${port}`;
const shouldManageWebServer = process.env.PLAYWRIGHT_SKIP_WEBSERVER !== "true";
const webServerEnv = Object.fromEntries(
  Object.entries(process.env).filter((entry): entry is [string, string] => entry[1] !== undefined),
);

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  timeout: 90_000,
  expect: {
    timeout: 15_000,
  },
  reporter: process.env.CI
    ? [["github"], ["html", { open: "never" }]]
    : [["list"]],
  use: {
    baseURL,
    testIdAttribute: "data-test-id",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  ...(shouldManageWebServer
    ? {
        webServer: {
          command: `npx next dev -H 127.0.0.1 -p ${port}`,
          url: `${baseURL}/students`,
          reuseExistingServer: !process.env.CI,
          timeout: 120_000,
          env: {
            ...webServerEnv,
            NEXT_DIST_DIR: process.env.PLAYWRIGHT_NEXT_DIST_DIR ?? ".next-e2e",
          },
        },
      }
    : {}),
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
