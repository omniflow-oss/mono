# Scaffolding

Scaffolding commands create new modules, wire them into the monorepo,
and allocate ports.

## Create components

```bash
./mono new service <name>
./mono new app <name>
./mono new lib <name>
./mono new package <name>
```

### Service scaffolds

Creates:

- `back/services/<name>` with Quarkus setup
- `contracts/rest/<name>.openapi.yaml`
- `docs/handbook/services/<name>.md`
- Port registry entry in `infra/ports.yaml`
- Reactor module entry in `back/pom.xml`

### App scaffolds

Creates:

- `front/apps/<name>` from the Nuxt dashboard template
- `.env` with assigned `NUXT_PORT`
  and `NUXT_HOST=0.0.0.0`
- Port registry entry in `infra/ports.yaml`

### Lib and package scaffolds

- Java libs are created under `back/libs/<name>` and wired into the
  reactor.
- Front-end packages are created under `front/packages/<name>` and
  normalized to the repo scripts.

## Delete components

```bash
./mono delete service <name>
./mono delete app <name>
./mono delete lib <name>
./mono delete package <name>
```

Deletion removes the project directory and cleans associated registry
entries for ports and docs.
