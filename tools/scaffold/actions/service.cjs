const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");
const { allocateServicePort } = require("../ports.cjs");
const { normalizeQuarkus } = require("../normalize/quarkus.cjs");
const { moveDir } = require("../move.cjs");
const { insertModule } = require("../maven.cjs");
const { DEFAULT_GROUP_ID } = require("../constants.cjs");
const { ensureDir, run, validateKebab } = require("../utils.cjs");

const name = process.argv[2];
validateKebab(name);

const port = allocateServicePort(name);
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "quarkus-"));
run("mvn", [
	"io.quarkus.platform:quarkus-maven-plugin:3.30.6:create",
	`-DprojectGroupId=${DEFAULT_GROUP_ID}`,
	`-DprojectArtifactId=${name}`,
	"-Dextensions=rest",
	`-DoutputDirectory=${tmp}`,
]);

const dest = path.join("back/services", name);
ensureDir(path.dirname(dest));
fs.rmSync(dest, { recursive: true, force: true });
moveDir(path.join(tmp, name), dest);

normalizeQuarkus(dest, name, port);
insertModule("back/pom.xml", `services/${name}`);

const contractPath = path.join("contracts/rest", `${name}.openapi.yaml`);
ensureDir(path.dirname(contractPath));
if (!fs.existsSync(contractPath)) {
	fs.writeFileSync(
		contractPath,
		`openapi: 3.0.3\ninfo:\n  title: ${name}\n  version: 0.1.0\npaths: {}\n`,
	);
}

const docDir = path.join("docs/handbook/services");
ensureDir(docDir);
const docPath = path.join(docDir, `${name}.md`);
if (!fs.existsSync(docPath)) {
	fs.writeFileSync(docPath, `# ${name}\n`);
}
