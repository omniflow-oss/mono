# Conventions

## Naming

- Use lowercase kebab-case for apps, services,
  libs, and packages.
- Java packages default to `com.omniflowcx.<name_without_dashes>`.

## Ports

- Services: 8081-8199
- Apps: 3001-3099

Do not hardcode ports outside the registry.
Scaffolding updates `infra/ports.yaml` automatically.

## Reports

- Lint logs: `reports/lint/**`
- Test logs: `reports/test/**` and `reports/vitest/**`
- Build logs: `reports/build/**`
