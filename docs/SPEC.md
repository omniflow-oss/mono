# OmniflowCX Tooling Reference

## Purpose

This document describes the current monorepo tooling behavior. It is authoritative for `./mono` commands, scaffolding, and contracts workflows.

## Commands

Core:

- `./mono bootstrap`
- `./mono dev`
- `./mono fmt`
- `./mono lint`
- `./mono typecheck`
- `./mono test`
- `./mono build`
- `./mono check`

Namespaces:

- `./mono contracts:lint|breaking|build`
- `./mono docs:lint|build|serve`
- `./mono infra:up|down`
- `./mono list:ports|scopes`
- `./mono tooling:test`
- `./mono new <type> <name>`
- `./mono delete <type> <name>`

## Flags

- `--scope <path>`
- `--changed`
- `--all`
- `--dry-run`
- `--verbose`

## Repository layout

```text
back/                 Quarkus services and Java libraries
front/                Nuxt apps and TS packages
contracts/            OpenAPI contracts and rules
docs/                 VitePress sources and generated API bundles
infra/                Docker tooling runtime and ports registry
tools/                CLI, scaffolding, contracts, and tests
reports/              Generated logs and artifacts
```

## Scaffolding behavior

- Services allocate a port, update `infra/ports.yaml`, and add a contract stub.
- Apps allocate a port and include `.env` with `NUXT_PORT` and `NUXT_HOST=0.0.0.0`.
- Deletes remove project directories and clean registry entries.

## Contracts pipeline

- Lint specs with Spectral.
- Build bundles into `docs/api/openapi/`.
- Generate TS clients into `front/packages/api-clients/`.
