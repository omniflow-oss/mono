import { spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import yaml from "js-yaml";
import { contractPathFor } from "./utils.mjs";

const PORTS_PATH = "infra/ports.yaml";
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

async function runDiff(svc, port, contractPath) {
	console.log(`[drift-check] Service: ${svc} (port ${port})`);
	const openapiText = await fetchOpenapi(port);
	if (!openapiText) {
		console.warn(`  Could not fetch /q/openapi for ${svc}`);
		return false;
	}

	const tmpPath = `${TMP_DIR}/openapi-${svc}.yaml`;
	writeFileSync(tmpPath, openapiText);

	const result = spawnSync(
		"pnpm",
		["redocly", "diff", "--severity=error", contractPath, tmpPath],
		{ stdio: "inherit" },
	);
	return Boolean(result.status);
}

async function main() {
	const byService = getAllocatedPorts();
	const touched = getChangedServices();
	if (touched.length === 0) {
		console.log("No changed services detected");
		process.exit(0);
	}

	mkdirSync(TMP_DIR, { recursive: true });
	const concurrency = Number(process.env.DRIFT_CONCURRENCY || 2);
	let failed = false;
	let idx = 0;

	async function worker() {
		while (idx < touched.length) {
			const svc = touched[idx++];
			const port = byService[svc];
			if (!port) {
				console.warn(`No assigned port for service: ${svc}`);
				continue;
			}
			const contractPath = contractPathFor(svc);
			if (!contractPath) {
				console.warn(`Missing contract for service: ${svc}`);
				continue;
			}
			const hasDrift = await runDiff(svc, port, contractPath);
			if (hasDrift) {
				failed = true;
				console.error(`Drift detected for ${svc}`);
			} else {
				console.log(`No drift for ${svc}`);
			}
		}
	}

	const workers = Array.from(
		{ length: Math.max(1, Math.min(concurrency, touched.length)) },
		() => worker(),
	);
	await Promise.all(workers);
	process.exit(failed ? 1 : 0);
}

main();
