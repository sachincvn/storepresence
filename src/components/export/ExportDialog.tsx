"use client";

import { useEffect, useId, useRef } from "react";
import { Button } from "@/components/ui/Button";
import { OUTPUT_SIZES, type SizeId } from "@/templates/sizes";

type Props = {
  open: boolean;
  onClose: () => void;
  slideCount: number;
  sizes: SizeId[];
  onSizesChange: (sizes: SizeId[]) => void;
  onDownload: () => void;
  /** Progress text while exporting; null when idle. */
  status: string | null;
  error?: string | null;
};

const STORES = ["Google Play", "App Store"] as const;

/** Pick store sizes, then download everything as one ZIP. */
export function ExportDialog({ open, onClose, slideCount, sizes, onSizesChange, onDownload, status, error }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  const toggle = (id: SizeId, on: boolean) => {
    const next = on ? [...sizes, id] : sizes.filter((s) => s !== id);
    // Keep display order, and never leave the export empty.
    onSizesChange(OUTPUT_SIZES.map((s) => s.id).filter((s) => next.includes(s)));
  };
  const files = OUTPUT_SIZES.filter((s) => sizes.includes(s.id)).reduce((n, s) => n + (s.kind === "feature" ? 1 : slideCount), 0);
  const busy = status !== null;

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget && !busy) onClose();
      }}
      className="m-auto w-[min(440px,calc(100vw-32px))] rounded-[28px] bg-white p-0 text-ink shadow-[0_30px_80px_-30px_rgb(22_19_31/0.5)] backdrop:bg-ink/40"
    >
      <div className="flex items-center justify-between border-b border-line px-6 py-4">
        <h2 id={titleId} className="font-display text-xl font-extrabold tracking-[-0.02em]">
          Export
        </h2>
        <button type="button" onClick={onClose} disabled={busy} className="rounded-xl border border-line px-3 py-1.5 text-sm font-bold disabled:opacity-40">
          Close
        </button>
      </div>
      <div className="flex flex-col gap-5 px-6 py-5">
        {STORES.map((store) => (
          <fieldset key={store} className="flex flex-col gap-2">
            <legend className="mb-1 text-sm font-bold text-muted">{store}</legend>
            {OUTPUT_SIZES.filter((s) => s.store === store).map((s) => {
              const checked = sizes.includes(s.id);
              const only = checked && sizes.length === 1;
              return (
                <label key={s.id} className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 ${checked ? "border-blue bg-blue/5" : "border-line"}`}>
                  <input type="checkbox" checked={checked} disabled={only || busy} onChange={(e) => toggle(s.id, e.target.checked)} className="size-5 accent-blue" />
                  <span className="flex-1 text-sm font-bold">{s.label}</span>
                  <span className="text-xs text-muted tabular-nums">
                    {s.width} × {s.height}
                  </span>
                </label>
              );
            })}
          </fieldset>
        ))}
        {error && (
          <p role="alert" className="rounded-xl bg-[#FFF0F5] px-3 py-2 text-sm font-semibold text-[#9E1846]">
            {error}
          </p>
        )}
        <p className="text-xs leading-relaxed text-muted">
          Other sizes reflow your slides automatically. Check them in the editor with the size switch above the preview.
        </p>
      </div>
      <div className="flex items-center justify-between gap-3 border-t border-line px-6 py-4">
        <p role="status" className="text-sm font-semibold text-muted tabular-nums">
          {status ?? `${files} ${files === 1 ? "file" : "files"}`}
        </p>
        <Button onClick={onDownload} disabled={busy}>
          Download ZIP
        </Button>
      </div>
    </dialog>
  );
}
