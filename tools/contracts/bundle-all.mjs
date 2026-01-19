import { spawnSync } from "node:child_process";
import path from "node:path";
import {
	contractNameFromPath,
	ensureContractsOutput,
	listContractSpecs,
} from "./utils.mjs";

const specs = listContractSpecs();
ensureContractsOutput();

if (specs.length === 0) {
	console.log("No contracts/rest/*.openapi.yaml found. Skipping bundling.");
	process.exit(0);
}

for (const specPath of specs) {
	const name = contractNameFromPath(specPath);
	const out = path.join("docs/api/openapi", `${name}.bundled.yaml`);
	const result = spawnSync("pnpm", ["redocly", "bundle", specPath, "-o", out], {
		stdio: "inherit",
	});
	if (result.status) process.exit(result.status);
}
