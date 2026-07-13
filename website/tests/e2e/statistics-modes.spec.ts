import { expect } from "@playwright/test";
import { test } from "./fixtures/management-scenario";

test.describe("Statistics Modes Tests", () => {
  test("Disabled stats shows fallback message on Overview", async ({ page, scenario }) => {
    await scenario({ role: "administrator", statsMode: "disabled" });
    await page.goto("/login");
    await page.getByLabel("Username").fill("operator");
    await page.locator("#password").fill("secret");
    await page.getByRole("button", { name: "Sign in" }).click();
    
    await expect(page.getByText("Statistics Unavailable")).toBeVisible();
    await expect(page.getByText("Statistics are globally disabled on this node.")).toBeVisible();
    await expect(page.getByText("Message rates")).toBeHidden();
  });

  test("Queue totals only shows limited metrics", async ({ page, scenario }) => {
    await scenario({ role: "administrator", statsMode: "queue-totals-only" });
    await page.goto("/login");
    await page.getByLabel("Username").fill("operator");
    await page.locator("#password").fill("secret");
    await page.getByRole("button", { name: "Sign in" }).click();
    
    await expect(
      page.getByRole("region", { name: "Workload health" }),
    ).toBeVisible();
    await expect(
      page.getByText(
        "Statistics are disabled, but queue totals are explicitly enabled.",
      ),
    ).toBeVisible();
    await expect(page.getByText("Message rates")).toBeHidden();
  });
});
