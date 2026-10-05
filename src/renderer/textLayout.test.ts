import { describe, expect, it } from "vitest";
import { layoutRich, layoutText, lineText, parseMarkup, wordText, wrap, type MeasurePiece } from "./textLayout";

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

describe("parseMarkup", () => {
  it("splits words and keeps styles, including mixed-style words", () => {
    expect(parseMarkup("Learn **anywhere** and ==fast==")).toEqual([
      [[{ text: "Learn", style: 0 }], [{ text: "anywhere", style: 1 }], [{ text: "and", style: 0 }], [{ text: "fast", style: 2 }]],
    ]);
    expect(parseMarkup("**any**where")).toEqual([[[{ text: "any", style: 1 }, { text: "where", style: 0 }]]]);
  });

  it("styles every word of a multi-word span and keeps paragraphs", () => {
    expect(parseMarkup("**learn fast**\nnow")).toEqual([
      [[{ text: "learn", style: 1 }], [{ text: "fast", style: 1 }]],
      [[{ text: "now", style: 0 }]],
    ]);
  });

  it("leaves unmatched markers literal and returns nothing for blank text", () => {
    expect(parseMarkup("5 ** 2")).toEqual([[[{ text: "5", style: 0 }], [{ text: "**", style: 0 }], [{ text: "2", style: 0 }]]]);
    expect(parseMarkup("  ")).toEqual([]);
  });
});

describe("layoutRich", () => {
  // Emphasis is twice as wide, so styled words wrap sooner.
  const measureStyled: MeasurePiece = (text, style, size) => text.length * size * 0.5 * (style === 1 ? 2 : 1);

  it("measures emphasis with its own width", () => {
    const plain = layoutRich(parseMarkup("abcd efgh"), measureStyled, { ...box, size: 50, minSize: 50 });
    const bold = layoutRich(parseMarkup("abcd **efgh**"), measureStyled, { ...box, size: 50, minSize: 50 });
    expect(plain.lines.map(lineText)).toEqual(["abcd efgh"]); // 9 chars × 25 = 225
    expect(bold.lines.map(lineText)).toEqual(["abcd efgh"]); // 4×25 + 25 + 4×50 = 325, still fits 500
    const tight = layoutRich(parseMarkup("abcd **efghij**"), measureStyled, { ...box, width: 300, size: 50, minSize: 50 });
    expect(tight.lines.map(lineText)).toEqual(["abcd", "efghij"]);
    expect(tight.lines[1][0][0].style).toBe(1);
  });

  it("truncates styled text with an ellipsis in the last piece's style", () => {
    const result = layoutRich(parseMarkup(`**${"word ".repeat(40)}**`), measureStyled, box);
    const lastWord = result.lines[result.lines.length - 1].at(-1)!;
    expect(result.truncated).toBe(true);
    expect(lastWord.at(-1)).toMatchObject({ style: 1 });
    expect(wordText(lastWord).endsWith("…")).toBe(true);
  });
});
