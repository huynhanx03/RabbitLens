import { expect } from "@playwright/test";
import { test } from "./fixtures/management-scenario";

test.describe("OAuth Tests", () => {
  test("Basic fallback works when OAuth is available", async ({ page }) => {
    await page.route("**/runtime-config.json", async (route) => {
      await route.fulfill({
        json: {
          apiBaseUrl: "/api",
          auth: { 
            basic: true, 
            oauth: { 
              resources: [{ id: "test-idp", label: "Test IdP", authority: "https://idp.local", clientId: "client", redirectUri: "http://localhost:5173/oauth/callback", scopes: ["openid"] }] 
            } 
          },
          defaultLocale: "en",
          defaultTheme: "system",
        },
      });
    });
    await page.route("**/api/whoami", (route) =>
      route.fulfill({ json: { name: "operator", tags: ["administrator"] } }),
    );
    await page.route("**/api/overview", (route) =>
      route.fulfill({
        json: {
          cluster_name: "rabbitlens-demo",
          rabbitmq_version: "4.4.0",
          erlang_version: "28.0",
          management_version: "4.4.0",
          disable_stats: false,
          rates_mode: "detailed",
          enable_queue_totals: false,
          object_totals: {
            connections: 0,
            channels: 0,
            exchanges: 0,
            queues: 0,
            consumers: 0,
          },
          message_stats: {},
        },
      }),
    );
    await page.route("**/api/extensions", (route) => route.fulfill({ json: [] }));
    await page.route("**/api/nodes", (route) => route.fulfill({ json: [] }));

    await page.goto("/login");

    await expect(page.getByRole("button", { name: "Test IdP" })).toBeVisible();
    await page.getByLabel("Username").fill("operator");
    await page.locator("#password").fill("secret");
    await page.getByRole("button", { name: "Sign in" }).click();
    
    await expect(page.getByRole("heading", { name: "Overview" })).toBeVisible();
  });
});
