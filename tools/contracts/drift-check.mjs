import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import yaml from "js-yaml";

const PORTS_PATH = "infra/ports.yaml";
const CONTRACTS_DIR = "contracts/rest";
const TMP_DIR = ".tmp";

function getAllocatedPorts() {
	const ports = yaml.load(readFileSync(PORTS_PATH, "utf8"));
	return ports?.back?.services ?? {};
}

function getChangedServices() {
	const base = process.env.CHANGE_BASE || "origin/main";
	const diff = spawnSync("git", ["diff", "--name-only", base], {
		encoding: "utf8",
	});
	const files = diff.stdout.split("\n").filter(Boolean);
	const changed = new Set();
	for (const f of files) {
		const contractMatch = f.match(
			/^contracts\/rest\/([a-z0-9\-]+)\.openapi.yaml$/,
		);
		if (contractMatch) {
			changed.add(contractMatch[1]);
			continue;
		}
		const serviceMatch = f.match(/^back\/services\/([a-z0-9\-]+)\//);
		if (serviceMatch) changed.add(serviceMatch[1]);
	}
	return Array.from(changed);
}

async function fetchOpenapi(port) {
	const baseUrl = process.env.DRIFT_BASE_URL?.replace(/\/$/, "");
	const url = baseUrl || `http://localhost:${port}`;
	const endpoint = `${url}/q/openapi`;
	try {
		const res = await fetch(endpoint);
		if (!res.ok) return null;
		return await res.text();
	} catch {
		return null;
	}
}

async function main() {
	const byService = getAllocatedPorts();
	const touched = getChangedServices();
	if (touched.length === 0) {
		console.log("No changed services detected");
		process.exit(0);
	}

	mkdirSync(TMP_DIR, { recursive: true });
	let failed = false;
	for (const svc of touched) {
		const port = byService[svc];
		if (!port) {
			console.warn(`No assigned port for service: ${svc}`);
			continue;
		}
		const contractPath = `${CONTRACTS_DIR}/${svc}.openapi.yaml`;
		if (!existsSync(contractPath)) {
			console.warn(`Missing contract for service: ${svc}`);
			continue;
		}
		console.log(`[drift-check] Service: ${svc} (port ${port})`);
		const openapiText = await fetchOpenapi(port);
		if (!openapiText) {
			console.warn(`  Could not fetch /q/openapi for ${svc}`);
			continue;
		}

		const tmpPath = `${TMP_DIR}/openapi-${svc}.yaml`;
		writeFileSync(tmpPath, openapiText);

		const result = spawnSync(
			"pnpm",
			["redocly", "diff", "--severity=error", contractPath, tmpPath],
			{ stdio: "inherit" },
		);
		if (result.status) {
			failed = true;
			console.error(`Drift detected for ${svc}`);
		} else {
			console.log(`No drift for ${svc}`);
		}
	}
	process.exit(failed ? 1 : 0);
}

main();
