# Release process

## Before publishing

1. Confirm `npm --prefix website run check` and `npm --prefix website run audit` pass.
2. Run the demo smoke test: `make up`, `make seed`, then `make smoke`.
3. Update `CHANGELOG.md`, `docs/compatibility.md`, and the version in
   `website/package.json`.
4. Create a clean git commit and tag it as `vX.Y.Z` after it is merged to `main`.

## Release artefacts

The release workflow creates a GitHub Release with source archives, SHA-256
checksums, an SPDX SBOM, and GHCR images for Linux AMD64 and ARM64. It labels
each image with its source repository, commit, and version.

## After publishing

1. Pull the exact image tag on a clean machine.
2. Start it with the documented external RabbitMQ Compose example.
3. Verify login, overview, one read operation, and one canceled destructive
   action.
4. Publish concise release notes and link the workflow run.
5. If a release must be withdrawn, mark it as a pre-release or delete only the
   release object; do not overwrite an immutable version tag.
