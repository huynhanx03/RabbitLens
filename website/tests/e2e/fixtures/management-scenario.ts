import { test as base } from "@playwright/test";

export type ScenarioOptions = {
  role?: "administrator" | "monitoring" | "policymaker" | "management" | "none";
  vhosts?: string[];
  statsMode?: "disabled" | "queue-totals-only" | "no-rates" | "basic-rates" | "detailed-rates";
  plugins?: string[];
  networkFlaky?: boolean;
};

export const test = base.extend<{
  scenario: (options: ScenarioOptions) => Promise<void>;
}>({
  scenario: async ({ page }, use) => {
    await use(async (options: ScenarioOptions) => {
      // Base config mock
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

      // User mock based on role
      await page.route("**/api/whoami", async (route) => {
        const tags = options.role && options.role !== "none" ? [options.role] : [];
        await route.fulfill({
          json: {
            name: "operator",
            tags,
            is_internal_user: true,
          },
        });
      });

      // Overview mock based on statsMode
      await page.route("**/api/overview", async (route) => {
        let disable_stats = false;
        let rates_mode = "detailed";
        let enable_queue_totals = false;

        switch (options.statsMode) {
          case "disabled":
            disable_stats = true;
            break;
          case "queue-totals-only":
            disable_stats = true;
            enable_queue_totals = true;
            break;
          case "no-rates":
            rates_mode = "none";
            break;
          case "basic-rates":
            rates_mode = "basic";
            break;
          case "detailed-rates":
            rates_mode = "detailed";
            break;
        }

        await route.fulfill({
          json: {
            rabbitmq_version: "4.4.0",
            erlang_version: "28.0",
            management_version: "4.4.0",
            cluster_name: "rabbit@localhost",
            disable_stats,
            rates_mode,
            enable_queue_totals,
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

      // Plugins/Extensions mock
      await page.route("**/api/extensions", async (route) => {
        const ext = (options.plugins || []).map((p) => ({ javascript: `${p}.js` }));
        await route.fulfill({ json: ext });
      });

      // Vhosts mock
      await page.route("**/api/vhosts", async (route) => {
        const vhosts = options.vhosts || ["/"];
        await route.fulfill({
          json: vhosts.map((name) => ({ name })),
        });
      });

      // Nodes mock
      await page.route("**/api/nodes", async (route) => {
        await route.fulfill({ json: [{ name: "rabbit@localhost", type: "disc", running: true }] });
      });

      // Flaky network (e.g. abort 1/3 of requests)
      if (options.networkFlaky) {
        let reqCount = 0;
        await page.route("**/api/**", async (route, request) => {
          if (request.url().includes("whoami")) return route.continue();
          reqCount++;
          if (reqCount % 3 === 0) {
            await route.abort("internetdisconnected");
          } else {
            await route.continue();
          }
        });
      }
    });
  },
});
