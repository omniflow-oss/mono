import { spawnSync } from "node:child_process";

const checks = [
	{ name: "node", cmd: "node", args: ["--version"] },
	{ name: "pnpm", cmd: "pnpm", args: ["--version"] },
	{ name: "mvn", cmd: "mvn", args: ["-v"] },
	{ name: "docker", cmd: "docker", args: ["--version"] },
	{ name: "task", cmd: "task", args: ["--version"] },
];

let failed = false;
for (const check of checks) {
	const result = spawnSync(check.cmd, check.args, { encoding: "utf8" });
	if (result.status !== 0) {
		console.error(`Missing or failed: ${check.name}`);
		failed = true;
		continue;
	}
	const line = result.stdout?.split("\n")[0] || result.stderr?.split("\n")[0];
	console.log(`${check.name}: ${line}`);
}

process.exit(failed ? 1 : 0);
