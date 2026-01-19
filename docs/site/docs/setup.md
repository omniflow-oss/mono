# Setup

## Prerequisites

- Docker installed and running
- Git with a cloned repository

## Bootstrap

```bash
./mono bootstrap
```

This installs root dependencies inside the tooling container.
You do not need local Node, Java, or pnpm installed.

## Start or stop infrastructure

```bash
./mono infra:up
./mono infra:down
```

Use `infra:up` when you want the tooling container
and port publishing ready for development.

## Verify the toolchain

```bash
./mono doctor
```

The doctor command validates required tools in the container
and checks port registry integrity.
