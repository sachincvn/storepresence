"use client";

import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent, type RefObject } from "react";
import type { ElementEdit, Project } from "@/types/project";
import type { ResolvedTemplate } from "@/types/template";
import { applyEdit, elementBox, elementName, hitTest, snapMove, type Guide } from "@/templates/edits";
import { designFor, getSlideKey, resolveSlide } from "@/templates/resolve";

type Props = {
  template: ResolvedTemplate;
  project: Project;
  slide: number;
  /** The preview canvas this overlay sits on. */
  canvasRef: RefObject<HTMLDivElement | null>;
  selected: string | null;
  onSelect: (id: string | null) => void;
  onEdit: (id: string, edit: ElementEdit | null) => void;
};

type Drag = { id: string; mode: "move" | "scale"; start: { x: number; y: number }; edit: ElementEdit; moved: boolean };

const pct = (v: number, of: number) => `${(v / of) * 100}%`;

/**
 * Click an element on the slide to select it, drag to move, pull the corner
 * to resize. Arrow keys nudge (Shift = more), + and − resize, Delete hides,
 * Escape deselects. Everything stays inside safe bounds.
 */
export function CanvasOverlay({ template, project, slide, canvasRef, selected, onSelect, onEdit }: Props) {
  const overlay = useRef<HTMLDivElement>(null);
  const drag = useRef<Drag | null>(null);
  const [guides, setGuides] = useState<Guide[]>([]);
  const [rect, setRect] = useState<{ left: number; top: number; width: number; height: number } | null>(null);
  const { width: W, height: H } = template.canvas;

  // Track where the preview canvas is, so the overlay matches it exactly.
  useEffect(() => {
    const host = canvasRef.current;
    const canvas = host?.querySelector("canvas");
    if (!host || !canvas) return;
    const measure = () => setRect({ left: canvas.offsetLeft, top: canvas.offsetTop, width: canvas.offsetWidth, height: canvas.offsetHeight });
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(canvas);
    observer.observe(host);
    return () => observer.disconnect();
  }, [canvasRef]);

  const spec = useMemo(() => resolveSlide(template, project, slide), [template, project, slide]);
  const base = designFor(template, slide, project).elements;
  const edits = project.elementEdits?.[getSlideKey(template, project, slide)] ?? {};
  const current = spec.elements.find((el) => el.id === selected);

  const toDesign = (e: PointerEvent) => {
    const box = overlay.current!.getBoundingClientRect();
    return { x: ((e.clientX - box.left) / box.width) * W, y: ((e.clientY - box.top) / box.height) * H };
  };

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    const p = toDesign(e);
    const scaling = (e.target as HTMLElement).dataset.handle === "scale";
    const hit = scaling ? current : hitTest(spec.elements, p.x, p.y);
    onSelect(hit?.id ?? null);
    overlay.current?.focus();
    if (!hit) return;
    drag.current = { id: hit.id, mode: scaling ? "scale" : "move", start: p, edit: { ...edits[hit.id] }, moved: false };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d) return;
    const p = toDesign(e);
    const el = base.find((b) => b.id === d.id);
    if (!el) return;
    if (!d.moved && Math.hypot(p.x - d.start.x, p.y - d.start.y) < 4) return;
    d.moved = true;
    e.preventDefault();
    const startEl = applyEdit(el, d.edit);
    if (d.mode === "move") {
      const snapped = snapMove(startEl, p.x - d.start.x, p.y - d.start.y, template.canvas);
      setGuides(snapped.guides);
      onEdit(d.id, { ...d.edit, dx: (d.edit.dx ?? 0) + snapped.dx, dy: (d.edit.dy ?? 0) + snapped.dy });
    } else {
      const { cx, cy } = elementBox(startEl);
      const ratio = Math.hypot(p.x - cx, p.y - cy) / Math.max(1, Math.hypot(d.start.x - cx, d.start.y - cy));
      onEdit(d.id, { ...d.edit, scale: (d.edit.scale ?? 1) * ratio });
    }
  };

  const endDrag = () => {
    drag.current = null;
    setGuides([]);
  };

  const onKeyDown = (e: KeyboardEvent) => {
    if (!selected) return;
    const edit = { ...edits[selected] };
    const step = e.shiftKey ? 20 : 4;
    const moves: Record<string, [number, number]> = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
    if (moves[e.key]) onEdit(selected, { ...edit, dx: (edit.dx ?? 0) + moves[e.key][0], dy: (edit.dy ?? 0) + moves[e.key][1] });
    else if (e.key === "+" || e.key === "=") onEdit(selected, { ...edit, scale: (edit.scale ?? 1) * 1.05 });
    else if (e.key === "-") onEdit(selected, { ...edit, scale: (edit.scale ?? 1) / 1.05 });
    else if (e.key === "Delete" || e.key === "Backspace") {
      onEdit(selected, { ...edit, hidden: true });
      onSelect(null);
    } else if (e.key === "Escape") onSelect(null);
    else return;
    e.preventDefault();
  };

  if (!rect) return null;
  const box = current && elementBox(current);

  return (
    <div
      ref={overlay}
      tabIndex={0}
      role="group"
      aria-label={current ? `${elementName(current)} selected. Arrow keys move, plus and minus resize, Delete hides, Escape deselects.` : "Slide canvas. Click an element to move or resize it."}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onKeyDown={onKeyDown}
      className={`absolute cursor-pointer rounded-[20px] outline-none focus-visible:ring-4 focus-visible:ring-blue/40 ${current ? "touch-none" : ""}`}
      style={rect}
    >
      {guides.map((g) => (
        <span
          key={`${g.axis}-${g.at}`}
          aria-hidden="true"
          className="pointer-events-none absolute bg-[#FF4FA3]"
          style={g.axis === "x" ? { left: pct(g.at, W), top: 0, bottom: 0, width: 1 } : { top: pct(g.at, H), left: 0, right: 0, height: 1 }}
        />
      ))}
      {current && box && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute border-2 border-blue shadow-[0_0_0_1px_white]"
          style={{
            left: pct(box.cx - box.w / 2, W),
            top: pct(box.cy - box.h / 2, H),
            width: pct(box.w, W),
            height: pct(box.h, H),
            transform: current.rotation ? `rotate(${current.rotation}deg)` : undefined,
          }}
        >
          <span className="absolute -top-6 left-0 rounded-md bg-blue px-1.5 py-0.5 text-[11px] font-bold whitespace-nowrap text-white">{elementName(current)}</span>
          <span
            data-handle="scale"
            className="pointer-events-auto absolute -right-2.5 -bottom-2.5 size-5 cursor-nwse-resize touch-none rounded-full border-2 border-white bg-blue shadow"
          />
        </div>
      )}
    </div>
  );
}
