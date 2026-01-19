import { spawnSync } from "node:child_process";
import { readdirSync } from "node:fs";
import path from "node:path";

import { mkdirSync } from "node:fs";

const specs = readdirSync("contracts/rest").filter((f) =>
	f.endsWith(".openapi.yaml"),
);

// Ensure output dir exists
mkdirSync("docs/api/openapi", { recursive: true });

if (specs.length === 0) {
	console.log("No contracts/rest/*.openapi.yaml found. Skipping bundling.");
	process.exit(0);
}

for (const spec of specs) {
	const out = path.join(
		"docs/api/openapi",
		spec.replace(".openapi.yaml", ".bundled.yaml"),
	);
	const result = spawnSync(
		"pnpm",
		["redocly", "bundle", path.join("contracts/rest", spec), "-o", out],
		{ stdio: "inherit" },
	);
	if (result.status) process.exit(result.status);
}
