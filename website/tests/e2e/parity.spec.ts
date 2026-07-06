import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { expect } from "@playwright/test";
import { test } from "./fixtures/management-scenario";

type ParityEntry = {
  sourceKey: string;
  rabbitLensRoute: string;
  status: "covered" | "excluded";
};

const dirname = path.dirname(fileURLToPath(import.meta.url));
const manifestPath = path.join(dirname, "../../tests/parity/legacy-management-ui.json");

function paginated(items: unknown[] = []) {
  return {
    items,
    filtered_count: items.length,
    item_count: items.length,
    page: 1,
    page_count: items.length ? 1 : 0,
    page_size: 100,
    total_count: items.length,
  };
}

function apiFixture(pathname: string): unknown {
  if (pathname === "/api/connections" || pathname === "/api/channels") return paginated();
  if (pathname === "/api/exchanges" || pathname === "/api/queues") return paginated();
  if (pathname === "/api/users" || pathname === "/api/policies" || pathname === "/api/operator-policies") return [];
  if (pathname.includes("limits")) return [];
  if (pathname === "/api/feature-flags" || pathname === "/api/deprecated-features") return [];
  if (pathname === "/api/cluster-name") return { name: "rabbitlens-demo" };
  if (pathname.startsWith("/api/federation-links")) return [];
  if (pathname.startsWith("/api/shovels")) return [];
  if (pathname === "/api/parameters/federation-upstream") return [];
  if (pathname.startsWith("/api/parameters/federation-upstream/")) {
    return { component: "federation-upstream", vhost: "demo", name: "demo", value: { uri: "amqp://remote" } };
  }
  if (pathname === "/api/parameters/shovel") return [];
  if (pathname.startsWith("/api/parameters/shovel/")) {
    return { component: "shovel", vhost: "demo", name: "demo", value: { "src-uri": "amqp://source", "dest-uri": "amqp://destination" } };
  }
  if (pathname === "/api/stream/connections") return paginated();
  if (pathname.includes("/publishers") || pathname.includes("/consumers")) return [];
  if (pathname.startsWith("/api/stream/connections/")) {
    return { name: "demo", vhost: "demo", state: "running", protocol: "stream" };
  }
  if (pathname.startsWith("/api/top/ets/")) {
    return { node: "rabbit@localhost", row_count: 20, ets_tables: [] };
  }
  if (pathname.startsWith("/api/top/")) {
    return { node: "rabbit@localhost", row_count: 20, processes: [] };
  }
  if (pathname.startsWith("/api/process/")) {
    return { pid: "<0.123.0>", name: { name: "rabbit_reader" }, memory: 1, reductions: 0, message_queue_len: 0 };
  }
  if (pathname.startsWith("/api/traces/node/")) {
    return pathname.split("/").length > 5
      ? { vhost: "demo", name: "demo", format: "json", pattern: "#" }
      : [];
  }
  if (pathname.startsWith("/api/trace-files/node/")) return [];
  return [];
}

function concreteRoute(entry: ParityEntry): string {
  const names: Record<string, string> = {
    "stream-connection-detail": "demo",
    "top-process-detail": encodeURIComponent("<0.123.0>"),
  };
  return entry.rabbitLensRoute
    .replace(":node", encodeURIComponent("rabbit@localhost"))
    .replace(":vhost", "demo")
    .replace(":pid", names[entry.sourceKey] ?? encodeURIComponent("<0.123.0>"))
    .replace(":name", names[entry.sourceKey] ?? "demo");
}

test("every covered parity route renders without the generic request boundary", async ({
  page,
  scenario,
}) => {
  const manifest = JSON.parse(await fs.readFile(manifestPath, "utf-8")) as ParityEntry[];
  const covered = manifest.filter((entry) => entry.status === "covered");
  expect(covered.length).toBeGreaterThan(0);

  await page.route("**/api/**", async (route) => {
    const pathname = new URL(route.request().url()).pathname;
    await route.fulfill({ json: apiFixture(pathname) });
  });
  await scenario({
    role: "administrator",
    vhosts: ["demo"],
    plugins: ["federation", "shovel", "stream", "top", "tracing"],
  });

  await page.goto("/login");
  await page.getByLabel("Username").fill("operator");
  await page.locator("#password").fill("secret");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByRole("region", { name: "Cluster health" })).toBeVisible();

  const routes = new Map(
    covered.map((entry) => [concreteRoute(entry), entry.sourceKey]),
  );
  for (const [route, sourceKey] of routes) {
    await test.step(`${sourceKey}: ${route}`, async () => {
      await page.goto(route);
      await expect(page.locator("main, #main-content")).toBeVisible();
      await expect(page.getByText("RabbitMQ request failed", { exact: false })).toHaveCount(0);
      await expect(page.getByText("An unexpected error occurred", { exact: false })).toHaveCount(0);
    });
  }
});
