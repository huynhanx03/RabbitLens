# Changelog

All notable changes are documented here. RabbitLens follows
[Semantic Versioning](https://semver.org/).

## [1.0.2] - 2026-08-13

### Added

- A modern RabbitMQ Management API user interface covering monitoring, topology,
  administration, extension surfaces, permissions, and safer destructive flows.
- Docker images for Linux AMD64 and ARM64, plus a reproducible demo stack.
- English and Vietnamese interfaces, unit tests, browser tests, bundle budgets,
  parity checks, and secret-artifact scanning.

### Security

- Browser clients authenticate directly with RabbitMQ; RabbitLens does not store
  broker data or message payloads.
- Added private vulnerability reporting, dependency audit gates, and automated
  dependency update checks.

### Compatibility

- Verified against RabbitMQ `4.3.2-management` and its Management HTTP API.

[1.0.2]: https://github.com/huynhanx03/RabbitLens/releases/tag/v1.0.2
