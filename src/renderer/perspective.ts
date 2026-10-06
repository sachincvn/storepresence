import type { Perspective, ScreenshotElement } from "@/types/template";

/*
 * Perspective for devices: the flat device is rotated in 3D, projected, and
 * scaled back to fit its box (so layout, hit testing and pop-outs still line
 * up). Drawing uses a triangle mesh: each small triangle is an affine map,
 * which together approximate the true projective warp closely.
 */

type Rotation = { rx: number; ry: number; rz: number };

const PRESETS: Record<Perspective, Rotation> = {
  left: { rx: 4, ry: 30, rz: 0 },
  right: { rx: 4, ry: -30, rz: 0 },
  flat: { rx: 50, ry: 0, rz: -16 },
  iso: { rx: 42, ry: 0, rz: 32 },
};

type Box = Pick<ScreenshotElement, "x" | "y" | "width" | "height">;
type Point = [number, number];

const rad = (d: number) => (d * Math.PI) / 180;

function rotateProject(box: Box, rot: Rotation, px: number, py: number): Point {
  const cx = box.x + box.width / 2;
  const cy = box.y + box.height / 2;
  let x = px - cx;
  let y = py - cy;
  let z = 0;
  // Tilt (top away), turn (side away), spin; then a gentle camera perspective.
  [y, z] = [y * Math.cos(rad(rot.rx)) - z * Math.sin(rad(rot.rx)), y * Math.sin(rad(rot.rx)) + z * Math.cos(rad(rot.rx))];
  [x, z] = [x * Math.cos(rad(rot.ry)) + z * Math.sin(rad(rot.ry)), -x * Math.sin(rad(rot.ry)) + z * Math.cos(rad(rot.ry))];
  [x, y] = [x * Math.cos(rad(rot.rz)) - y * Math.sin(rad(rot.rz)), x * Math.sin(rad(rot.rz)) + y * Math.cos(rad(rot.rz))];
  const focal = 2.4 * Math.max(box.width, box.height);
  const s = focal / (focal + z);
  return [x * s, y * s];
}

/** The box a device is drawn and warped in: a little larger than the element, for the side buttons. */
export function deviceBox(el: Box): Box {
  const pad = el.width * 0.02;
  return { x: el.x - pad, y: el.y - pad, width: el.width + pad * 2, height: el.height + pad * 2 };
}

/** Maps a point of the flat device box to where it lands in perspective (same coordinate space). */
export function perspectivePoint(box: Box, perspective: Perspective, px: number, py: number): Point {
  const rot = PRESETS[perspective];
  const corners = [
    rotateProject(box, rot, box.x, box.y),
    rotateProject(box, rot, box.x + box.width, box.y),
    rotateProject(box, rot, box.x, box.y + box.height),
    rotateProject(box, rot, box.x + box.width, box.y + box.height),
  ];
  const xs = corners.map((c) => c[0]);
  const ys = corners.map((c) => c[1]);
  // Keep the device's visual size: scale the projected shape back to the box's area, centered.
  const [a, b, c, d] = corners; // TL, TR, BL, BR
  const area = Math.abs((a[0] * b[1] - b[0] * a[1]) + (b[0] * d[1] - d[0] * b[1]) + (d[0] * c[1] - c[0] * d[1]) + (c[0] * a[1] - a[0] * c[1])) / 2;
  const fit = Math.sqrt((box.width * box.height) / Math.max(1, area));
  const midX = (Math.max(...xs) + Math.min(...xs)) / 2;
  const midY = (Math.max(...ys) + Math.min(...ys)) / 2;
  const [x, y] = rotateProject(box, rot, px, py);
  return [box.x + box.width / 2 + (x - midX) * fit, box.y + box.height / 2 + (y - midY) * fit];
}

/** Affine transform taking source triangle s to destination triangle d. */
function affine(s: [Point, Point, Point], d: [Point, Point, Point]): [number, number, number, number, number, number] {
  const [[x0, y0], [x1, y1], [x2, y2]] = s;
  const det = (x1 - x0) * (y2 - y0) - (x2 - x0) * (y1 - y0);
  const a = ((d[1][0] - d[0][0]) * (y2 - y0) - (d[2][0] - d[0][0]) * (y1 - y0)) / det;
  const c = ((d[2][0] - d[0][0]) * (x1 - x0) - (d[1][0] - d[0][0]) * (x2 - x0)) / det;
  const b = ((d[1][1] - d[0][1]) * (y2 - y0) - (d[2][1] - d[0][1]) * (y1 - y0)) / det;
  const dd = ((d[2][1] - d[0][1]) * (x1 - x0) - (d[1][1] - d[0][1]) * (x2 - x0)) / det;
  return [a, b, c, dd, d[0][0] - a * x0 - c * y0, d[0][1] - b * x0 - dd * y0];
}

/** Grows a triangle slightly around its center, so neighbours overlap and no seams show. */
function grow(t: [Point, Point, Point], by: number): [Point, Point, Point] {
  const cx = (t[0][0] + t[1][0] + t[2][0]) / 3;
  const cy = (t[0][1] + t[1][1] + t[2][1]) / 3;
  return t.map(([x, y]) => {
    const len = Math.hypot(x - cx, y - cy) || 1;
    return [x + ((x - cx) / len) * by, y + ((y - cy) / len) * by];
  }) as [Point, Point, Point];
}

const COLS = 10;
const ROWS = 18;

/**
 * Draws `source` (the flat device, `box` drawn at `scale` px per unit) into
 * `ctx` in perspective. `ctx` draws in the same units as `box`.
 */
export function drawWarped(ctx: CanvasRenderingContext2D, source: HTMLCanvasElement, box: Box, perspective: Perspective, scale: number): void {
  const map = (u: number, v: number) => perspectivePoint(box, perspective, box.x + u * box.width, box.y + v * box.height);
  const grid: Point[][] = Array.from({ length: ROWS + 1 }, (_, r) => Array.from({ length: COLS + 1 }, (_, c) => map(c / COLS, r / ROWS)));
  const src = (c: number, r: number): Point => [(c / COLS) * source.width, (r / ROWS) * source.height];
  // About 1.5 device pixels of overlap hides the anti-aliased triangle edges.
  const seam = 1.5 / scale;

  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const tris: [[Point, Point, Point], [Point, Point, Point]][] = [
        [
          [src(c, r), src(c + 1, r), src(c, r + 1)],
          [grid[r][c], grid[r][c + 1], grid[r + 1][c]],
        ],
        [
          [src(c + 1, r), src(c + 1, r + 1), src(c, r + 1)],
          [grid[r][c + 1], grid[r + 1][c + 1], grid[r + 1][c]],
        ],
      ];
      for (const [s, d] of tris) {
        const clip = grow(d, seam);
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(...clip[0]);
        ctx.lineTo(...clip[1]);
        ctx.lineTo(...clip[2]);
        ctx.closePath();
        ctx.clip();
        ctx.transform(...affine(s, d));
        ctx.drawImage(source, 0, 0);
        ctx.restore();
      }
    }
  }
}
