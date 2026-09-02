import { expect, type Page } from "@playwright/test";
import { test } from "./fixtures/management-scenario";

const viewports = [
  { name: "phone", width: 360, height: 800 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "desktop", width: 1440, height: 900 },
  { name: "wide", width: 1920, height: 1080 },
] as const;

type VisualPreferences = {
  theme: "light" | "dark";
  locale: "en" | "vi";
};

async function applyPreferences(page: Page, preferences: VisualPreferences) {
  await page.addInitScript((values) => {
    localStorage.setItem("rabbitlens.theme", values.theme);
    localStorage.setItem("rabbitlens.locale", values.locale);
    localStorage.setItem("rabbitlens.sidebar", "expanded");
  }, preferences);
}

async function signIn(page: Page, heading: "Overview" | "Tổng quan") {
  await page.goto("/");
  await page.locator("#username").fill("operator");
  await page.locator("#password").fill("secret");
  await page.locator('button[type="submit"]').click();
  const clusterHealth = heading === "Tổng quan" ? "Sức khỏe cụm" : "Cluster health";
  await expect(page.getByRole("region", { name: clusterHealth })).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
}

test.describe("Responsive shell archetypes", () => {
  test.beforeEach(async ({ scenario }) => {
    await scenario({
      role: "administrator",
      statsMode: "detailed-rates",
    });
  });

  for (const viewport of viewports) {
    test(`Overview shell at ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await applyPreferences(page, {
        theme: "light",
        locale: "en",
      });
      await signIn(page, "Overview");

      const hasHorizontalOverflow = await page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
      );
      expect(hasHorizontalOverflow).toBe(false);
    });
  }

  test("Overview desktop dark English", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await applyPreferences(page, {
      theme: "dark",
      locale: "en",
    });
    await signIn(page, "Overview");
  });

  test("Overview phone drawer", async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    await applyPreferences(page, {
      theme: "light",
      locale: "en",
    });
    await signIn(page, "Overview");
    await page.getByRole("button", { name: "Open navigation" }).click();
    await expect(page.getByRole("navigation", { name: "Primary navigation" })).toBeVisible();
  });
});
