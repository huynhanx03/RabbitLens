# Contributing to RabbitLens

Read [the code standards](code-standards.md), [design system](design-system.md)
and [architecture guide](architecture.md) before changing production code.

## Local quality checks

Run `npm ci` from `website`, then use `npm run check` before opening a pull request. Run `npm run test:e2e` for browser-impacting changes. Use `npm run test:pr-coverage -- main` to validate changed-file coverage locally.

## Code boundaries

- `components/ui` contains UI primitives; do not add domain behaviour there.
- `components/shared` contains reusable operator patterns. Promote a component
  there only after at least two features need the same interaction; pass labels,
  data and callbacks as props, and keep resource/query knowledge in the feature.
- `features` own domain UI and cannot import another feature.
- API serialization, schemas and query helpers live in `api` or `domains` and need direct tests.
- Use semantic tokens and translated strings; do not introduce a hard-coded palette or user-facing copy.

## Accessibility and tests

Use native controls before ARIA. Icon-only controls require an accessible name. New behavior needs a focused unit/component/route test; changed user flows also require a Playwright scenario. Test success, empty/loading, authorization/error, keyboard and mobile cases relevant to the change.

## Commits and pull requests

Use Conventional Commits, for example `feat(queues): add message retry action` or `fix(auth): preserve safe redirect`. The pre-commit hook formats and lints staged supported files; commit-msg validates the message. Keep changes focused and ensure the PR description explains operator impact and test evidence.
