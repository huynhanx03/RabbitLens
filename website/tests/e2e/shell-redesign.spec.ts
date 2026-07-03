import { expect, type Page } from "@playwright/test";
import { test } from "./fixtures/management-scenario";

async function signInOnCurrentPage(page: Page) {
  await page.getByLabel("Username").fill("operator");
  await page.locator("#password").fill("secret");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(
    page.getByRole("button", { name: "Go to…" }),
  ).toBeVisible();
}

async function signInAsAdministrator(page: Page) {
  await page.goto("/");
  await signInOnCurrentPage(page);
}

test.describe("Application shell redesign", () => {
  test.beforeEach(async ({ page, scenario }) => {
    await scenario({
      role: "administrator",
      statsMode: "detailed-rates",
    });
    await page.route("**/api/connections?*", async (route) => {
      await route.fulfill({
        json: {
          items: [],
          filtered_count: 0,
          item_count: 0,
          page: 1,
          page_count: 0,
          page_size: 100,
          total_count: 0,
        },
      });
    });
  });

  test("desktop sidebar stays expanded without density controls", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name.startsWith("Mobile"), "Desktop-only sidebar behavior");
    await signInAsAdministrator(page);

    await expect(
      page.getByRole("button", { name: "Collapse sidebar" }),
    ).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Density" })).toHaveCount(0);
    await expect(page.getByRole("link", { name: "Overview" })).toBeVisible();
    await expect(page.locator("html")).not.toHaveAttribute("data-density");
  });

  test("command navigation is keyboard accessible", async ({ page }) => {
    await signInAsAdministrator(page);

    await page.keyboard.press("ControlOrMeta+K");
    await expect(page.getByRole("dialog")).toBeVisible();
    await page
      .getByPlaceholder("Search pages and actions…")
      .fill("Connections");
    await page.getByRole("option", { name: "Connections" }).click();

    await expect(page).toHaveURL(/\/connections/);
  });

  test("shell composition reuses Overview and Extensions queries", async ({
    page,
  }) => {
    const requestCounts = { overview: 0, extensions: 0 };
    page.on("request", (request) => {
      const pathname = new URL(request.url()).pathname;
      if (pathname === "/api/overview") requestCounts.overview += 1;
      if (pathname === "/api/extensions") requestCounts.extensions += 1;
    });

    await signInAsAdministrator(page);

    expect(requestCounts).toEqual({ overview: 1, extensions: 1 });
  });

  test("mobile drawer leaves the document overflow-free", async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    await signInAsAdministrator(page);

    await page.getByRole("button", { name: "Open navigation" }).click();
    await expect(
      page.getByRole("navigation", { name: "Primary navigation" }),
    ).toBeVisible();
    const hasHorizontalOverflow = await page.evaluate(
      () =>
        document.documentElement.scrollWidth >
        document.documentElement.clientWidth,
    );
    expect(hasHorizontalOverflow).toBe(false);
  });
});
