# Tooling Plan (Current State)

This plan replaces the original bootstrap plan. The tooling stack is now implemented and the focus is on maintenance and incremental improvements.

## Current baseline

- Docker-first runtime via `./mono` and `infra/tools.compose.yaml`.
- Task orchestration in `Taskfile.yml`.
- Contracts pipeline with bundling and TS client generation.
- Scaffolding and deletion for services, apps, libs, and packages.
- Tooling checks and report logging under `reports/**`.

## Next priorities

1. Expand VitePress content for handbook, ADRs, and runbooks.
2. Add CI gating for tooling tests and contract breaking checks.
3. Expand scaffolding tests for delete workflows and port registry integrity.

## Ownership

Update `CODEOWNERS` and `docs/handbook` when new teams take ownership of services.
