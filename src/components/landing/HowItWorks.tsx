import { templates } from "@/templates/registry";
import { Card, CheckIcon, container, Icon, SectionHeader } from "./Section";

export function HowItWorks() {
  return (
    <section id="how" aria-labelledby="how-title" className="scroll-mt-24 pt-8 pb-24 lg:pb-32">
      <div className={container}>
        <SectionHeader
          id="how-title"
          eyebrow="How it works"
          icon={<Icon name="bolt" />}
          title="From raw screenshots"
          accent="to a store listing."
          lede="Pick a template. Drop your screenshots. Export. That's it."
        />
        <ol className="mt-12 grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-3">
          <li className="flex">
            <Card className="w-full" number="01" visual={<PickVisual />} title="Pick a template" body="Every layout is already sized and styled for the store." />
          </li>
          <li className="flex">
            <Card className="w-full" number="02" visual={<DropVisual />} title="Drop your screenshots" body="Drag in PNG, JPG or WEBP. Each one fits its slot." />
          </li>
          <li className="flex">
            <Card className="w-full" number="03" visual={<ExportVisual />} title="Export the set" body="One PNG, or the whole set as a ZIP. Done." />
          </li>
        </ol>
      </div>
    </section>
  );
}

function PickVisual() {
  const picks = templates.slice(0, 3);
  return (
    <div className="absolute inset-0 flex items-center justify-center gap-4">
      {picks.map((t, i) => (
        <div key={t.id} className="flex flex-col items-center gap-2">
          <span
            className={`block aspect-[9/16] rounded-lg ring-1 ring-black/10 ${i === 1 ? "w-[68px] shadow-card-hover ring-2 ring-brand-500 ring-offset-2 ring-offset-paper" : "w-14 opacity-80"}`}
            style={{ background: t.theme.background }}
          />
          <span className={`rounded-md px-1.5 py-0.5 text-[11px] ${i === 1 ? "bg-brand-500 text-white" : "text-ink/60"}`}>{t.name}</span>
        </div>
      ))}
      <svg viewBox="0 0 24 24" aria-hidden="true" className="anim-cursor absolute top-[48%] left-[54%] size-6 drop-shadow-[0_2px_3px_rgb(19_16_31/0.3)]">
        <path d="M5 3l14 8-6 1.5L10 19z" fill="#fff" stroke="#13101f" strokeWidth="1.6" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

function DropVisual() {
  return (
    <div className="absolute inset-0 grid place-items-center">
      <div className="w-[72%] rounded-2xl border border-hairline bg-white p-2 shadow-card">
        <div className="anim-zone flex flex-col items-center gap-1.5 rounded-xl border-[1.5px] border-dashed border-brand-200 bg-brand-50/50 py-5">
          <Icon name="upload" className="size-5 text-brand-500" />
          <span className="text-xs font-medium">Drop screenshots here</span>
          <span className="text-[11px] text-ink/50">PNG · JPG · WEBP</span>
        </div>
      </div>
      <span className="anim-drop absolute top-[18%] right-[14%] flex rotate-6 items-center gap-1.5 rounded-lg bg-white px-2 py-1 text-[11px] shadow-card-hover">
        <span className="h-4 w-2.5 rounded-[2px] bg-brand-500" />
        home.png
      </span>
    </div>
  );
}

function ExportVisual() {
  return (
    <div className="absolute inset-0 grid place-items-center">
      <div className="anim-toast flex items-center gap-3 rounded-2xl border border-hairline bg-white py-3 pr-5 pl-3 shadow-card-hover [--d:-1s]">
        <span className="relative grid size-9 place-items-center rounded-full bg-success text-white">
          <span className="anim-pulse-ring absolute inset-0 rounded-full bg-success/40" />
          <CheckIcon className="relative" />
        </span>
        <span>
          <span className="block text-sm font-medium">Export complete</span>
          <span className="block text-xs text-muted">4 PNGs · zipped in order</span>
        </span>
      </div>
    </div>
  );
}
