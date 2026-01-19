# Architecture

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

## Port ranges

- Services: 8081-8199
- Apps: 3001-3099
- Debug: 5005

Ports are assigned by scaffolding and stored in
`infra/ports.yaml`.

## Tooling runtime

All commands run in the tooling container.
The wrapper sets host UID and GID to avoid permission issues.
