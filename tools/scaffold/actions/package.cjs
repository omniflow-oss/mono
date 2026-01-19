const path = require("node:path");
const { normalizePackage } = require("../normalize/package.cjs");
const { ensureDir, validateKebab } = require("../utils.cjs");

const name = process.argv[2];
validateKebab(name);

const dir = path.join("front/packages", name);
ensureDir(dir);
normalizePackage(dir, name);
