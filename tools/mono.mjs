#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { readdirSync, statSync } from "node:fs";
import path from "node:path";
import { getChangedScopes } from "./changed.mjs";

const args = process.argv.slice(2);
const cmd = args[0] || "help";

const flags = new Set(args.filter((a) => a.startsWith("--")));
const scopes = [];
for (let i = 0; i < args.length; i += 1) {
	if (args[i] === "--scope" && args[i + 1]) scopes.push(args[i + 1]);
}

const dryRun = flags.has("--dry-run");
const useChanged = flags.has("--changed");
const useAll = flags.has("--all");
const verbose = flags.has("--verbose") || flags.has("-v");

// Color output helpers
const colors = {
	reset: "\x1b[0m",
	green: "\x1b[32m",
	red: "\x1b[31m",
	yellow: "\x1b[33m",
	blue: "\x1b[34m",
	magenta: "\x1b[35m",
	cyan: "\x1b[36m",
	gray: "\x1b[90m",
};

const log = {
	success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
	error: (msg) => console.error(`${colors.red}✗${colors.reset} ${msg}`),
	warn: (msg) => console.warn(`${colors.yellow}⚠${colors.reset} ${msg}`),
	info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
	step: (msg) => console.log(`${colors.cyan}▸${colors.reset} ${msg}`),
	dim: (msg) => console.log(`${colors.gray}${msg}${colors.reset}`),
};

const run = (command, commandArgs) => {
	if (dryRun) {
		console.log([command, ...commandArgs].join(" "));
		return 0;
	}
	const result = spawnSync(command, commandArgs, { stdio: "inherit" });
	return result.status ?? 1;
};

const taskAvailable = (() => {
	const result = spawnSync("task", ["--version"], { stdio: "ignore" });
	if (result.error && result.error.code === "ENOENT") return false;
	return result.status === 0;
})();

const runTaskFallback = (taskName, extra = []) => {
	switch (taskName) {
		case "bootstrap":
			return run("bash", [
				"-c",
				"pnpm install; if [ -f docs/site/package.json ]; then pnpm -C docs/site install; fi",
			]);
		case "fmt":
			return run("bash", [
				"-c",
				"pnpm biome format --write . && mvn -f back/pom.xml -q com.diffplug.spotless:spotless-maven-plugin:2.44.0:apply",
			]);
		case "lint":
			return run("bash", [
				"-c",
				'set -o pipefail && mkdir -p reports/lint && pnpm biome lint . | tee reports/lint/biome.log && mvn -f back/pom.xml -q com.diffplug.spotless:spotless-maven-plugin:2.44.0:check | tee reports/lint/spotless.log && mvn -f back/pom.xml -q -DskipTests compile com.github.spotbugs:spotbugs-maven-plugin:4.8.6.0:check -Dspotbugs.effort=Default -Dspotbugs.threshold=Medium -Dspotbugs.excludeFilterFile=config/spotbugs/excludes.xml | tee reports/lint/spotbugs.log && pnpm spectral lint --ruleset contracts/rules/spectral.yaml contracts/rest/*.openapi.yaml | tee reports/lint/spectral.log && pnpm markdownlint-cli2 "docs/**/*.md" "README.md" | tee reports/lint/markdown.log',
			]);
		case "typecheck":
			return run("bash", [
				"-c",
				"mkdir -p reports/typecheck && pnpm -r --filter ./front... tsc --noEmit | tee reports/typecheck/front-tsc.log",
			]);
		case "test":
			return run("bash", [
				"-c",
				"set -o pipefail && mkdir -p reports/test && mvn -f back/pom.xml test | tee reports/test/maven.log && rm -rf reports/vitest && mkdir -p reports/vitest && pnpm vitest run --reporter=junit --outputFile=reports/vitest/root.junit.xml | tee reports/vitest/vitest.log",
			]);
		case "build":
			return run("bash", [
				"-c",
				"set -o pipefail && rm -rf reports/build && mkdir -p reports/build && mvn -f back/pom.xml -DskipTests package | tee reports/build/maven.log && pnpm -r --filter ./front... build | tee reports/build/front-build.log",
			]);
		case "check":
			return run("bash", [
				"-c",
				"node tools/mono.mjs lint --changed && node tools/mono.mjs typecheck --changed && node tools/mono.mjs test --changed && node tools/mono.mjs build --changed",
			]);
		case "contracts:lint":
			return run("bash", [
				"-c",
				"set -o pipefail && mkdir -p reports/contracts && pnpm spectral lint --ruleset contracts/rules/spectral.yaml contracts/rest/*.openapi.yaml | tee reports/contracts/spectral.log",
			]);
		case "contracts:breaking":
			return run("bash", [
				"-c",
				"set -o pipefail && mkdir -p reports/contracts && node tools/contracts/breaking.mjs | tee reports/contracts/breaking.log",
			]);
		case "contracts:build":
			return run("bash", [
				"-c",
				"set -o pipefail && mkdir -p reports/contracts && node tools/contracts/bundle-all.mjs | tee reports/contracts/bundle-all.log && node tools/contracts/gen-clients.mjs | tee reports/contracts/gen-clients.log && pnpm -r --filter ./front... typecheck | tee reports/contracts/typecheck.log",
			]);
		case "docs:lint":
			return run("bash", [
				"-c",
				'set -o pipefail && mkdir -p reports/docs && pnpm markdownlint-cli2 "docs/**/*.md" "README.md" | tee reports/docs/markdownlint.log',
			]);
		case "docs:build":
			return run("bash", [
				"-c",
				"set -o pipefail && mkdir -p reports/docs && node tools/contracts/bundle-all.mjs | tee reports/docs/bundle-all.log && node tools/contracts/gen-clients.mjs | tee reports/docs/gen-clients.log && cd docs/site && pnpm vitepress build | tee ../../reports/docs/vitepress-build.log",
			]);
		case "list:ports":
			return run("bash", [
				"-c",
				"set -o pipefail && mkdir -p reports/list && node tools/scaffold/ports.cjs list | tee reports/list/ports.log",
			]);
		case "list:scopes":
			return run("bash", [
				"-c",
				"set -o pipefail && mkdir -p reports/list && node tools/mono.mjs list scopes | tee reports/list/scopes.log",
			]);
		case "doctor":
			return run("bash", [
				"-c",
				"set -o pipefail && mkdir -p reports/doctor && node tools/scaffold/ports.cjs doctor | tee reports/doctor/doctor.log",
			]);
		case "tooling:test":
			return run("bash", [
				"-c",
				"set -o pipefail && mkdir -p reports/tooling && pnpm vitest run | tee reports/tooling/vitest.log",
			]);
		case "tooling:test:e2e":
			return run("bash", [
				"-c",
				"set -o pipefail && mkdir -p reports/tooling && pnpm vitest run --dir tools/test/e2e | tee reports/tooling/vitest-e2e.log",
			]);
		case "new:app":
			return run("bash", [
				"-c",
				`set -o pipefail && mkdir -p reports/new && node tools/scaffold/actions/app.cjs ${extra.join(" ")} | tee reports/new/app.log`,
			]);
		case "new:service":
			return run("bash", [
				"-c",
				`set -o pipefail && mkdir -p reports/new && node tools/scaffold/actions/service.cjs ${extra.join(" ")} | tee reports/new/service.log`,
			]);
		case "new:lib":
			return run("bash", [
				"-c",
				`set -o pipefail && mkdir -p reports/new && node tools/scaffold/actions/lib.cjs ${extra.join(" ")} | tee reports/new/lib.log`,
			]);
		case "new:package":
			return run("bash", [
				"-c",
				`set -o pipefail && mkdir -p reports/new && node tools/scaffold/actions/package.cjs ${extra.join(" ")} | tee reports/new/package.log`,
			]);
		default:
			log.error(
				`Task runner not installed and no fallback for task: ${taskName}`,
			);
			if (extra.length) log.info(`Args: ${extra.join(" ")}`);
			return 1;
	}
};

const runTask = (taskName, extra = []) => {
	if (!taskAvailable) {
		return runTaskFallback(taskName, extra);
	}
	return run("task", extra.length ? [taskName, "--", ...extra] : [taskName]);
};

const listScopes = () => {
	const roots = ["back/services", "back/libs", "front/apps", "front/packages"];
	for (const root of roots) {
		try {
			const entries = readdirSync(root, { withFileTypes: true });
			for (const entry of entries) {
				if (entry.isDirectory()) console.log(path.join(root, entry.name));
			}
		} catch {
			// ignore missing roots
		}
	}
};

const parseScopes = async () => {
	if (useAll) return [];
	if (useChanged) return await getChangedScopes();
	return scopes;
};

const isBackScope = (s) =>
	s.startsWith("back/services/") || s.startsWith("back/libs/");
const isFrontScope = (s) =>
	s.startsWith("front/apps/") || s.startsWith("front/packages/");

const mvnFor = (scopePath, goal, extra = []) => {
	const name = scopePath.split("/").pop();
	const args = ["-f", "back/pom.xml", "-pl", `:${name}`, "-am", goal, ...extra];
	return run("mvn", args);
};

const pnpmFor = (scopePath, script, extra = []) => {
	const args = ["-C", scopePath, script, ...extra];
	return run("pnpm", args);
};

const runScoped = async (scopeList, action) => {
	for (const scope of scopeList) {
		if (isBackScope(scope)) {
			const status = await action.back(scope);
			if (status) process.exit(status);
		} else if (isFrontScope(scope)) {
			const status = await action.front(scope);
			if (status) process.exit(status);
		} else {
			console.error(`Unknown scope: ${scope}`);
			process.exit(1);
		}
	}
};

if (cmd === "help") {
	console.log(`
${colors.cyan}OmniFlowCX Mono Tool${colors.reset}

${colors.yellow}Usage:${colors.reset}
  ./mono <command> [flags]

${colors.yellow}Commands:${colors.reset}
  bootstrap     Install all dependencies
  dev           Start development servers
  check         Run all quality checks (lint, typecheck, test, build)
  lint          Run linters
  typecheck     Run type checking
  test          Run tests
  build         Build projects
  fmt           Format code
  doctor        Check development environment

${colors.yellow}Scaffolding:${colors.reset}
  new <type> <name>  Create new service/app/lib/package
    Types: service, app, lib, package

${colors.yellow}Contracts:${colors.reset}
  contracts:lint      Lint OpenAPI specs
  contracts:breaking  Check breaking changes
  contracts:build     Bundle specs and generate clients

${colors.yellow}Documentation:${colors.reset}
  docs:lint    Lint documentation
  docs:build   Build documentation site
  docs:serve   Start docs dev server

${colors.yellow}Infrastructure:${colors.reset}
  infra:up     Start Docker infrastructure
  infra:down   Stop Docker infrastructure

${colors.yellow}Utilities:${colors.reset}
  list:ports   List allocated ports
  list:scopes  List all scopes
  tooling:test Run tooling tests

${colors.yellow}Flags:${colors.reset}
  --scope <path>  Run command for specific scope
  --changed       Run only for changed files (default)
  --all           Run for all scopes
  --dry-run       Show what would run without executing
  --native        Run without Docker
  --verbose, -v   Enable verbose output

${colors.yellow}Examples:${colors.reset}
  ${colors.gray}# Start all changed services${colors.reset}
  ./mono dev --changed

  ${colors.gray}# Start all services${colors.reset}
  ./mono dev --all

  ${colors.gray}# Start specific service${colors.reset}
  ./mono dev --scope back/services/user-service
  ./mono dev --scope front/apps/dashboard

  ${colors.gray}# Run checks for changed code${colors.reset}
  ./mono check --changed

  ${colors.gray}# Run specific checks for a scope${colors.reset}
  ./mono lint --scope front/apps/dashboard

  ${colors.gray}# Create new service${colors.reset}
  ./mono new service payment

  ${colors.gray}# Build contracts and generate clients${colors.reset}
  ./mono contracts:build

  ${colors.gray}# Preview documentation${colors.reset}
  ./mono docs:serve

  ${colors.gray}# Check environment health${colors.reset}
  ./mono doctor
`);
	process.exit(0);
}

if (cmd === "tooling") {
	if (args[1] === "test" && args.includes("--e2e"))
		process.exit(runTask("tooling:test:e2e"));
	if (args[1] === "test") process.exit(runTask("tooling:test"));
}

if (cmd === "list" && args[1] === "scopes") {
	listScopes();
	process.exit(0);
}

if (cmd === "list" && args[1] === "ports") {
	process.exit(runTask("list:ports"));
}

if (cmd === "doctor") {
	process.exit(runTask("doctor"));
}

if (cmd.startsWith("contracts")) {
	const name = cmd.includes(":") ? cmd : `contracts:${args[1] || "build"}`;
	process.exit(runTask(name));
}

if (cmd.startsWith("docs")) {
	const name = cmd.includes(":") ? cmd : `docs:${args[1] || "build"}`;
	process.exit(runTask(name));
}

if (cmd.startsWith("infra")) {
	const name = cmd.includes(":") ? cmd : `infra:${args[1] || "up"}`;
	process.exit(runTask(name));
}

if (cmd === "new") {
	const target = args[1];
	if (!target) {
		console.error("Missing new target: service|app|lib|package");
		process.exit(1);
	}
	const name = args[2];
	const taskName = `new:${target}`;
	process.exit(runTask(taskName, name ? [name] : []));
}

const scopeList = await parseScopes();

if (useChanged && scopeList.some((s) => s.startsWith("__"))) {
	process.exit(runTask(cmd));
}

if (scopeList.length === 0 || useAll) {
	process.exit(runTask(cmd));
}

if (cmd === "dev") {
	await runScoped(scopeList, {
		back: (s) => mvnFor(s, "quarkus:dev"),
		front: (s) => pnpmFor(s, "dev"),
	});
	process.exit(0);
}

if (cmd === "fmt") {
	await runScoped(scopeList, {
		back: (s) => mvnFor(s, "spotless:apply"),
		front: (s) => pnpmFor(s, "fmt"),
	});
	process.exit(0);
}

if (cmd === "lint") {
	await runScoped(scopeList, {
		back: (s) => mvnFor(s, "spotless:check"),
		front: (s) => pnpmFor(s, "lint"),
	});
	process.exit(0);
}

if (cmd === "typecheck") {
	await runScoped(scopeList, {
		back: () => 0,
		front: (s) => pnpmFor(s, "typecheck"),
	});
	process.exit(0);
}

if (cmd === "test") {
	await runScoped(scopeList, {
		back: (s) => mvnFor(s, "test"),
		front: (s) => pnpmFor(s, "test:ci"),
	});
	process.exit(0);
}

if (cmd === "build") {
	await runScoped(scopeList, {
		back: (s) => mvnFor(s, "package", ["-DskipTests"]),
		front: (s) => pnpmFor(s, "build"),
	});
	process.exit(0);
}

if (cmd === "check") {
	const steps = ["lint", "typecheck", "test", "build"];

	if (scopeList.length === 0) {
		log.warn("No changed scopes to check");
		process.exit(0);
	}

	log.info(`Checking ${scopeList.length} scope(s): ${scopeList.join(", ")}`);
	console.log();

	for (const scope of scopeList) {
		log.dim(`\n--- Checking: ${scope} ---`);
		for (let i = 0; i < steps.length; i++) {
			const step = steps[i];
			log.step(`[${i + 1}/${steps.length}] ${step}...`);
			const status = run("node", ["tools/mono.mjs", step, "--scope", scope]);
			if (status) {
				log.error(`${step} failed in ${scope}`);
				log.info(`Run: ./mono ${step} --scope ${scope}`);
				log.info(`Or: ./mono ${step} --changed`);
				process.exit(status);
			}
			log.success(`${step} passed`);
		}
		log.success(`${scope} ✓`);
	}

	console.log();
	log.success(`All checks passed for ${scopeList.length} scope(s)`);
	process.exit(0);
}

process.exit(runTask(cmd));
