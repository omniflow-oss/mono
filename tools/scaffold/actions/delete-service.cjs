const fs = require("node:fs");
const path = require("node:path");
const { deleteServicePort } = require("../ports.cjs");
const { removeModule } = require("../maven.cjs");
const { validateKebab } = require("../utils.cjs");

const name = process.argv[2];
validateKebab(name);

const serviceDir = path.join("back/services", name);
if (fs.existsSync(serviceDir)) {
	fs.rmSync(serviceDir, { recursive: true, force: true });
}

const contractPath = path.join("contracts/rest", `${name}.openapi.yaml`);
if (fs.existsSync(contractPath)) fs.rmSync(contractPath, { force: true });

const docPath = path.join("docs/handbook/services", `${name}.md`);
if (fs.existsSync(docPath)) fs.rmSync(docPath, { force: true });

const basePath = path.join("front/packages/api-clients", name);
if (fs.existsSync(basePath)) {
	fs.rmSync(basePath, { recursive: true, force: true });
}

deleteServicePort(name);
removeModule("back/pom.xml", `services/${name}`);
