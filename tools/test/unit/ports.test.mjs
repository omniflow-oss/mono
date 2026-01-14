import { describe, it, expect } from "vitest";
import { allocateNextPort } from "../../scaffold/ports.cjs";

describe("allocateNextPort", () => {
  it("allocates the first free port in range", () => {
    const port = allocateNextPort({ used: [8081], start: 8081, end: 8083 });
    expect(port).toBe(8082);
  });
});
