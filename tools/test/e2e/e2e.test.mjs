import { describe, it } from "vitest";
import { execSync } from "node:child_process";

describe("tooling e2e", () => {
  it("scaffolds a service", () => {
    execSync("./mono new service e2e-svc", { stdio: "inherit" });
  });
});
