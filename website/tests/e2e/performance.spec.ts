import { expect, test } from "@playwright/test";
import { PERFORMANCE_BUDGETS } from "../../config/performance-budgets.mjs";
import { navigateTo } from "./helpers/navigation";

test.describe("Performance Budgets", () => {
  test.beforeEach(async ({ page }) => {
    // Mock the base requests
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
          message_stats: {},
        },
      });
    });

    await page.route("**/api/extensions", async (route) => {
      await route.fulfill({ json: [] });
    });
    
    await page.route("**/api/nodes", async (route) => {
      await route.fulfill({ json: [{ name: "rabbit@localhost", type: "disc", running: true }] });
    });
    
    await page.route("**/api/vhosts", async (route) => {
      await route.fulfill({ json: [{ name: "/" }] });
    });
  });

  test("Initial load stays within API request budget", async ({ page }) => {
    let apiRequestCount = 0;

    page.on("request", (req) => {
      if (new URL(req.url()).pathname.startsWith("/api/")) {
        apiRequestCount++;
      }
    });

    await page.goto("/login");
    await page.getByLabel("Username").fill("operator");
    await page.locator("#password").fill("secret");
    await page.getByRole("button", { name: "Sign in" }).click();
    
    await expect(page.getByRole("region", { name: "Cluster health" })).toBeVisible();
    
    expect(apiRequestCount).toBeLessThanOrEqual(
      PERFORMANCE_BUDGETS.initialApiRequestCount,
    );
  });

  test("Large data sets stay within DOM budget (virtualization/pagination)", async ({ page }) => {
    // Mock 10,000 queues
    const largeQueuesResponse = Array.from({ length: 10000 }, (_, i) => ({
      name: `queue-${i}`,
      vhost: "/",
      durable: true,
      auto_delete: false,
      messages: i,
    }));

    await page.route("**/api/queues*", async (route) => {
      await route.fulfill({
        json: {
          items: largeQueuesResponse.slice(0, 100),
          filtered_count: 10000,
          item_count: 10000,
          page: 1,
          page_count: 100,
          page_size: 100,
          total_count: 10000,
        },
      });
    });

    await page.goto("/login");
    await page.getByLabel("Username").fill("operator");
    await page.locator("#password").fill("secret");
    await page.getByRole("button", { name: "Sign in" }).click();
    
    await navigateTo(page, "Queues and Streams");
    await expect(page).toHaveURL(/\/queues/);
    await expect(page.locator("tbody tr").first()).toBeVisible();

    // Verify row count is bounded by virtualization/pagination
    const rows = await page.locator("tbody tr").count();
    
    // Should be pagination limit (e.g., 50) + maybe header row
    expect(rows).toBeLessThanOrEqual(PERFORMANCE_BUDGETS.virtualizedDomRows);
  });

  test("Queue detail cold navigation makes one count-only detail request", async ({ page }) => {
    const queue = {
      name: "orders",
      vhost: "/",
      type: "classic",
      node: "rabbit@localhost",
      state: "running",
      durable: true,
      auto_delete: false,
      exclusive: false,
      arguments: {},
      messages: 15,
      messages_ready: 10,
      messages_unacknowledged: 5,
      consumers: 2,
      consumer_capacity: 0.9,
      messages_details: {
        rate: 0,
        samples: [{ timestamp: 1_783_851_200, sample: 15 }],
      },
      messages_ready_details: {
        rate: 0,
        samples: [{ timestamp: 1_783_851_200, sample: 10 }],
      },
      messages_unacknowledged_details: {
        rate: 0,
        samples: [{ timestamp: 1_783_851_200, sample: 5 }],
      },
    };
    let detailRequests = 0;
    let detailUrl = "";

    await page.route(/\/api\/queues(?:\/|\?|$)/, async (route) => {
      const url = route.request().url();
      if (url.includes("/api/queues/%2F/orders/bindings")) {
        await route.fulfill({
          json: [
            {
              source: "orders.events",
              vhost: "/",
              destination: "orders",
              destination_type: "queue",
              routing_key: "orders.#",
              arguments: {},
              properties_key: "orders.%23",
            },
          ],
        });
        return;
      }
      if (url.includes("/api/queues/%2F/orders?")) {
        detailRequests += 1;
        detailUrl = url;
        await route.fulfill({ json: queue });
        return;
      }
      await route.fulfill({
        json: {
          items: [queue],
          filtered_count: 1,
          item_count: 1,
          page: 1,
          page_count: 1,
          page_size: 100,
          total_count: 1,
        },
      });
    });

    await page.route("**/api/exchanges/%2F/orders.events*", async (route) => {
      await route.fulfill({
        json: {
          name: "orders.events",
          vhost: "/",
          type: "topic",
          durable: true,
          auto_delete: false,
          internal: false,
          arguments: {},
        },
      });
    });

    await page.goto("/login");
    await page.getByLabel("Username").fill("operator");
    await page.locator("#password").fill("secret");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page.getByRole("region", { name: "Cluster health" })).toBeVisible();

    await navigateTo(page, "Queues and Streams");
    const ordersRow = page.getByRole("row").filter({ hasText: "orders" });
    await expect(ordersRow).toBeVisible();
    await ordersRow.click();
    await expect(page.getByRole("region", { name: "Configuration" })).toBeVisible();
    await expect(page.getByText("topic", { exact: true })).toBeVisible();

    expect(detailRequests).toBe(1);
    expect(detailUrl).toContain("lengths_age=60");
    expect(detailUrl).toContain("lengths_incr=5");
    expect(detailUrl).not.toContain("msg_rates");
    await expect(page.getByText("Message counts history")).toBeVisible();
    await expect(page.getByText("Message rates history")).toHaveCount(0);
  });
});
