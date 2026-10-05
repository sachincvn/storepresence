"use client";

import type { ReactNode } from "react";

export type SlideActions = {
  canAddText: boolean;
  onDuplicate: () => void;
  onAddText: () => void;
  onMove: (offset: -1 | 1) => void;
  onRemove: () => void;
};

type Props = SlideActions & { slide: number; count: number };

const ICONS = {
  duplicate: "M8 8h11v11H8zM5 16V5h11",
  text: "M5 7V5h10v2M10 5v12m-2.5 0h5M17 12v6m-3-3h6",
  left: "M15 18 9 12l6-6",
  right: "m9 18 6-6-6-6",
  remove: "M5 7h14M10 11v6M14 11v6M6 7l1 12h10l1-12M9 7V4h6v3",
};

/** Arrange the set: duplicate, add a text slide, move or delete the selected slide. */
export function SlideToolbar({ slide, count, canAddText, onDuplicate, onAddText, onMove, onRemove }: Props) {
  return (
    <div role="toolbar" aria-label={`Slide ${slide + 1} actions`} className="flex flex-wrap items-center justify-center gap-1">
      <ToolButton icon={ICONS.duplicate} onClick={onDuplicate}>
        Duplicate
      </ToolButton>
      <ToolButton icon={ICONS.text} onClick={onAddText} disabled={!canAddText}>
        Text slide
      </ToolButton>
      <span aria-hidden="true" className="mx-1 h-5 w-px bg-line" />
      <ToolButton icon={ICONS.left} label="Move slide left" onClick={() => onMove(-1)} disabled={slide === 0} />
      <ToolButton icon={ICONS.right} label="Move slide right" onClick={() => onMove(1)} disabled={slide >= count - 1} />
      <ToolButton icon={ICONS.remove} label="Delete slide" onClick={onRemove} disabled={count <= 1} />
    </div>
  );
}

function ToolButton({ icon, label, children, ...props }: { icon: string; label?: string; children?: ReactNode; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={`inline-flex h-9 items-center gap-1.5 rounded-xl text-xs font-bold text-ink hover:bg-white disabled:pointer-events-none disabled:opacity-35 ${children ? "px-2.5" : "w-9 justify-center"}`}
      {...props}
    >
      <svg viewBox="0 0 24 24" className="size-[18px]" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d={icon} />
      </svg>
      {children}
    </button>
  );
}
