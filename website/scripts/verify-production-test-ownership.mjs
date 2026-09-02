import { readdirSync } from "node:fs";
import { extname, join } from "node:path";

const owners = {
  "src/app/app.tsx": "app-shell and router integration tests",
  "src/app/layout/app-brand.tsx": "brand-logo and visual-contract tests",
  "src/app/navigation/navigation-types.ts": "navigation-registry type contract",
  "src/app/providers/theme-context.ts": "theme-provider integration test",
  "src/app/resolve-list-path.ts": "router and list-page integration tests",
  "src/app/routes/__root.tsx": "router, shell, and E2E route coverage",
  "src/app/routes/_authenticated.tsx": "router, permission, and E2E route coverage",
  "src/app/routes/_authenticated/admin/cluster.tsx": "cluster page and E2E route coverage",
  "src/app/routes/_authenticated/admin/definitions.tsx":
    "definition admin page and E2E route coverage",
  "src/app/routes/_authenticated/admin/deprecated-features.tsx":
    "deprecated-feature page and E2E route coverage",
  "src/app/routes/_authenticated/admin/feature-flags.tsx":
    "feature-flag page and E2E route coverage",
  "src/app/routes/_authenticated/admin/limits.tsx": "limit page and E2E route coverage",
  "src/app/routes/_authenticated/admin/limits/index.tsx": "limit list page and E2E route coverage",
  "src/app/routes/_authenticated/admin/policies/$vhost/$name.tsx":
    "policy detail page and E2E route coverage",
  "src/app/routes/_authenticated/admin/policies/index.tsx":
    "policy list page and E2E route coverage",
  "src/app/routes/_authenticated/admin/route.tsx": "admin boundary and permission E2E coverage",
  "src/app/routes/_authenticated/admin/users/$name.tsx": "user detail page and E2E route coverage",
  "src/app/routes/_authenticated/admin/users/index.tsx": "user list page and E2E route coverage",
  "src/app/routes/_authenticated/admin/vhosts/$name.tsx":
    "vhost detail page and E2E route coverage",
  "src/app/routes/_authenticated/admin/vhosts/index.tsx": "vhost list page and E2E route coverage",
  "src/app/routes/_authenticated/channels/$name.tsx": "channel detail page and E2E route coverage",
  "src/app/routes/_authenticated/channels/index.tsx": "channel list page and E2E route coverage",
  "src/app/routes/_authenticated/connections/$name.tsx":
    "connection detail page and E2E route coverage",
  "src/app/routes/_authenticated/connections/index.tsx":
    "connection list page and E2E route coverage",
  "src/app/routes/_authenticated/exchanges/$vhost.$name.tsx":
    "exchange detail page and E2E route coverage",
  "src/app/routes/_authenticated/exchanges/index.tsx": "exchange list page and E2E route coverage",
  "src/app/routes/_authenticated/extensions/federation/status.tsx":
    "federation status page and E2E route coverage",
  "src/app/routes/_authenticated/extensions/federation/upstreams/$vhost.$name.tsx":
    "federation upstream detail and E2E route coverage",
  "src/app/routes/_authenticated/extensions/federation/upstreams/index.tsx":
    "federation upstream list and E2E route coverage",
  "src/app/routes/_authenticated/extensions/shovels/management/$vhost.$name.tsx":
    "shovel detail page and E2E route coverage",
  "src/app/routes/_authenticated/extensions/shovels/management/index.tsx":
    "shovel management page and E2E route coverage",
  "src/app/routes/_authenticated/extensions/shovels/status.tsx":
    "shovel status page and E2E route coverage",
  "src/app/routes/_authenticated/extensions/streams/connections/$vhost.$name.tsx":
    "stream connection detail and E2E route coverage",
  "src/app/routes/_authenticated/extensions/streams/connections/index.tsx":
    "stream connection list and E2E route coverage",
  "src/app/routes/_authenticated/extensions/streams/super-streams.tsx":
    "super-stream page and E2E route coverage",
  "src/app/routes/_authenticated/extensions/top/ets.tsx": "ETS table page and E2E route coverage",
  "src/app/routes/_authenticated/extensions/top/index.tsx": "top page and E2E route coverage",
  "src/app/routes/_authenticated/extensions/top/process/$pid.tsx":
    "top process detail and E2E route coverage",
  "src/app/routes/_authenticated/extensions/tracing/$node.$vhost.$name.tsx":
    "trace detail page and E2E route coverage",
  "src/app/routes/_authenticated/extensions/tracing/index.tsx":
    "tracing page and E2E route coverage",
  "src/app/routes/_authenticated/index.tsx": "overview page and shell E2E coverage",
  "src/app/routes/_authenticated/nodes/$name.tsx": "node detail page and E2E route coverage",
  "src/app/routes/_authenticated/nodes/index.tsx": "nodes page and E2E route coverage",
  "src/app/routes/_authenticated/queues/$vhost.$name.tsx":
    "queue detail route and E2E route coverage",
  "src/app/routes/_authenticated/queues/index.tsx": "queue list page and E2E route coverage",
  "src/app/routes/login.tsx": "login form and accessibility E2E coverage",
  "src/app/routes/oauth.callback.tsx": "OAuth callback route test",
  "src/app/routes/oauth.logout-callback.tsx": "OAuth callback route test",
  "src/app/routes/oauth.silent-callback.tsx": "OAuth callback route test",
  "src/auth/auth-provider.tsx": "auth context, store, and app-shell integration tests",
  "src/auth/auth-session.ts": "auth store and OAuth manager tests",
  "src/auth/permissions/action-policy.ts": "permission decision and gate tests",
  "src/capabilities/capability-schema.ts": "capability API and registry tests",
  "src/config/runtime-config-provider.tsx": "runtime-config context integration test",
  "src/config/runtime-config-schema.ts": "runtime-config parser test",
  "src/domains/admin/cluster/cluster-query.ts": "cluster API and page query tests",
  "src/domains/admin/limits/limit-schema.ts": "limit API and form tests",
  "src/domains/bindings/binding-columns.tsx": "binding list and create-binding dialog tests",
  "src/domains/bindings/binding-list.tsx": "binding query and create-binding dialog tests",
  "src/domains/channels/channel-columns.tsx": "channel list and detail page tests",
  "src/domains/channels/channel-query.ts": "channel list and detail page tests",
  "src/domains/connections/connection-keys.ts": "connection query and list-page tests",
  "src/domains/extensions/extension-query.ts": "extension API and route-guard tests",
  "src/domains/extensions/federation/federation-upstream-query.ts":
    "federation upstream API and page tests",
  "src/domains/extensions/shovels/shovel-parameter-query.ts":
    "shovel parameter API and management page tests",
  "src/domains/extensions/streams/stream-query.ts": "stream API and page tests",
  "src/extensions/extension-descriptor.ts": "extension registry and route-guard tests",
  "src/features/admin/admin-navigation.ts": "admin layout and UI boundary tests",
  "src/features/exchanges/exchange-columns.tsx": "exchange list and detail page tests",
  "src/features/queues/queue-columns.tsx": "queue list and detail page tests",
  "src/features/users/permission-form.tsx": "permission-forms integration test",
  "src/features/users/topic-permission-form.tsx": "permission-forms integration test",
  "src/i18n/locales/en.ts": "i18n resource contract",
  "src/i18n/locales/vi.ts": "i18n resource contract",
  "src/i18n/resources.ts": "i18n resource contract",
  "src/lib/utils.ts": "shared component integration tests",
  "src/main.tsx": "production build entry-point verification",
};

function walk(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory() ? walk(join(directory, entry.name)) : [join(directory, entry.name)],
  );
}

const files = walk("src");
const fileSet = new Set(files);
const isExcluded = (path) =>
  path.startsWith("src/test/") ||
  path.startsWith("src/components/ui/") ||
  path.endsWith(".d.ts") ||
  path.endsWith("route-tree.gen.ts") ||
  /\.test\.[tj]sx?$/.test(path);
const withoutSameStem = files
  .filter((path) => [".ts", ".tsx"].includes(extname(path)) && !isExcluded(path))
  .filter((path) => {
    const stem = path.replace(/\.(ts|tsx)$/, "");
    return !fileSet.has(`${stem}.test.ts`) && !fileSet.has(`${stem}.test.tsx`);
  })
  .sort();
const unowned = withoutSameStem.filter((path) => !(path in owners));
const staleOwners = Object.keys(owners).filter((path) => !withoutSameStem.includes(path));

if (unowned.length || staleOwners.length) {
  if (unowned.length) console.error(`Missing owners:\n${unowned.join("\n")}`);
  if (staleOwners.length) console.error(`Stale owners:\n${staleOwners.join("\n")}`);
  process.exitCode = 1;
} else {
  console.log(`✅ ${withoutSameStem.length} indirect production-test owners are documented.`);
}
