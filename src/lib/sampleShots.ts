import type { Screenshot } from "@/types/project";

/*
 * Placeholder app screenshots drawn in canvas, so the editor preview is
 * never empty before the user uploads. Browser only.
 */

const W = 720;
const H = 1560;
const BLUE = "#3D5AFE";
const INK = "#16131F";
const MUTED = "#8A8597";
const TILE = "#F3F2F8";
const FONT = "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif";

type Ctx = CanvasRenderingContext2D;

function text(ctx: Ctx, value: string, x: number, y: number, size: number, weight = 600, color = INK, align: CanvasTextAlign = "left") {
  ctx.font = `${weight} ${size}px ${FONT}`;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = "middle";
  ctx.fillText(value, x, y);
}

function box(ctx: Ctx, x: number, y: number, w: number, h: number, r: number, color: string) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fillStyle = color;
  ctx.fill();
}

function circle(ctx: Ctx, x: number, y: number, r: number, color: string) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
}

function chrome(ctx: Ctx, title: string, subtitle: string, activeTab: number) {
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, W, H);

  // Status bar
  text(ctx, "9:41", 56, 44, 26, 700);
  for (let i = 0; i < 4; i++) box(ctx, 560 + i * 12, 52 - i * 6, 8, 10 + i * 6, 2, INK);
  box(ctx, 620, 34, 46, 22, 6, INK);

  text(ctx, title, 48, 160, 60, 800);
  text(ctx, subtitle, 48, 222, 28, 500, MUTED);
  circle(ctx, 640, 160, 34, "#E6DEFF");
  text(ctx, "S", 640, 162, 30, 800, BLUE, "center");

  // Tab bar
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, H - 150, W, 150);
  box(ctx, 0, H - 151, W, 2, 0, "#ECEAF2");
  ["Today", "Stats", "Inbox", "Plan"].forEach((label, i) => {
    const x = 90 + i * 180;
    const color = i === activeTab ? BLUE : MUTED;
    box(ctx, x - 22, H - 118, 44, 44, 14, i === activeTab ? BLUE : "#E4E1EC");
    text(ctx, label, x, H - 46, 22, 700, color, "center");
  });
}

function tasksScreen(ctx: Ctx) {
  chrome(ctx, "Today", "6 tasks, 2 done", 0);
  const tasks: [string, string, boolean][] = [
    ["Design review", "10:00, Studio", true],
    ["Send invoice to Acme", "Due today", true],
    ["Gym session", "18:00", false],
    ["Call with Sam", "19:30, 20 min", false],
    ["Plan weekend trip", "No date", false],
    ["Buy groceries", "Shared list", false],
  ];
  tasks.forEach(([title, meta, done], i) => {
    const y = 300 + i * 150;
    box(ctx, 40, y, W - 80, 128, 32, TILE);
    if (done) {
      circle(ctx, 104, y + 64, 26, BLUE);
      ctx.strokeStyle = "#FFFFFF";
      ctx.lineWidth = 6;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(92, y + 64);
      ctx.lineTo(101, y + 74);
      ctx.lineTo(117, y + 54);
      ctx.stroke();
    } else {
      ctx.strokeStyle = "#C9C5D6";
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(104, y + 64, 24, 0, Math.PI * 2);
      ctx.stroke();
    }
    text(ctx, title, 156, y + 48, 32, 700, done ? MUTED : INK);
    text(ctx, meta, 156, y + 88, 24, 500, MUTED);
  });
  box(ctx, W - 160, H - 290, 112, 112, 40, BLUE);
  text(ctx, "+", W - 104, H - 236, 64, 500, "#FFFFFF", "center");
}

function statsScreen(ctx: Ctx) {
  chrome(ctx, "Progress", "This week", 1);
  box(ctx, 40, 290, W - 80, 380, 40, BLUE);
  text(ctx, "Focus time", 84, 350, 28, 600, "rgba(255,255,255,0.75)");
  text(ctx, "18h 40m", 84, 420, 72, 800, "#FFFFFF");
  const bars = [0.45, 0.7, 0.55, 0.9, 0.65, 0.35, 0.8];
  bars.forEach((v, i) => {
    const bh = 150 * v;
    box(ctx, 90 + i * 80, 630 - bh, 44, bh, 14, i === 3 ? "#FFD43B" : "rgba(255,255,255,0.45)");
  });

  [["Tasks done", "42", "#D3F4E4"], ["Streak", "9 days", "#FFE3D3"]].forEach(([label, value, bg], i) => {
    const x = 40 + i * 330;
    box(ctx, x, 700, 310, 220, 36, bg);
    text(ctx, label, x + 36, 760, 26, 600, MUTED);
    text(ctx, value, x + 36, 840, 56, 800);
  });

  text(ctx, "Top projects", 48, 990, 34, 800);
  [["Website redesign", 0.8], ["Mobile app", 0.55], ["Marketing", 0.3]].forEach(([name, pct], i) => {
    const y = 1040 + i * 110;
    text(ctx, String(name), 48, y + 20, 28, 600);
    box(ctx, 48, y + 52, W - 96, 18, 9, TILE);
    box(ctx, 48, y + 52, (W - 96) * Number(pct), 18, 9, BLUE);
  });
}

function inboxScreen(ctx: Ctx) {
  chrome(ctx, "Inbox", "3 new messages", 2);
  const messages: [string, boolean][] = [
    ["Hey! Are we still on for the review at 10?", false],
    ["Yes, see you there. I'll bring the new mockups.", true],
    ["Perfect. Can you also share the invoice?", false],
    ["Sent it a minute ago.", true],
    ["Got it, thanks!", false],
  ];
  let y = 300;
  for (const [message, mine] of messages) {
    ctx.font = `500 30px ${FONT}`;
    const words = message.split(" ");
    const lines: string[] = [];
    let line = "";
    for (const word of words) {
      const next = line ? `${line} ${word}` : word;
      if (ctx.measureText(next).width > 420) {
        lines.push(line);
        line = word;
      } else line = next;
    }
    lines.push(line);
    const bw = Math.max(...lines.map((l) => ctx.measureText(l).width)) + 64;
    const bh = lines.length * 42 + 44;
    const x = mine ? W - 40 - bw : 40;
    box(ctx, x, y, bw, bh, 36, mine ? BLUE : TILE);
    lines.forEach((l, i) => text(ctx, l, x + 32, y + 43 + i * 42, 30, 500, mine ? "#FFFFFF" : INK));
    y += bh + 28;
  }
  box(ctx, 40, H - 260, W - 80, 88, 44, TILE);
  text(ctx, "Write a message", 84, H - 216, 28, 500, MUTED);
  circle(ctx, W - 88, H - 216, 34, BLUE);
}

function calendarScreen(ctx: Ctx) {
  chrome(ctx, "Schedule", "Week of June 9", 3);
  const days = ["M", "T", "W", "T", "F", "S", "S"];
  days.forEach((d, i) => {
    const x = 70 + i * 96;
    const active = i === 2;
    if (active) box(ctx, x - 36, 278, 72, 120, 36, BLUE);
    text(ctx, d, x, 312, 24, 600, active ? "rgba(255,255,255,0.8)" : MUTED, "center");
    text(ctx, String(9 + i), x, 362, 34, 800, active ? "#FFFFFF" : INK, "center");
  });

  const events: [string, string, string, number][] = [
    ["09:00", "Standup", "#D3F4E4", 1],
    ["10:30", "Design review", "#E6DEFF", 2],
    ["13:00", "Lunch with Ana", "#FFE3D3", 1],
    ["15:00", "Invoice due", "#FFD43B", 1],
    ["17:30", "Gym", "#DCE8FF", 1],
  ];
  let y = 450;
  for (const [time, title, bg, span] of events) {
    const h = 110 * span + (span - 1) * 20;
    text(ctx, time, 48, y + 34, 24, 600, MUTED);
    box(ctx, 150, y, W - 190, h, 28, bg);
    box(ctx, 150, y, 10, h, 5, INK);
    text(ctx, title, 190, y + 40, 30, 700);
    text(ctx, span > 1 ? "Studio, 1h 30m" : "30 min", 190, y + 78, 22, 500, MUTED);
    y += h + 24;
  }
}

const screens = [
  { name: "sample-today.png", draw: tasksScreen },
  { name: "sample-progress.png", draw: statsScreen },
  { name: "sample-inbox.png", draw: inboxScreen },
  { name: "sample-schedule.png", draw: calendarScreen },
];

export function createSampleScreenshots(): Screenshot[] {
  return screens.map(({ name, draw }) => {
    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas 2D context is not available");
    draw(ctx);
    // Data URLs need no revoking, unlike object URLs for uploads.
    return { id: `sample-${name}`, name, url: canvas.toDataURL("image/png"), width: W, height: H };
  });
}

/* ---------- Ratio samples for the Template Lab ---------- */

export type RatioSample = { id: string; label: string; width: number; height: number; color: string };

/** Real-world capture shapes a template must survive. */
export const RATIO_SAMPLES: RatioSample[] = [
  { id: "phone-tall", label: "9 : 19.5", width: 1080, height: 2340, color: "#FFD6E7" },
  { id: "phone-classic", label: "9 : 16", width: 1080, height: 1920, color: "#D3F4E4" },
  { id: "tablet", label: "3 : 4", width: 1536, height: 2048, color: "#DCE8FF" },
  { id: "landscape", label: "16 : 10", width: 2560, height: 1600, color: "#FFE3D3" },
  { id: "square", label: "1 : 1", width: 1200, height: 1200, color: "#E6DEFF" },
  { id: "tiny", label: "Tiny 200×400", width: 200, height: 400, color: "#FFF3B8" },
];

/**
 * Test cards: a dark header and footer bar (so crops are obvious), a grid,
 * and the ratio in the middle. Browser only.
 */
export function createRatioSamples(): Screenshot[] {
  return RATIO_SAMPLES.map((s) => {
    const canvas = document.createElement("canvas");
    canvas.width = s.width;
    canvas.height = s.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas 2D context is not available");
    const unit = Math.min(s.width, s.height);

    ctx.fillStyle = s.color;
    ctx.fillRect(0, 0, s.width, s.height);

    ctx.strokeStyle = "rgba(22, 19, 31, 0.12)";
    ctx.lineWidth = Math.max(1, unit / 400);
    const step = unit / 8;
    for (let x = step; x < s.width; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, s.height);
      ctx.stroke();
    }
    for (let y = step; y < s.height; y += step) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(s.width, y);
      ctx.stroke();
    }

    const bar = Math.max(12, s.height * 0.07);
    ctx.fillStyle = INK;
    ctx.fillRect(0, 0, s.width, bar);
    ctx.fillRect(0, s.height - bar, s.width, bar);
    ctx.fillStyle = "#FFFFFF";
    ctx.font = `700 ${bar * 0.45}px ${FONT}`;
    ctx.textBaseline = "middle";
    ctx.textAlign = "left";
    ctx.fillText("TOP", bar * 0.4, bar / 2);
    ctx.fillText("BOTTOM", bar * 0.4, s.height - bar / 2);

    ctx.fillStyle = INK;
    ctx.textAlign = "center";
    ctx.font = `800 ${unit * 0.14}px ${FONT}`;
    ctx.fillText(s.label, s.width / 2, s.height / 2);
    ctx.font = `600 ${unit * 0.06}px ${FONT}`;
    ctx.fillText(`${s.width} × ${s.height}`, s.width / 2, s.height / 2 + unit * 0.13);

    return { id: `ratio-${s.id}`, name: `${s.id}.png`, url: canvas.toDataURL("image/png"), width: s.width, height: s.height };
  });
}

let shared: Screenshot[] | null = null;

/** Sample screenshots created once per page and reused by every preview. */
export function getSharedSampleScreenshots(): Screenshot[] {
  shared ??= createSampleScreenshots();
  return shared;
}
