const fs = require("fs");
const path = require("path");

function normalizeQuarkus(serviceDir, name, port) {
  const propsPath = path.join(serviceDir, "src/main/resources/application.properties");
  const lines = [
    `quarkus.http.port=${port}`,
    "quarkus.http.host=0.0.0.0",
    `quarkus.application.name=${name}`
  ];
  fs.appendFileSync(propsPath, `\n${lines.join("\n")}\n`);
}

module.exports = { normalizeQuarkus };
