const fs = require("fs");
const path = require("path");

function normalizeNuxt(appDir, name, port) {
  const pkgPath = path.join(appDir, "package.json");
  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
  pkg.scripts = {
    dev: "nuxt dev",
    build: "nuxt build",
    fmt: "biome format .",
    lint: "biome lint .",
    typecheck: "tsc --noEmit",
    "test:ci": `vitest run --reporter=junit --outputFile=reports/vitest/${name}.junit.xml`
  };
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));

  const removeFiles = [
    ".eslintrc",
    ".eslintrc.cjs",
    ".eslintrc.js",
    ".eslintrc.json",
    ".prettierrc",
    ".prettierrc.js",
    ".prettierrc.json",
    "prettier.config.js"
  ];
  for (const file of removeFiles) {
    const target = path.join(appDir, file);
    if (fs.existsSync(target)) fs.rmSync(target, { force: true });
  }

  fs.writeFileSync(path.join(appDir, ".env"), `NUXT_PORT=${port}\nNUXT_HOST=0.0.0.0\n`);
}

module.exports = { normalizeNuxt };
