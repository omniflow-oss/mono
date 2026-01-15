import { spawnSync } from "node:child_process";

const base = process.env.CHANGE_BASE || "origin/main";
const diff = spawnSync(
	"git",
	["diff", "--name-only", base, "--", "contracts/rest"],
	{ encoding: "utf8" },
);
const files = diff.stdout
	.split("\n")
	.filter((f) => f.endsWith(".openapi.yaml"));

for (const f of files) {
	const result = spawnSync(
		"pnpm",
		["redocly", "diff", "--severity=error", `${base}:${f}`, f],
		{ stdio: "inherit" },
	);
	if (result.status) process.exit(result.status);
}
