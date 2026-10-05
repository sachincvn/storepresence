import type { CSSProperties } from "react";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { site } from "@/lib/site";
import { ClayPill, ClaySphere, Starburst, Sticker } from "./Decor";
import { StorePoster } from "./StorePoster";
import { getPoster } from "./posters";

const promises = ["No account needed", "Nothing uploaded", "PNG + ZIP export"];

const fan = [
  { id: "sunny", className: "left-[4%] top-[20%] w-[35%] z-10", r: -9, d: 200 },
  { id: "midnight", className: "right-[4%] top-[22%] w-[35%] z-10", r: 8, d: 350 },
  { id: "studio-blue", className: "left-1/2 top-[9%] w-[41%] -translate-x-1/2 z-20", r: 0, d: 0 },
];

function vars(v: Record<string, string>) {
  return v as CSSProperties;
}

export function Hero() {
  return (
    <section aria-labelledby="hero-title" className="relative px-4 pt-12 pb-20 sm:px-6 sm:pt-16 lg:px-10 lg:pt-20 lg:pb-28">
      {/* Soft clay glow behind the hero */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[720px] bg-[radial-gradient(60%_50%_at_75%_30%,#e6deff_0%,transparent_70%),radial-gradient(40%_40%_at_10%_20%,#dce8ff_0%,transparent_70%)]" />

      <div className="mx-auto grid max-w-[1200px] items-center gap-14 lg:grid-cols-12 lg:gap-10">
        <div className="lg:col-span-6">
          <h1
            id="hero-title"
            className="font-display text-[clamp(2.6rem,5.2vw,4.5rem)] leading-[1.02] font-extrabold tracking-[-0.045em]"
          >
            Turn app <ShotsChip /> screenshots into store&#8209;ready graphics <ExportChip />
          </h1>
          <p className="mt-6 max-w-[30rem] text-lg leading-relaxed text-muted">
            Pick a template, drop in your screenshots and export your entire
            Play Store set in seconds. No design skills, no design tools.
          </p>
          <div className="mt-9 flex flex-wrap gap-4">
            <ButtonLink href={site.editorPath}>Create screenshots</ButtonLink>
            <ButtonLink href="#templates" variant="secondary">
              Explore templates
            </ButtonLink>
          </div>
          <ul className="mt-10 flex flex-wrap gap-2.5">
            {promises.map((item) => (
              <li
                key={item}
                className="clay-hero flex items-center gap-2 rounded-xl bg-white px-3.5 py-2 text-sm font-semibold"
              >
                <Check />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <figure className="relative lg:col-span-6" aria-label="Example store screenshots made from three templates">
          <div className="relative mx-auto aspect-[1/0.95] max-w-[600px]">
            {/* Clay stage */}
            <div className="clay-hero absolute inset-x-0 top-[6%] bottom-0 overflow-hidden rounded-[44px] bg-lilac">
              <div className="halftone absolute -right-10 -bottom-10 h-2/3 w-2/3 text-blue opacity-30 [mask-image:radial-gradient(circle_at_80%_80%,black_15%,transparent_65%)]" />
              <div className="halftone absolute -top-6 -left-6 h-1/3 w-1/3 text-pink opacity-30 [mask-image:radial-gradient(circle_at_20%_20%,black_10%,transparent_65%)]" />
            </div>

            {fan.map(({ id, className, r, d }) => (
              <StorePoster
                key={id}
                poster={getPoster(id)}
                className={`rise-in absolute! shadow-float ring-2 ring-ink ${className}`}
                style={vars({ "--r": `${r}deg`, "--d": `${d}ms` })}
              />
            ))}

            <ClaySphere rich color="#FFD43B" className="float absolute top-[2%] left-[6%] z-30 w-[13%]" />
            <ClaySphere rich color="#FF6FAE" className="float absolute top-[58%] -right-[2%] z-30 w-[8%]" style={vars({ "--d": "1.5s" })} />
            <ClayPill rich color="#3D5AFE" className="float absolute bottom-[5%] left-[44%] z-30 h-[6%] w-[19%] -rotate-12" style={vars({ "--d": "3s" })} />

            <Starburst className="absolute top-[0%] right-[3%] z-30 w-[22%] rotate-12 text-[clamp(0.7rem,1.4vw,0.95rem)]">
              No
              <br />
              sign-up
            </Starburst>

            <Sticker className="absolute bottom-[5%] left-[4%] z-30 -rotate-3 bg-white text-xs sm:text-sm">
              1080 × 1920 px
            </Sticker>
          </div>
        </figure>
      </div>
    </section>
  );
}

/** Inline headline chip: a tiny fan of finished screenshots. */
function ShotsChip() {
  return (
    <span
      aria-hidden="true"
      className="clay-hero relative mx-[0.05em] inline-block h-[0.82em] w-[1.55em] -rotate-3 overflow-hidden rounded-[0.28em] bg-yellow align-[-0.1em]"
    >
      {(["lilac", "studio-blue", "mint"] as const).map((id, i) => (
        <StorePoster
          key={id}
          poster={getPoster(id)}
          className="absolute! top-[16%] w-[0.4em] rounded-[0.06em]! ring-1 ring-ink"
          style={{ left: `${12 + i * 26}%`, transform: `rotate(${(i - 1) * 9}deg)` }}
        />
      ))}
    </span>
  );
}

/** Inline headline chip: neo-brutalist export button. */
function ExportChip() {
  return (
    <span
      aria-hidden="true"
      className="relative ml-[0.05em] inline-grid size-[0.78em] rotate-6 place-items-center rounded-[0.24em] border-[0.045em] border-ink bg-blue align-[-0.08em] shadow-[0.06em_0.06em_0_#16131F]"
    >
      <svg viewBox="0 0 24 24" className="size-[0.48em]">
        <path d="M12 4v11m0 0-4.5-4.5M12 15l4.5-4.5M5 19.5h14" fill="none" stroke="#fff" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}

function Check() {
  return (
    <span aria-hidden="true" className="grid size-5 place-items-center rounded-md bg-blue">
      <svg viewBox="0 0 16 16" className="size-3">
        <path d="M3 8.5 L6.5 12 L13 4.5" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}
