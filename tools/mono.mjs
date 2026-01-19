#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { readdirSync } from "node:fs";
import path from "node:path";
import { getChangedScopes } from "./changed.mjs";
import {
	CHECK_STEPS,
	COMMANDS,
	SCOPED_COMMANDS,
	SPECIAL_COMMANDS,
	resolveCommand,
} from "./commands.mjs";
import {
	isBackScope,
	isFrontScope,
	mvnForScope,
	pnpmForScope,
} from "./scopes.mjs";

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

const taskAvailable = () => {
	const result = spawnSync("task", ["--version"], { stdio: "ignore" });
	if (result.error && result.error.code === "ENOENT") return false;
	return result.status === 0;
};

const taskInstaller =
	'if ! command -v task >/dev/null 2>&1; then install_dir=/usr/local/bin; if [ ! -w "$install_dir" ]; then install_dir="$HOME/.local/bin"; mkdir -p "$install_dir"; fi; curl -sL https://taskfile.dev/install.sh | sh -s -- -d -b "$install_dir"; fi';

const ensureTask = () => run("bash", ["-c", taskInstaller]);

const runTask = (taskName, extra = []) => {
	const entry = COMMANDS[taskName];
	if (!entry) {
		log.error(`Unknown task: ${taskName}`);
		return 1;
	}
	if (SPECIAL_COMMANDS.has(taskName)) {
		const command = entry.command;
		const args =
			typeof entry.args === "function" ? entry.args(extra) : entry.args;
		return run(command, args);
	}
	if (!taskAvailable()) ensureTask();
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

const resolved = resolveCommand(cmd, args);
if (SPECIAL_COMMANDS.has(resolved.name)) {
	if (resolved.name === "list:scopes") {
		listScopes();
		process.exit(0);
	}
}

const scopeList = await parseScopes();

if (useChanged && scopeList.some((s) => s.startsWith("__"))) {
	process.exit(runTask(resolved.name, resolved.extra));
}

if (scopeList.length === 0 || useAll || !SCOPED_COMMANDS.has(resolved.name)) {
	process.exit(runTask(resolved.name, resolved.extra));
}

if (resolved.name === "dev") {
	await runScoped(scopeList, {
		back: (s) => {
			const [command, args] = mvnForScope(s, "quarkus:dev");
			return run(command, args);
		},
		front: (s) => {
			const [command, args] = pnpmForScope(s, "dev");
			return run(command, args);
		},
	});
	process.exit(0);
}

if (resolved.name === "fmt") {
	await runScoped(scopeList, {
		back: (s) => {
			const [command, args] = mvnForScope(s, "spotless:apply");
			return run(command, args);
		},
		front: (s) => {
			const [command, args] = pnpmForScope(s, "fmt");
			return run(command, args);
		},
	});
	process.exit(0);
}

if (resolved.name === "lint") {
	await runScoped(scopeList, {
		back: (s) => {
			const [command, args] = mvnForScope(s, "spotless:check");
			return run(command, args);
		},
		front: (s) => {
			const [command, args] = pnpmForScope(s, "lint");
			return run(command, args);
		},
	});
	process.exit(0);
}

if (resolved.name === "typecheck") {
	await runScoped(scopeList, {
		back: () => 0,
		front: (s) => {
			const [command, args] = pnpmForScope(s, "typecheck");
			return run(command, args);
		},
	});
	process.exit(0);
}

if (resolved.name === "test") {
	await runScoped(scopeList, {
		back: (s) => {
			const [command, args] = mvnForScope(s, "test");
			return run(command, args);
		},
		front: (s) => {
			const [command, args] = pnpmForScope(s, "test:ci");
			return run(command, args);
		},
	});
	process.exit(0);
}

if (resolved.name === "build") {
	await runScoped(scopeList, {
		back: (s) => {
			const [command, args] = mvnForScope(s, "package", ["-DskipTests"]);
			return run(command, args);
		},
		front: (s) => {
			const [command, args] = pnpmForScope(s, "build");
			return run(command, args);
		},
	});
	process.exit(0);
}

if (resolved.name === "check") {
	if (scopeList.length === 0) {
		log.warn("No changed scopes to check");
		process.exit(0);
	}

	log.info(`Checking ${scopeList.length} scope(s): ${scopeList.join(", ")}`);
	console.log();

	for (const scope of scopeList) {
		log.dim(`\n--- Checking: ${scope} ---`);
		for (let i = 0; i < CHECK_STEPS.length; i++) {
			const step = CHECK_STEPS[i];
			log.step(`[${i + 1}/${CHECK_STEPS.length}] ${step}...`);
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

process.exit(runTask(resolved.name, resolved.extra));
