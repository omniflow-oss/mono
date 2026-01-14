import { describe, it, expect } from "vitest";
import { mapChangedFiles } from "../../changed.mjs";

describe("mapChangedFiles", () => {
  it("returns __ALL__ for tooling changes", () => {
    const result = mapChangedFiles(["Taskfile.yml"]);
    expect(result).toContain("__ALL__");
  });

  it("maps service changes to back scope", () => {
    const result = mapChangedFiles(["back/services/orders/src/Main.java"]);
    expect(result).toContain("back/services/orders");
  });
});
