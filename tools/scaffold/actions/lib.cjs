const path = require("node:path");
const { insertModule } = require("../maven.cjs");
const { ensureDir, validateKebab } = require("../utils.cjs");

const name = process.argv[2];
validateKebab(name);

const dir = path.join("back/libs", name);
ensureDir(dir);
insertModule("back/pom.xml", `libs/${name}`);
