const fs = require("node:fs");
const path = require("node:path");
const { deleteAppPort } = require("../ports.cjs");
const { validateKebab } = require("../utils.cjs");

const name = process.argv[2];
validateKebab(name);

const appDir = path.join("front/apps", name);
if (fs.existsSync(appDir)) {
	fs.rmSync(appDir, { recursive: true, force: true });
}

deleteAppPort(name);
