# Monorepo Tooling Spec (Docker-first) — OmniflowCX

**Status:** Authoritative specification  
**Audience:** Developers + coding agents (Codex/Claude)  
**Default runtime:** Docker (local + CI)  
**Root package/group id (global):** `com.omniflowcx`

---

## 0. Goals

### 0.1 Primary goals
- One monorepo hosting:
  - **Back**: Quarkus services + Java libs
  - **Front**: Nuxt 4 apps + TS packages
  - **Contracts**: OpenAPI contracts-first + governance
  - **Docs**: VitePress site generated from contracts + handbook/ADR/runbooks
- One stable entrypoint for humans + agents: `./mono`
- Deterministic tooling versions by running **everything in Docker by default**
- Scaffolding commands that:
  - generate new services/apps/libs/packages
  - allocate and wire ports automatically
  - wire Maven modules automatically
  - create and wire OpenAPI contracts automatically
  - normalize generated output to match monorepo standards (Biome, scripts, reporting)
- Fast feedback via **changed-only** execution with safe fallbacks
- Non-regression: unit + E2E tests for tooling and scaffolding

### 0.2 Non-goals (phase 2+)
- Building/publishing runtime images for all services
- Full SLSA/provenance signing (can be added later)

---

## 1. Authoritative repository layout

```text
repo/
  back/
    pom.xml                       # Maven reactor root (mandatory)
    services/
      <service>/
    libs/
      <lib>/
  front/
    apps/
      <app>/
    packages/
      <pkg>/
      api-clients/                # generated TS types/clients (recommended)
  contracts/
    rest/
      <service>.openapi.yaml
    rules/
      spectral.yaml
    shared/
      common-schemas.yaml
      errors.yaml
  docs/
    api/openapi/                  # generated/bundled specs
    site/                         # VitePress sources
    adr/
    handbook/
    runbooks/
  infra/
    tools.compose.yaml            # tooling container runner (docker-first)
    ports.yaml                    # authoritative port registry
  config/
    spotbugs/excludes.xml
  tools/
    mono.mjs
    changed.mjs
    run-parallel.mjs
    contracts/
      bundle-all.mjs
      gen-clients.mjs
      breaking.mjs
      drift-check.mjs
    scaffold/
      plopfile.cjs
      actions/
        app.cjs
        service.cjs
        lib.cjs
        package.cjs
      normalize/
        nuxt.cjs
        quarkus.cjs
        package.cjs
      ports.cjs                   # port allocator + registry ops
      maven.cjs                   # module wiring + robust -pl/-am mapping
    test/
      unit/
      e2e/
  reports/                        # generated artifacts (gitignored)
  Taskfile.yml
  package.json                    # root tooling deps
  pnpm-workspace.yaml
  biome.json
  .editorconfig
  .gitattributes
  AGENTS.md
  CONTRIBUTING.md
  CODEOWNERS
  .github/workflows/
```

---

## 2. Global variables (single source of truth)

### 2.1 Repo identity
- **GROUP_ID** / base Java package: `com.omniflowcx`
- **Default Quarkus projectGroupId:** `com.omniflowcx`
- **Default package root for services/libs:** `com.omniflowcx.<name_without_dashes>`

### 2.2 Port ranges (reserved)
- Quarkus services: `8081–8199`
- Nuxt apps: `3001–3099`
- Debug (Quarkus): `5005` (shared) or per-service optional later

### 2.3 Tooling runtime
- Docker-first is default
- Opt-out: `./mono --native ...` or `MONO_IN_DOCKER=0`

---

## 3. Toolchain (pinned, deterministic)

### 3.1 Back (Java)
- JDK: pinned in tooling image (Java 17 or 21; choose and lock)
- Maven wrapper: `./mvnw` committed
- Quarkus generator (pinned): `io.quarkus.platform:quarkus-maven-plugin:3.30.6:create`
- Formatting: Spotless
- Architecture rules: ArchUnit
- Bug detection: SpotBugs (threshold **Medium**, excludes filter)
- Tests: JUnit 5 + RestAssured

### 3.2 Front (JS/TS)
- Node + pnpm pinned in tooling image + root `packageManager`
- Lint/format: Biome
- Typecheck: `tsc --noEmit`
- Tests: Vitest with JUnit output into `reports/`

### 3.3 Contracts & docs
- OpenAPI contracts-first under `contracts/rest/*`
- Lint: Spectral (custom ruleset)
- Breaking changes: diff against base ref (usually `origin/main`)
- Bundle for docs: Redocly bundle (or equivalent)
- TS client generation: `openapi-typescript` (loop all specs)
- Docs site: VitePress; docs build depends on contracts build

---

## 4. Docker-first runtime (local + CI)

### 4.1 Default behavior
- Every `./mono ...` command runs inside the tooling container.
- The wrapper sets host UID/GID to avoid permission issues.

### 4.2 Tooling runner
- `infra/tools.compose.yaml` mounts:
  - repo → `/work`
  - Maven cache volume
  - pnpm store volume
- Git must be available in container.

### 4.3 Dev ports
Port publishing strategy (required):
- **Publish port ranges** to avoid dynamic docker flags complexity:
  - `3001-3099:3001-3099`
  - `8081-8199:8081-8199`
- Each app/service binds to its allocated port inside container.
- Binding requirements:
  - Quarkus: `quarkus.http.host=0.0.0.0`
  - Nuxt: `NUXT_HOST=0.0.0.0`

---

## 5. Authoritative port registry (mandatory)

### 5.1 File: `infra/ports.yaml`
Schema:
```yaml
back:
  services:
    <service>: <port>
front:
  apps:
    <app>: <port>
```

### 5.2 Allocation rules
- On scaffold:
  - allocate next free port within range
  - write to `infra/ports.yaml`
  - write binding config to generated project:
    - Quarkus: `quarkus.http.port=<port>` + host binding
    - Nuxt: `.env` with `NUXT_PORT=<port>` + `NUXT_HOST=0.0.0.0`
- On dev run:
  - validate entry exists for the scope; fail with clear message if missing

### 5.3 CLI support
- `./mono list ports` prints the registry
- `./mono doctor` validates no duplicates, range compliance

---

## 6. Orchestration contract (`./mono`)

### 6.1 Supported commands
Core:
- `bootstrap`
- `dev`
- `fmt`
- `lint`
- `typecheck`
- `test`
- `build`
- `check`

Namespaces:
- `contracts lint|breaking|build|drift`
- `docs lint|build|serve`
- `infra up|down|reset`
- `new service|lib|app|package`
- `tooling test [--e2e]`
- `list scopes|ports|contracts`
- `doctor`

Flags:
- `--scope <path>` (repeatable)
- `--changed`
- `--parallel`
- `--all`
- `--native` (wrapper only)
- `--dry-run` (selection + scaffold preview)

### 6.2 Scope rules
Valid scope prefixes:
- `back/services/<name>`
- `back/libs/<name>`
- `front/apps/<name>`
- `front/packages/<name>`

---

## 7. Taskfile contract (authoritative behavior)

### 7.1 Required tasks
- `bootstrap`: install root deps and validate toolchain
- `fmt`: back Spotless apply + front Biome format
- `lint`: back Spotless check + SpotBugs check; front Biome lint; contracts spectral; docs markdownlint
- `typecheck`: TS `tsc --noEmit`
- `test`: back `mvn test`; front `vitest run` w/ junit output
- `build`: back `mvn -DskipTests package`; front `nuxt build`
- `check`: lint + typecheck + test + build
- `*:changed`: changed-only with safe-mode fallbacks

### 7.2 Robust Maven scoping (mandatory)
For a back scope `back/services/orders`, run from reactor:
- `mvn -f back/pom.xml -pl :orders -am ...`
Mapping:
- artifactId == folder name (kebab) unless overridden (not allowed by default)

This prevents brittle relative path usage.

### 7.3 Changed-only safe fallbacks
- If any of these changed → full `check`:
  - root tooling files (`Taskfile.yml`, `tools/**`, `.github/**`, `infra/tools.compose.yaml`, root `package.json/pnpm-lock.yaml`, `back/pom.xml`, `pnpm-workspace.yaml`, `biome.json`)
- If `back/libs/**` changed → run full back reactor for Java tasks
- If `front/packages/**` changed → run full front workspace for JS tasks
- If `contracts/**` changed → run `contracts:build` + `contracts:breaking` and re-run affected TS clients generation

---

## 8. Scaffolding (Plop + generators) — mandatory behavior

### 8.1 `./mono new app <name>`
Generator:
- `pnpm create nuxt@latest -- -t github:nuxt-ui-templates/dashboard`

Actions:
1. Validate name is `lowercase-kebab`
2. Allocate port from `infra/ports.yaml` range 3001-3099 and write registry
3. Run generator to temp dir, then move to `front/apps/<name>`
4. Normalize to monorepo standards:
   - ensure scripts: `dev/build/fmt/lint/typecheck/test:ci`
   - remove eslint/prettier configs if present
   - enforce Biome
   - enforce vitest junit output: `reports/vitest/<name>.junit.xml`
   - create `.env` with `NUXT_PORT` and `NUXT_HOST=0.0.0.0`
5. Optional smoke: run `./mono lint --scope front/apps/<name>` (can be behind flag)

### 8.2 `./mono new service <name>`
Generator (pinned):
```bash
mvn io.quarkus.platform:quarkus-maven-plugin:3.30.6:create \
  -DprojectGroupId=com.omniflowcx \
  -DprojectArtifactId=<name> \
  -Dextensions='rest'
```

Actions:
1. Validate name is `lowercase-kebab`
2. Allocate port from `infra/ports.yaml` range 8081-8199 and write registry
3. Run generator to temp dir, then move to `back/services/<name>`
4. Normalize:
   - set parent to `back` reactor (groupId `com.omniflowcx`, artifactId `back`)
   - ensure `application.properties` has:
     - `quarkus.http.port=<port>`
     - `quarkus.http.host=0.0.0.0`
     - `quarkus.application.name=<name>`
   - add baseline `HealthResource` + test (if generator doesn't include)
   - add ArchUnit skeleton test OR depend on shared `back/libs/arch-rules`
5. Wire Maven reactor:
   - insert `<module>services/<name></module>` into `back/pom.xml` (idempotent)
6. Create contract-first artifacts:
   - create `contracts/rest/<name>.openapi.yaml` (must pass Spectral)
   - create docs stub `docs/handbook/services/<name>.md` (optional but recommended)
7. Optional smoke: `./mono contracts lint` + `./mono lint --scope back/services/<name>`

### 8.3 `./mono new lib <name>`
- Create `back/libs/<name>`
- Parent = `back`
- Wire `<module>libs/<name></module>` into `back/pom.xml`
- Minimal marker class
- Optional ArchUnit rules package if lib type is `arch-rules`

### 8.4 `./mono new package <name>`
- Create `front/packages/<name>`
- Ensure scripts: `fmt/lint/typecheck/test:ci/build`
- Use Biome + tsc
- JUnit report path: `reports/vitest/pkg-<name>.junit.xml`

---

## 9. Contracts pipeline (authoritative)

### 9.1 Commands
- `contracts lint`: spectral across all `contracts/rest/*.openapi.yaml`
- `contracts breaking`: diff contracts against base ref (`CHANGE_BASE` default `origin/main`)
- `contracts build`:
  1. lint
  2. bundle all specs to `docs/api/openapi/*.bundled.yaml`
  3. generate TS clients into `front/packages/api-clients/**`

### 9.2 Drift check (recommended, CI gate for touched services)
- For each touched service:
  - run `mvn -pl :<service> -am test` (or start in dev profile quickly)
  - fetch service `/q/openapi` (Quarkus) OR generate locally if available
  - compare normalized spec with `contracts/rest/<service>.openapi.yaml`
  - fail on drift

---

## 10. Docs pipeline

- `docs lint`: markdownlint across `docs/**` and `README.md`
- `docs build`:
  - depends on `contracts build` (ensures API docs are fresh)
  - runs `vitepress build docs/site`
- `docs serve`: `vitepress dev docs/site` (docker-first)

---

## 11. Governance & hygiene (mandatory)

- `.editorconfig` and `.gitattributes` committed
- `CODEOWNERS` includes owners for:
  - `back/**`, `front/**`, `contracts/**`, `docs/**`, `tools/**`
- Branch protection requires:
  - `./mono check --changed`
  - `./mono contracts breaking` when contracts touched
- `AGENTS.md` strict rules:
  - only run `./mono`
  - default to `check --changed`
  - paste minimal logs (last ~80 lines + failing file/line)
- `CONTRIBUTING.md` documents:
  - how to scaffold new components
  - contract-first workflow
  - required checks before PR

---

## 12. Tooling regression tests (mandatory)

### 12.1 Unit tests (Vitest)
- Focus on pure logic:
  - kebab validation
  - ports allocation + registry update
  - Maven module insertion idempotency
  - changed-scope mapping + safe-mode triggers
  - normalization patches (Nuxt/Quarkus)

### 12.2 E2E tests
Run in a temporary workspace (temp dir) using docker-first execution:
- `./mono new service e2e-svc`
  - asserts: module wired, ports.yaml updated, contract created
  - runs: `./mono lint/test/build --scope back/services/e2e-svc` (or subset)
- `./mono new app e2e-app`
  - asserts: ports.yaml updated, scripts normalized, `.env` created
  - runs: `./mono lint/typecheck/build --scope front/apps/e2e-app`
- Changed-only routing test:
  - modify one file and assert `./mono check --changed --dry-run` returns expected scopes

Command:
- `./mono tooling test` (unit)
- `./mono tooling test --e2e` (unit + e2e)

---

## 13. Security baseline (optional gates; at least nightly)

- gitleaks secret scanning
- SBOM (syft) + vuln scan (grype) nightly or on main

---

## 14. Acceptance criteria (must hold)

- Docker-first default: `./mono check --all` runs without requiring host Node/Java
- Scaffolding:
  - creates component in correct folder
  - updates `infra/ports.yaml`
  - wires Maven modules for back
  - creates contract for services
  - `./mono check --scope <new>` succeeds
- Contracts:
  - `./mono contracts build` bundles + generates clients for all specs
- Tooling tests:
  - `./mono tooling test --e2e` passes (in CI tooling image)

