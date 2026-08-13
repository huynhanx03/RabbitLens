# RabbitLens roadmap

This roadmap prioritizes safe, observable RabbitMQ operations. Dates are not
promises; priorities can change when an operator-reported problem has higher
impact.

## Now: harden the 1.x foundation

- Keep CI, visual baselines, dependency audit, image publication, and release
  artefacts reproducible.
- Verify RabbitMQ compatibility beyond the demo version and record results in
  the compatibility matrix.
- Collect real operator feedback through reproducible issue reports and small
  deployment trials.
- Improve accessibility, performance, and failure-state coverage.

## Next: reduce operator toil

- Add guided safe-action flows for high-risk broker operations.
- Expand capability detection and clear unsupported-feature messaging.
- Publish upgrade, rollback, and production deployment examples.
- Establish a monthly release cadence once external users are actively testing.

## Later: community-led priorities

- Triage features requested by real operators with reproducible context.
- Document integration patterns and deployment case studies only with the
  operator's permission.
- Consider discussions after there is enough user activity to sustain them.

## Not on the roadmap

RabbitLens will not become a RabbitMQ broker, persist message payloads, or
silently bypass RabbitMQ authentication and authorization.
