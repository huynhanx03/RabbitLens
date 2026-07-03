import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.describe("Accessibility", () => {
  test.beforeEach(async ({ page }) => {
    await page.route("**/runtime-config.json", async (route) => {
      await route.fulfill({
        json: {
          apiBaseUrl: "/api",
          auth: { basic: true, oauth: null },
          defaultLocale: "en",
          defaultTheme: "system",
        },
      });
    });

    await page.route("**/api/whoami", async (route) => {
      await route.fulfill({
        json: {
          name: "operator",
          tags: ["administrator"],
          is_internal_user: true,
        },
      });
    });

    await page.route("**/api/overview", async (route) => {
      await route.fulfill({
        json: {
          rabbitmq_version: "4.4.0",
          erlang_version: "28.0",
          management_version: "4.4.0",
          cluster_name: "rabbit@localhost",
          disable_stats: false,
          object_totals: {
            connections: 10,
            channels: 25,
            exchanges: 8,
            queues: 15,
            consumers: 40,
          },
          message_stats: {
            publish_details: { rate: 25.5 },
            deliver_get_details: { rate: 20.1 },
          },
        },
      });
    });

    await page.route("**/api/nodes", async (route) => {
      await route.fulfill({
        json: [
          {
            name: "rabbit@localhost",
            type: "disc",
            running: true,
            uptime: 123456,
          },
        ],
      });
    });

    await page.route("**/api/extensions", async (route) => {
      await route.fulfill({ json: [] });
    });
  });

  test("Overview page has no automatically detectable accessibility issues", async ({ page }) => {
    await page.goto("/");
    await page.getByLabel("Username").fill("operator");
    await page.locator("#password").fill("secret");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page.getByRole("heading", { name: "Overview" })).toBeVisible();

    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test("Login page has no automatically detectable accessibility issues", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: "Connect to RabbitMQ" })).toBeVisible();

    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });
});
