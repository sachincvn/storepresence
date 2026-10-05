import type { ReactNode } from "react";
import { SectionHeading } from "./SectionHeading";
import { StorePoster } from "./StorePoster";
import { getPoster } from "./posters";

const steps: { title: string; body: string; tile: string; art: ReactNode }[] = [
  {
    title: "Pick a template",
    body: "Bold, soft, dark or minimal. Every layout is already sized for the store.",
    tile: "bg-peach",
    art: <PickArt />,
  },
  {
    title: "Drop your screenshots",
    body: "Drag in PNG, JPG or WEBP files. Each one fits its slot without stretching.",
    tile: "bg-sky",
    art: <DropArt />,
  },
  {
    title: "Export the set",
    body: "Download one PNG, or the whole set as a ZIP named 01.png, 02.png and on.",
    tile: "bg-mint",
    art: <ExportArt />,
  },
];

export function HowItWorks() {
  return (
    <section id="how" aria-labelledby="how-title" className="scroll-mt-24 px-4 py-20 sm:px-6 lg:px-10 lg:py-28">
      <div className="mx-auto max-w-[1200px]">
        <SectionHeading id="how-title">Three moves. Zero design work.</SectionHeading>
        <ol className="mt-12 grid gap-6 md:grid-cols-3">
          {steps.map((step, i) => (
            <li key={step.title} className={`clay flex flex-col rounded-[32px] p-3 ${step.tile}`}>
              <div aria-hidden="true" className="relative h-52 overflow-hidden rounded-[24px] bg-white/45">
                {step.art}
              </div>
              <div className="px-4 pt-6 pb-5">
                <p aria-hidden="true" className="flex items-center gap-3">
                  <span className="grid size-8 place-items-center rounded-lg border-2 border-ink bg-white font-display text-base font-extrabold shadow-pop-sm">
                    {i + 1}
                  </span>
                </p>
                <h3 className="mt-4 font-display text-2xl font-extrabold tracking-[-0.03em]">{step.title}</h3>
                <p className="mt-2 leading-relaxed text-muted">{step.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function PickArt() {
  const ids = ["mint", "lilac", "studio-blue"];
  return (
    <>
      {ids.map((id, i) => (
        <StorePoster
          key={id}
          poster={getPoster(id)}
          className="absolute! top-6 w-[28%] ring-2 ring-ink shadow-float"
          style={{ left: `${14 + i * 22}%`, transform: `rotate(${(i - 1) * 10}deg) translateY(${i === 1 ? -6 : 8}px)`, zIndex: i === 2 ? 3 : i }}
        />
      ))}
    </>
  );
}

function DropArt() {
  return (
    <>
      <div className="absolute inset-x-8 top-[38%] bottom-6 rounded-2xl border-2 border-dashed border-ink/40 bg-white/60" />
      <p className="absolute inset-x-0 bottom-10 text-center text-xs font-bold text-muted">Drop PNG, JPG or WEBP</p>
      <div className="absolute top-5 left-1/2 w-[22%] -translate-x-1/2 rotate-[8deg]">
        <div className="aspect-[9/19] rounded-xl border-2 border-ink bg-white p-1.5 shadow-float">
          <div className="h-2 rounded-full bg-blue" />
          <div className="mt-1.5 h-1.5 w-3/4 rounded-full bg-ink/15" />
          <div className="mt-1 h-1.5 w-1/2 rounded-full bg-ink/15" />
          <div className="mt-2 aspect-square rounded-md bg-lilac" />
        </div>
      </div>
      <svg viewBox="0 0 24 24" className="absolute top-[48%] left-[60%] size-7 drop-shadow-[2px_2px_0_#16131F]">
        <path d="M5 3l14 8-6 1.5L10 19z" fill="#fff" stroke="#16131F" strokeWidth="1.8" strokeLinejoin="round" />
      </svg>
    </>
  );
}

function ExportArt() {
  return (
    <>
      <div className="absolute top-1/2 left-1/2 grid h-28 w-24 -translate-x-1/2 -translate-y-1/2 -rotate-6 place-items-center rounded-[22px] border-2 border-ink bg-white shadow-pop-sm">
        <span className="font-display text-lg font-extrabold">ZIP</span>
        <span className="absolute top-3 left-1/2 h-10 w-2 -translate-x-1/2 bg-[repeating-linear-gradient(#16131F_0_4px,transparent_4px_8px)]" />
      </div>
      <span className="absolute top-[22%] left-[60%] grid size-10 rotate-6 place-items-center rounded-xl border-2 border-ink bg-blue shadow-pop-sm">
        <svg viewBox="0 0 16 16" className="size-5">
          <path d="M3 8.5 L6.5 12 L13 4.5" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      {["01.png", "02.png", "03.png"].map((name, i) => (
        <span
          key={name}
          className="absolute rounded-lg bg-white px-2 py-1 text-[11px] font-bold shadow-float"
          style={{ left: i === 1 ? "10%" : i === 0 ? "14%" : "64%", top: i === 0 ? "18%" : i === 1 ? "62%" : "70%" }}
        >
          {name}
        </span>
      ))}
    </>
  );
}
