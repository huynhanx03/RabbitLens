# RabbitLens code standards

## Boundaries and ownership

Follow the dependency direction defined in [architecture.md](architecture.md):

```text
app/routes -> features -> domains -> api/auth/config
```

- Routes own URL parsing, guards and page composition only.
- Features own one operator task and local interaction state.
- Domains own RabbitMQ schemas, API adapters, query options, cache keys and
  resource-level presentation.
- `components/shared` accepts props and callbacks; it never calls a RabbitMQ
  endpoint or imports a feature.
- `components/ui` contains design primitives only. Do not put product copy,
  domain types or API calls there.
- Extract a workflow only when one action is truly shared by two or more
  features. A workflow can depend on domains and components, never on a route
  or feature.

The domain-boundary test is the executable safeguard for these rules.

## TypeScript and React

- Prefer explicit domain schemas and inferred types over duplicated interfaces.
- Keep request construction in `*-api.ts`; keep query keys/options and cache
  invalidation in `*-query.ts`.
- Keep `*-view-model.ts` pure: no React hooks or router imports.
- Use `import type` for type-only dependencies.
- Prefer a small extracted component with a direct regression test over a large
  page with unrelated local helpers.
- Do not introduce global state for server data; use the existing TanStack
  Query owner and cache key.

## UI, accessibility and i18n

- Use semantic design tokens and existing UI/shared components. Do not add a
  hard-coded palette to a feature.
- Use native controls before ARIA. Every icon-only control needs an accessible
  name; every form control needs a visible or programmatic label.
- Preserve keyboard operation, focus management and destructive-action
  confirmation when extracting or restyling a component.
- A controlled dialog must clear confirmation values, selections and local
  validation when its `open` prop becomes false. Do not rely only on a local
  button or dialog callback: a parent can close it externally.
- Use `useResetOnClose` for this policy. It resets only on an open-to-closed
  transition, so a form reset cannot loop while a controlled dialog remains
  closed.
- All user-visible copy uses `t(...)` with matching English and Vietnamese
  locale keys. Never concatenate translated fragments to form a sentence.

## Tests and changes

- Add a focused test before changing production behavior. Test the visible
  contract rather than implementation details.
- Use the narrowest layer that proves the contract: utility/schema, API/query,
  component, route, then E2E for a changed operator workflow.
- Cover success plus relevant empty/loading/error, authorization, destructive,
  keyboard and mobile states.
- For a controlled dialog with local form state, test an external close and
  reopen after a valid or invalid interaction; the next session must start
  clean.
- Keep mocks aligned with the public `ManagementApiClient` contract; avoid
  mocks that silently accept an incorrect request signature.
- New changed first-party production code must pass the PR changed-line
  coverage gate (minimum 85%).

## Local quality bar

Before opening a PR, run the commands in [contributing.md](contributing.md).
At minimum: format, lint, typecheck, unit tests and changed-file coverage.
Use Conventional Commits; pre-commit formatting/linting and commit-message
validation are installed through Husky.
