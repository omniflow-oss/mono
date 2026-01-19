import { spawnSync } from "node:child_process";

import { readFileSync } from "node:fs";

const config = JSON.parse(
	readFileSync(new URL("./changed.config.json", import.meta.url), "utf8"),
);

const TOOLING_PREFIXES = config.toolingPrefixes ?? [];

const scopeFromPath = (filePath, base) => {
	const parts = filePath.split("/");
	const idx = parts.indexOf(base);
	if (idx === -1 || parts.length < idx + 2) return null;
	return parts.slice(0, idx + 2).join("/");
};

export function mapChangedFiles(files) {
	const scopes = new Set();

	for (const f of files) {
		if (TOOLING_PREFIXES.some((p) => f.startsWith(p))) {
			scopes.add("__ALL__");
			continue;
		}

		if (f.startsWith(config.contractsPrefix ?? "contracts/")) {
			scopes.add("__CONTRACTS__");
			continue;
		}

		if (f.startsWith(config.docsPrefix ?? "docs/")) {
			scopes.add("__DOCS__");
			continue;
		}

		const backService = scopeFromPath(f, "services");
		if (f.startsWith("back/services/") && backService) scopes.add(backService);

		const backLib = scopeFromPath(f, "libs");
		if (f.startsWith("back/libs/") && backLib) scopes.add(backLib);

		const frontApp = scopeFromPath(f, "apps");
		if (f.startsWith("front/apps/") && frontApp) scopes.add(frontApp);

		const frontPkg = scopeFromPath(f, "packages");
		if (f.startsWith("front/packages/") && frontPkg) scopes.add(frontPkg);
	}

	return Array.from(scopes);
}

export async function getChangedScopes(
	baseRef = process.env.CHANGE_BASE ||
		process.env.GITHUB_BASE_REF ||
		"origin/main",
) {
	let diff = spawnSync("git", ["diff", "--name-only", baseRef], {
		encoding: "utf8",
	});
	if (diff.status) {
		diff = spawnSync("git", ["diff", "--name-only", "HEAD~1"], {
			encoding: "utf8",
		});
	}
	const files = diff.stdout.split("\n").filter(Boolean);
	return mapChangedFiles(files);
}
