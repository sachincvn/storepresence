"use client";

import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import type { BlockKind } from "@/types/project";

export type SlideActions = {
  canAddText: boolean;
  /** Blocks for the Add menu; `reason` explains why one is unavailable. */
  blocks: { kind: BlockKind; label: string; reason?: string }[];
  onAddBlock: (kind: BlockKind) => void;
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
  add: "M12 5v14M5 12h14",
};

/** Arrange the set: duplicate, add a text slide, move or delete the selected slide. */
export function SlideToolbar({ slide, count, canAddText, blocks, onAddBlock, onDuplicate, onAddText, onMove, onRemove }: Props) {
  return (
    <div role="toolbar" aria-label={`Slide ${slide + 1} actions`} className="flex flex-wrap items-center justify-center gap-1">
      <AddMenu blocks={blocks} onAdd={onAddBlock} />
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

/** "Add" menu: rating, review, big number, award, app icon, pop-out. */
function AddMenu({ blocks, onAdd }: { blocks: SlideActions["blocks"]; onAdd: SlideActions["onAddBlock"] }) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);

  // Close on a click outside.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    root.current?.querySelector<HTMLButtonElement>("[role=menuitem]:not([aria-disabled=true])")?.focus();
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open]);

  const onKeyDown = (e: KeyboardEvent<HTMLUListElement>) => {
    const items = [...e.currentTarget.querySelectorAll<HTMLButtonElement>("[role=menuitem]")];
    const at = items.indexOf(document.activeElement as HTMLButtonElement);
    if (e.key === "Escape") {
      setOpen(false);
      trigger.current?.focus();
    } else if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      items[(at + (e.key === "ArrowDown" ? 1 : items.length - 1)) % items.length]?.focus();
    } else return;
    e.preventDefault();
  };

  return (
    <div ref={root} className="relative">
      <button
        ref={trigger}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="inline-flex h-9 items-center gap-1.5 rounded-xl px-2.5 text-xs font-bold text-blue hover:bg-white"
      >
        <svg viewBox="0 0 24 24" className="size-[18px]" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
          <path d={ICONS.add} />
        </svg>
        Add
      </button>
      {open && (
        <ul role="menu" aria-label="Add to slide" onKeyDown={onKeyDown} className="absolute bottom-full left-0 z-30 mb-2 w-56 rounded-2xl border border-line bg-white p-1.5 shadow-[0_20px_50px_-20px_rgb(22_19_31/0.45)]">
          {blocks.map((b) => (
            <li key={b.kind} role="none">
              <button
                type="button"
                role="menuitem"
                aria-disabled={b.reason ? true : undefined}
                title={b.reason}
                onClick={() => {
                  if (b.reason) return;
                  onAdd(b.kind);
                  setOpen(false);
                }}
                className="flex w-full flex-col rounded-xl px-3 py-2 text-left text-sm font-bold hover:bg-canvas focus-visible:bg-canvas aria-disabled:cursor-not-allowed aria-disabled:text-muted"
              >
                {b.label}
                {b.reason && <span className="text-xs font-semibold text-muted">{b.reason}</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
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
