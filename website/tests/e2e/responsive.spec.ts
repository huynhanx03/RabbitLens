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
  density: "comfortable" | "compact";
};

async function applyPreferences(
  page: Page,
  preferences: VisualPreferences,
) {
  await page.addInitScript((values) => {
    localStorage.setItem("rabbitlens.theme", values.theme);
    localStorage.setItem("rabbitlens.locale", values.locale);
    localStorage.setItem("rabbitlens.table-density", values.density);
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
    test(`Overview shell at ${viewport.name}`, async ({ page }, testInfo) => {
      await page.setViewportSize(viewport);
      await applyPreferences(page, {
        theme: "light",
        locale: "en",
        density: "comfortable",
      });
      await signIn(page, "Overview");

      const hasHorizontalOverflow = await page.evaluate(
        () =>
          document.documentElement.scrollWidth >
          document.documentElement.clientWidth,
      );
      expect(hasHorizontalOverflow).toBe(false);

      if (testInfo.project.name === "chromium") {
        await expect(page).toHaveScreenshot(`overview-${viewport.name}.png`, {
          animations: "disabled",
          fullPage: true,
        });
      }
    });
  }

  test("Overview desktop dark Vietnamese compact", async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await applyPreferences(page, {
      theme: "dark",
      locale: "vi",
      density: "compact",
    });
    await signIn(page, "Tổng quan");

    if (testInfo.project.name === "chromium") {
      await expect(page).toHaveScreenshot(
        "overview-desktop-dark-vi-compact.png",
        { animations: "disabled", fullPage: true },
      );
    }
  });

  test("Overview phone drawer", async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 360, height: 800 });
    await applyPreferences(page, {
      theme: "light",
      locale: "en",
      density: "comfortable",
    });
    await signIn(page, "Overview");
    await page.getByRole("button", { name: "Open navigation" }).click();
    await expect(
      page.getByRole("navigation", { name: "Primary navigation" }),
    ).toBeVisible();

    if (testInfo.project.name === "chromium") {
      await expect(page).toHaveScreenshot("overview-phone-drawer.png", {
        animations: "disabled",
        fullPage: true,
      });
    }
  });
});
