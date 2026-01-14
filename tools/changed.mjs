import { spawnSync } from "node:child_process";

const TOOLING_PREFIXES = [
  "Taskfile.yml",
  "tools/",
  ".github/",
  "infra/tools.compose.yaml",
  "package.json",
  "pnpm-workspace.yaml",
  "biome.json",
  "back/pom.xml"
];

const scopeFromPath = (filePath, base) => {
  const parts = filePath.split("/");
  const idx = parts.indexOf(base);
  if (idx === -1 || parts.length < idx + 2) return null;
  return parts.slice(0, idx + 2).join("/");
};

export function mapChangedFiles(files) {
  const scopes = new Set();

  for (const f of files) {
    if (TOOLING_PREFIXES.some((p) => f.startsWith(p))) {
      scopes.add("__ALL__");
      continue;
    }

    if (f.startsWith("contracts/")) {
      scopes.add("__CONTRACTS__");
      continue;
    }

    if (f.startsWith("docs/")) {
      scopes.add("__DOCS__");
      continue;
    }

    const backService = scopeFromPath(f, "services");
    if (f.startsWith("back/services/") && backService) scopes.add(`back/${backService}`);

    const backLib = scopeFromPath(f, "libs");
    if (f.startsWith("back/libs/") && backLib) scopes.add(`back/${backLib}`);

    const frontApp = scopeFromPath(f, "apps");
    if (f.startsWith("front/apps/") && frontApp) scopes.add(`front/${frontApp}`);

    const frontPkg = scopeFromPath(f, "packages");
    if (f.startsWith("front/packages/") && frontPkg) scopes.add(`front/${frontPkg}`);
  }

  return Array.from(scopes);
}

export async function getChangedScopes(baseRef = process.env.CHANGE_BASE || "origin/main") {
  const diff = spawnSync("git", ["diff", "--name-only", baseRef], { encoding: "utf8" });
  const files = diff.stdout.split("\n").filter(Boolean);
  return mapChangedFiles(files);
}
