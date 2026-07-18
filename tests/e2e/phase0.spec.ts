import { expect, test } from "@playwright/test";

test("renders the brand profile intake", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", { name: "Brand profile" }),
  ).toBeVisible();
  await expect(page.getByLabel("Website URL")).toBeVisible();
  await expect(page.getByRole("button", { name: "Analyze" })).toBeVisible();
});
