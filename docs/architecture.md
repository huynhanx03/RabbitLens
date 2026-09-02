# RabbitLens frontend architecture

RabbitLens follows a one-way dependency model. The rule keeps RabbitMQ
behaviour easy to find, makes query contracts independently testable, and
prevents a route change from quietly coupling unrelated operational screens.

```text
app / routes  ->  features  ->  domains  ->  api / auth / config
                    |              |
                    +--> shared <--+
```

## Ownership

| Area | Owns | Must not own |
| --- | --- | --- |
| `app` | bootstrapping, providers, layouts, navigation and route wiring | RabbitMQ resource UI or endpoint parsing |
| `app/routes` | URL parsing, guards and page-to-feature composition | business/query logic |
| `features` | one screen or a user task: local state, mutations and composition | schemas, transport clients or another feature |
| `domains/<resource>` | a RabbitMQ entity's schema, API adapter, query keys/options, view model and reusable entity presentation | app state or route ownership |
| `components/shared` | generic, domain-independent operator UI patterns | endpoint calls, domain queries or feature imports |
| `components/ui` | design-system primitives only | RabbitMQ behaviour or product copy |
| `api`, `auth`, `config` | cross-cutting platform contracts | page UI |

Promote UI to `components/shared` only when the interaction and accessibility
contract are reused by at least two features. A shared component receives data,
labels and success/error callbacks through props; it must not know a RabbitMQ
resource, construct endpoint payloads, or call a query hook. For example,
`ParameterManagementPage` owns the common parameter table/create/delete
interaction, while Shovels and Federation supply their resource-specific query
and mutation contracts. Cover the shared interaction once and retain a focused
feature test for each resource-specific mapping.

Use a `workflows/<name>` module only when a reusable action genuinely spans two
or more features. It may depend on `domains` and `components`, but never on a
feature or route. This keeps a cross-resource operation such as publishing or
binding creation explicit instead of creating feature-to-feature imports.

## File conventions

- `*-schema.ts`: runtime response/request contract, with malformed and boundary tests.
- `*-api.ts`: one typed RabbitMQ Management API adapter.
- `*-query.ts`: TanStack query keys/options/mutations and cache invalidation.
- `*-view-model.ts`: pure UI mapping, no React imports.
- `*-page.tsx`: a route-facing screen feature.
- `*-dialog.tsx` / `*-form.tsx`: a bounded interaction owned by that feature or workflow.
- `*.test.ts(x)`: colocated verification at the same boundary.

## Dependency checks

`src/domains/domain-boundaries.test.ts` enforces that UI features do not retain
transport/schema/query files and that generic shared components stay independent
of the Management API client. Before adding an import, follow the arrows above;
move the reusable concern to its owning layer rather than adding an exception.

## Migration status

The core entities (`overview`, `connections`, `channels`, `queues`, exchanges,
bindings, extensions and administration resources) already own their API/query
contracts under `domains`. Reused Consumer, Channel and Stream presentation is
also now colocated with its entity. The remaining cross-feature compositions are
being migrated to named workflows; they must not grow further.
