import { describe, it } from "vitest";
import { execSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

function copyRepo(srcRoot, destRoot) {
	fs.mkdirSync(destRoot, { recursive: true });
	fs.cpSync(srcRoot, destRoot, {
		recursive: true,
		filter: (src) => {
			const rel = path.relative(srcRoot, src);
			if (!rel) return true;
			const parts = rel.split(path.sep);
			if (parts[0] === ".git") return false;
			if (parts.includes("node_modules")) return false;
			if (parts.includes(".pnpm-store")) return false;
			if (parts.includes("target")) return false;
			if (parts[0] === "reports") return false;
			return true;
		},
	});
}

describe("tooling e2e", () => {
	it("scaffolds a service", () => {
		const repoRoot = process.cwd();
		const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "tooling-e2e-"));
		const tempRepo = path.join(tempRoot, "repo");
		copyRepo(repoRoot, tempRepo);
		execSync("./mono new service e2e-svc", {
			stdio: "inherit",
			cwd: tempRepo,
			env: {
				...process.env,
				MONO_IN_DOCKER: "0",
				NODE_PATH: path.join(repoRoot, "node_modules"),
			},
		});
	});
});
