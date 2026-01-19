# OmniflowCX

OmniflowCX is a Docker-first monorepo for Quarkus services, Nuxt apps,
and shared tooling.
The `./mono` command is the single entrypoint for builds, checks,
and scaffolding.

## Quick start

```bash
./mono bootstrap
./mono check --changed
./mono docs:serve
```

## What lives where

- Back-end services: `back/services/<name>`
- Java libraries: `back/libs/<name>`
- Front-end apps: `front/apps/<name>`
- Front-end packages: `front/packages/<name>`
- OpenAPI contracts: `contracts/rest/*.openapi.yaml`
- VitePress docs: `docs/site/docs`
- Tooling scripts: `tools/**`

## Core ideas

- Docker is required for all tooling; no native mode is supported.
- Use scopes to run commands for a specific app or service.
- Reports are written to `reports/**` for CI
  visibility.

Next steps: start with the Setup and Workflows pages.
Then review Scaffolding and Contracts for day-to-day development.
