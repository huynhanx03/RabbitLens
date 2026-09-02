# RabbitLens Testing Strategy

RabbitLens protects operator workflows through a layered test suite.

1. **Utilities and schemas:** test empty, malformed, boundary and encoded values without a DOM.
2. **API and query adapters:** use MSW fixtures to test success, authorization, timeout and retry/error rendering.
3. **Components:** use Testing Library to exercise accessible names, keyboard input and visible state rather than implementation details.
4. **Routes:** verify anonymous/authenticated guards, redirect validation and error boundaries.
5. **E2E:** use Playwright management scenarios for login/connection states, navigation, mutation confirmation, mobile navigation and axe checks.

Run `npm run test` for unit/component/route tests, `npm run test:e2e` for browser coverage, and `npm run test:pr-coverage -- main` before a PR. The CI changed-file gate requires 85% line coverage for changed production sources, excluding generated router code and foundational UI primitives.
