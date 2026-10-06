import type { CSSProperties } from "react";
import { OUTPUT_SIZES } from "@/templates/sizes";
import { templates } from "@/templates/registry";
import { Card, CheckIcon, container, Icon, SectionHeader, Tag } from "./Section";

export function Features() {
  return (
    <section id="features" aria-labelledby="features-title" className="scroll-mt-24 py-20 lg:py-28">
      <div className={container}>
        <SectionHeader
          id="features-title"
          eyebrow="Features"
          icon={<Icon name="sparkle" />}
          title="Your screenshots."
          accent="Ready for the store."
          lede="Fitting, sizing, framing and exporting are done for you. Templates own the layout; you bring the content."
        />

        <div className="mt-12 grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-12">
          <Card
            className="md:col-span-2 lg:col-span-7"
            visual={<FitVisual />}
            visualClassName="h-72"
            title="Any screenshot, perfect fit"
            body="Tall, standard or landscape. Every screenshot is scaled into its slot with its proportions intact."
            tags={["Any aspect ratio", "Never stretched", "Auto crop", "Rounded corners", "Shadows"]}
          />
          <Card
            className="lg:col-span-5"
            visual={<SizesVisual />}
            visualClassName="h-72"
            title="Every store size"
            body="Design once, export for Google Play and the App Store at exact pixels."
            tags={["Google Play", "iPhone 6.9″", "iPhone 6.5″", "iPad 13″"]}
          />
          <Card
            className="lg:col-span-4"
            visual={<TextVisual />}
            title="Your words, your colors"
            body="Edit headlines and the theme color. The layout takes care of itself."
          />
          <Card
            className="lg:col-span-4"
            visual={<PrivacyVisual />}
            title="Stays in your browser"
            body="Rendering happens on your device. Screenshots are never uploaded."
          />
          <Card
            className="md:col-span-2 lg:col-span-4"
            visual={<BatchVisual />}
            title="Whole set, one click"
            body="Every slide exported at once, numbered in order and zipped."
          />
          <Card
            className="md:col-span-2 lg:col-span-7"
            visual={<TemplatesVisual />}
            visualClassName="h-56"
            title={`${templates.length} templates, one click apart`}
            body="Switch the whole set's look without touching your screenshots or text."
          />
          <Card
            className="md:col-span-2 lg:col-span-5"
            visual={<UndoVisual />}
            visualClassName="h-56"
            title="Undo anything, lose nothing"
            body="Full undo and redo, and your project autosaves in this browser."
          />
        </div>
      </div>
    </section>
  );
}

/* ---------- Visuals (decorative) ---------- */

/** A raw app screenshot drawn with CSS. */
function RawShot({ className = "" }: { className?: string }) {
  return (
    <div className={`flex flex-col gap-[6%] overflow-hidden bg-white p-[8%] ${className}`}>
      <div className="flex items-center justify-between">
        <div className="h-[5px] w-1/3 rounded-full bg-ink/70" />
        <div className="aspect-square w-[14%] rounded-full bg-brand-100" />
      </div>
      <div className="rounded-[10%/16%] bg-[linear-gradient(135deg,#8b64ff,#5024c8)] p-[8%]">
        <div className="h-[4px] w-1/2 rounded-full bg-white/60" />
        <div className="mt-[8%] h-[7px] w-3/4 rounded-full bg-white" />
      </div>
      {[80, 62, 72, 50].map((w) => (
        <div key={w} className="flex items-center gap-[6%]">
          <div className="aspect-square w-[16%] shrink-0 rounded-[30%] bg-paper" />
          <div className="h-[4px] rounded-full bg-ink/12" style={{ width: `${w}%` }} />
        </div>
      ))}
    </div>
  );
}

function FitVisual() {
  return (
    <div className="absolute inset-0 flex items-center justify-center gap-5 px-6 pt-8 sm:gap-10">
      <div className="flex flex-col items-center gap-2.5">
        <RawShot className="h-40 w-[74px] rounded-lg border border-hairline shadow-card sm:h-48 sm:w-[88px]" />
        <Tag>1170 × 2532</Tag>
      </div>
      <svg viewBox="0 0 40 16" aria-hidden="true" className="anim-nudge w-8 shrink-0 text-brand-400 sm:w-10">
        <path d="M2 8h34m0 0-6-6m6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <div className="anim-float relative flex h-52 w-[118px] flex-col items-center overflow-hidden rounded-xl bg-[linear-gradient(180deg,#7c5cee,#5530d6)] px-3 pt-4 shadow-card-hover sm:h-60 sm:w-[136px]">
        <p className="text-center font-display text-[13px] leading-tight font-medium text-white">Plan your day in seconds</p>
        <div className="mt-3 w-[78%] flex-1 rounded-t-[14px] border-[3px] border-b-0 border-ink bg-ink pt-1">
          <RawShot className="h-full rounded-t-[10px]" />
        </div>
      </div>
      <span className="anim-toast absolute top-4 left-1/2 -translate-x-1/2 rounded-full bg-white px-3 py-1.5 text-xs font-medium whitespace-nowrap text-green-700 shadow-card">
        Fitted automatically · never stretched
      </span>
    </div>
  );
}

function SizesVisual() {
  return (
    <div className="absolute inset-0 flex items-center justify-center p-5">
      <ul className="relative w-full max-w-[320px] rounded-2xl border border-hairline bg-white p-1.5 shadow-card">
        <li aria-hidden="true" className="anim-rows pointer-events-none absolute inset-x-1.5 top-1.5 h-9 rounded-lg bg-brand-50" />
        {OUTPUT_SIZES.map((s, i) => {
          const tall = s.height >= s.width;
          return (
            <li key={s.id} className="relative flex h-9 items-center gap-3 rounded-lg px-2.5 text-[13px]">
              <span className="grid w-4 place-items-center">
                <span
                  className={`block rounded-[2px] border-[1.5px] ${i === 0 ? "border-brand-500" : "border-ink/35"}`}
                  style={tall ? { height: 15, width: (15 * s.width) / s.height } : { width: 17, height: (17 * s.height) / s.width }}
                />
              </span>
              <span className="truncate">
                {s.store === "Google Play" ? "Play" : "App Store"} · {s.label}
              </span>
              <span className="ml-auto text-xs text-ink/45 tabular-nums">
                {s.width} × {s.height}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function TextVisual() {
  return (
    <div className="absolute inset-0 flex flex-col justify-center gap-3 p-5">
      <span className="w-max rounded-md border border-brand-100 bg-white px-2 py-1 font-mono text-[11px] text-brand-600">Headline</span>
      <div className="rounded-xl border border-hairline bg-white p-1.5 shadow-card">
        <div className="rounded-lg border border-brand-200 px-3 py-2.5 text-sm shadow-[0_0_0_3px_rgb(109_63_240/0.12)]">
          Never miss a <span className="rounded bg-brand-100 px-0.5 text-brand-700">deadline</span>
          <span className="anim-blink ml-px inline-block h-4 w-px translate-y-0.5 bg-brand-500" />
        </div>
        <div className="flex items-center gap-2 px-2 pt-3 pb-1.5">
          {["#6D3FF0", "#16131F", "#22A55B", "#FF6FAE", "#FFB020", "#3D5AFE"].map((c, i) => (
            <span
              key={c}
              className={`size-5 rounded-full ${i === 0 ? "ring-2 ring-brand-500 ring-offset-2" : "ring-1 ring-black/10"}`}
              style={{ background: c }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function PrivacyVisual() {
  return (
    <div className="absolute inset-0 grid place-items-center">
      <div className="anim-spin absolute size-44 rounded-full border border-dashed border-brand-300" />
      <div className="absolute size-28 rounded-full bg-brand-50" />
      <div className="anim-pulse-ring absolute size-20 rounded-full bg-brand-200/60" />
      <div className="relative grid size-16 place-items-center rounded-[18px] bg-[linear-gradient(var(--color-brand-400),var(--color-brand-600))] text-white shadow-[0_0_0_1px_var(--color-brand-800),inset_0_1px_0_rgb(255_255_255/0.3),0_12px_24px_-10px_rgb(98_50_224/0.7)]">
        <Icon name="laptop" className="size-7" />
      </div>
      <span className="anim-float absolute top-[22%] right-[24%] grid size-8 place-items-center rounded-lg bg-white text-brand-500 shadow-card">
        <Icon name="image" className="size-4" />
      </span>
      <span className="anim-float absolute top-[52%] left-[18%] grid size-8 [--d:-2.5s] place-items-center rounded-lg bg-white text-pink shadow-card">
        <Icon name="phone" className="size-4" />
      </span>
      <span className="absolute bottom-[12%] flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-medium shadow-card">
        <Icon name="cloudOff" className="size-3.5" />0 uploads
      </span>
    </div>
  );
}

const batchColors = ["#6D3FF0", "#8B64FF", "#5024C8", "#7C5CEE", "#FF8A65", "#3D5AFE", "#22A55B", "#C9B8FF", "#FFB020", "#9BE7C4", "#16131F", "#FF6FAE"];

function BatchVisual() {
  return (
    <div className="absolute inset-0 flex flex-col justify-center gap-3 p-5">
      <div className="grid grid-cols-6 gap-1.5">
        {batchColors.map((c, i) => (
          <span
            key={c}
            className="anim-tile grid aspect-[9/14] place-items-center rounded-md text-white ring-1 ring-black/5"
            style={{ background: c, "--d": `${i * 220}ms` } as CSSProperties}
          >
            <CheckIcon className="size-3" />
          </span>
        ))}
      </div>
      <div className="rounded-xl border border-hairline bg-white px-3 py-2.5 shadow-card">
        <div className="flex justify-between text-xs">
          <span className="font-medium">Exporting 12 slides</span>
          <span className="text-ink/50">my-app-screenshots.zip</span>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-paper">
          <div className="anim-fill h-full w-full rounded-full bg-[linear-gradient(90deg,var(--color-brand-400),var(--color-brand-600))]" />
        </div>
      </div>
    </div>
  );
}

function TemplatesVisual() {
  const shown = templates.slice(0, 8);
  // Each row holds its chips twice and scrolls by half for a seamless loop.
  return (
    <div className="absolute inset-0 flex flex-col justify-center gap-2.5 overflow-hidden py-5 [mask-image:linear-gradient(90deg,transparent,black_10%,black_90%,transparent)]">
      {[shown.slice(0, 4), shown.slice(4, 8)].map((row, r) => (
        <div key={r} className={`marquee marquee-slow flex w-max gap-2.5 pr-2.5 ${r === 1 ? "marquee-reverse" : ""}`}>
          {[...row, ...row].map((t, i) => (
            <span
              key={`${t.id}-${i}`}
              className={`flex shrink-0 items-center gap-2 rounded-xl border bg-white px-3 py-2 text-[13px] shadow-card ${r === 0 && i % 4 === 1 ? "border-brand-300 text-brand-700 ring-2 ring-brand-500/20" : "border-hairline"}`}
            >
              <span className="size-4 rounded-[5px] ring-1 ring-black/10" style={{ background: t.theme.background }} />
              {t.name}
            </span>
          ))}
        </div>
      ))}
    </div>
  );
}

function UndoVisual() {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
      <div className="flex gap-2.5">
        {["Ctrl", "Z"].map((k, i) => (
          <kbd
            key={k}
            style={{ "--d": `${i * 90}ms` } as CSSProperties}
            className="anim-key grid h-14 min-w-14 place-items-center rounded-xl border border-hairline bg-white px-3 font-sans text-lg font-medium text-ink shadow-[0_2px_0_var(--color-hairline),0_8px_16px_-10px_rgb(19_16_31/0.3)]"
          >
            {k}
          </kbd>
        ))}
      </div>
      <span className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-medium text-green-700 shadow-card">
        <CheckIcon className="size-3.5" />
        Saved in this browser
      </span>
    </div>
  );
}
