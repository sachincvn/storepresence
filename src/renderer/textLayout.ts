/*
 * Text layout, pure and canvas-free (measuring is injected), so it is unit-tested.
 * Supports inline markup: **emphasis** and ==marker==.
 */

/** 0 = base, 1 = emphasis (`**word**`), 2 = marker (`==word==`). */
export type PieceStyle = 0 | 1 | 2;
export type Piece = { text: string; style: PieceStyle };
/** A word is unbreakable at spaces but may mix styles ("**any**where"). */
export type Word = Piece[];
export type RichLine = Word[];

/** Width of `text` in `style` at font size `size`, in template pixels. */
export type MeasurePiece = (text: string, style: PieceStyle, size: number) => number;

/** Plain measure for unstyled text (kept for simple callers and tests). */
export type MeasureText = (text: string, size: number) => number;

export type TextLayoutOptions = {
  width: number;
  height: number;
  size: number;
  minSize: number;
  lineHeight: number;
  maxLines: number;
};

export type RichLayout = {
  size: number;
  lines: RichLine[];
  /** Line box height in pixels. */
  lineHeightPx: number;
  /** True when text was cut and ends with an ellipsis. */
  truncated: boolean;
};

export type TextLayout = Omit<RichLayout, "lines"> & { lines: string[] };

const SHRINK_STEP = 2;
const MARKUP = /\*\*(.+?)\*\*|==(.+?)==/g;

/** Splits text into paragraphs of styled words. Unmatched markers stay literal. */
export function parseMarkup(text: string): Word[][] {
  const pieces: Piece[] = [];
  let last = 0;
  for (const m of text.matchAll(MARKUP)) {
    const index = m.index ?? 0;
    if (index > last) pieces.push({ text: text.slice(last, index), style: 0 });
    pieces.push(m[1] !== undefined ? { text: m[1], style: 1 } : { text: m[2], style: 2 });
    last = index + m[0].length;
  }
  if (last < text.length) pieces.push({ text: text.slice(last), style: 0 });

  const paragraphs: Word[][] = [[]];
  let word: Word = [];
  const flush = () => {
    if (word.length > 0) paragraphs[paragraphs.length - 1].push(word);
    word = [];
  };
  for (const piece of pieces) {
    for (const part of piece.text.split(/(\s)/)) {
      if (part === "\n") {
        flush();
        paragraphs.push([]);
      } else if (/^\s$/.test(part)) {
        flush();
      } else if (part) {
        const prev = word[word.length - 1];
        if (prev && prev.style === piece.style) prev.text += part;
        else word.push({ text: part, style: piece.style });
      }
    }
  }
  flush();
  return paragraphs.every((p) => p.length === 0) ? [] : paragraphs;
}

export function wordText(word: Word): string {
  return word.map((p) => p.text).join("");
}

export function lineText(line: RichLine): string {
  return line.map(wordText).join(" ");
}

function wordWidth(word: Word, measure: (p: Piece) => number): number {
  return word.reduce((w, p) => w + measure(p), 0);
}

export function lineWidth(line: RichLine, measure: (p: Piece) => number, space: number): number {
  return line.reduce((w, word, i) => w + wordWidth(word, measure) + (i > 0 ? space : 0), 0);
}

/** Greedy wrap. Paragraph breaks are kept; words wider than the box are split by character. */
export function wrapWords(paragraphs: Word[][], measure: (p: Piece) => number, space: number, maxWidth: number): RichLine[] {
  const lines: RichLine[] = [];
  for (const paragraph of paragraphs) {
    let line: RichLine = [];
    let width = 0;
    for (const word of paragraph) {
      const ww = wordWidth(word, measure);
      if (line.length > 0 && width + space + ww <= maxWidth) {
        line.push(word);
        width += space + ww;
        continue;
      }
      if (line.length > 0) lines.push(line);
      if (ww <= maxWidth) {
        line = [word];
        width = ww;
        continue;
      }
      // Break an over-long word across lines, keeping each character's style.
      let part: Word = [];
      for (const piece of word) {
        for (const char of piece.text) {
          const next = appendChar(part, char, piece.style);
          if (part.length > 0 && wordWidth(next, measure) > maxWidth) {
            lines.push([part]);
            part = [{ text: char, style: piece.style }];
          } else {
            part = next;
          }
        }
      }
      line = [part];
      width = wordWidth(part, measure);
    }
    lines.push(line);
  }
  return lines;
}

function appendChar(word: Word, char: string, style: PieceStyle): Word {
  const prev = word[word.length - 1];
  if (prev && prev.style === style) return [...word.slice(0, -1), { text: prev.text + char, style }];
  return [...word, { text: char, style }];
}

/**
 * Picks the largest size (from `size` down to `minSize`) at which the text
 * wraps into the box, with balanced lines. If even `minSize` overflows, the
 * text is cut with an ellipsis.
 */
export function layoutRich(paragraphs: Word[][], measure: MeasurePiece, opts: TextLayoutOptions): RichLayout {
  const minSize = Math.min(opts.minSize, opts.size);

  for (let size = opts.size; ; size = Math.max(minSize, size - SHRINK_STEP)) {
    const lineHeightPx = size * opts.lineHeight;
    const maxLines = Math.max(1, Math.min(opts.maxLines, Math.floor(opts.height / lineHeightPx + 1e-6)));
    const m = (p: Piece) => measure(p.text, p.style, size);
    const space = measure(" ", 0, size);
    const lines = wrapWords(paragraphs, m, space, opts.width);

    if (lines.length <= maxLines) {
      return { size, lines: balance(paragraphs, lines, m, space, opts.width), lineHeightPx, truncated: false };
    }
    if (size === minSize) {
      return { size, lines: truncate(lines, maxLines, m, space, opts.width), lineHeightPx, truncated: true };
    }
  }
}

/** Plain-text layout: same rules, no markup styling. */
export function layoutText(text: string, measure: MeasureText, opts: TextLayoutOptions): TextLayout {
  const clean = text.replace(/[ \t]+/g, " ").trim();
  const paragraphs = clean ? clean.split("\n").map((p) => p.trim().split(" ").filter(Boolean).map((w): Word => [{ text: w, style: 0 }])) : [];
  const result = layoutRich(paragraphs, (t, _style, size) => measure(t, size), opts);
  return { ...result, lines: result.lines.map(lineText) };
}

/** Plain greedy wrap of a string (paragraphs by "\n"). */
export function wrap(text: string, measure: (s: string) => number, maxWidth: number): string[] {
  if (text === "") return [];
  const paragraphs = text.split("\n").map((p) => p.trim().split(" ").filter(Boolean).map((w): Word => [{ text: w, style: 0 }]));
  return wrapWords(paragraphs, (p) => measure(p.text), measure(" "), maxWidth).map(lineText);
}

/**
 * Like CSS `text-wrap: balance`: narrows the wrap width as far as possible
 * without adding a line, so "Train smarter every / day" becomes "Train smarter / every day".
 */
function balance(paragraphs: Word[][], lines: RichLine[], measure: (p: Piece) => number, space: number, maxWidth: number): RichLine[] {
  if (lines.length < 2) return lines;
  let lo = 0;
  let hi = maxWidth;
  let best = lines;
  for (let i = 0; i < 12; i++) {
    const mid = (lo + hi) / 2;
    const candidate = wrapWords(paragraphs, measure, space, mid);
    if (candidate.length === lines.length) {
      best = candidate;
      hi = mid;
    } else {
      lo = mid;
    }
  }
  return best;
}

function truncate(lines: RichLine[], maxLines: number, measure: (p: Piece) => number, space: number, maxWidth: number): RichLine[] {
  const kept = lines.slice(0, maxLines).map((line) => line.map((word) => word.map((p) => ({ ...p }))));
  const last = kept[kept.length - 1];
  const withEllipsis = () => {
    const words = last.map((w) => [...w]);
    const tail = words[words.length - 1];
    const style = tail?.[tail.length - 1]?.style ?? 0;
    if (tail) tail.push({ text: "…", style });
    else words.push([{ text: "…", style: 0 }]);
    return words;
  };
  // Drop characters from the end until "…" fits.
  while (last.length > 0 && lineWidth(withEllipsis(), measure, space) > maxWidth) {
    const tail = last[last.length - 1];
    const piece = tail[tail.length - 1];
    piece.text = piece.text.slice(0, -1);
    if (!piece.text) tail.pop();
    if (tail.length === 0) last.pop();
  }
  kept[kept.length - 1] = withEllipsis();
  return kept;
}
