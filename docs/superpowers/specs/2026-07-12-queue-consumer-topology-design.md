# Queue Detail Consumer Topology Design

**Date:** 2026-07-12
**Status:** Approved in conversation
**Scope:** Queue Detail only

## Summary

Queue Detail will become a topology-first page that answers, in order:

1. How is this queue declared?
2. From which exchanges and binding keys does it receive messages?
3. What is its current backlog and backlog history?
4. Which consumers are attached?
5. Which advanced diagnostics are available when troubleshooting?

The page will remove **Message rates history**, retain **Message counts history**, restore queue declaration arguments, and replace the duplicated bottom binding table with consumer-route cards that remain fully manageable.

The UI will report the broker's actual topology. It will not invent application-only names such as `CONSUMERS.pentest`, publisher identities, or publisher defaults such as `DELIVERY_MODE: 2`, because RabbitMQ does not persist those as queue topology.

## Goals

- Make the selected queue's consumer configuration understandable without navigating between Queue, Exchange, and Binding pages.
- Show queue, exchange, and binding declaration fields with explicit labels and unambiguous boolean values.
- Preserve every explicit incoming binding; never collapse a many-binding topology to a single routing key.
- Keep current backlog and backlog history visible for operational monitoring.
- Reduce duplicate content, API payload, and component responsibilities.
- Preserve RabbitMQ Management permissions and existing safe mutation flows.
- Keep partial data useful when one supporting request fails.

## Non-goals

- Reconstructing the application's original YAML hierarchy or aliases.
- Inferring publisher identity, publisher routing defaults, or `delivery_mode` from topology.
- Traversing arbitrary upstream exchange-to-exchange graphs.
- Redesigning Exchange Detail in the same change.
- Performing the repository-wide performance and clean-architecture optimization track in this feature. That work will receive its own evidence-driven design and plan after this scoped feature.

## Broker Semantics

The topology view joins three Management API resources:

| Information | Source |
| --- | --- |
| Queue name, vhost, type, durable, auto-delete, exclusive, arguments, node, policy, current counts, count samples | `GET /api/queues/{vhost}/{queue}` |
| Source exchange, destination queue, routing key, binding arguments, binding identity | `GET /api/queues/{vhost}/{queue}/bindings` |
| Source exchange type, durable, auto-delete, internal, arguments | `GET /api/exchanges/{vhost}/{exchange}` |

A queue has an array of bindings, not one routing key. Topic binding keys such as `scan.#` are filters, not proof that a publisher sends that literal key. Empty routing keys are valid and must render as `""`, not as missing data.

The default exchange uses an empty broker name and provides an implicit binding whose key is the queue name. The page will classify this as a system binding, keep it out of deployment-like explicit routes, and expose it through a collapsed **System bindings** disclosure.

Queue and exchange durability describe topology survival. Message `delivery_mode` is a per-message publisher property and will not appear in the topology configuration.

References:

- [RabbitMQ HTTP API: queue and binding operations](https://www.rabbitmq.com/docs/4.2/http-api-reference#queue-and-binding-operations)
- [RabbitMQ default exchange](https://www.rabbitmq.com/docs/4.2/exchanges#default-exchange)
- [RabbitMQ durability](https://www.rabbitmq.com/docs/4.2/queues#durability)
- [RabbitMQ message properties](https://www.rabbitmq.com/docs/4.2/publishers#message-properties)

## Page Structure

### 1. Header

The header keeps the queue name, vhost, type, node, state, and declaration badges. Labels in the configuration section remain the source of truth; badges are only a summary.

Actions are grouped by frequency:

- **Publish message** remains the primary action.
- Conditional operational actions such as Move messages, Purge, Synchronize mirrors, and Cancel synchronization live in a secondary action group.
- Remove remains destructive and always requires confirmation.

### 2. Configuration

The first content section uses the approved topology-first layout.

#### Queue declaration

The declaration card shows:

- Name
- Virtual host
- Type
- Durable as Yes, No, or Unavailable
- Auto delete as Yes, No, or Unavailable
- Exclusive as Yes, No, or Unavailable
- Arguments, including an explicit empty object
- Node when supplied by RabbitMQ

`false` must render as **No**. Missing API data must render as **Unavailable**; it must not be confused with `false`.

#### Consumer routes

Each explicit incoming binding renders as a route:

```text
source exchange → binding key → selected queue
```

The exchange node shows name, type, durability, and exchange arguments. The route shows the binding key and binding arguments. The queue node identifies the selected destination.

The route list supports:

- Multiple exchanges bound to one queue.
- Multiple bindings from the same exchange.
- Empty binding keys.
- Exchange types whose routing semantics differ, including fanout and headers.
- Add binding through the existing permission-aware dialog.
- Remove binding through the existing destructive confirmation.

The bottom Queue Bindings table is removed because it duplicates these routes. Exchange Detail keeps its existing binding tables.

Implicit default-exchange bindings appear only inside a collapsed **System bindings** disclosure and are clearly labeled as broker-managed.

### 3. Live State

A compact metric row shows current values:

- Ready
- Unacknowledged
- Total
- Consumers
- Consumer capacity

The current `Properties` card is removed. Its fields move to the appropriate declaration, live-state, or advanced section.

### 4. Message Counts History

The Ready, Unacknowledged, and Total history chart remains directly below Live State. It continues to respect RabbitMQ statistics capability and availability messaging.

Message rates history is removed entirely from Queue Detail:

- No publish, deliver/get, or acknowledgement history chart.
- No queue detail request for `msg_rates` samples.
- No queue-detail-only message-rate series transformation.

Rate columns on the Queue list are unaffected.

### 5. Consumers

The consumer table remains visible and follows Message Counts History. It is the primary runtime answer to which workers are attached to the queue.

For stream queues, the existing stream publisher information remains conditional and appears with the other runtime participants. Classic and quorum queues do not render an empty stream-publisher section.

### 6. Advanced

Rarely needed diagnostics are collapsed by default:

- Message Inspector
- Effective policy and operator policy details
- Replication membership and status

If replication is unhealthy, a visible warning is promoted to Live State while the detailed membership remains under Advanced. This prevents a clean layout from hiding an operationally important fault.

## Data Model and Component Boundaries

The page component will orchestrate sections but will not assemble topology presentation data inline.

The feature introduces this queue-topology view-model contract:

```ts
type QueueTopologyRoute = {
  binding: Binding;
  exchange: Exchange | null;
  isImplicitDefault: boolean;
  exchangeStatus: "loading" | "available" | "unavailable";
};

type QueueTopologyConfig = {
  queue: Queue;
  explicitRoutes: QueueTopologyRoute[];
  systemRoutes: QueueTopologyRoute[];
};
```

The implementation uses these focused feature files:

- `queue-topology-view-model.ts` contains the pure mapper that classifies bindings and joins cached exchange records.
- `queue-configuration-section.tsx` renders queue declaration fields.
- `queue-consumer-routes.tsx` renders and manages incoming bindings.
- `queue-live-state.tsx` renders current operational values.
- `queue-advanced-section.tsx` owns the collapsed diagnostic content.
- `queue-detail-page.tsx` orchestrates queries, mutations, and section order.

The existing generic Exchange binding UI remains independent. `queue-query.ts`, `binding-query.ts`, and `exchange-query.ts` expose shared query-options factories and mutation invalidation; Queue topology does not add a generic cross-resource presentation abstraction.

## Query and Cache Design

### Queue detail

The route loader and Queue Detail component use the same query-options factory and the same key. The key is derived only from request-shaping inputs: vhost, queue name, selected history range, and the requested `lengths` sample parameters.

Capability booleans that do not change the HTTP response are not appended to the cache key. The loader awaits or returns `ensureQueryData`, so a cold navigation produces one matching detail request rather than two unrelated cache entries.

Queue detail range parameters include only length/count history. `msg_rates` prefixes are removed from this route.

### Bindings

Consumer Routes uses the existing queue-binding query identity. Add and Remove mutations invalidate the queue's binding data and therefore refresh both route rendering and binding controls.

### Exchange declarations

The page derives unique non-empty source exchange names from explicit bindings and requests each exchange detail once with `disable_stats=true`. Cached exchange records are shared across duplicate bindings from the same source.

The implicit default exchange does not cause a separate exchange-detail request.

## Loading, Empty, and Error States

- Queue detail failure uses the existing page-level error behavior.
- Queue declaration renders as soon as Queue detail is available; it does not wait for every source exchange.
- Binding loading shows route skeletons within Consumer Routes.
- No explicit bindings shows a useful empty state and an Add binding action when permitted.
- If an exchange detail request fails, the route still shows source exchange name, binding key, destination queue, and binding arguments. Exchange type, durability, and arguments render as Unavailable with a retry action.
- An empty routing key renders explicitly as `""`.
- Empty arguments render as `{}` so absence and loading are not conflated.
- Readable topology remains visible regardless of mutation permission. Because user tags do not reliably encode per-vhost configure permissions, Add/Remove controls retain their current visibility and display Management API `401`/`403` errors in the existing dialog error treatment.

## Accessibility and Localization

- All new labels are added in English and Vietnamese.
- Route arrows are decorative; the accessible route label reads the complete relationship in words.
- Yes, No, Unavailable, Explicit binding, and System binding use localized text rather than color alone.
- Collapsible Advanced and System bindings controls expose expanded state and keyboard operation.
- Destructive binding and queue actions retain confirmation dialogs and accessible names.

## Testing Strategy

### Pure unit tests

- Classify the implicit default binding separately.
- Preserve multiple explicit bindings from one exchange.
- Preserve empty routing keys and binding arguments.
- Join one cached exchange declaration to multiple bindings.
- Represent partial exchange-detail failure without dropping the route.

### Component tests

- Render queue declaration fields, including true, false, unavailable, and non-empty arguments.
- Render exchange type, durability, routing key, and arguments in Consumer Routes.
- Keep system bindings collapsed and correctly labeled.
- Verify Add/Remove binding actions retain their dialogs and invalidation behavior.
- Verify Message counts history remains visible.
- Verify Message rates history is absent.
- Verify unhealthy replication promotes a visible warning.
- Verify Message Inspector and advanced policy details are collapsed by default and accessible when expanded.

### Query and route tests

- Verify Queue detail history parameters request `lengths` but not `msg_rates`.
- Verify loader and page share the same query key and produce one cold-navigation queue-detail request.
- Verify unique source exchanges produce one declaration request each.
- Verify the default exchange produces no declaration request.

### Regression checks

- English/Vietnamese translation parity.
- TypeScript, lint, unit tests, production build, and bundle budget.
- A focused Playwright request-count assertion for cold Queue Detail navigation.

## Success Criteria

- Opening a queue shows its complete broker-side consumer topology without navigating to Exchange Detail.
- The sample `pentest.response` topology visibly maps exchange `pentest.response`, kind `topic`, durable state, routing key `scan.#`, and queue declaration fields.
- Multiple bindings remain distinct and understandable.
- Queue arguments are visible again.
- Message counts history remains available; message rates history does not.
- Queue Detail no longer requests `msg_rates` samples.
- A cold Queue Detail navigation does not duplicate the same queue-detail HTTP request through mismatched React Query keys.
- Existing queue mutations, message operations, permissions, and conditional queue-type features remain functional.

## Follow-up System Optimization Track

The separate system-wide audit will begin from the high-confidence findings already identified:

1. Unify loader/component query options for Queue, Exchange, and Connection detail routes.
2. Remove App Shell's unnecessary blocking dependency and polling subscription to Overview where safe.
3. Measure and address unbounded, polling binding tables for high-cardinality brokers.
4. Make the bundle-budget verifier measure the transitive initial import graph.

Each optimization will require a before/after measurement and its own scoped implementation plan. Speculative broad refactors are excluded.
