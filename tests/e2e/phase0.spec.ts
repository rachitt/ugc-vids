import { expect, test } from "@playwright/test";

test("renders the Phase 0 shell", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Fastlane" })).toBeVisible();
  await expect(page.getByText("Next.js 15")).toBeVisible();
  await expect(page.getByText("Drizzle + Postgres")).toBeVisible();
});
