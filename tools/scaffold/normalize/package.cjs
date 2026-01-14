const fs = require("fs");
const path = require("path");

function normalizePackage(dir, name) {
  const pkgPath = path.join(dir, "package.json");
  const pkg = {
    name: `@omniflowcx/${name}`,
    version: "0.1.0",
    private: true,
    scripts: {
      fmt: "biome format .",
      lint: "biome lint .",
      typecheck: "tsc --noEmit",
      "test:ci": `vitest run --reporter=junit --outputFile=reports/vitest/pkg-${name}.junit.xml`,
      build: "tsc -p tsconfig.json"
    }
  };
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
}

module.exports = { normalizePackage };
