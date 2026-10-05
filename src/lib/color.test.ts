import { describe, expect, it } from "vitest";
import { mixHex } from "./color";

describe("mixHex", () => {
  it("mixes channel by channel", () => {
    expect(mixHex("#000000", "#FFFFFF", 0.5)).toBe("#808080");
    expect(mixHex("#3D5AFE", "#3D5AFE", 0.7)).toBe("#3D5AFE");
    expect(mixHex("#fff", "#000", 0)).toBe("#FFFFFF");
  });

  it("returns null for non-hex colors", () => {
    expect(mixHex("rgba(0,0,0,1)", "#fff", 0.5)).toBeNull();
  });
});
