import { expect, test } from "@playwright/test";
import { navigateTo } from "./helpers/navigation";

test.describe("RabbitLens foundation", () => {
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

    await page.route("**/api/extensions", async (route) => {
      await route.fulfill({ json: [] });
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

    await page.route("**/api/nodes/rabbit%40localhost?*", async (route) => {
      await route.fulfill({
        json: {
          name: "rabbit@localhost",
          type: "disc",
          running: true,
          fd_used: 25,
          fd_total: 1024,
          sockets_used: 10,
          sockets_total: 829,
          mem_used: 536870912,
          disk_free: 53687091200,
        },
      });
    });
  });

  test("signs in and navigates from Overview to node detail", async ({
    page,
  }) => {
    await page.goto("/");

    await expect(page).toHaveURL(/\/login/);
    await page.getByLabel("Username").fill("operator");
    await page.locator("#password").fill("secret");
    await page.getByRole("button", { name: "Sign in" }).click();

    await expect(page).toHaveURL("http://127.0.0.1:4173/");
    await expect(page.getByRole("region", { name: "Cluster health" })).toBeVisible();

    await navigateTo(page, "Nodes");
    await expect(page).toHaveURL(/\/nodes$/);
    await expect(page.getByRole("link", { name: "rabbit@localhost" })).toBeVisible();

    await page.getByRole("link", { name: "rabbit@localhost" }).click();
    await expect(
      page.getByRole("heading", { name: "rabbit@localhost" }),
    ).toBeVisible();
    await expect(page.getByText("File Descriptors")).toBeVisible();
  });
});
