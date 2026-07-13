import AxeBuilder from "@axe-core/playwright";
import { expect, type Page } from "@playwright/test";
import { test } from "./fixtures/management-scenario";
import { navigateTo } from "./helpers/navigation";

const connection = {
  name: "127.0.0.1:55000 -> 127.0.0.1:5672",
  node: "rabbit@localhost",
  vhost: "/",
  user: "operator",
  protocol: "AMQP 0-9-1",
  state: "running",
  ssl: true,
  peer_host: "127.0.0.1",
  peer_port: 55000,
  host: "127.0.0.1",
  port: 5672,
  channels: 2,
};

async function signIn(page: Page) {
  await page.goto("/");
  await page.getByLabel("Username").fill("operator");
  await page.locator("#password").fill("secret");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(
    page.getByRole("region", { name: "Cluster health" }),
  ).toBeVisible();
}

test.describe("Connections reference data experience", () => {
  test.beforeEach(async ({ page, scenario }) => {
    await scenario({ role: "administrator", statsMode: "detailed-rates" });
    await page.route("**/api/connections?*", async (route) => {
      await route.fulfill({
        json: {
          items: [connection],
          filtered_count: 1,
          item_count: 1,
          page: 1,
          page_count: 1,
          page_size: 100,
          total_count: 1,
        },
      });
    });
  });

  test("supports filtering, sorting and confirmed row actions", async ({
    page,
  }) => {
    let listRequests = 0;
    page.on("request", (request) => {
      if (new URL(request.url()).pathname === "/api/connections") {
        listRequests += 1;
      }
    });
    await signIn(page);
    await navigateTo(page, "Connections");

    await expect(
      page.getByRole("table", { name: "RabbitMQ connections" }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: connection.name, exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("navigation", { name: "Pagination" }),
    ).toContainText("1 item(s)");
    expect(listRequests).toBe(1);

    await page.getByRole("button", { name: "Name", exact: true }).click();
    await expect(page).toHaveURL(/sort=name/);

    await page.getByLabel("Filter by name").fill("worker");
    await page.getByRole("button", { name: "Filter", exact: true }).click();
    await expect(page).toHaveURL(/name=worker/);

    await page
      .getByRole("button", { name: `Force close ${connection.name}` })
      .click();
    await expect(
      page.getByRole("alertdialog", { name: "Force close connection" }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Cancel" }).click();
    await expect(
      page.getByRole("alertdialog", { name: "Force close connection" }),
    ).toHaveCount(0);

    const accessibility = await new AxeBuilder({ page }).analyze();
    expect(accessibility.violations).toEqual([]);
  });

  test("prioritizes essential columns without document overflow on mobile", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await signIn(page);
    await page.getByRole("button", { name: "Open navigation" }).click();
    await page.getByRole("link", { name: "Connections", exact: true }).click();

    await expect(
      page.getByRole("columnheader", { name: "Name" }),
    ).toBeVisible();
    await expect(
      page.getByRole("columnheader", { name: "State" }),
    ).toBeVisible();
    await expect(
      page.getByRole("columnheader", { name: "Protocol" }),
    ).toBeHidden();
    await expect(
      page.getByRole("toolbar", { name: "Connection controls" }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () =>
          document.documentElement.scrollWidth <=
          document.documentElement.clientWidth,
      ),
    ).toBe(true);
  });
});
