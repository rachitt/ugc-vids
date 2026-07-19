import "dotenv/config";

import { defineConfig, devices } from "@playwright/test";

const e2eRunId =
  process.env.FASTLANE_E2E_RUN_ID ?? `e2e-${Date.now()}-${process.pid}`;
const e2eWorkspaceName =
  process.env.FASTLANE_DEFAULT_WORKSPACE_NAME ??
  `Fastlane Core Loop ${e2eRunId}`;

process.env.FASTLANE_E2E_RUN_ID = e2eRunId;
process.env.FASTLANE_DEFAULT_WORKSPACE_NAME = e2eWorkspaceName;
process.env.FASTLANE_FAKE_AI = process.env.FASTLANE_FAKE_AI ?? "1";
process.env.FASTLANE_FAKE_SCRAPE = process.env.FASTLANE_FAKE_SCRAPE ?? "1";
process.env.STORAGE_DRIVER = process.env.STORAGE_DRIVER ?? "local";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 30_000,
  expect: {
    timeout: 5_000,
  },
  reporter: [["list"]],
  globalSetup: "./tests/e2e/global-setup.ts",
  globalTeardown: "./tests/e2e/global-teardown.ts",
  use: {
    baseURL: "http://127.0.0.1:3000",
    trace: "on-first-retry",
  },
  webServer: {
    command: "pnpm dev",
    env: {
      ...process.env,
      FASTLANE_DEFAULT_WORKSPACE_NAME: e2eWorkspaceName,
      FASTLANE_E2E_RUN_ID: e2eRunId,
      FASTLANE_FAKE_AI: process.env.FASTLANE_FAKE_AI ?? "1",
      FASTLANE_FAKE_SCRAPE: process.env.FASTLANE_FAKE_SCRAPE ?? "1",
      STORAGE_DRIVER: process.env.STORAGE_DRIVER ?? "local",
    },
    url: "http://127.0.0.1:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
