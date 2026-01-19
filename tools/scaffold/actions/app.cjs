const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");
const { allocateAppPort } = require("../ports.cjs");
const { normalizeNuxt } = require("../normalize/nuxt.cjs");
const { moveDir } = require("../move.cjs");
const { ensureDir, run, validateKebab } = require("../utils.cjs");

const name = process.argv[2];
validateKebab(name);

const port = allocateAppPort(name);
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "nuxt-app-"));
run("pnpm", [
	"create",
	"nuxt@latest",
	"--",
	"-t",
	"github:nuxt-ui-templates/dashboard",
	tmp,
]);

const dest = path.join("front/apps", name);
ensureDir(path.dirname(dest));
fs.rmSync(dest, { recursive: true, force: true });
moveDir(tmp, dest);
normalizeNuxt(dest, name, port);
