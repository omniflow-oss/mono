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

const run = (command, commandArgs) => {
	if (dryRun) {
		console.log([command, ...commandArgs].join(" "));
		return 0;
	}
	const result = spawnSync(command, commandArgs, { stdio: "inherit" });
	return result.status ?? 1;
};

const runTask = (taskName, extra = []) =>
	run("task", extra.length ? [taskName, "--", ...extra] : [taskName]);

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
	console.log(
		"Usage: ./mono <command> [--scope <path>] [--changed] [--all] [--dry-run]",
	);
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
	for (const scope of scopeList) {
		for (const step of steps) {
			const status = run("node", ["tools/mono.mjs", step, "--scope", scope]);
			if (status) process.exit(status);
		}
	}
	process.exit(0);
}

process.exit(runTask(cmd));
