import { describe, it, expect } from "vitest";

const isKebab = (s) => /^[a-z0-9]+(-[a-z0-9]+)*$/.test(s);

describe("kebab validation", () => {
  it("accepts lowercase-kebab", () => {
    expect(isKebab("my-service")).toBe(true);
  });
});
