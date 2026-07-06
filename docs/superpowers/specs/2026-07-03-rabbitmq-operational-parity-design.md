# RabbitMQ Operational Parity Design

## Goal

Bring RabbitLens to operational parity with the bundled RabbitMQ Management UI while preserving its modern frontend architecture. Operators must be able to complete routine administration, topology management, protocol inspection, troubleshooting, and optional-plugin workflows without returning to the legacy UI.

Operational parity deliberately excludes low-value internal Erlang diagnostics whose primary audience is RabbitMQ core development. It includes broker health signals and diagnostics that help an operator identify saturation, churn, persistence, networking, replication, or client problems.

## Compatibility target

- Treat the bundled `rabbitmq-server` source as the canonical behavior reference.
- Support that RabbitMQ release and the two preceding major release families where their Management API exposes equivalent capabilities.
- Detect support from endpoints and response shape instead of branching on hard-coded RabbitMQ version strings.
- Accept documented optional, nullable, and release-dependent response fields without weakening stable fields or using untyped production values.
- Preserve unknown response fields at schema boundaries when they may be useful for forward compatibility, but expose typed view models to UI components.

## Architecture

RabbitLens remains a frontend-only application. It connects to the existing RabbitMQ Management HTTP API through the current same-origin proxy and does not introduce a RabbitLens backend.

Operational parity is governed by a central capability matrix. Each capability records its owning core area or plugin, required RabbitMQ access level, probe strategy, frontend route, Management API operations, UI surfaces, compatibility notes, and automated evidence. This matrix becomes the source of truth for navigation visibility and parity validation.

API paths, request bodies, and response schemas remain in `website/src/domains`. Features consume typed queries and mutations rather than constructing Management API URLs. Shared operational concepts such as consumers, AMQP values, replication members, protocol sessions, and diagnostics use reusable components and view models.

## Broker capability discovery

Introduce a typed `BrokerCapabilities` model with these responsibilities:

- Record core capabilities that are always expected from a compatible Management API.
- Record optional extension availability for Federation, Shovel, Streams, Top, and Tracing.
- Record narrower capabilities when a plugin or RabbitMQ release exposes only part of a feature, such as stream connections without super-stream management.
- Distinguish unavailable, forbidden, temporarily unavailable, and malformed responses.
- Cache discovery for the authenticated session and invalidate it after authentication identity changes.

Discovery starts with the existing overview/bootstrap data and RabbitMQ extension metadata. A plugin-specific endpoint is probed only when extension metadata is insufficient. Probes are lightweight, cancellable, deduplicated by TanStack Query, and never run continuously.

Unavailable extensions are omitted from the sidebar, command menu, and extension landing navigation. Direct navigation to an unavailable extension route renders a localized unavailable state instead of a generic request error. A forbidden endpoint does not imply that the plugin is disabled; it produces a permission state appropriate to the authenticated user.

## Authentication and authorization

- Continue using RabbitMQ as the authority for Basic and OAuth/OIDC authentication.
- Use RabbitMQ user tags to hide actions that are known to require administrator, policymaker, monitoring, or management access.
- Treat backend `403` responses as authoritative because vhost permissions and plugin-specific authorization can be narrower than user tags.
- Never infer that a plugin is absent from a `401` or `403` response.
- Preserve the current secret-handling boundary: credentials and tokens must not be persisted in test artifacts, URLs, logs, or error copy.

## Operational feature scope

### Connections and AMQP protocols

- Preserve list, filtering, pagination, detail, rate charts, client properties, and forced close.
- Show network endpoints, connected time, timeout/heartbeat, frame and channel limits, authentication mechanism, protocol, user, vhost, node, and TLS details when supplied.
- Continue showing channels for AMQP 0-9-1 connections.
- Detect AMQP 1.0 and Web AMQP 1.0 connections and show sessions instead of requesting channels.
- Show AMQP 1.0 session incoming/outgoing links, delivery counts, settlement state, credits, unsettled deliveries, consumer timeout indicators, and link addresses available from the API.

### Channels and consumers

- Preserve channel list, detail, rates, prefetch, confirm, transaction, and unacknowledged-message information.
- Show a reusable consumer table on channel detail with owner, queue, consumer tag, acknowledgement requirement, exclusivity, prefetch, active/activity status, timeout, and arguments.
- Show release-dependent channel operational fields, including pending Raft commands and cached segments, only when present.
- Keep expensive or detailed rate sections capability-aware and suppress them when RabbitMQ statistics collection is disabled.

### Queues

- Preserve create, list, filter, detail, delete, purge, get messages, bindings, queue-type selection, and arbitrary typed arguments.
- Add direct publish from queue detail by publishing to the default exchange with the queue name as the routing key.
- Show policy, operator policy, effective policy definition, exclusive owner, consumer capacity, and queue-type-specific properties.
- Show leader, members, online members, and quorum availability for quorum and stream queues when returned by the API.
- Show the reusable consumer table on queue detail.
- Support queue actions exposed by the compatible Management API and relevant to the queue type, including synchronization actions when present. Action visibility is derived from queue properties and capability data.
- Add a focused Move Messages workflow that creates the same temporary dynamic shovel behavior as the legacy UI when the Shovel Management capability is available. It is hidden otherwise.
- Show operational queue runtime metrics only when present and useful for troubleshooting; raw internal structures remain collapsible rather than dominating the page.

### Exchanges and bindings

- Preserve exchange create/delete, typed arguments, publish, incoming/outgoing bindings, and binding create/delete.
- Retain support for the default exchange and plugin-defined exchange types returned by RabbitMQ.
- Present publish routing results and backend validation errors without closing the form or discarding the payload.

### Nodes and cluster operations

- Preserve node list/detail, alarms, memory, disk, file/socket descriptors, process usage, applications, plugins, cluster links, log/config files, binary-memory opt-in, cluster naming, and statistics reset.
- Add operator-focused persistence statistics: schema-store transactions, queue-index operations, and message-store reads/writes.
- Add I/O operation counts, byte rates, and average operation latency.
- Add connection, channel, and queue churn.
- Show values only when statistics mode and the response support them; do not synthesize misleading zeros for unavailable data.
- Exclude exhaustive Erlang VM internals that do not drive an operator decision and remain available through RabbitMQ Top or external monitoring.

### Administration

- Preserve users, password/tag changes, deletion, own-password behavior, vhosts, vhost restart/delete, standard permissions, topic permissions, policies, operator policies, user/vhost limits, feature flags, deprecated features, definitions import/export, cluster name, and statistics reset.
- Keep mutation controls permission-aware and require confirmation for destructive or cluster-wide actions.
- Preserve API error detail that is safe and actionable, including validation conflicts and protected resources.

### Streams

- Keep stream connection list/detail with publishers and consumers.
- Preserve super-stream creation by partition count or binding keys.
- Manage the generated queues and exchange through the existing topology pages. The bundled Super Stream endpoint supports `PUT` and `OPTIONS` only, so RabbitLens does not claim unsupported list, detail, or delete operations.
- Show stream publishers on stream queue detail through `/stream/publishers/:vhost/:queue`.
- Hide all Streams navigation when stream management capability is unavailable.

### Federation, Shovel, Top, and Tracing

- Preserve existing status, management, restart, create/update/delete, process, ETS, trace, and trace-file workflows.
- Drive all extension navigation and direct-route states from capability discovery.
- Reuse the Shovel domain API for Move Messages rather than creating queue-specific HTTP code.

## Data flow and polling

- TanStack Query owns request caching, cancellation, retries, and invalidation.
- List polling uses the existing heavier interval; entity details use the existing detail interval.
- Polling pauses while the document is hidden and resumes when visible.
- Capability discovery is session-scoped and is not polled.
- Mutations invalidate only affected resources and related summaries rather than the entire query cache.
- Navigation, range changes, filters, and logout abort obsolete requests.
- A resource that disappears between polls is represented as a typed not-found state with a return-to-list action.

## Error model

Normalize Management API failures into user-relevant categories:

- `unauthenticated`: clear or renew the session through the existing auth flow.
- `forbidden`: show the localized permission state and keep unrelated navigation usable.
- `not-found`: explain that the resource may have closed or been deleted and offer navigation back.
- `capability-unavailable`: hide optional navigation and show a direct-route unavailable state.
- `conflict` or `validation`: retain the form and show RabbitMQ's safe validation message.
- `temporarily-unavailable`: preserve stale data when possible and offer retry.
- `unsupported-response`: identify the endpoint and compatibility context in development diagnostics while showing safe user copy.

Polling failures must not replace valid stale data with a full-page error. Repeated transient failures may surface a non-blocking stale-data warning.

## UI composition

- Preserve the current shell, themes, localization, responsive behavior, and fixed desktop sidebar.
- Keep list pages compact and action-oriented; entity identity and contextual actions remain in detail headers.
- Reuse `DataTable`, `SectionCard`, `DetailGrid`, `DefinitionList`, `StatusBadge`, `ConfirmDialog`, `MutationErrorAlert`, and `AsyncState`.
- Add focused shared components for consumer tables, replication state, AMQP 1.0 sessions/links, capability-unavailable states, and optional diagnostic series.
- Avoid raw JSON for primary operational data. Raw forward-compatible fields may appear only in an explicitly secondary disclosure.
- Every new label and error state ships in English and Vietnamese.

## Parity evidence

Replace page-only parity claims with capability-level evidence. Each manifest entry must identify:

- Legacy source route, action, or template section.
- RabbitLens route and UI surface.
- Management API endpoint and HTTP method.
- Required role or permission behavior.
- Core or plugin capability dependency.
- Unit, integration, or browser test evidence.
- Compatibility behavior for absent fields or endpoints.

The verifier must reject duplicate keys, missing source references, missing implementation/test files, uncovered legacy operational actions, and entries that claim coverage only because a parent page exists.

## Test strategy

- Follow red-green-refactor for each schema, API operation, query, view model, component, and page behavior.
- Use MSW tests for success, forbidden, not-found, plugin-unavailable, nullable-field, and older-response-shape cases.
- Test navigation generation for every extension capability combination.
- Test AMQP 0-9-1 channels and AMQP 1.0 sessions as distinct connection-detail paths.
- Test resource disappearance during polling without flaky timers or real sleeps.
- Add focused browser flows for queue operations, consumer inspection, move messages, super-stream creation, stream publishers, and optional-plugin hiding.
- Extend the RabbitMQ demo environment and smoke checks only where a real broker is required to prove API compatibility.
- Run lint, typecheck, unit tests, production build, parity verification, bundle budget, artifact-secret scan, targeted Playwright tests, and integrated RabbitMQ smoke checks before completion.

## Delivery decomposition

Implement the design as independently verifiable milestones:

1. Capability registry, discovery, navigation hiding, route guards, and error taxonomy.
2. Connection protocol details and AMQP 1.0 sessions/links.
3. Shared consumers and channel/queue operational details.
4. Queue publishing, type-specific actions, replication state, and Move Messages.
5. Node operational persistence, I/O, and churn diagnostics.
6. Super-stream list/detail/delete lifecycle.
7. Manifest expansion, compatibility fixtures, integrated smoke coverage, and final hardening.

Each milestone must leave the application buildable and testable. Existing user changes in the worktree must be preserved, and implementation commits must stage only files owned by the milestone.

## Success criteria

- An operator can complete every included operational workflow without opening the legacy Management UI.
- Optional extensions disappear automatically when unavailable and remain distinguishable from permission failures.
- RabbitMQ responses from the compatibility target do not fail because an optional field is missing or null.
- Ephemeral connections, channels, and queues disappearing during polling produce an intentional not-found experience.
- Parity evidence covers individual actions and data sections rather than only top-level pages.
- All new behavior is localized, permission-aware, responsive, accessible, and protected by automated tests.
