"use client";

import { useRef, useState, type DragEvent, type ReactNode } from "react";
import type { Screenshot } from "@/types/project";
import { ACCEPT_ATTR, MAX_SCREENSHOTS } from "@/lib/upload";

type ScreenshotPanelProps = {
  screenshots: Screenshot[];
  usingSamples: boolean;
  selected: number;
  pending: number;
  errors: string[];
  /** Announced politely to screen readers. */
  notice: string;
  onSelect: (index: number) => void;
  onAdd: (files: FileList) => void;
  onReplace: (screenshot: Screenshot, file: File) => void;
  onRemove: (screenshot: Screenshot) => void;
  onMove: (screenshot: Screenshot, offset: -1 | 1) => void;
  onDismissErrors: () => void;
};

export function ScreenshotPanel(props: ScreenshotPanelProps) {
  const { screenshots, usingSamples, selected, pending, errors, notice } = props;
  const inputRef = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const full = !usingSamples && screenshots.length >= MAX_SCREENSHOTS;

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation(); // the editor-wide drop target must not add them twice
    setOver(false);
    if (e.dataTransfer.files.length > 0) props.onAdd(e.dataTransfer.files);
  };

  return (
    <div className="flex flex-col gap-3">
      <p role="status" className="sr-only">
        {notice}
      </p>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={onDrop}
        className={`rounded-2xl border-2 border-dashed p-4 text-center transition-colors ${over ? "border-brand-500 bg-brand-50" : "border-line bg-white"}`}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT_ATTR}
          multiple
          className="sr-only"
          tabIndex={-1}
          aria-hidden="true"
          onChange={(e) => {
            if (e.target.files?.length) props.onAdd(e.target.files);
            e.target.value = "";
          }}
        />
        <button
          type="button"
          disabled={full || pending > 0}
          onClick={() => inputRef.current?.click()}
          className="inline-flex items-center gap-2 rounded-xl border border-line bg-brand-500 px-4 py-2 text-sm font-medium text-white shadow-card transition-[translate,box-shadow] hover:-translate-x-px hover:-translate-y-px hover:shadow-card-hover active:translate-x-[3px] active:translate-y-[3px] active:shadow-none disabled:pointer-events-none disabled:opacity-50"
        >
          <svg viewBox="0 0 16 16" className="size-4" aria-hidden="true">
            <path d="M8 13V5m0 0L5 8m3-3 3 3M3 3h10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {pending > 0 ? `Adding ${pending}…` : "Upload screenshots"}
        </button>
        <p className="mt-2 text-xs leading-relaxed text-muted">
          {full ? `Set is full (${MAX_SCREENSHOTS}). Remove one to add more.` : "PNG, JPG or WEBP. Or drop files anywhere."}
        </p>
      </div>

      {errors.length > 0 && (
        <div role="alert" className="rounded-xl border border-[#F3B5CC] bg-[#FFF0F5] p-3 text-sm text-[#9E1846]">
          <ul className="flex flex-col gap-1">
            {errors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
          <button type="button" onClick={props.onDismissErrors} className="mt-2 rounded text-xs font-medium underline">
            Dismiss
          </button>
        </div>
      )}

      {usingSamples ? (
        <p className="text-sm leading-relaxed text-muted">Showing 4 sample screenshots. Your uploads replace them.</p>
      ) : (
        <ol aria-label="Your screenshots" className="flex flex-col gap-2">
          {screenshots.map((s, i) => (
            <li
              key={s.id}
              className={`flex items-center gap-3 rounded-xl border bg-white p-2 ${i === selected ? "border-brand-500 ring-1 ring-brand-500" : "border-line"}`}
            >
              <button
                type="button"
                onClick={() => props.onSelect(i)}
                aria-label={`Show slide ${i + 1}`}
                aria-current={i === selected ? "true" : undefined}
                className="shrink-0 rounded-md"
              >
                {/* Object URL thumbnail; next/image cannot optimise blob: URLs. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={s.url} alt="" className="h-14 w-8 rounded-md object-cover ring-1 ring-line" />
              </button>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  <span className="text-muted tabular-nums">{i + 1}.</span> {s.name}
                </p>
                <p className="text-xs text-muted tabular-nums">
                  {s.width} × {s.height}
                </p>
              </div>
              <div className="flex shrink-0 items-center">
                <IconButton label={`Move ${s.name} up`} disabled={i === 0} onClick={() => props.onMove(s, -1)}>
                  <path d="M8 12V4m0 0L4.5 7.5M8 4l3.5 3.5" />
                </IconButton>
                <IconButton label={`Move ${s.name} down`} disabled={i === screenshots.length - 1} onClick={() => props.onMove(s, 1)}>
                  <path d="M8 4v8m0 0-3.5-3.5M8 12l3.5-3.5" />
                </IconButton>
                <ReplaceButton screenshot={s} onReplace={props.onReplace} />
                <IconButton label={`Remove ${s.name}`} onClick={() => props.onRemove(s)}>
                  <path d="M4 4l8 8m0-8-8 8" />
                </IconButton>
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

function IconButton({ label, disabled, onClick, children }: { label: string; disabled?: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className="grid size-8 place-items-center rounded-lg text-ink/70 hover:bg-canvas hover:text-ink disabled:opacity-30"
    >
      <svg viewBox="0 0 16 16" className="size-4" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        {children}
      </svg>
    </button>
  );
}

function ReplaceButton({ screenshot, onReplace }: { screenshot: Screenshot; onReplace: (s: Screenshot, file: File) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <>
      <input
        ref={ref}
        type="file"
        accept={ACCEPT_ATTR}
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onReplace(screenshot, file);
          e.target.value = "";
        }}
      />
      <IconButton label={`Replace ${screenshot.name}`} onClick={() => ref.current?.click()}>
        <path d="M3 8a5 5 0 0 1 8.5-3.5L13 6m0-3v3h-3M13 8a5 5 0 0 1-8.5 3.5L3 10m0 3v-3h3" />
      </IconButton>
    </>
  );
}
