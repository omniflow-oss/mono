import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { contractNameFromPath, listContractSpecs } from "./utils.mjs";

const baseDir = "front/packages/api-clients";
mkdirSync(baseDir, { recursive: true });
if (!existsSync(path.join(baseDir, "package.json"))) {
	const pkg = {
		name: "@omniflowcx/api-clients",
		private: true,
		version: "0.1.0",
		scripts: {
			build: "echo api-clients generated",
		},
	};
	writeFileSync(
		path.join(baseDir, "package.json"),
		JSON.stringify(pkg, null, 2),
	);
}

const specs = listContractSpecs();
for (const specPath of specs) {
	const svc = contractNameFromPath(specPath);
	const outDir = path.join(baseDir, svc);
	mkdirSync(outDir, { recursive: true });
	const result = spawnSync(
		"pnpm",
		["openapi-typescript", specPath, "-o", path.join(outDir, "types.ts")],
		{ stdio: "inherit" },
	);
	if (result.status) process.exit(result.status);
}
