import type { CSSProperties } from "react";
import { site } from "@/lib/site";
import { templates } from "@/templates/registry";
import { CtaLink, PlayLink } from "./Cta";
import { HeroMock } from "./HeroMock";
import { container, Icon, type IconName, TornEdge } from "./Section";

const exportsFor: { icon: IconName; label: string }[] = [
  { icon: "phone", label: "Google Play" },
  { icon: "phone", label: "iPhone" },
  { icon: "tablet", label: "iPad" },
  { icon: "banner", label: "Feature graphic" },
];

function delay(ms: number) {
  return { "--d": `${ms}ms` } as CSSProperties;
}

export function Hero() {
  return (
    <section aria-labelledby="hero-title" className="on-brand relative isolate overflow-hidden pt-32 pb-20 text-white sm:pt-40 sm:pb-28">
      <HeroSky />

      <div className={`${container} text-center`}>
        <p
          className="fade-up inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3.5 py-1.5 text-[13px] font-medium backdrop-blur-md"
          style={delay(0)}
        >
          <Icon name="sparkle" className="size-3.5 text-brand-100" />
          {templates.length} store-ready templates<span className="hidden sm:inline"> · Google Play &amp; App Store</span>
        </p>

        <h1
          id="hero-title"
          className="fade-up mx-auto mt-6 font-display text-[clamp(2.5rem,5.2vw,3.85rem)] leading-[1.04] font-medium tracking-[-0.035em] text-balance"
          style={delay(60)}
        >
          Your app screenshots.
          <br />
          Store-ready in a minute.
        </h1>

        <p className="fade-up mx-auto mt-5 max-w-[38rem] text-lg leading-[1.6] text-white/85" style={delay(120)}>
          Stop wrestling with design tools to make Play Store and App Store graphics.
          Pick a template, drop in your screenshots and export the whole set.
        </p>

        <div className="fade-up mt-9 flex flex-wrap items-center justify-center gap-x-8 gap-y-4" style={delay(180)}>
          <CtaLink href={site.editorPath} variant="light">
            Create screenshots
          </CtaLink>
          <PlayLink href="#how">See how it works</PlayLink>
        </div>

        <p className="fade-up mt-6 text-[13px] font-medium text-white/75" style={delay(220)}>
          100% in your browser · No account · Nothing uploaded
        </p>

        <ul className="fade-up mt-5 flex flex-wrap items-center justify-center gap-x-1 gap-y-2 text-[13px] font-medium text-white/85" style={delay(260)}>
          <li className="mr-2 text-[11px] tracking-[0.12em] text-white/60 uppercase">Exports for</li>
          {exportsFor.map((item, i) => (
            <li key={item.label} className="flex items-center gap-1">
              {i > 0 && <span aria-hidden="true" className="mr-1 text-white/35">·</span>}
              <span className="grid size-6 place-items-center rounded-full bg-white/90 text-brand-600">
                <Icon name={item.icon} className="size-3.5" />
              </span>
              {item.label}
            </li>
          ))}
        </ul>
      </div>

      <div className={`${container} fade-up mt-14 sm:mt-16`} style={delay(320)}>
        <HeroMock />
      </div>

      <TornEdge position="bottom" seed={3} />
    </section>
  );
}

/** Violet gradient sky with soft, blurred clouds and film grain. */
function HeroSky() {
  return (
    <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,#5530d6_0%,#7c5cee_55%,#e2d9fc_100%)]">
      <Cloud className="anim-drift -top-10 -left-24 hidden w-[520px] opacity-60 sm:block" />
      <Cloud className="anim-drift -right-32 top-6 hidden w-[560px] opacity-50 [--d:-7s] sm:block" />
      <Cloud className="anim-drift top-[46%] -left-40 w-[640px] opacity-45 [--d:-12s] max-sm:top-[62%]" />
      <Cloud className="anim-drift top-[58%] -right-24 w-[600px] opacity-55 [--d:-4s]" />
      <Cloud className="-bottom-24 left-[30%] w-[760px] opacity-70" />
      <div className="grain absolute inset-0 opacity-[0.1]" />
    </div>
  );
}

/** A cloud: a few overlapping white blobs, heavily blurred. */
function Cloud({ className }: { className: string }) {
  return (
    <div className={`absolute aspect-[2.4/1] blur-2xl ${className}`}>
      <span className="absolute bottom-0 left-0 h-[55%] w-full rounded-full bg-white/80" />
      <span className="absolute bottom-[25%] left-[18%] h-[70%] w-[38%] rounded-full bg-white/80" />
      <span className="absolute bottom-[20%] left-[45%] h-[90%] w-[34%] rounded-full bg-white/80" />
    </div>
  );
}
