# OmniflowCX Tooling Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a Docker-first monorepo tooling stack with deterministic commands, scaffolding, contracts, and docs per SPEC.

**Architecture:** A `./mono` wrapper dispatches to Taskfile targets and Node scripts in `tools/`, defaulting to a Docker tooling container (Java 21 + Node/pnpm + go-task). Scaffolding and contracts are implemented as reusable scripts with unit tests; changed-only selection is centralized in `tools/changed.mjs`.

**Tech Stack:** Node.js + pnpm, go-task, Java 21, Maven, Quarkus generator, Nuxt, Vitest, Biome, Spectral, Redocly.

### Task 1: Repository skeleton + hygiene files

**Files:**
- Create: `back/`, `back/services/`, `back/libs/`
- Create: `front/`, `front/apps/`, `front/packages/`, `front/packages/api-clients/`
- Create: `contracts/rest/`, `contracts/rules/`, `contracts/shared/`
- Create: `docs/site/`, `docs/api/openapi/`, `docs/adr/`, `docs/handbook/`, `docs/runbooks/`
- Create: `infra/`, `tools/`, `config/spotbugs/`, `reports/`
- Create: `.editorconfig`, `.gitattributes`, `.gitignore`, `CODEOWNERS`, `AGENTS.md`, `CONTRIBUTING.md`
- Modify: `docs/SPEC.md`, `docs/PLAN.md` (ensure tracked as-is)

**Step 1: Create directories**

Run: `mkdir -p back/services back/libs front/apps front/packages front/packages/api-clients contracts/rest contracts/rules contracts/shared docs/site docs/api/openapi docs/adr docs/handbook docs/runbooks infra tools config/spotbugs reports`
Expected: directories exist.

**Step 2: Add hygiene files**

Create `.editorconfig`:
```ini
root = true

[*]
end_of_line = lf
charset = utf-8
insert_final_newline = true
trim_trailing_whitespace = true

[*.md]
trim_trailing_whitespace = false
```

Create `.gitattributes`:
```gitattributes
* text=auto eol=lf
```

Create `.gitignore` (append if existing):
```gitignore
reports/
node_modules/
.pnpm-store/
.pnp.cjs
.pnp.data.json
.target/
.nuxt/
.output/
.idea/
.DS_Store
```

Create `CODEOWNERS`:
```text
* @omniflowcx/core
/back/** @omniflowcx/back
/front/** @omniflowcx/front
/contracts/** @omniflowcx/contracts
/docs/** @omniflowcx/docs
/tools/** @omniflowcx/tooling
```

Create `AGENTS.md`:
```markdown
# Agent Guidelines

- Use `./mono` for all operations.
- Default to `./mono check --changed`.
- When reporting failures, paste only the last ~80 lines of logs and the failing file/line.
```

Create `CONTRIBUTING.md`:
```markdown
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
```

**Step 3: Verify files are present**

Run: `rg --files`
Expected: output includes the new paths.

**Step 4: Commit**

Run:
```bash
git add .editorconfig .gitattributes .gitignore CODEOWNERS AGENTS.md CONTRIBUTING.md back front contracts docs infra tools config reports
# Add docs/SPEC.md docs/PLAN.md if untracked

git commit -m "chore: add repo skeleton and hygiene files"
```
Expected: commit created.

### Task 2: Docker-first tooling runtime

**Files:**
- Create: `infra/Dockerfile.tools`
- Create: `infra/tools.compose.yaml`
- Create: `mono`

**Step 1: Add tooling Dockerfile**

Create `infra/Dockerfile.tools`:
```Dockerfile
FROM node:20-bookworm

RUN apt-get update && apt-get install -y \
  openjdk-21-jdk \
  git \
  curl \
  unzip \
  ca-certificates \
  bash \
  && rm -rf /var/lib/apt/lists/*

# Maven (via apt for simplicity)
RUN apt-get update && apt-get install -y maven && rm -rf /var/lib/apt/lists/*

# go-task
RUN curl -sSL https://taskfile.dev/install.sh | sh -s -- -b /usr/local/bin

# pnpm via corepack
RUN corepack enable

WORKDIR /work
```

**Step 2: Add compose runner**

Create `infra/tools.compose.yaml`:
```yaml
services:
  tools:
    build:
      context: ..
      dockerfile: infra/Dockerfile.tools
    working_dir: /work
    volumes:
      - ..:/work
      - m2:/root/.m2
      - pnpm_store:/root/.pnpm-store
    environment:
      - USER_ID=${USER_ID}
      - GROUP_ID=${GROUP_ID}
    ports:
      - "3001-3099:3001-3099"
      - "8081-8199:8081-8199"
      - "5005:5005"

volumes:
  m2:
  pnpm_store:
```

**Step 3: Add docker-first wrapper**

Create `mono` (make executable):
```bash
#!/usr/bin/env bash
set -euo pipefail

MONO_IN_DOCKER=${MONO_IN_DOCKER:-1}

if [[ "${1:-}" == "--native" ]]; then
  MONO_IN_DOCKER=0
  shift
fi

if [[ "$MONO_IN_DOCKER" == "1" ]]; then
  export USER_ID=$(id -u)
  export GROUP_ID=$(id -g)
  docker compose -f infra/tools.compose.yaml run --rm tools node tools/mono.mjs "$@"
else
  node tools/mono.mjs "$@"
fi
```

**Step 4: Verify wrapper runs (native)**

Run: `chmod +x mono && ./mono --native help`
Expected: usage output (placeholder until Taskfile exists).

**Step 5: Commit**

Run:
```bash
git add infra/Dockerfile.tools infra/tools.compose.yaml mono
git commit -m "feat: add docker-first tooling runtime"
```

### Task 3: Root tooling dependencies and config

**Files:**
- Create: `package.json`
- Create: `pnpm-workspace.yaml`
- Create: `biome.json`

**Step 1: Add root package.json**

Create `package.json`:
```json
{
  "name": "omniflowcx-root",
  "private": true,
  "packageManager": "pnpm@9.15.0",
  "devDependencies": {
    "@biomejs/biome": "^1.9.4",
    "@redocly/cli": "^1.18.1",
    "@stoplight/spectral-cli": "^6.11.0",
    "js-yaml": "^4.1.0",
    "markdownlint-cli2": "^0.12.1",
    "openapi-typescript": "^6.7.6",
    "vitepress": "^1.0.0",
    "vitest": "^1.6.0"
  }
}
```

**Step 2: Add pnpm workspace**

Create `pnpm-workspace.yaml`:
```yaml
packages:
  - "front/apps/*"
  - "front/packages/*"
  - "docs/site"
```

**Step 3: Add Biome config**

Create `biome.json`:
```json
{
  "linter": {
    "enabled": true
  },
  "formatter": {
    "enabled": true
  },
  "files": {
    "ignore": [
      "reports/**",
      "**/node_modules/**",
      "**/.nuxt/**",
      "**/.output/**"
    ]
  }
}
```

**Step 4: Verify bootstrap (native)**

Run: `./mono --native bootstrap`
Expected: pnpm install completes.

**Step 5: Commit**

Run:
```bash
git add package.json pnpm-workspace.yaml biome.json
git commit -m "feat: add root tooling deps and configs"
```

### Task 4: Back reactor + SpotBugs baseline

**Files:**
- Create: `back/pom.xml`
- Create: `config/spotbugs/excludes.xml`

**Step 1: Add back reactor POM**

Create `back/pom.xml`:
```xml
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
  <modelVersion>4.0.0</modelVersion>

  <groupId>com.omniflowcx</groupId>
  <artifactId>back</artifactId>
  <version>1.0.0-SNAPSHOT</version>
  <packaging>pom</packaging>

  <modules>
  </modules>

  <build>
    <pluginManagement>
      <plugins>
        <plugin>
          <groupId>com.diffplug.spotless</groupId>
          <artifactId>spotless-maven-plugin</artifactId>
          <version>2.44.0</version>
        </plugin>
        <plugin>
          <groupId>com.github.spotbugs</groupId>
          <artifactId>spotbugs-maven-plugin</artifactId>
          <version>4.8.6.0</version>
        </plugin>
        <plugin>
          <groupId>org.apache.maven.plugins</groupId>
          <artifactId>maven-surefire-plugin</artifactId>
          <version>3.5.1</version>
        </plugin>
      </plugins>
    </pluginManagement>
  </build>
</project>
```

**Step 2: Add SpotBugs excludes**

Create `config/spotbugs/excludes.xml`:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<FindBugsFilter>
</FindBugsFilter>
```

**Step 3: Verify Maven reactor reads**

Run: `./mono --native lint --dry-run`
Expected: command listing (no execution yet).

**Step 4: Commit**

Run:
```bash
git add back/pom.xml config/spotbugs/excludes.xml
git commit -m "feat: add back reactor baseline"
```

### Task 5: Taskfile contract + CLI dispatcher

**Files:**
- Create: `Taskfile.yml`
- Create: `tools/mono.mjs`
- Create: `tools/run-parallel.mjs`

**Step 1: Add Taskfile**

Create `Taskfile.yml`:
```yaml
version: "3"

vars:
  ROOT: "{{.ROOT_DIR}}"

includes: {}

tasks:
  help:
    cmds:
      - echo "Use ./mono <command> [flags]"

  bootstrap:
    cmds:
      - pnpm install

  fmt:
    cmds:
      - pnpm biome format .
      - mvn -f back/pom.xml -q spotless:apply

  lint:
    cmds:
      - pnpm biome lint .
      - mvn -f back/pom.xml -q spotless:check
      - mvn -f back/pom.xml -q spotbugs:check -Dspotbugs.effort=Default -Dspotbugs.threshold=Medium -Dspotbugs.excludeFilterFile=config/spotbugs/excludes.xml
      - pnpm spectral lint contracts/rest/*.openapi.yaml
      - pnpm markdownlint-cli2 "docs/**/*.md" "README.md"

  typecheck:
    cmds:
      - pnpm -r --filter ./front... tsc --noEmit

  test:
    cmds:
      - mvn -f back/pom.xml -q test
      - pnpm vitest run --reporter=junit --outputFile=reports/vitest/root.junit.xml

  build:
    cmds:
      - mvn -f back/pom.xml -q -DskipTests package
      - pnpm -r --filter ./front... build

  check:
    deps: [lint, typecheck, test, build]

  # Namespaces
  contracts:lint:
    cmds:
      - pnpm spectral lint contracts/rest/*.openapi.yaml

  contracts:breaking:
    cmds:
      - node tools/contracts/breaking.mjs

  contracts:build:
    cmds:
      - node tools/contracts/bundle-all.mjs
      - node tools/contracts/gen-clients.mjs

  docs:lint:
    cmds:
      - pnpm markdownlint-cli2 "docs/**/*.md" "README.md"

  docs:build:
    cmds:
      - node tools/contracts/bundle-all.mjs
      - node tools/contracts/gen-clients.mjs
      - pnpm -C docs/site vitepress build

  docs:serve:
    cmds:
      - pnpm -C docs/site vitepress dev

  infra:up:
    cmds:
      - docker compose -f infra/tools.compose.yaml up -d

  infra:down:
    cmds:
      - docker compose -f infra/tools.compose.yaml down

  list:ports:
    cmds:
      - node tools/scaffold/ports.cjs list

  list:scopes:
    cmds:
      - node tools/mono.mjs list scopes

  doctor:
    cmds:
      - node tools/scaffold/ports.cjs doctor

  new:app:
    cmds:
      - node tools/scaffold/actions/app.cjs

  new:service:
    cmds:
      - node tools/scaffold/actions/service.cjs

  new:lib:
    cmds:
      - node tools/scaffold/actions/lib.cjs

  new:package:
    cmds:
      - node tools/scaffold/actions/package.cjs

  tooling:test:
    cmds:
      - pnpm vitest run

  tooling:test:e2e:
    cmds:
      - pnpm vitest run --dir tools/test/e2e
```

**Step 2: Add CLI dispatcher**

Create `tools/mono.mjs`:
```js
#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getChangedScopes } from "./changed.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const cmd = args[0] || "help";

const task = (name, extra = []) => {
  const result = spawnSync("task", [name, ...extra], { stdio: "inherit" });
  process.exit(result.status ?? 1);
};

if (cmd === "help") {
  console.log("Usage: ./mono <command> [--scope <path>] [--changed] [--all] [--dry-run]");
  process.exit(0);
}

if (cmd === "list" && args[1] === "scopes") {
  const scopes = [
    "back/services",
    "back/libs",
    "front/apps",
    "front/packages"
  ];
  for (const base of scopes) {
    const full = path.join(process.cwd(), base);
    try {
      const entries = readFileSync(path.join(full, "."));
    } catch {
      // ignore missing base
    }
  }
  task("list:scopes");
}

if (args.includes("--changed")) {
  const scopes = await getChangedScopes();
  if (scopes.includes("__ALL__")) return task("check");
  if (scopes.includes("__CONTRACTS__")) return task("contracts:build");
  if (scopes.includes("__DOCS__")) return task("docs:build");
}

if (cmd.includes(":")) return task(cmd);
return task(cmd);
```

Create `tools/run-parallel.mjs`:
```js
import { spawn } from "node:child_process";

const cmds = process.argv.slice(2);
if (cmds.length === 0) process.exit(0);

const procs = cmds.map((c) => spawn(c, { shell: true, stdio: "inherit" }));
let code = 0;
procs.forEach((p) => p.on("exit", (c) => { if (c) code = c; }));
process.on("exit", () => process.exit(code));
```

**Step 3: Verify basic CLI**

Run: `./mono --native help`
Expected: usage output.

**Step 4: Commit**

Run:
```bash
git add Taskfile.yml tools/mono.mjs tools/run-parallel.mjs
git commit -m "feat: add task runner and mono dispatcher"
```

### Task 6: Changed-only detection (with unit tests)

**Files:**
- Create: `tools/changed.mjs`
- Create: `tools/test/unit/changed.test.mjs`

**Step 1: Write failing test**

Create `tools/test/unit/changed.test.mjs`:
```js
import { describe, it, expect } from "vitest";
import { mapChangedFiles } from "../../changed.mjs";

describe("mapChangedFiles", () => {
  it("returns __ALL__ for tooling changes", () => {
    const result = mapChangedFiles(["Taskfile.yml"]);
    expect(result).toContain("__ALL__");
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm vitest run tools/test/unit/changed.test.mjs`
Expected: FAIL with "mapChangedFiles is not defined".

**Step 3: Write minimal implementation**

Create `tools/changed.mjs`:
```js
import { spawnSync } from "node:child_process";

const TOOLING_GLOBS = [
  "Taskfile.yml",
  "tools/",
  ".github/",
  "infra/tools.compose.yaml",
  "package.json",
  "pnpm-workspace.yaml",
  "biome.json",
  "back/pom.xml"
];

export function mapChangedFiles(files) {
  for (const f of files) {
    if (TOOLING_GLOBS.some((g) => f.startsWith(g))) return ["__ALL__"];
    if (f.startsWith("contracts/")) return ["__CONTRACTS__"];
    if (f.startsWith("docs/")) return ["__DOCS__"];
  }
  return [];
}

export async function getChangedScopes(baseRef = process.env.CHANGE_BASE || "origin/main") {
  const diff = spawnSync("git", ["diff", "--name-only", baseRef], { encoding: "utf8" });
  const files = diff.stdout.split("\n").filter(Boolean);
  return mapChangedFiles(files);
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm vitest run tools/test/unit/changed.test.mjs`
Expected: PASS.

**Step 5: Commit**

Run:
```bash
git add tools/changed.mjs tools/test/unit/changed.test.mjs
git commit -m "feat: add changed-only mapping"
```

### Task 7: Ports registry + allocator (with unit tests)

**Files:**
- Create: `infra/ports.yaml`
- Create: `tools/scaffold/ports.cjs`
- Create: `tools/test/unit/ports.test.mjs`

**Step 1: Write failing test**

Create `tools/test/unit/ports.test.mjs`:
```js
import { describe, it, expect } from "vitest";
import { allocateNextPort } from "../../scaffold/ports.cjs";

describe("allocateNextPort", () => {
  it("allocates the first free port in range", () => {
    const port = allocateNextPort({ used: [8081], start: 8081, end: 8083 });
    expect(port).toBe(8082);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm vitest run tools/test/unit/ports.test.mjs`
Expected: FAIL with "allocateNextPort is not defined".

**Step 3: Write minimal implementation**

Create `infra/ports.yaml`:
```yaml
back:
  services: {}
front:
  apps: {}
```

Create `tools/scaffold/ports.cjs`:
```js
const fs = require("fs");
const yaml = require("js-yaml");

const PORTS_PATH = "infra/ports.yaml";
const RANGES = {
  service: { start: 8081, end: 8199 },
  app: { start: 3001, end: 3099 }
};

function readPorts() {
  const raw = fs.readFileSync(PORTS_PATH, "utf8");
  return yaml.load(raw);
}

function writePorts(data) {
  fs.writeFileSync(PORTS_PATH, yaml.dump(data, { lineWidth: -1 }));
}

function allocateNextPort({ used, start, end }) {
  for (let p = start; p <= end; p += 1) {
    if (!used.includes(p)) return p;
  }
  throw new Error("No free ports in range");
}

function allocateServicePort(name) {
  const data = readPorts();
  const used = Object.values(data.back.services || {});
  const port = allocateNextPort({ used, ...RANGES.service });
  data.back.services[name] = port;
  writePorts(data);
  return port;
}

function allocateAppPort(name) {
  const data = readPorts();
  const used = Object.values(data.front.apps || {});
  const port = allocateNextPort({ used, ...RANGES.app });
  data.front.apps[name] = port;
  writePorts(data);
  return port;
}

function listPorts() {
  const data = readPorts();
  console.log(yaml.dump(data));
}

function doctorPorts() {
  const data = readPorts();
  const all = [];
  for (const p of Object.values(data.back.services || {})) all.push(p);
  for (const p of Object.values(data.front.apps || {})) all.push(p);
  const dup = all.find((p, i) => all.indexOf(p) !== i);
  if (dup) throw new Error("Duplicate port: " + dup);
}

if (require.main === module) {
  const cmd = process.argv[2];
  if (cmd === "list") listPorts();
  if (cmd === "doctor") doctorPorts();
}

module.exports = {
  allocateNextPort,
  allocateServicePort,
  allocateAppPort,
  listPorts,
  doctorPorts
};
```

**Step 4: Run test to verify it passes**

Run: `pnpm vitest run tools/test/unit/ports.test.mjs`
Expected: PASS.

**Step 5: Commit**

Run:
```bash
git add infra/ports.yaml tools/scaffold/ports.cjs tools/test/unit/ports.test.mjs
git commit -m "feat: add ports registry and allocator"
```

### Task 8: Contracts pipeline scripts

**Files:**
- Create: `contracts/rules/spectral.yaml`
- Create: `tools/contracts/bundle-all.mjs`
- Create: `tools/contracts/gen-clients.mjs`
- Create: `tools/contracts/breaking.mjs`
- Create: `tools/contracts/drift-check.mjs`

**Step 1: Add Spectral ruleset**

Create `contracts/rules/spectral.yaml`:
```yaml
extends: ["spectral:oas"]
```

**Step 2: Add bundle and client scripts**

Create `tools/contracts/bundle-all.mjs`:
```js
import { spawnSync } from "node:child_process";
import { readdirSync } from "node:fs";
import path from "node:path";

const specs = readdirSync("contracts/rest").filter((f) => f.endsWith(".openapi.yaml"));
for (const spec of specs) {
  const out = path.join("docs/api/openapi", spec.replace(".openapi.yaml", ".bundled.yaml"));
  const result = spawnSync("pnpm", ["redocly", "bundle", path.join("contracts/rest", spec), "-o", out], { stdio: "inherit" });
  if (result.status) process.exit(result.status);
}
```

Create `tools/contracts/gen-clients.mjs`:
```js
import { spawnSync } from "node:child_process";
import { readdirSync, mkdirSync } from "node:fs";
import path from "node:path";

const specs = readdirSync("contracts/rest").filter((f) => f.endsWith(".openapi.yaml"));
for (const spec of specs) {
  const svc = spec.replace(".openapi.yaml", "");
  const outDir = path.join("front/packages/api-clients", svc);
  mkdirSync(outDir, { recursive: true });
  const result = spawnSync("pnpm", ["openapi-typescript", path.join("contracts/rest", spec), "-o", path.join(outDir, "types.ts")], { stdio: "inherit" });
  if (result.status) process.exit(result.status);
}
```

Create `tools/contracts/breaking.mjs`:
```js
import { spawnSync } from "node:child_process";

const base = process.env.CHANGE_BASE || "origin/main";
const diff = spawnSync("git", ["diff", "--name-only", base, "--", "contracts/rest"], { encoding: "utf8" });
const files = diff.stdout.split("\n").filter((f) => f.endsWith(".openapi.yaml"));
for (const f of files) {
  const result = spawnSync("pnpm", ["redocly", "diff", "--severity=error", `${base}:${f}`, f], { stdio: "inherit" });
  if (result.status) process.exit(result.status);
}
```

Create `tools/contracts/drift-check.mjs`:
```js
console.log("drift-check not implemented yet");
process.exit(0);
```

**Step 3: Verify contracts build (dry)**

Run: `./mono --native contracts build`
Expected: bundles created for any existing specs.

**Step 4: Commit**

Run:
```bash
git add contracts/rules/spectral.yaml tools/contracts/bundle-all.mjs tools/contracts/gen-clients.mjs tools/contracts/breaking.mjs tools/contracts/drift-check.mjs
git commit -m "feat: add contracts tooling"
```

### Task 9: Scaffolding + normalization helpers

**Files:**
- Create: `tools/scaffold/constants.cjs`
- Create: `tools/scaffold/maven.cjs`
- Create: `tools/scaffold/normalize/nuxt.cjs`
- Create: `tools/scaffold/normalize/quarkus.cjs`
- Create: `tools/scaffold/normalize/package.cjs`
- Create: `tools/scaffold/plopfile.cjs`
- Create: `tools/scaffold/actions/app.cjs`
- Create: `tools/scaffold/actions/service.cjs`
- Create: `tools/scaffold/actions/lib.cjs`
- Create: `tools/scaffold/actions/package.cjs`

**Step 1: Add constants and Maven helper**

Create `tools/scaffold/constants.cjs`:
```js
module.exports = {
  DEFAULT_GROUP_ID: "com.omniflowcx",
  DEFAULT_BASE_PACKAGE: "com.omniflowcx"
};
```

Create `tools/scaffold/maven.cjs`:
```js
const fs = require("fs");

function insertModule(path, modulePath) {
  const xml = fs.readFileSync(path, "utf8");
  if (xml.includes(`<module>${modulePath}</module>`)) return;
  const updated = xml.replace("</modules>", `  <module>${modulePath}</module>\n</modules>`);
  fs.writeFileSync(path, updated);
}

module.exports = { insertModule };
```

**Step 2: Add normalization helpers**

Create `tools/scaffold/normalize/nuxt.cjs`:
```js
const fs = require("fs");
const path = require("path");

function normalizeNuxt(appDir, name, port) {
  const pkgPath = path.join(appDir, "package.json");
  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
  pkg.scripts = {
    dev: "nuxt dev",
    build: "nuxt build",
    fmt: "biome format .",
    lint: "biome lint .",
    typecheck: "tsc --noEmit",
    "test:ci": `vitest run --reporter=junit --outputFile=reports/vitest/${name}.junit.xml`
  };
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
  fs.writeFileSync(path.join(appDir, ".env"), `NUXT_PORT=${port}\nNUXT_HOST=0.0.0.0\n`);
}

module.exports = { normalizeNuxt };
```

Create `tools/scaffold/normalize/quarkus.cjs`:
```js
const fs = require("fs");
const path = require("path");

function normalizeQuarkus(serviceDir, name, port) {
  const propsPath = path.join(serviceDir, "src/main/resources/application.properties");
  fs.appendFileSync(propsPath, `\nquarkus.http.port=${port}\nquarkus.http.host=0.0.0.0\nquarkus.application.name=${name}\n`);
}

module.exports = { normalizeQuarkus };
```

Create `tools/scaffold/normalize/package.cjs`:
```js
const fs = require("fs");
const path = require("path");

function normalizePackage(dir, name) {
  const pkgPath = path.join(dir, "package.json");
  const pkg = {
    name: `@omniflowcx/${name}`,
    version: "0.1.0",
    private: true,
    scripts: {
      fmt: "biome format .",
      lint: "biome lint .",
      typecheck: "tsc --noEmit",
      "test:ci": `vitest run --reporter=junit --outputFile=reports/vitest/pkg-${name}.junit.xml`,
      build: "tsc -p tsconfig.json"
    }
  };
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
}

module.exports = { normalizePackage };
```

**Step 3: Add plopfile and actions**

Create `tools/scaffold/plopfile.cjs`:
```js
module.exports = function (plop) {
  plop.setGenerator("app", { prompts: [], actions: [] });
  plop.setGenerator("service", { prompts: [], actions: [] });
  plop.setGenerator("lib", { prompts: [], actions: [] });
  plop.setGenerator("package", { prompts: [], actions: [] });
};
```

Create `tools/scaffold/actions/app.cjs`:
```js
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const os = require("os");
const { allocateAppPort } = require("../ports.cjs");
const { normalizeNuxt } = require("../normalize/nuxt.cjs");

const name = process.argv[2];
if (!name || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(name)) {
  throw new Error("Invalid name; use lowercase-kebab");
}
const port = allocateAppPort(name);
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "nuxt-app-"));
execSync(`pnpm create nuxt@latest -- -t github:nuxt-ui-templates/dashboard ${tmp}`, { stdio: "inherit" });
const dest = path.join("front/apps", name);
execSync(`rm -rf ${dest}`);
execSync(`mv ${tmp} ${dest}`);
normalizeNuxt(dest, name, port);
```

Create `tools/scaffold/actions/service.cjs`:
```js
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const os = require("os");
const { allocateServicePort } = require("../ports.cjs");
const { normalizeQuarkus } = require("../normalize/quarkus.cjs");
const { insertModule } = require("../maven.cjs");
const { DEFAULT_GROUP_ID } = require("../constants.cjs");

const name = process.argv[2];
if (!name || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(name)) {
  throw new Error("Invalid name; use lowercase-kebab");
}
const port = allocateServicePort(name);
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "quarkus-"));
execSync(`mvn io.quarkus.platform:quarkus-maven-plugin:3.30.6:create -DprojectGroupId=${DEFAULT_GROUP_ID} -DprojectArtifactId=${name} -Dextensions='rest' -DoutputDirectory=${tmp}`, { stdio: "inherit" });
const dest = path.join("back/services", name);
execSync(`rm -rf ${dest}`);
execSync(`mv ${path.join(tmp, name)} ${dest}`);
normalizeQuarkus(dest, name, port);
insertModule("back/pom.xml", `services/${name}`);
fs.writeFileSync(path.join("contracts/rest", `${name}.openapi.yaml`), "openapi: 3.0.3\ninfo:\n  title: " + name + "\n  version: 0.1.0\npaths: {}\n");
```

Create `tools/scaffold/actions/lib.cjs`:
```js
const fs = require("fs");
const path = require("path");
const { insertModule } = require("../maven.cjs");

const name = process.argv[2];
if (!name || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(name)) {
  throw new Error("Invalid name; use lowercase-kebab");
}
const dir = path.join("back/libs", name);
fs.mkdirSync(dir, { recursive: true });
insertModule("back/pom.xml", `libs/${name}`);
```

Create `tools/scaffold/actions/package.cjs`:
```js
const fs = require("fs");
const path = require("path");
const { normalizePackage } = require("../normalize/package.cjs");

const name = process.argv[2];
if (!name || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(name)) {
  throw new Error("Invalid name; use lowercase-kebab");
}
const dir = path.join("front/packages", name);
fs.mkdirSync(dir, { recursive: true });
normalizePackage(dir, name);
```

**Step 4: Verify no syntax errors**

Run: `node -c tools/scaffold/actions/app.cjs`
Expected: no output.

**Step 5: Commit**

Run:
```bash
git add tools/scaffold
git commit -m "feat: add scaffold helpers and generators"
```

### Task 10: Tooling tests (unit + e2e harness)

**Files:**
- Create: `tools/test/unit/name.test.mjs`
- Create: `tools/test/e2e/e2e.test.mjs`

**Step 1: Write failing unit test**

Create `tools/test/unit/name.test.mjs`:
```js
import { describe, it, expect } from "vitest";

const isKebab = (s) => /^[a-z0-9]+(-[a-z0-9]+)*$/.test(s);

describe("kebab validation", () => {
  it("accepts lowercase-kebab", () => {
    expect(isKebab("my-service")).toBe(true);
  });
});
```

**Step 2: Run test to verify it passes**

Run: `pnpm vitest run tools/test/unit/name.test.mjs`
Expected: PASS.

**Step 3: Add E2E harness**

Create `tools/test/e2e/e2e.test.mjs`:
```js
import { describe, it } from "vitest";
import { execSync } from "node:child_process";

describe("tooling e2e", () => {
  it("scaffolds a service", () => {
    execSync("./mono new service e2e-svc", { stdio: "inherit" });
  });
});
```

**Step 4: Commit**

Run:
```bash
git add tools/test
git commit -m "test: add tooling unit and e2e harness"
```

### Task 11: Final verification

**Step 1: Run docker-first checks**

Run:
```bash
./mono bootstrap
./mono contracts build
./mono docs build
./mono check --all
./mono tooling test --e2e
```
Expected: all commands succeed.

**Step 2: Commit**

Run:
```bash
git add -A
git commit -m "chore: verify tooling stack"
```
