import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import yaml from "js-yaml";

const PORTS_PATH = "infra/ports.yaml";
const SERVICES_DIR = "back/services";
const CONTRACTS_DIR = "contracts/rest";

function getAllocatedPorts() {
	const ports = yaml.load(readFileSync(PORTS_PATH, "utf8"));
	// Format: { back: { services: { svc: port } }, ... }
	return ports.back?.services ?? {};
}

function getChangedServices() {
	// List changed service contracts & services by name
	// Returns array of names like ['orders', 'users']
	const diff = spawnSync("git", ["diff", "--name-only", "origin/main"], {
		encoding: "utf8",
	});
	const files = diff.stdout.split("\n").filter(Boolean);
	const changed = new Set();
	for (const f of files) {
		// contracts/rest/orders.openapi.yaml => orders
		const m = f.match(/^contracts\/rest\/([a-z0-9\-]+)\.openapi.yaml$/);
		if (m) {
			changed.add(m[1]);
			continue;
		}
		const s = f.match(/^back\/services\/([a-z0-9\-]+)\//);
		if (s) changed.add(s[1]);
	}
	return Array.from(changed);
}

async function fetchOpenapi(service, port) {
	// Try to fetch /q/openapi using fetch
	const url =
		process.env.DRIFT_BASE_URL?.replace(/\/$/, "") ||
		`http://localhost:${port}`;
	const endpoint = `${url}/q/openapi`;
	try {
		const res = await fetch(endpoint);
		if (!res.ok) return null;
		return await res.text();
	} catch (e) {
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

	let failed = false;
	for (const svc of touched) {
		const port = byService[svc];
		if (!port) {
			console.warn(`No assigned port for service: ${svc}`);
			continue;
		}
		console.log(`[drift-check] Service: ${svc} (port ${port})`);
		const openapiText = await fetchOpenapi(svc, port);
		if (!openapiText) {
			console.warn(`  Could not fetch /q/openapi for ${svc}`);
			continue;
		}
		// Write temp
		const tmpPath = `.tmp/openapi-${svc}.yaml`;
		Bun.write(tmpPath, openapiText);
		// Compare with repo contract
		const contractPath = `${CONTRACTS_DIR}/${svc}.openapi.yaml`;
		const result = spawnSync(
			"pnpm",
			["redocly", "diff", contractPath, tmpPath],
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
