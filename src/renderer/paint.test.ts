import { describe, expect, it } from "vitest";
import { seededRandom, withAlpha } from "./paint";

describe("seededRandom", () => {
  it("is deterministic per seed and stays in [0, 1)", () => {
    const a = seededRandom(42);
    const b = seededRandom(42);
    const seq = Array.from({ length: 20 }, () => a());
    expect(Array.from({ length: 20 }, () => b())).toEqual(seq);
    expect(seq.every((v) => v >= 0 && v < 1)).toBe(true);
    expect(seededRandom(43)()).not.toBe(seq[0]);
  });
});

describe("withAlpha", () => {
  it.each([
    ["#3D5AFE", 0.5, "rgba(61, 90, 254, 0.5)"],
    ["#fff", 0, "rgba(255, 255, 255, 0)"],
    ["rgba(10, 20, 30, 0.9)", 0.2, "rgba(10, 20, 30, 0.2)"],
    ["rgb(1,2,3)", 1, "rgba(1, 2, 3, 1)"],
    ["transparent", 0, "transparent"],
  ])("%s at %s → %s", (color, alpha, expected) => {
    expect(withAlpha(color, alpha)).toBe(expected);
  });
});
