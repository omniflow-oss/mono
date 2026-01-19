const { execSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");
const { allocateAppPort } = require("../ports.cjs");
const { normalizeNuxt } = require("../normalize/nuxt.cjs");
const { moveDir } = require("../move.cjs");

const name = process.argv[2];
if (!name || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(name)) {
	throw new Error("Invalid name; use lowercase-kebab");
}

const port = allocateAppPort(name);
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "nuxt-app-"));
const { spawnSync } = require("node:child_process");

spawnSync(
	"pnpm",
	[
		"create",
		"nuxt@latest",
		"--",
		"-t",
		"github:nuxt-ui-templates/dashboard",
		tmp,
	],
	{ stdio: "inherit" },
);

const dest = path.join("front/apps", name);
fs.rmSync(dest, { recursive: true, force: true });
moveDir(tmp, dest);
normalizeNuxt(dest, name, port);
