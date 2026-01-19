const fs = require("node:fs");
const path = require("node:path");
const { removeModule } = require("../maven.cjs");
const { validateKebab } = require("../utils.cjs");

const name = process.argv[2];
validateKebab(name);

const libDir = path.join("back/libs", name);
if (fs.existsSync(libDir)) {
	fs.rmSync(libDir, { recursive: true, force: true });
}

removeModule("back/pom.xml", `libs/${name}`);
