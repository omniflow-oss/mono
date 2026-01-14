# Implementation Plan (Codex-executable) — OmniflowCX Tooling

**Global base group/package:** `com.omniflowcx`  
**Default runtime:** Docker (local + CI)  
**Delivery:** create two files (`SPEC.md`, `PLAN.md`) and implement repo accordingly.

---

## Phase 0 — Pre-flight decisions (do once)
1. Choose Java version for tooling image: **17** (recommended) or **21** (ok).  
2. Confirm port ranges:
   - services: 8081–8199
   - apps: 3001–3099

---

## Phase 1 — Repository skeleton + identity

### 1.1 Create/adjust folders
Create if missing:
- `back/ services/ libs/`
- `front/ apps/ packages/ api-clients/`
- `contracts/rest rules shared`
- `docs/site api/openapi adr handbook runbooks`
- `infra/`
- `tools/ (mono/changing/contracts/scaffold/test)`
- `config/spotbugs`
- `reports/`

### 1.2 Add repo identity constants
- In tooling scripts, define:
  - `DEFAULT_GROUP_ID = "com.omniflowcx"`
  - `DEFAULT_BASE_PACKAGE = "com.omniflowcx"`

Create `tools/scaffold/constants.cjs` exporting these values.

### 1.3 Add hygiene files
Create:
- `.editorconfig`
- `.gitattributes` (LF normalization)
- `.gitignore` (ignore `reports/`, `node_modules/`, `target/`, `.output/`, `.nuxt/`)
- `CODEOWNERS` (placeholders ok)
- `AGENTS.md`
- `CONTRIBUTING.md`

**Verify**
- Repo opens cleanly; no generated artifacts committed.

---

## Phase 2 — Docker-first runtime (mandatory)

### 2.1 Add tooling runner compose
Create `infra/tools.compose.yaml` with:
- mount `./` → `/work`
- volumes: m2 + pnpm store
- user UID:GID from env
- ports ranges published:
  - `3001-3099:3001-3099`
  - `8081-8199:8081-8199`
  - (optional) `5005:5005`

### 2.2 Build tooling image
Create:
- `infra/Dockerfile.tools` (or `Dockerfile.tools` at root)
Include:
- Node pinned
- corepack enabled, pnpm pinned via packageManager
- Java pinned
- Maven (optional but fine)
- go-task
- git

### 2.3 Add docker-first wrapper
Create root executable script `mono`:
- docker is default
- opt-out with `--native` or `MONO_IN_DOCKER=0`
- runs `node tools/mono.mjs ...` inside container

**Verify**
- `./mono help` works on a machine without local Node/Java installed (only Docker).

---

## Phase 3 — Root tool deps (pnpm workspace + Biome + contracts + docs)

### 3.1 Root `package.json`
Add dev deps:
- `@biomejs/biome`
- `@stoplight/spectral-cli`
- `@redocly/cli`
- `openapi-typescript`
- `markdownlint-cli2`
- `vitepress`
- `vitest` (for tooling tests)
- `js-yaml` (for ports registry ops)

Set:
- `"packageManager": "pnpm@<pinned>"`

### 3.2 `pnpm-workspace.yaml`
Include:
- `front/apps/*`
- `front/packages/*`
- `docs/site`

### 3.3 `biome.json`
Configure format/lint rules and ignore generated folders.

**Verify**
- `./mono --native bootstrap` works (native optional)
- In docker: `./mono bootstrap` works.

---

## Phase 4 — Back reactor (Spotless + SpotBugs baseline)

### 4.1 Create `back/pom.xml` (reactor)
- packaging `pom`
- groupId `com.omniflowcx`
- artifactId `back`
- pluginManagement:
  - spotless
  - spotbugs
  - surefire

### 4.2 SpotBugs excludes
Create: `config/spotbugs/excludes.xml`

**Verify**
- `./mono lint` runs even with zero modules (or create one sample module temporarily).

---

## Phase 5 — Orchestration (Taskfile + mono CLI)

### 5.1 Add `Taskfile.yml`
Implement tasks:
- `bootstrap`
- `fmt`, `lint`, `typecheck`, `test`, `build`, `check`
- `*:changed` variants
- namespaces: `contracts:*`, `docs:*`, `infra:*`, `new:*`, `tooling:*`, `list:*`, `doctor`

Key requirements:
- Back scoped tasks must use reactor + `-pl :artifactId -am`
- Front tasks use `pnpm -r --filter ...`
- All outputs go to `reports/**` where applicable

### 5.2 Add CLI dispatcher
Create `tools/mono.mjs`:
- maps CLI commands and flags to Taskfile targets
- supports namespaces
- supports `--scope/--changed/--parallel/--all/--dry-run`

### 5.3 Changed detection
Create `tools/changed.mjs`:
- maps file diffs to impacted scopes
- emits `__ALL__`, `__CONTRACTS__`, `__DOCS__`, etc.
- safe fallbacks as specified

**Verify**
- `./mono check --all`
- `./mono check --changed` works in a git repo with `origin/main` present (CI) or provide fallback to `HEAD~1`.

---

## Phase 6 — Ports registry + allocator

### 6.1 Create `infra/ports.yaml`
Initialize with empty maps:
```yaml
back:
  services: {}
front:
  apps: {}
```

### 6.2 Implement ports library
Create `tools/scaffold/ports.cjs`:
- read/write YAML
- allocate next free within ranges
- validate uniqueness + range compliance
- commands:
  - `listPorts()`
  - `allocateServicePort(name)`
  - `allocateAppPort(name)`
  - `doctorPorts()`

### 6.3 Wire into `./mono list ports` and `./mono doctor`
- `list:ports` task prints ports.yaml
- `doctor` validates ports + tool versions

**Verify**
- allocate + persist + no duplicates.

---

## Phase 7 — Contracts pipeline (bundle-all + TS clients + breaking + drift)

### 7.1 Spectral ruleset
Create `contracts/rules/spectral.yaml`

### 7.2 Bundle all specs
Create `tools/contracts/bundle-all.mjs`:
- for each `contracts/rest/*.openapi.yaml`:
  - `redocly bundle` to `docs/api/openapi/<svc>.bundled.yaml`

### 7.3 Generate TS clients for all specs
Create `tools/contracts/gen-clients.mjs`:
- for each spec:
  - generate types into `front/packages/api-clients/<svc>/types.ts`
- ensure `front/packages/api-clients/package.json` exists with required scripts

### 7.4 Breaking diff
Create `tools/contracts/breaking.mjs`:
- compare base ref vs head for changed specs
- fail on breaking changes

### 7.5 Drift check (CI gate for touched services)
Create `tools/contracts/drift-check.mjs`:
- for each touched service:
  - fetch `/q/openapi` from running service OR generate if feasible
  - normalize and compare to repo contract
- integrate into CI later (optional but recommended)

**Verify**
- `./mono contracts build` creates bundles + clients.

---

## Phase 8 — Scaffolding (Plop + generators + wiring + normalization)

### 8.1 Plop root
Create `tools/scaffold/plopfile.cjs` with generators:
- `app`
- `service`
- `lib`
- `package`

### 8.2 App generator
Implement `tools/scaffold/actions/app.cjs`:
- validate kebab name
- allocate app port, update `infra/ports.yaml`
- run:
  - `pnpm create nuxt@latest -- -t github:nuxt-ui-templates/dashboard` into temp dir
- move into `front/apps/<name>`
- normalize via `normalize/nuxt.cjs`:
  - enforce scripts: dev/build/fmt/lint/typecheck/test:ci
  - remove eslint/prettier
  - enforce `.env` with NUXT_PORT/NUXT_HOST
  - ensure vitest junit path in scripts

### 8.3 Service generator
Implement `tools/scaffold/actions/service.cjs`:
- validate kebab name
- allocate service port, update `infra/ports.yaml`
- run Quarkus create (pinned 3.30.6) into temp dir:
  - `-DprojectGroupId=com.omniflowcx`
  - `-DprojectArtifactId=<name>`
  - `-Dextensions='rest'`
- move into `back/services/<name>`
- normalize via `normalize/quarkus.cjs`:
  - parent = `back` reactor
  - application.properties: port, host bind, app name
  - add HealthResource + tests if missing
  - add ArchUnit skeleton test (or shared rules)
- wire module in `back/pom.xml` via `maven.cjs`
- create contract file `contracts/rest/<name>.openapi.yaml` (must pass spectral)
- create docs stub `docs/handbook/services/<name>.md` (optional)

### 8.4 Lib + package generators
- create templates, wire for back libs
- enforce scripts + biome for front packages

### 8.5 Expose via `./mono new ...`
Add Taskfile tasks:
- `new:app`, `new:service`, `new:lib`, `new:package`

**Verify**
- `./mono new service orders` creates:
  - folder
  - ports.yaml entry
  - back/pom module entry
  - contract file
- `./mono new app dashboard2` creates app, ports entry, `.env`

---

## Phase 9 — Robust dev experience

### 9.1 `./mono dev --scope ...` must:
- validate ports registry has entry
- run:
  - Quarkus dev: binds 0.0.0.0 and uses assigned port
  - Nuxt dev: binds 0.0.0.0 and uses assigned port
- avoid port collisions

### 9.2 Provide `./mono list scopes`
Implement `list:scopes`:
- enumerate directories under the four scope roots

---

## Phase 10 — Tooling regression tests (mandatory)

### 10.1 Unit tests (Vitest)
Create `tools/test/unit` for:
- validation (kebab)
- ports allocator
- pom insertion idempotency
- changed mapping

### 10.2 E2E tests
Create `tools/test/e2e`:
- in temp workspace (copy repo minimal tooling + init git):
  - run docker-first `./mono new service e2e-svc`
  - assert ports.yaml + contract + pom wired
  - run scoped `./mono lint/test/build`
  - run `./mono new app e2e-app` and scoped lint/typecheck/build

Expose:
- `./mono tooling test`
- `./mono tooling test --e2e`

### 10.3 CI gating
- If PR touches `tools/**`, `Taskfile.yml`, `infra/**`, root tool files → run `tooling test --e2e`
- Otherwise unit only (or skip tooling tests)

---

## Phase 11 — Final acceptance pass
Run in docker (default):
- `./mono bootstrap`
- `./mono contracts build`
- `./mono docs build`
- `./mono check --all`
- `./mono tooling test --e2e`

---

## Notes for Codex execution
- Keep diffs minimal and incremental
- After each phase, run the verify commands
- Never introduce additional linters that overlap Biome/Spotless (avoid ESLint/Prettier/Checkstyle)
