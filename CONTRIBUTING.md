# Contributing

## Scaffolding

- New Quarkus service: `./mono new service <name>`
- New Nuxt app: `./mono new app <name>`
- New Java lib: `./mono new lib <name>`
- New TS package: `./mono new package <name>`

## Contracts-first

- OpenAPI specs live in `contracts/rest/`.
- Run `./mono contracts build` before docs builds.

## Required checks before PR

- `./mono check --changed`
- If contracts touched: `./mono contracts breaking`
