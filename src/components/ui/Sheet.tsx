"use client";

import { useEffect, useRef, type ReactNode } from "react";

type SheetProps = {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
};

/**
 * Mobile bottom sheet on native <dialog>: modal focus trap, Esc to close and
 * focus return come from the browser. Tap the backdrop to close.
 */
export function Sheet({ open, title, onClose, children }: SheetProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby="sheet-title"
      onClose={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="sheet fixed inset-x-0 top-auto bottom-0 m-0 max-h-[85dvh] w-full max-w-none rounded-t-[28px] bg-white p-0 text-ink shadow-[0_-20px_50px_-20px_rgb(22_19_31/0.4)] backdrop:bg-ink/40"
    >
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-white px-5 pt-3 pb-3">
        <span aria-hidden="true" className="absolute top-2 left-1/2 h-1 w-10 -translate-x-1/2 rounded-full bg-line" />
        <h2 id="sheet-title" className="mt-2 font-display text-xl font-extrabold tracking-[-0.02em]">
          {title}
        </h2>
        <button type="button" onClick={onClose} className="mt-2 rounded-xl border border-line px-3 py-1.5 text-sm font-bold">
          Done
        </button>
      </div>
      <div className="px-5 pt-4 pb-[max(1.5rem,env(safe-area-inset-bottom))]">{open && children}</div>
    </dialog>
  );
}
