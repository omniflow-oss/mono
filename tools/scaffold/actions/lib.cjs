const fs = require("node:fs");
const path = require("node:path");
const { insertModule } = require("../maven.cjs");

const name = process.argv[2];
if (!name || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(name)) {
	throw new Error("Invalid name; use lowercase-kebab");
}

const dir = path.join("back/libs", name);
fs.mkdirSync(dir, { recursive: true });
insertModule("back/pom.xml", `libs/${name}`);
