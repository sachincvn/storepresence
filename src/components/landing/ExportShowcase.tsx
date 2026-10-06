import type { CSSProperties } from "react";
import { OUTPUT_SIZES } from "@/templates/sizes";
import { CheckIcon, container, Eyebrow, Icon } from "./Section";

const SLIDES = 4;
const files = OUTPUT_SIZES.reduce((n, s) => n + (s.kind === "screens" ? SLIDES : 1), 0);

const points = [
  "Google Play phone, feature graphic, iPhone and iPad sizes",
  "Each size is reflowed from your design, not stretched",
  "Sorted into store folders inside one ZIP",
];

export function ExportShowcase() {
  return (
    <section aria-labelledby="export-title" className="py-24 lg:py-32">
      <div className={`${container} grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-16`}>
        <div className="reveal min-w-0 lg:col-span-6">
          <ExportPanel />
        </div>
        <div className="reveal min-w-0 lg:col-span-6">
          <Eyebrow icon={<Icon name="layers" />}>Multi-size export</Eyebrow>
          <h2 id="export-title" className="mt-4 font-display text-[clamp(2.25rem,4.4vw,3.5rem)] leading-[1.04] font-medium tracking-[-0.035em] text-balance">
            Exporting one size is easy.
            <br />
            <span className="text-brand-500">So is every size at once.</span>
          </h2>
          <p className="mt-5 max-w-[30rem] text-[17px] leading-[1.6] text-muted">
            Design your set once at 1080 × 1920. Tick the sizes you need and get them all in a single download.
          </p>
          <ul className="mt-7 space-y-3">
            {points.map((p) => (
              <li key={p} className="reveal flex gap-3 text-[15px]">
                <CheckIcon className="mt-0.5 text-brand-500" />
                {p}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

function ExportPanel() {
  return (
    <div aria-hidden="true" className="rounded-[30px] border border-hairline bg-white/60 p-3 shadow-card sm:p-5">
      <div className="overflow-hidden rounded-[20px] border border-hairline bg-white shadow-card">
        <div className="flex h-12 items-center gap-2 border-b border-hairline px-4">
          <span className="size-3 rounded-full bg-[#ff5f57]" />
          <span className="size-3 rounded-full bg-[#febc2e]" />
          <span className="size-3 rounded-full bg-[#28c840]" />
          <span className="ml-3 text-sm font-medium">Export {SLIDES} slides</span>
        </div>
        <ul className="space-y-1 p-3">
          {OUTPUT_SIZES.map((s, i) => (
            <li key={s.id} className="flex items-center gap-3 rounded-xl px-2 py-2 text-sm">
              <span
                style={{ "--d": `${i * 300}ms` } as CSSProperties}
                className="anim-tile grid size-5 shrink-0 place-items-center rounded-md bg-brand-500 text-white"
              >
                <CheckIcon className="size-3" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate">
                  {s.store} · {s.label}
                </span>
                <span className="block truncate font-mono text-[11px] text-ink/45">{s.folder}/</span>
              </span>
              <span className="text-xs text-ink/50 tabular-nums">
                {s.width} × {s.height}
              </span>
              <span className="w-12 text-right text-xs font-medium text-brand-600 tabular-nums">
                {s.kind === "screens" ? `${SLIDES} PNG` : "1 PNG"}
              </span>
            </li>
          ))}
        </ul>
        <div className="mx-3 grid grid-cols-3 gap-2">
          {[
            { label: "Slides", value: String(SLIDES) },
            { label: "Sizes", value: String(OUTPUT_SIZES.length) },
            { label: "Files", value: String(files), brand: true },
          ].map((stat) => (
            <div key={stat.label} className="rounded-xl bg-paper px-3 py-2.5">
              <p className="text-[11px] text-ink/50">{stat.label}</p>
              <p className={`font-display text-lg font-medium ${stat.brand ? "text-brand-600" : ""}`}>{stat.value}</p>
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-center justify-between gap-3 border-t border-hairline p-3">
          <span className="flex items-center gap-1.5 font-mono text-xs text-ink/55">
            <Icon name="zip" className="size-4 text-brand-500" />
            my-app-screenshots.zip
          </span>
          <span className="anim-pop rounded-lg bg-[linear-gradient(var(--color-brand-400),var(--color-brand-600))] px-4 py-2 text-sm font-medium text-white shadow-[0_0_0_1px_var(--color-brand-800),inset_0_1px_0_rgb(255_255_255/0.3)]">
            Export {files} files
          </span>
        </div>
      </div>
    </div>
  );
}
