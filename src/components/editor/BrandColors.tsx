"use client";

import { useEffect, useRef, useState } from "react";
import type { Screenshot } from "@/types/project";
import type { ResolvedTemplate, ThemeTokens } from "@/types/template";
import { ACCEPT_ATTR } from "@/lib/upload";
import { brandThemes, extractPalette, type PaletteColor } from "@/lib/palette";

/** Side of the copy the palette is read from; plenty for an icon's main colors. */
const SAMPLE_SIZE = 48;

function useIconPalette(url: string | undefined): PaletteColor[] | null {
  const [result, setResult] = useState<{ url: string; palette: PaletteColor[] } | null>(null);
  useEffect(() => {
    if (!url) return;
    let active = true;
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = SAMPLE_SIZE;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx || !active) return;
      ctx.drawImage(img, 0, 0, SAMPLE_SIZE, SAMPLE_SIZE);
      setResult({ url, palette: extractPalette(ctx.getImageData(0, 0, SAMPLE_SIZE, SAMPLE_SIZE).data) });
    };
    img.src = url;
    return () => {
      active = false;
    };
  }, [url]);
  return result && result.url === url ? result.palette : null;
}

type Props = {
  template: ResolvedTemplate;
  theme: ThemeTokens;
  icon?: Screenshot;
  onUpload: (file: File) => void;
  onApply: (theme: ThemeTokens) => void;
};

const sameTheme = (a: ThemeTokens, b: ThemeTokens) => {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]) as Set<keyof ThemeTokens>;
  return [...keys].every((k) => a[k]?.toUpperCase() === b[k]?.toUpperCase());
};

/** Colors that fit the user's app icon, as one-click theme suggestions. */
export function BrandColors({ template, theme, icon, onUpload, onApply }: Props) {
  const input = useRef<HTMLInputElement>(null);
  const palette = useIconPalette(icon?.url);
  const suggestions = palette ? brandThemes(palette, template.theme, template.editableColors) : [];

  return (
    <div className="mb-3 rounded-xl border border-line bg-white p-3">
      {icon ? (
        <>
          <div className="flex items-center gap-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element -- object URL preview */}
            <img src={icon.url} alt="" className="size-8 rounded-lg object-cover" />
            <div className="min-w-0">
              <p className="text-sm font-bold">Match your app icon</p>
              {palette && (
                <p className="flex gap-1 pt-1" aria-hidden="true">
                  {palette.map((c) => (
                    <span key={c.hex} className="size-3 rounded-full ring-1 ring-ink/10" style={{ background: c.hex }} />
                  ))}
                </p>
              )}
            </div>
          </div>
          {suggestions.length > 0 && (
            <div className="mt-3 grid grid-cols-3 gap-2">
              {suggestions.map((s) => {
                const look = { ...template.theme, ...s.theme };
                return (
                  <button
                    key={s.id}
                    type="button"
                    aria-pressed={sameTheme(theme, s.theme)}
                    aria-label={`Use ${s.label.toLowerCase()} brand colors`}
                    onClick={() => onApply(s.theme)}
                    className="group flex flex-col gap-1.5 rounded-lg p-1 text-left aria-pressed:ring-2 aria-pressed:ring-blue"
                  >
                    <span
                      aria-hidden="true"
                      className="flex h-12 items-end justify-between rounded-md p-1.5 ring-1 ring-ink/10 group-hover:ring-ink/30"
                      style={{ background: look.background }}
                    >
                      <span className="font-display text-sm leading-none font-extrabold" style={{ color: look.foreground }}>
                        Aa
                      </span>
                      <span className="h-2.5 w-5 rounded-full" style={{ background: look.accent }} />
                    </span>
                    <span className="px-0.5 text-[11px] font-bold">{s.label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </>
      ) : (
        <button type="button" onClick={() => input.current?.click()} className="flex w-full items-center gap-3 text-left">
          <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-canvas" aria-hidden="true">
            <svg viewBox="0 0 24 24" className="size-5 text-blue" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3a9 9 0 1 0 0 18c1.5 0 2-1 2-2s-1-1.5-1-2.5S14 15 15.5 15H18a3 3 0 0 0 3-3 9 9 0 0 0-9-9zM7.5 11.5h.01M10 7.5h.01M15 7.5h.01" />
            </svg>
          </span>
          <span>
            <span className="block text-sm font-bold text-blue">Match colors to your app icon</span>
            <span className="block text-xs text-muted">Upload the icon, get colors that fit</span>
          </span>
        </button>
      )}
      <input
        ref={input}
        type="file"
        accept={ACCEPT_ATTR}
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onUpload(file);
          e.target.value = "";
        }}
      />
    </div>
  );
}
