import { expect } from "@playwright/test";
import { test } from "./fixtures/management-scenario";
import { navigateTo, openAppNavigation } from "./helpers/navigation";

test.describe("Permission Tests", () => {
  test("Administrator has access to administration destinations", async ({ page, scenario }) => {
    await scenario({ role: "administrator" });
    await page.goto("/login");
    await page.getByLabel("Username").fill("operator");
    await page.locator("#password").fill("secret");
    await page.getByRole("button", { name: "Sign in" }).click();
    
    await openAppNavigation(page);
    await expect(page.getByRole("link", { name: "Users" })).toBeVisible();
  });

  test("Management user does not see administration destinations", async ({ page, scenario }) => {
    await scenario({ role: "management" });
    await page.goto("/login");
    await page.getByLabel("Username").fill("operator");
    await page.locator("#password").fill("secret");
    await page.getByRole("button", { name: "Sign in" }).click();
    
    await openAppNavigation(page);
    await expect(page.getByRole("link", { name: "Users" })).toBeHidden();
  });

  test("403 triggers permission state", async ({ page, scenario }) => {
    await scenario({ role: "administrator" });
    await page.route("**/api/queues*", async (route) => {
      await route.fulfill({
        status: 403,
        json: { error: "not_authorised", reason: "Forbidden" },
      });
    });

    await page.goto("/login");
    await page.getByLabel("Username").fill("operator");
    await page.locator("#password").fill("secret");
    await page.getByRole("button", { name: "Sign in" }).click();
    
    await navigateTo(page, "Queues and Streams");
    
    await expect(page.getByText("You do not have permission to view this data.")).toBeVisible();
  });
});
