"use client";

import { useId, useRef, type KeyboardEvent, type PointerEvent } from "react";
import type { NormRect } from "@/types/template";
import { clampRegion } from "@/renderer/calloutRenderer";

type Corner = "nw" | "ne" | "sw" | "se";
const CORNERS: Corner[] = ["nw", "ne", "sw", "se"];

type Drag = { mode: "move" | "draw" | Corner; start: { x: number; y: number }; origin: NormRect; moved: boolean };

type Props = {
  /** Screenshot URL. */
  src: string;
  /** Accessible name, e.g. "Pop-out area". */
  label: string;
  value: NormRect;
  onChange: (region: NormRect) => void;
};

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const pct = (v: number) => `${+(v * 100).toFixed(2)}%`;

function fromPoints(a: { x: number; y: number }, b: { x: number; y: number }): NormRect {
  return clampRegion({ x: Math.min(a.x, b.x), y: Math.min(a.y, b.y), w: Math.abs(a.x - b.x), h: Math.abs(a.y - b.y) });
}

/** The corner opposite `corner` stays put while resizing. */
function anchorOf(r: NormRect, corner: Corner): { x: number; y: number } {
  return { x: corner.includes("w") ? r.x + r.w : r.x, y: corner.includes("n") ? r.y + r.h : r.y };
}

/**
 * Pick an area of a screenshot: drag the box to move it, drag a corner to
 * resize, or draw a new box. Arrow keys move it; Shift + arrows resize.
 */
export function RegionPicker({ src, label, value, onChange }: Props) {
  const frame = useRef<HTMLDivElement>(null);
  const drag = useRef<Drag | null>(null);
  const hintId = useId();

  const pointAt = (e: PointerEvent) => {
    const box = frame.current!.getBoundingClientRect();
    return { x: clamp01((e.clientX - box.left) / box.width), y: clamp01((e.clientY - box.top) / box.height) };
  };

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    const target = e.target as HTMLElement;
    const corner = target.closest<HTMLElement>("[data-corner]")?.dataset.corner as Corner | undefined;
    const mode = corner ?? (target.closest("[data-region]") ? "move" : "draw");
    drag.current = { mode, start: pointAt(e), origin: value, moved: false };
    e.currentTarget.setPointerCapture(e.pointerId);
    e.preventDefault();
    frame.current?.querySelector<HTMLElement>("[data-region]")?.focus();
  };

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d) return;
    const p = pointAt(e);
    const dx = p.x - d.start.x;
    const dy = p.y - d.start.y;
    // A click without movement on the empty area should not collapse the box.
    if (!d.moved && Math.hypot(dx, dy) < 0.01) return;
    d.moved = true;
    if (d.mode === "move") onChange(clampRegion({ ...d.origin, x: d.origin.x + dx, y: d.origin.y + dy }));
    else if (d.mode === "draw") onChange(fromPoints(d.start, p));
    else onChange(fromPoints(anchorOf(d.origin, d.mode), p));
  };

  const endDrag = () => {
    drag.current = null;
  };

  const onKeyDown = (e: KeyboardEvent) => {
    const step = 0.01;
    const delta = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }[e.key];
    if (!delta) return;
    e.preventDefault();
    const [dx, dy] = delta;
    onChange(clampRegion(e.shiftKey ? { ...value, w: value.w + dx, h: value.h + dy } : { ...value, x: value.x + dx, y: value.y + dy }));
  };

  const r = clampRegion(value);
  const described = `left ${Math.round(r.x * 100)}%, top ${Math.round(r.y * 100)}%, width ${Math.round(r.w * 100)}%, height ${Math.round(r.h * 100)}%`;

  return (
    <div className="flex flex-col gap-2">
      <div
        ref={frame}
        className="relative mx-auto w-fit cursor-crosshair touch-none overflow-hidden rounded-xl border border-line bg-canvas select-none"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- local object/data URL, not an optimizable asset */}
        <img src={src} alt="" draggable={false} className="block max-h-[340px] max-w-full" />
        <div
          data-region
          tabIndex={0}
          role="group"
          aria-label={`${label}: ${described}`}
          aria-describedby={hintId}
          onKeyDown={onKeyDown}
          className="absolute cursor-move rounded-md border-2 border-white shadow-[0_0_0_9999px_rgba(19,16,31,0.45)] outline-none focus-visible:ring-4 focus-visible:ring-brand-500/50"
          style={{ left: pct(r.x), top: pct(r.y), width: pct(r.w), height: pct(r.h) }}
        >
          {CORNERS.map((c) => (
            <span
              key={c}
              data-corner={c}
              aria-hidden="true"
              className={`absolute grid size-8 place-items-center ${c.includes("n") ? "-top-4" : "-bottom-4"} ${c.includes("w") ? "-left-4" : "-right-4"} ${c === "nw" || c === "se" ? "cursor-nwse-resize" : "cursor-nesw-resize"}`}
            >
              <span className="size-3.5 rounded-full border-2 border-white bg-brand-500 shadow" />
            </span>
          ))}
        </div>
      </div>
      <p id={hintId} className="text-xs leading-relaxed text-muted">
        Drag the box or its corners, or draw a new one. Arrow keys move it, Shift + arrows resize.
      </p>
    </div>
  );
}
