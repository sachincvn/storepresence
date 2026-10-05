"use client";

import { useRef } from "react";
import type { Screenshot } from "@/types/project";
import type { ImageSlotKey } from "@/types/template";
import { ACCEPT_ATTR } from "@/lib/upload";

const LABELS: Record<ImageSlotKey, { title: string; hint: string }> = {
  appIcon: { title: "App icon", hint: "Square PNG, 512px or larger" },
  logo: { title: "Logo", hint: "Transparent PNG works best" },
  mascot: { title: "Mascot", hint: "Transparent PNG, floats over the slide" },
};

type BrandImagesProps = {
  keys: ImageSlotKey[];
  images: Partial<Record<ImageSlotKey, Screenshot>>;
  onChange: (key: ImageSlotKey, file: File | null) => void;
};

/** Upload spots for the image slots this template uses. */
export function BrandImages({ keys, images, onChange }: BrandImagesProps) {
  return (
    <ul className="flex flex-col gap-2">
      {keys.map((key) => (
        <BrandImage key={key} slot={key} image={images[key]} onChange={onChange} />
      ))}
    </ul>
  );
}

function BrandImage({ slot, image, onChange }: { slot: ImageSlotKey; image?: Screenshot; onChange: BrandImagesProps["onChange"] }) {
  const input = useRef<HTMLInputElement>(null);
  const { title, hint } = LABELS[slot];
  return (
    <li className="flex items-center gap-3 rounded-xl border border-line bg-white p-2">
      <span className="grid size-12 shrink-0 place-items-center overflow-hidden rounded-lg bg-canvas">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element -- object URL preview
          <img src={image.url} alt="" className="size-full object-contain" />
        ) : (
          <svg viewBox="0 0 24 24" className="size-5 text-muted" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-bold">{title}</span>
        <span className="block truncate text-xs text-muted">{image ? image.name : hint}</span>
        <span className="mt-1 flex gap-3">
          <button type="button" onClick={() => input.current?.click()} className="rounded text-xs font-bold text-blue hover:underline">
            {image ? "Replace" : "Upload"}
            <span className="sr-only"> {title.toLowerCase()}</span>
          </button>
          {image && (
            <button type="button" onClick={() => onChange(slot, null)} className="rounded text-xs font-bold text-muted hover:text-ink hover:underline">
              Remove<span className="sr-only"> {title.toLowerCase()}</span>
            </button>
          )}
        </span>
      </span>
      <input
        ref={input}
        type="file"
        accept={ACCEPT_ATTR}
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onChange(slot, file);
          e.target.value = "";
        }}
      />
    </li>
  );
}
