# CI and Tooling

## Required checks

- `./mono check --changed`
- `./mono contracts:breaking` when contracts are touched

## Tooling tests

```bash
./mono tooling:test
./mono tooling:test --e2e
```

Unit tests cover scaffolding helpers and change detection.
E2E tests validate end-to-end
scaffolding.

## Reports

CI logs are written to `reports/**` with task-specific folders
for lint, test, build, and docs.
