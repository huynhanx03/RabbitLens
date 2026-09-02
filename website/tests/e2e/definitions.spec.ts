import { expect } from "@playwright/test";
import { test } from "./fixtures/management-scenario";
import { navigateTo } from "./helpers/navigation";

async function signIn(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.getByLabel("Username").fill("operator");
  await page.locator("#password").fill("secret");
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL(/\/$/);
}

test.describe("Definitions backup and restore", () => {
  test("administrator can open scoped export/import controls", async ({ page, scenario }) => {
    await scenario({ role: "administrator", vhosts: ["/", "orders"] });
    await signIn(page);
    await navigateTo(page, "Cluster");

    await expect(page).toHaveURL(/\/admin\/cluster$/);
    await expect(page.getByRole("heading", { name: "Definitions Export / Import" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Download definitions" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Upload definitions" })).toBeDisabled();
    await expect(page.getByRole("combobox", { name: "Virtual Host" })).toHaveCount(2);
  });
});
