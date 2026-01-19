export const SCOPED_COMMANDS = new Set([
	"dev",
	"fmt",
	"lint",
	"typecheck",
	"test",
	"build",
]);

export const CHECK_STEPS = ["lint", "typecheck", "test", "build"];

const installGoTask =
	'if ! command -v task >/dev/null 2>&1; then install_dir=/usr/local/bin; if [ ! -w "$install_dir" ]; then install_dir="$HOME/.local/bin"; mkdir -p "$install_dir"; fi; curl -sL https://taskfile.dev/install.sh | sh -s -- -d -b "$install_dir"; fi';

const installDeps = "pnpm install";

export const COMMANDS = {
	bootstrap: {
		command: "bash",
		args: ["-c", `${installGoTask}; ${installDeps}`],
	},
	fmt: {
		command: "bash",
		args: [
			"-c",
			"pnpm biome format --write . && mvn -f back/pom.xml -q com.diffplug.spotless:spotless-maven-plugin:2.44.0:apply",
		],
	},
	lint: {
		command: "bash",
		args: [
			"-c",
			'set -o pipefail && mkdir -p reports/lint && pnpm biome lint . | tee reports/lint/biome.log && mvn -f back/pom.xml -q com.diffplug.spotless:spotless-maven-plugin:2.44.0:check | tee reports/lint/spotless.log && mvn -f back/pom.xml -q -DskipTests compile com.github.spotbugs:spotbugs-maven-plugin:4.8.6.0:check -Dspotbugs.effort=Default -Dspotbugs.threshold=Medium -Dspotbugs.excludeFilterFile=config/spotbugs/excludes.xml | tee reports/lint/spotbugs.log && pnpm spectral lint --ruleset contracts/rules/spectral.yaml contracts/rest/*.openapi.yaml | tee reports/lint/spectral.log && pnpm markdownlint-cli2 "docs/**/*.md" "README.md" | tee reports/lint/markdown.log',
		],
	},
	typecheck: {
		command: "bash",
		args: [
			"-c",
			"mkdir -p reports/typecheck && pnpm -r --filter ./front... tsc --noEmit | tee reports/typecheck/front-tsc.log",
		],
	},
	test: {
		command: "bash",
		args: [
			"-c",
			"set -o pipefail && mkdir -p reports/test && mvn -f back/pom.xml test | tee reports/test/maven.log && rm -rf reports/vitest && mkdir -p reports/vitest && pnpm vitest run --reporter=junit --outputFile=reports/vitest/root.junit.xml | tee reports/vitest/vitest.log",
		],
	},
	build: {
		command: "bash",
		args: [
			"-c",
			"set -o pipefail && rm -rf reports/build && mkdir -p reports/build && mvn -f back/pom.xml -DskipTests package | tee reports/build/maven.log && pnpm -r --filter ./front... build | tee reports/build/front-build.log",
		],
	},
	check: {
		command: "task",
		args: ["check"],
	},

	"contracts:lint": {
		command: "bash",
		args: [
			"-c",
			"set -o pipefail && mkdir -p reports/contracts && pnpm spectral lint --ruleset contracts/rules/spectral.yaml contracts/rest/*.openapi.yaml | tee reports/contracts/spectral.log",
		],
	},
	"contracts:breaking": {
		command: "bash",
		args: [
			"-c",
			"set -o pipefail && mkdir -p reports/contracts && node tools/contracts/breaking.mjs | tee reports/contracts/breaking.log",
		],
	},
	"contracts:build": {
		command: "bash",
		args: [
			"-c",
			"set -o pipefail && mkdir -p reports/contracts && node tools/contracts/bundle-all.mjs | tee reports/contracts/bundle-all.log && node tools/contracts/gen-clients.mjs | tee reports/contracts/gen-clients.log && pnpm -r --filter ./front... typecheck | tee reports/contracts/typecheck.log",
		],
	},
	"docs:lint": {
		command: "bash",
		args: [
			"-c",
			'set -o pipefail && mkdir -p reports/docs && pnpm markdownlint-cli2 "docs/**/*.md" "README.md" | tee reports/docs/markdownlint.log',
		],
	},
	"docs:build": {
		command: "bash",
		args: [
			"-c",
			"set -o pipefail && mkdir -p reports/docs && node tools/contracts/bundle-all.mjs | tee reports/docs/bundle-all.log && node tools/contracts/gen-clients.mjs | tee reports/docs/gen-clients.log && pnpm -C docs/site vitepress build | tee reports/docs/vitepress-build.log",
		],
	},
	"docs:serve": {
		command: "bash",
		args: [
			"-c",
			"mkdir -p reports/docs && pnpm -C docs/site vitepress dev 2>&1 | tee reports/docs/vitepress-dev.log",
		],
	},
	"infra:up": {
		command: "bash",
		args: [
			"-c",
			"set -o pipefail && mkdir -p reports/infra && docker compose -f infra/tools.compose.yaml up -d | tee reports/infra/up.log",
		],
	},
	"infra:down": {
		command: "bash",
		args: [
			"-c",
			"set -o pipefail && mkdir -p reports/infra && docker compose -f infra/tools.compose.yaml down | tee reports/infra/down.log",
		],
	},
	"list:ports": {
		command: "bash",
		args: [
			"-c",
			"set -o pipefail && mkdir -p reports/list && node tools/scaffold/ports.cjs list | tee reports/list/ports.log",
		],
	},
	"list:scopes": {
		command: "bash",
		args: [
			"-c",
			"set -o pipefail && mkdir -p reports/list && node tools/list-scopes.mjs | tee reports/list/scopes.log",
		],
	},
	doctor: {
		command: "bash",
		args: [
			"-c",
			"set -o pipefail && mkdir -p reports/doctor && node tools/tooling/doctor.mjs | tee reports/doctor/tooling.log && node tools/scaffold/ports.cjs doctor | tee reports/doctor/ports.log",
		],
	},
	"tooling:test": {
		command: "bash",
		args: [
			"-c",
			"set -o pipefail && mkdir -p reports/tooling && pnpm vitest run | tee reports/tooling/vitest.log",
		],
	},
	"tooling:test:e2e": {
		command: "bash",
		args: [
			"-c",
			"set -o pipefail && mkdir -p reports/tooling && pnpm vitest run --dir tools/test/e2e | tee reports/tooling/vitest-e2e.log",
		],
	},
	"new:app": {
		command: "bash",
		args: (extra) => [
			"-c",
			`set -o pipefail && mkdir -p reports/new && node tools/scaffold/actions/app.cjs ${extra.join(" ")} | tee reports/new/app.log`,
		],
	},
	"new:service": {
		command: "bash",
		args: (extra) => [
			"-c",
			`set -o pipefail && mkdir -p reports/new && node tools/scaffold/actions/service.cjs ${extra.join(" ")} | tee reports/new/service.log`,
		],
	},
	"new:lib": {
		command: "bash",
		args: (extra) => [
			"-c",
			`set -o pipefail && mkdir -p reports/new && node tools/scaffold/actions/lib.cjs ${extra.join(" ")} | tee reports/new/lib.log`,
		],
	},
	"new:package": {
		command: "bash",
		args: (extra) => [
			"-c",
			`set -o pipefail && mkdir -p reports/new && node tools/scaffold/actions/package.cjs ${extra.join(" ")} | tee reports/new/package.log`,
		],
	},
	"delete:app": {
		command: "bash",
		args: (extra) => [
			"-c",
			`set -o pipefail && mkdir -p reports/delete && node tools/scaffold/actions/delete-app.cjs ${extra.join(" ")} | tee reports/delete/app.log`,
		],
	},
	"delete:service": {
		command: "bash",
		args: (extra) => [
			"-c",
			`set -o pipefail && mkdir -p reports/delete && node tools/scaffold/actions/delete-service.cjs ${extra.join(" ")} | tee reports/delete/service.log`,
		],
	},
	"delete:lib": {
		command: "bash",
		args: (extra) => [
			"-c",
			`set -o pipefail && mkdir -p reports/delete && node tools/scaffold/actions/delete-lib.cjs ${extra.join(" ")} | tee reports/delete/lib.log`,
		],
	},
	"delete:package": {
		command: "bash",
		args: (extra) => [
			"-c",
			`set -o pipefail && mkdir -p reports/delete && node tools/scaffold/actions/delete-package.cjs ${extra.join(" ")} | tee reports/delete/package.log`,
		],
	},
};

export function resolveCommand(cmd, args) {
	if (cmd === "tooling") {
		if (args[1] === "test" && args.includes("--e2e"))
			return { name: "tooling:test:e2e", extra: [] };
		if (args[1] === "test") return { name: "tooling:test", extra: [] };
	}

	if (cmd === "list" && args[1] === "scopes") {
		return { name: "list:scopes", extra: [] };
	}

	if (cmd === "list" && args[1] === "ports") {
		return { name: "list:ports", extra: [] };
	}

	if (cmd.startsWith("contracts")) {
		const name = cmd.includes(":") ? cmd : `contracts:${args[1] || "build"}`;
		return { name, extra: [] };
	}

	if (cmd.startsWith("docs")) {
		const name = cmd.includes(":") ? cmd : `docs:${args[1] || "build"}`;
		return { name, extra: [] };
	}

	if (cmd.startsWith("infra")) {
		const name = cmd.includes(":") ? cmd : `infra:${args[1] || "up"}`;
		return { name, extra: [] };
	}

	if (cmd === "new") {
		const target = args[1];
		return { name: `new:${target}`, extra: args.slice(2) };
	}

	if (cmd === "delete") {
		const target = args[1];
		return { name: `delete:${target}`, extra: args.slice(2) };
	}

	return { name: cmd, extra: [] };
}
