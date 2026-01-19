const fs = require("node:fs");
const path = require("node:path");
const { validateKebab } = require("../utils.cjs");

const name = process.argv[2];
validateKebab(name);

const pkgDir = path.join("front/packages", name);
if (fs.existsSync(pkgDir)) {
	fs.rmSync(pkgDir, { recursive: true, force: true });
}

const apiClientDir = path.join("front/packages/api-clients", name);
if (fs.existsSync(apiClientDir)) {
	fs.rmSync(apiClientDir, { recursive: true, force: true });
}
