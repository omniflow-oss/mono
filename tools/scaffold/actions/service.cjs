const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const os = require("os");
const { allocateServicePort } = require("../ports.cjs");
const { normalizeQuarkus } = require("../normalize/quarkus.cjs");
const { insertModule } = require("../maven.cjs");
const { DEFAULT_GROUP_ID } = require("../constants.cjs");

const name = process.argv[2];
if (!name || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(name)) {
  throw new Error("Invalid name; use lowercase-kebab");
}

const port = allocateServicePort(name);
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "quarkus-"));
execSync(
  `mvn io.quarkus.platform:quarkus-maven-plugin:3.30.6:create -DprojectGroupId=${DEFAULT_GROUP_ID} -DprojectArtifactId=${name} -Dextensions='rest' -DoutputDirectory=${tmp}`,
  { stdio: "inherit" }
);

const dest = path.join("back/services", name);
fs.rmSync(dest, { recursive: true, force: true });
fs.renameSync(path.join(tmp, name), dest);

normalizeQuarkus(dest, name, port);
insertModule("back/pom.xml", `services/${name}`);

const contractPath = path.join("contracts/rest", `${name}.openapi.yaml`);
if (!fs.existsSync(contractPath)) {
  fs.writeFileSync(
    contractPath,
    `openapi: 3.0.3\ninfo:\n  title: ${name}\n  version: 0.1.0\npaths: {}\n`
  );
}

const docDir = path.join("docs/handbook/services");
fs.mkdirSync(docDir, { recursive: true });
const docPath = path.join(docDir, `${name}.md`);
if (!fs.existsSync(docPath)) {
  fs.writeFileSync(docPath, `# ${name}\n`);
}
