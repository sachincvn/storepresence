import { describe, expect, it } from "vitest";
import { layoutText, wrap } from "./textLayout";

// Monospace stand-in: every character is half the font size wide.
const measure = (text: string, size: number) => text.length * size * 0.5;

const box = { width: 500, height: 300, size: 100, minSize: 50, lineHeight: 1, maxLines: 3 };

describe("wrap", () => {
  const m = (s: string) => s.length * 10;

  it("wraps greedily on spaces", () => {
    expect(wrap("aa bb cc dd", m, 50)).toEqual(["aa bb", "cc dd"]);
  });

  it("keeps explicit newlines and empty input", () => {
    expect(wrap("aa\nbb", m, 100)).toEqual(["aa", "bb"]);
    expect(wrap("", m, 100)).toEqual([]);
  });

  it("splits words wider than the box", () => {
    expect(wrap("abcdefgh", m, 30)).toEqual(["abc", "def", "gh"]);
  });
});

describe("layoutText", () => {
  it("keeps the full size when text fits", () => {
    // 100px font → 10 chars per 500px line.
    expect(layoutText("Plan your day", measure, box)).toEqual({
      size: 100, lines: ["Plan", "your day"], lineHeightPx: 100, truncated: false,
    });
  });

  it("balances lines instead of leaving a short last line", () => {
    // Greedy wrap would give "aaaa bbbb" / "cc".
    const result = layoutText("aaaa bbbb cc", measure, box);
    expect(result.lines).toEqual(["aaaa", "bbbb cc"]);
  });

  it("shrinks until text fits within maxLines", () => {
    const result = layoutText("Track every habit and goal in one place", measure, box);
    expect(result.truncated).toBe(false);
    expect(result.size).toBeLessThan(100);
    expect(result.size).toBeGreaterThanOrEqual(50);
    expect(result.lines.length).toBeLessThanOrEqual(3);
    for (const line of result.lines) expect(measure(line, result.size)).toBeLessThanOrEqual(500);
  });

  it("respects box height as well as maxLines", () => {
    const result = layoutText("aaaa bbbb cccc dddd", measure, { ...box, height: 100, size: 100, minSize: 100 });
    expect(result.lines).toHaveLength(1);
    expect(result.truncated).toBe(true);
  });

  it("truncates with an ellipsis at minSize", () => {
    const long = "word ".repeat(80);
    const result = layoutText(long, measure, box);
    expect(result).toMatchObject({ size: 50, truncated: true });
    expect(result.lines).toHaveLength(3);
    expect(result.lines[2].endsWith("…")).toBe(true);
    expect(measure(result.lines[2], 50)).toBeLessThanOrEqual(500);
  });

  it("returns no lines for blank text", () => {
    expect(layoutText("   ", measure, box).lines).toEqual([]);
  });
});
