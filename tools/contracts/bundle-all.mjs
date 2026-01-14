import { spawnSync } from "node:child_process";
import { readdirSync } from "node:fs";
import path from "node:path";

const specs = readdirSync("contracts/rest").filter((f) => f.endsWith(".openapi.yaml"));
for (const spec of specs) {
  const out = path.join("docs/api/openapi", spec.replace(".openapi.yaml", ".bundled.yaml"));
  const result = spawnSync(
    "pnpm",
    ["redocly", "bundle", path.join("contracts/rest", spec), "-o", out],
    { stdio: "inherit" }
  );
  if (result.status) process.exit(result.status);
}
