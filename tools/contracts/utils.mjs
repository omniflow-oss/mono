import { existsSync, mkdirSync, readdirSync } from "node:fs";
import path from "node:path";

const CONTRACTS_DIR = "contracts/rest";
const OUTPUT_DIR = "docs/api/openapi";

export function listContractSpecs() {
	if (!existsSync(CONTRACTS_DIR)) return [];
	return readdirSync(CONTRACTS_DIR)
		.filter((f) => f.endsWith(".openapi.yaml"))
		.map((f) => path.join(CONTRACTS_DIR, f));
}

export function ensureContractsOutput() {
	mkdirSync(OUTPUT_DIR, { recursive: true });
}

export function contractNameFromPath(specPath) {
	return path.basename(specPath).replace(".openapi.yaml", "");
}

export function contractPathFor(serviceName) {
	const filePath = path.join(CONTRACTS_DIR, `${serviceName}.openapi.yaml`);
	return existsSync(filePath) ? filePath : null;
}
