const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const os = require("os");
const { allocateAppPort } = require("../ports.cjs");
const { normalizeNuxt } = require("../normalize/nuxt.cjs");

const name = process.argv[2];
if (!name || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(name)) {
  throw new Error("Invalid name; use lowercase-kebab");
}

const port = allocateAppPort(name);
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "nuxt-app-"));
execSync(`pnpm create nuxt@latest -- -t github:nuxt-ui-templates/dashboard ${tmp}`, { stdio: "inherit" });

const dest = path.join("front/apps", name);
fs.rmSync(dest, { recursive: true, force: true });
fs.renameSync(tmp, dest);
normalizeNuxt(dest, name, port);
