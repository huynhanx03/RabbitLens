import AxeBuilder from "@axe-core/playwright";
import { expect, type Page } from "@playwright/test";
import { test } from "./fixtures/management-scenario";

const channel = {
  name: "client -> rabbit (1)",
  node: "rabbit@localhost",
  connection_details: { name: "client -> rabbit", peer_host: "127.0.0.1", peer_port: 55000 },
  user: "operator",
  vhost: "/",
  number: 1,
  state: "running",
  transactional: false,
  confirm: true,
  consumer_count: 2,
  messages_unacknowledged: 3,
  messages_unconfirmed: 0,
  messages_uncommitted: 0,
  prefetch_count: 100,
  global_prefetch_count: 0,
  message_stats: {
    publish_details: { rate: 4.2 },
    deliver_get_details: { rate: 3.8 },
    ack_details: { rate: 3.5 },
  },
};

async function signIn(page: Page) {
  await page.goto("/");
  await page.getByLabel("Username").fill("operator");
  await page.locator("#password").fill("secret");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByRole("region", { name: "Cluster health" })).toBeVisible();
}

test.describe("Dashboard and detail archetypes", () => {
  test.beforeEach(async ({ page, scenario }) => {
    await scenario({ role: "administrator", statsMode: "detailed-rates" });
    await page.route("**/api/channels?*", (route) => route.fulfill({ json: {
      items: [channel], filtered_count: 1, item_count: 1, page: 1,
      page_count: 1, page_size: 100, total_count: 1,
    } }));
    await page.route("**/api/channels/**", (route) => route.fulfill({ json: channel }));
  });

  test("Overview presents operational hierarchy without accessibility violations", async ({ page }) => {
    await signIn(page);
    const clusterHealth = page.getByRole("region", { name: "Cluster health" });
    await expect(clusterHealth).toBeVisible();
    await expect(page.getByRole("region", { name: "Connections" })).toBeVisible();
    await expect(clusterHealth.getByText("Operational")).toBeVisible();
    const accessibility = await new AxeBuilder({ page }).analyze();
    expect(accessibility.violations).toEqual([]);
  });

  test("Channels list reaches a responsive typed detail page", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await signIn(page);
    await page.getByRole("button", { name: "Open navigation" }).click();
    await page.getByRole("link", { name: "Channels", exact: true }).click();
    await expect(page.getByRole("table", { name: "RabbitMQ channels" })).toBeVisible();
    await page.getByRole("link", { name: channel.name }).click();
    await expect(page.getByRole("heading", { name: channel.name })).toBeVisible();
    await expect(page.getByRole("region", { name: "Properties" })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  });
});
