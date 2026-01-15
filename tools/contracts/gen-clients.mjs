import { spawnSync } from "node:child_process";
import { readdirSync, mkdirSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";

const baseDir = "front/packages/api-clients";
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

const specs = readdirSync("contracts/rest").filter((f) =>
	f.endsWith(".openapi.yaml"),
);
for (const spec of specs) {
	const svc = spec.replace(".openapi.yaml", "");
	const outDir = path.join(baseDir, svc);
	mkdirSync(outDir, { recursive: true });
	const result = spawnSync(
		"pnpm",
		[
			"openapi-typescript",
			path.join("contracts/rest", spec),
			"-o",
			path.join(outDir, "types.ts"),
		],
		{ stdio: "inherit" },
	);
	if (result.status) process.exit(result.status);
}
