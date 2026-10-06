import type { CSSProperties } from "react";
import { site } from "@/lib/site";
import { CtaLink, PlayLink } from "./Cta";
import { container, Icon, type IconName, TornEdge } from "./Section";

const trust: { icon: IconName; label: string }[] = [
  { icon: "shield", label: "Private by design" },
  { icon: "laptop", label: "Runs in your browser" },
  { icon: "phone", label: "Exact store sizes" },
  { icon: "zip", label: "PNG + ZIP" },
];

export function FinalCta() {
  return (
    <section aria-labelledby="cta-title" className="on-brand relative isolate overflow-hidden bg-[linear-gradient(180deg,#5530d6_0%,#7c5cee_70%,#9a80f5_100%)] pt-28 pb-32 text-white lg:pt-36 lg:pb-40">
      <TornEdge position="top" seed={19} />
      <div aria-hidden="true" className="absolute -bottom-40 -left-20 -z-10 h-[420px] w-[820px] rounded-full bg-white/15 blur-3xl" />
      <div aria-hidden="true" className="absolute -top-20 right-0 -z-10 h-[360px] w-[620px] rounded-full bg-white/10 blur-3xl" />
      <div aria-hidden="true" className="grain absolute inset-0 -z-10 opacity-[0.1]" />

      <div className={`${container} grid items-center gap-12 lg:grid-cols-12`}>
        <div className="reveal lg:col-span-7">
          <p className="text-[13px] font-medium tracking-[0.12em] text-white/70 uppercase">Your next release</p>
          <h2 id="cta-title" className="mt-4 font-display text-[clamp(2.25rem,4.4vw,3.5rem)] leading-[1.04] font-medium tracking-[-0.035em]">
            Store screenshots,
            <br />
            <span className="text-brand-100/80">without the design work.</span>
          </h2>
          <p className="mt-5 max-w-[30rem] text-[17px] leading-[1.6] text-white/80">
            Stop opening a design tool for every release. Pick, drop, done.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-4">
            <CtaLink href={site.editorPath} variant="light">
              Create screenshots
            </CtaLink>
            <PlayLink href="#templates">Browse templates</PlayLink>
          </div>
          <ul className="mt-8 flex flex-wrap gap-2">
            {trust.map((t) => (
              <li key={t.label} className="reveal flex items-center gap-1.5 rounded-full border border-white/25 bg-white/10 px-3 py-1.5 text-[13px] font-medium">
                <Icon name={t.icon} className="size-3.5" />
                {t.label}
              </li>
            ))}
          </ul>
        </div>

        <div aria-hidden="true" className="reveal lg:col-span-5">
          <div className="rounded-[26px] border border-white/70 bg-white p-2 text-ink shadow-mock">
            <div className="anim-zone flex flex-col items-center gap-2 rounded-[20px] border-[1.5px] border-dashed border-brand-200 bg-paper px-6 py-12">
              <div className="mb-2 flex -space-x-3">
                {["#6D3FF0", "#FF8A65", "#22A55B"].map((c, i) => (
                  <span key={c} className="anim-float block h-16 w-10 rounded-lg border-2 border-white shadow-card" style={{ background: c, rotate: `${(i - 1) * 8}deg`, "--d": `${i * -1.4}s` } as CSSProperties} />
                ))}
              </div>
              <p className="font-medium">Drop screenshots here</p>
              <p className="text-xs text-ink/50">PNG, JPG or WEBP · nothing leaves your device</p>
            </div>
            <p className="flex items-center gap-2 px-3 pt-3 pb-1.5 text-xs text-ink/60">
              <Icon name="zip" className="size-4 text-brand-500" />
              Exports as my-app-screenshots.zip
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
