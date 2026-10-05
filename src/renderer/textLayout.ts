/** Width of `text` at font size `size`, in template pixels. */
export type MeasureText = (text: string, size: number) => number;

export type TextLayoutOptions = {
  width: number;
  height: number;
  size: number;
  minSize: number;
  lineHeight: number;
  maxLines: number;
};

export type TextLayout = {
  size: number;
  lines: string[];
  /** Line box height in pixels. */
  lineHeightPx: number;
  /** True when text was cut and ends with an ellipsis. */
  truncated: boolean;
};

const SHRINK_STEP = 2;

/**
 * Picks the largest font size (from `size` down to `minSize`) at which the
 * text wraps into the box. If even `minSize` overflows, the text is cut
 * with an ellipsis. Pure: measuring is injected, so it is testable without canvas.
 */
export function layoutText(text: string, measure: MeasureText, opts: TextLayoutOptions): TextLayout {
  const clean = text.replace(/[ \t]+/g, " ").trim();
  const minSize = Math.min(opts.minSize, opts.size);

  for (let size = opts.size; ; size = Math.max(minSize, size - SHRINK_STEP)) {
    const lineHeightPx = size * opts.lineHeight;
    const maxLines = Math.max(1, Math.min(opts.maxLines, Math.floor(opts.height / lineHeightPx + 1e-6)));
    const measureAt = (s: string) => measure(s, size);
    const lines = wrap(clean, measureAt, opts.width);

    if (lines.length <= maxLines) {
      return { size, lines: balance(clean, lines, measureAt, opts.width), lineHeightPx, truncated: false };
    }
    if (size === minSize) {
      return { size, lines: truncate(lines, maxLines, (s) => measure(s, size), opts.width), lineHeightPx, truncated: true };
    }
  }
}

/** Greedy word wrap. Explicit newlines are kept; words wider than the box are split by character. */
export function wrap(text: string, measure: (s: string) => number, maxWidth: number): string[] {
  if (text === "") return [];
  const lines: string[] = [];

  for (const paragraph of text.split("\n")) {
    let line = "";
    for (const word of paragraph.trim().split(" ").filter(Boolean)) {
      const candidate = line ? `${line} ${word}` : word;
      if (measure(candidate) <= maxWidth) {
        line = candidate;
        continue;
      }
      if (line) lines.push(line);
      if (measure(word) <= maxWidth) {
        line = word;
        continue;
      }
      // Break an over-long word across lines.
      line = "";
      for (const char of word) {
        if (line && measure(line + char) > maxWidth) {
          lines.push(line);
          line = char;
        } else {
          line += char;
        }
      }
    }
    lines.push(line);
  }
  return lines;
}

/**
 * Like CSS `text-wrap: balance`: narrows the wrap width as far as possible
 * without adding a line, so "Train smarter every / day" becomes "Train smarter / every day".
 */
function balance(text: string, lines: string[], measure: (s: string) => number, maxWidth: number): string[] {
  if (lines.length < 2) return lines;
  let lo = 0;
  let hi = maxWidth;
  let best = lines;
  for (let i = 0; i < 12; i++) {
    const mid = (lo + hi) / 2;
    const candidate = wrap(text, measure, mid);
    if (candidate.length === lines.length) {
      best = candidate;
      hi = mid;
    } else {
      lo = mid;
    }
  }
  return best;
}

function truncate(lines: string[], maxLines: number, measure: (s: string) => number, maxWidth: number): string[] {
  const kept = lines.slice(0, maxLines);
  let last = kept[kept.length - 1];
  while (last.length > 0 && measure(`${last}…`) > maxWidth) last = last.slice(0, -1);
  kept[kept.length - 1] = `${last.trimEnd()}…`;
  return kept;
}
