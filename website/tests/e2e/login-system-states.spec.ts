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
  ssl: false,
  channels: 1,
};

async function signIn(page: Page) {
  await page.goto("/");
  await page.getByLabel("Username").fill("operator");
  await page.locator("#password").fill("secret");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByRole("region", { name: "Cluster health" })).toBeVisible();
}

test.describe("Login and system feedback", () => {
  test.beforeEach(async ({ scenario }) => {
    await scenario({ role: "administrator", statsMode: "detailed-rates" });
  });

  test("renders a mobile dark Vietnamese login with accessible controls", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.addInitScript(() => {
      localStorage.setItem("rabbitlens.theme", "dark");
      localStorage.setItem("rabbitlens.locale", "vi");
    });

    await page.goto("/login");

    await expect(page.locator("html")).toHaveClass(/dark/);
    await expect(
      page.getByRole("heading", { name: "Kết nối RabbitMQ" }),
    ).toBeVisible();
    await expect(page.getByLabel("Tên người dùng")).toHaveAttribute(
      "autocomplete",
      "username",
    );
    await expect(page.locator("#password")).toHaveAttribute(
      "autocomplete",
      "current-password",
    );
    await page.getByRole("button", { name: "Hiện mật khẩu" }).click();
    await expect(page.locator("#password")).toHaveAttribute("type", "text");

    const accessibility = await new AxeBuilder({ page }).analyze();
    expect(accessibility.violations).toEqual([]);
    expect(
      await page.evaluate(
        () =>
          document.documentElement.scrollWidth <=
          document.documentElement.clientWidth,
      ),
    ).toBe(true);
  });

  test("shows a specific invalid-credentials error and clears the password", async ({
    page,
  }) => {
    await page.unroute("**/api/whoami");
    await page.route("**/api/whoami", (route) =>
      route.fulfill({ status: 401, json: { error: "not_authorised" } }),
    );
    await page.goto("/login");

    await page.getByLabel("Username").fill("operator");
    await page.locator("#password").fill("wrong-password");
    await page.getByRole("button", { name: "Sign in" }).click();

    await expect(page.getByRole("alert")).toContainText(
      "RabbitMQ rejected these credentials.",
    );
    await expect(page.locator("#password")).toHaveValue("");
  });

  test("keeps context while offline and clears the banner after reconnect", async ({
    context,
    page,
  }) => {
    await signIn(page);

    try {
      await context.setOffline(true);
      await expect(page.getByRole("alert")).toContainText("You are offline");
    } finally {
      await context.setOffline(false);
    }

    await expect(page.getByText("You are offline")).toHaveCount(0);
  });

  test("confirms a destructive mutation and reports success", async ({ page }) => {
    await page.route("**/api/connections?*", (route) =>
      route.fulfill({
        json: {
          items: [connection],
          filtered_count: 1,
          item_count: 1,
          page: 1,
          page_count: 1,
          page_size: 100,
          total_count: 1,
        },
      }),
    );
    await page.route("**/api/connections/**", (route) =>
      route.fulfill({ status: 204 }),
    );
    await signIn(page);
    await navigateTo(page, "Connections");

    await page
      .getByRole("button", { name: `Actions for ${connection.name}` })
      .click();
    await page.getByRole("menuitem", { name: "Force close" }).click();
    const dialog = page.getByRole("alertdialog", {
      name: "Force close connection",
    });
    await expect(dialog).toBeVisible();
    await dialog.getByRole("button", { name: "Force close" }).click();

    await expect(page.getByText("Changes saved")).toBeVisible();
    await expect(dialog).toHaveCount(0);
  });
});
