import type { ReactNode } from "react";
import { TemplateSetPreview } from "@/components/templates/TemplateSetPreview";
import { templates } from "@/templates/registry";
import { CheckIcon, Icon } from "./Section";

const sidebar = templates.slice(0, 6);
const swatches = ["#6D3FF0", "#16131F", "#22A55B", "#FF6FAE", "#FFB020"];

/**
 * Coded mini editor inside a glass tray: template list, a live render of the
 * Studio Blue set and export controls, with floating step and done toasts.
 * Decorative; the figcaption is the text equivalent.
 */
export function HeroMock() {
  return (
    <figure className="relative mx-auto max-w-[1080px] text-ink">
      <figcaption className="sr-only">
        The editor: pick a template on the left, see your screenshots placed in the preview, then change the headline
        and color and export.
      </figcaption>

      <div aria-hidden="true" className="rounded-[32px] border border-white/45 bg-white/20 p-3 shadow-mock backdrop-blur-md sm:p-8 lg:px-20 lg:py-10">
        <div className="overflow-hidden rounded-[20px] border border-white/80 bg-white shadow-[0_30px_60px_-30px_rgb(48_20_140/0.45)]">
          <div className="flex h-12 items-center gap-2 border-b border-hairline bg-[#fbfaff] px-4">
            <span className="size-3 rounded-full bg-[#ff5f57]" />
            <span className="size-3 rounded-full bg-[#febc2e]" />
            <span className="size-3 rounded-full bg-[#28c840]" />
            <span className="ml-4 hidden items-center gap-2 rounded-lg border border-hairline bg-white px-3 py-1 text-xs text-ink/60 sm:flex">
              <Icon name="layers" className="size-3.5 text-brand-500" />
              Studio Blue · 4 slides
            </span>
            <span className="ml-auto rounded-lg bg-paper px-2.5 py-1 text-[11px] font-medium text-ink/55 tabular-nums">1080 × 1920</span>
          </div>

          <div className="grid md:grid-cols-[180px_minmax(0,1fr)] lg:grid-cols-[180px_minmax(0,1fr)_220px]">
            <div className="hidden border-r border-hairline bg-[#fbfaff] p-3 text-left md:block">
              <p className="px-2 pt-1 pb-2 text-[11px] font-medium text-ink/45">Templates</p>
              <ul className="space-y-0.5">
                {sidebar.map((t) => {
                  const active = t.id === "studio-blue";
                  return (
                    <li
                      key={t.id}
                      className={`flex h-9 items-center gap-2.5 rounded-lg px-2 text-[13px] ${active ? "bg-brand-500 font-medium text-white" : "text-ink/70"}`}
                    >
                      <span className="size-4 shrink-0 rounded-[5px] ring-1 ring-black/10" style={{ background: t.theme.background }} />
                      <span className="truncate">{t.name}</span>
                    </li>
                  );
                })}
              </ul>
            </div>

            <div className="bg-paper px-4 py-6 sm:px-8 sm:py-9">
              <TemplateSetPreview templateId="studio-blue" className="mx-auto max-w-[460px] shadow-card" />
              <div className="mt-5 flex justify-center gap-1.5">
                <span className="h-1.5 w-5 rounded-full bg-brand-500" />
                <span className="size-1.5 rounded-full bg-ink/15" />
                <span className="size-1.5 rounded-full bg-ink/15" />
              </div>
            </div>

            <div className="hidden space-y-5 border-l border-hairline p-4 text-left lg:block">
              <MockField label="Headline">
                <div className="rounded-lg border border-brand-200 bg-white px-3 py-2 text-[13px] shadow-[0_0_0_3px_rgb(109_63_240/0.12)]">
                  Plan your day in seconds<span className="anim-blink ml-px inline-block h-3.5 w-px translate-y-0.5 bg-brand-500" />
                </div>
              </MockField>
              <MockField label="Theme color">
                <div className="flex gap-2">
                  {swatches.map((c, i) => (
                    <span
                      key={c}
                      className={`size-6 rounded-full ${i === 0 ? "ring-2 ring-brand-500 ring-offset-2" : "ring-1 ring-black/10"}`}
                      style={{ background: c }}
                    />
                  ))}
                </div>
              </MockField>
              <MockField label="Device frame">
                <div className="flex items-center justify-between rounded-lg border border-hairline px-3 py-2 text-[13px] text-ink/70">
                  Phone
                  <span className="flex h-5 w-9 items-center justify-end rounded-full bg-brand-500 p-0.5">
                    <span className="size-4 rounded-full bg-white" />
                  </span>
                </div>
              </MockField>
              <div className="grid h-10 place-items-center rounded-xl bg-[linear-gradient(var(--color-brand-400),var(--color-brand-600))] text-[13px] font-medium text-white shadow-[0_0_0_1px_var(--color-brand-800),inset_0_1px_0_rgb(255_255_255/0.3)]">
                Export all as ZIP
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating step card (left) and done toast (right). */}
      <div aria-hidden="true" className="anim-float absolute top-[38%] -left-3 hidden w-52 rounded-2xl border border-white/80 bg-white/90 p-3.5 text-left shadow-card-hover backdrop-blur-md xl:block">
        <div className="flex gap-3">
          <span className="font-display text-sm font-medium text-brand-500">2</span>
          <span>
            <span className="block text-sm font-medium">Drop screenshots</span>
            <span className="mt-0.5 block text-xs leading-4 text-muted">PNG, JPG or WEBP. Placed and fitted for you.</span>
          </span>
        </div>
      </div>
      <div
        aria-hidden="true"
        className="anim-toast absolute -bottom-5 left-1/2 flex w-max -translate-x-1/2 items-center gap-3 rounded-2xl border border-white/80 bg-white/90 py-3 pr-5 pl-3 text-left shadow-card-hover backdrop-blur-md sm:right-6 sm:left-auto sm:translate-x-0 xl:bottom-[16%] xl:-right-6"
      >
        <span className="relative grid size-9 place-items-center rounded-full bg-success text-white">
          <span className="anim-pulse-ring absolute inset-0 rounded-full bg-success/40" />
          <CheckIcon className="relative" />
        </span>
        <span>
          <span className="block text-sm font-medium">Exported 4 screenshots</span>
          <span className="block text-xs text-muted">my-app-screenshots.zip · 1080 × 1920</span>
        </span>
      </div>
    </figure>
  );
}

function MockField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <p className="mb-2 text-[11px] font-medium text-ink/45">{label}</p>
      {children}
    </div>
  );
}
