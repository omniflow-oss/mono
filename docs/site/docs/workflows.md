# Workflows

## Run checks

```bash
./mono check --changed
```

Use `--changed` to scope work to modified areas.
For a full run, use
`./mono check --all`.

## Scope a command

```bash
./mono lint --scope back/services/orders
./mono typecheck --scope front/apps/dashboard
```

Scopes must start with one of these prefixes:

- `back/services/<name>`
- `back/libs/<name>`
- `front/apps/<name>`
- `front/packages/<name>`

## Development servers

```bash
./mono dev --scope back/services/orders
./mono dev --scope front/apps/dashboard
```

Quarkus services run `quarkus:dev`
and bind to their allocated port.
Nuxt apps run `pnpm dev` with the assigned port and host.

## Docs and contracts

```bash
./mono contracts:build
./mono docs:build
./mono docs:serve
```

The docs build depends on contract bundling and client generation.

## Reports

Every task writes logs to `reports/**`.
Use these logs for CI troubleshooting or local debugging.
