import type { ReactNode } from "react";
import { site } from "@/lib/site";
import { CtaLink } from "./Cta";
import { LogoMark } from "./Logo";
import { CheckIcon, container, CrossIcon, Icon, SectionHeader, TornEdge } from "./Section";

const rows = [
  { label: "Starting point", old: "Blank design canvas", now: "Finished template" },
  { label: "Fitting screenshots", old: "Crop and resize by hand", now: "Automatic, never stretched" },
  { label: "Store sizes", old: "Rebuild for each size", now: "All sizes from one design" },
  { label: "Exporting", old: "One file at a time", now: "One ZIP, in order" },
  { label: "Privacy", old: "Uploaded to a website", now: "Never leaves your browser" },
  { label: "Getting started", old: "Sign up first", now: "No account" },
];

export function Difference() {
  return (
    <section aria-labelledby="difference-title" className="on-brand relative isolate overflow-hidden bg-[linear-gradient(180deg,#6d3ff0_0%,#7c5cee_100%)] py-28 lg:py-36">
      <TornEdge position="top" seed={7} />
      <div aria-hidden="true" className="absolute -top-20 left-1/4 -z-10 size-[620px] rounded-full bg-white/10 blur-3xl" />
      <div aria-hidden="true" className="grain absolute inset-0 -z-10 opacity-[0.1]" />

      <div className={container}>
        <SectionHeader
          id="difference-title"
          tone="brand"
          eyebrow="The difference"
          icon={<Icon name="scale" />}
          title="Why open a design tool"
          accent="for a few screenshots?"
          lede="Finding a template, resizing every screenshot, exporting each size and renaming files. StorePresence replaces the whole routine."
        >
          <CtaLink href={site.editorPath} variant="light" size="md" className="mt-6">
            Create screenshots
          </CtaLink>
        </SectionHeader>

        <div className="mt-12 grid grid-cols-1 gap-4 text-ink md:grid-cols-2">
          <Column
            title="The old way"
            subtitle="Design tools, manual resizing"
            icon={
              <span className="grid size-10 place-items-center rounded-xl border border-hairline bg-white text-ink/70">
                <Icon name="globe" className="size-5" />
              </span>
            }
            titleClass="text-[#d4343a]"
            className="border-white/60 bg-white"
          >
            {rows.map((row) => (
              <Row key={row.label} label={row.label}>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[#f6c4c6] bg-[#fdf1f1] px-2.5 py-1 text-xs leading-none text-[#c42b31]">
                  <CrossIcon className="size-3" />
                  {row.old}
                </span>
              </Row>
            ))}
          </Column>
          <Column
            title={`The ${site.name} way`}
            subtitle="Template in, store set out"
            icon={
              <span className="grid size-10 place-items-center rounded-xl border border-hairline bg-white">
                <LogoMark className="size-6" />
              </span>
            }
            titleClass="text-brand-600"
            className="border-brand-200 bg-white shadow-[0_0_0_4px_rgb(255_255_255/0.35),0_30px_60px_-30px_rgb(30_10_90/0.5)]"
          >
            {rows.map((row) => (
              <Row key={row.label} label={row.label}>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-200 bg-brand-50 px-2.5 py-1 text-xs leading-none text-brand-700">
                  <CheckIcon className="size-3" />
                  {row.now}
                </span>
              </Row>
            ))}
          </Column>
        </div>

        <p className="reveal mt-16 text-center font-display text-[clamp(1.5rem,2.6vw,2rem)] font-medium tracking-[-0.03em] text-white">
          Less fiddling. <span className="text-brand-100/80">More shipping.</span>
        </p>
      </div>

      <TornEdge position="bottom" seed={11} />
    </section>
  );
}

function Column({
  title,
  subtitle,
  icon,
  titleClass,
  className,
  children,
}: {
  title: string;
  subtitle: string;
  icon: ReactNode;
  titleClass: string;
  className: string;
  children: ReactNode;
}) {
  return (
    <div className={`reveal overflow-hidden rounded-[26px] border p-2 ${className}`}>
      <div className="flex items-center gap-3 rounded-[20px] bg-paper px-4 py-3.5">
        {icon}
        <div>
          <h3 className={`font-display text-base font-medium ${titleClass}`}>{title}</h3>
          <p className="text-xs text-muted">{subtitle}</p>
        </div>
      </div>
      <ul className="divide-y divide-hairline px-4 pb-2">{children}</ul>
    </div>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <li className="flex min-h-[52px] items-center justify-between gap-3 py-2.5 text-sm">
      <span>{label}</span>
      {children}
    </li>
  );
}
