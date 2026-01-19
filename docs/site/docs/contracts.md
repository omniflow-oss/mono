# Contracts

Contracts are OpenAPI-first specs stored in `contracts/rest`.
They drive client generation and documentation.

## Layout

- `contracts/rest/<service>.openapi.yaml`
- `contracts/rules/spectral.yaml`
- `docs/api/openapi/<service>.bundled.yaml`

## Commands

```bash
./mono contracts:lint
./mono contracts:breaking
./mono contracts:build
```

- `contracts:lint` runs Spectral on all specs.
- `contracts:breaking` checks for breaking changes
  against the base ref.
- `contracts:build` bundles specs and generates TS clients.

## Client generation

Clients are generated under
`front/packages/api-clients/<service>/types.ts`.
