import type { ReactNode } from "react";
import { Sticker } from "./Decor";
import { StorePoster } from "./StorePoster";
import { getPoster, posters, type PosterStyle } from "./posters";

type Tone = "white" | "ink" | "sky" | "pop" | "mint";

const tones: Record<Tone, { card: string; body: string }> = {
  white: { card: "clay bg-white", body: "text-muted" },
  ink: { card: "clay-dark bg-ink text-white", body: "text-white/65" },
  sky: { card: "clay bg-sky", body: "text-muted" },
  pop: { card: "border-2 border-ink bg-white shadow-pop", body: "text-muted" },
  mint: { card: "clay bg-mint", body: "text-muted" },
};

export function Features() {
  return (
    <section id="features" aria-labelledby="features-title" className="scroll-mt-24 px-4 py-20 sm:px-6 lg:px-10 lg:py-28">
      <div className="mx-auto max-w-[1200px]">
        <div className="grid gap-6 lg:grid-cols-12 lg:items-end">
          <h2
            id="features-title"
            className="font-display text-[clamp(2.1rem,3.8vw,3.4rem)] leading-[1.02] font-extrabold tracking-[-0.04em] text-balance lg:col-span-7"
          >
            Built for the tedious parts.
          </h2>
          <p className="max-w-[28rem] text-lg leading-relaxed text-muted lg:col-span-5 lg:justify-self-end">
            Fitting, sizing and exporting are handled for you. A new release only
            means new screenshots.
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-12">
          <FeatureCard
            tone="white"
            className="md:col-span-2 lg:col-span-7"
            layout="split"
            title="Any size in. Perfect fit out."
            body="Tall, standard or landscape. Every screenshot is scaled into its slot with proportions intact, never stretched."
          >
            <FitDemo />
          </FeatureCard>

          <FeatureCard
            tone="ink"
            className="md:col-span-2 lg:col-span-5"
            title="Exact pixels, every time"
            body="Exports match the template to the pixel, whatever your zoom level or screen size."
          >
            <PixelDemo />
          </FeatureCard>

          <FeatureCard
            tone="sky"
            className="lg:col-span-4"
            title="Stays on your device"
            body="Rendering happens in your browser. Screenshots are never uploaded or stored."
          >
            <PrivacyDemo />
          </FeatureCard>

          <FeatureCard
            tone="pop"
            className="lg:col-span-4"
            title="Whole set, one ZIP"
            body="Every screenshot exported at once, numbered in order and ready for the console."
          >
            <ZipDemo />
          </FeatureCard>

          <FeatureCard
            tone="mint"
            className="md:col-span-2 lg:col-span-4"
            title="Your words, your colors"
            body="Change the headline and theme color. The template handles the layout."
          >
            <CustomizeDemo />
          </FeatureCard>
        </div>
      </div>
    </section>
  );
}

function FeatureCard({
  tone,
  title,
  body,
  className,
  layout = "stack",
  children,
}: {
  tone: Tone;
  title: string;
  body: string;
  className: string;
  /** "split" puts text beside the visual on wider screens. */
  layout?: "stack" | "split";
  children: ReactNode;
}) {
  const split = layout === "split";
  return (
    <article
      className={`relative overflow-hidden rounded-[32px] p-6 sm:p-8 ${
        split ? "grid gap-6 sm:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] sm:items-center sm:gap-8" : "flex flex-col"
      } ${tones[tone].card} ${className}`}
    >
      <div>
        <h3 className="font-display text-2xl font-extrabold tracking-[-0.03em]">{title}</h3>
        <p className={`mt-2 max-w-[26rem] leading-relaxed ${tones[tone].body}`}>{body}</p>
      </div>
      <div aria-hidden="true" className={`flex justify-center ${split ? "" : "mt-6 flex-1 items-end"}`}>
        {children}
      </div>
    </article>
  );
}

/* ---------- Visual demos (decorative) ---------- */

function FakeShot({ className = "" }: { className?: string }) {
  return (
    <div className={`flex flex-col overflow-hidden rounded-[4px] bg-white ring-[1.5px] ring-ink ${className}`}>
      <div className="h-[16%] min-h-2 bg-blue" />
      <div className="flex flex-1 flex-col gap-[8%] p-[10%]">
        <div className="aspect-square w-[28%] rounded-full bg-pink ring-[1.5px] ring-ink" />
        <div className="h-1 w-full rounded-full bg-ink/15" />
        <div className="h-1 w-3/4 rounded-full bg-ink/15" />
        <div className="h-1 w-1/2 rounded-full bg-ink/15" />
      </div>
    </div>
  );
}

const sources = [
  // `fit` sizes the shot inside a 9:16 slot the way contain would.
  { label: "9 : 19.5", src: "h-full aspect-[9/19.5]", fit: "h-full aspect-[9/19.5]", slot: "bg-blue" },
  { label: "3 : 4", src: "h-[78%] aspect-[3/4]", fit: "w-full aspect-[3/4]", slot: "bg-peach" },
  { label: "16 : 10", src: "w-full aspect-[16/10]", fit: "w-full aspect-[16/10]", slot: "bg-lilac" },
];

function FitDemo() {
  return (
    <div className="grid w-full max-w-[360px] grid-cols-3 gap-3 sm:gap-4">
      {sources.map((s) => (
        <div key={s.label} className="flex flex-col items-center">
          <div className="flex h-16 w-full max-w-[84px] items-end justify-center">
            <FakeShot className={s.src} />
          </div>
          <Sticker className="mt-2.5 bg-white px-1.5! py-0.5! text-[10px]! shadow-none! sm:text-[11px]!">{s.label}</Sticker>
          <svg viewBox="0 0 24 40" className="my-2 h-6 w-4 text-ink">
            <path d="M12 2v32m0 0-7-7m7 7 7-7" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <div className={`relative flex aspect-[9/16] w-full max-w-[104px] flex-col rounded-xl p-[9%] ring-2 ring-ink ${s.slot}`}>
            <div className="h-1.5 w-4/5 rounded-full bg-ink/80" />
            <div className="mt-1 h-1.5 w-3/5 rounded-full bg-ink/80" />
            <div className="mt-[14%] flex min-h-0 flex-1 items-center justify-center">
              <FakeShot className={`${s.fit} max-w-full shadow-pop-sm`} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function PixelDemo() {
  return (
    <div className="relative grid w-full place-items-center pt-8">
      <div className="relative h-[220px] aspect-[9/16]">
        {/* width rule */}
        <div className="absolute -top-7 right-0 left-0 flex items-center gap-2 text-sky">
          <span className="h-3 w-0.5 bg-sky" />
          <span className="h-0.5 flex-1 bg-sky" />
          <span className="font-display text-sm font-extrabold tabular-nums">1080</span>
          <span className="h-0.5 flex-1 bg-sky" />
          <span className="h-3 w-0.5 bg-sky" />
        </div>
        {/* height rule */}
        <div className="absolute top-0 -right-9 bottom-0 flex flex-col items-center gap-2 text-sky">
          <span className="h-0.5 w-3 bg-sky" />
          <span className="w-0.5 flex-1 bg-sky" />
          <span className="font-display text-sm font-extrabold tabular-nums [writing-mode:vertical-rl]">1920</span>
          <span className="w-0.5 flex-1 bg-sky" />
          <span className="h-0.5 w-3 bg-sky" />
        </div>
        <StorePoster poster={getPoster("lilac")} className="ring-2 ring-white/90" />
      </div>
      <div className="halftone absolute -bottom-10 -left-10 size-48 text-white opacity-20 [mask-image:radial-gradient(circle_at_30%_70%,black_15%,transparent_65%)]" />
    </div>
  );
}

function PrivacyDemo() {
  return (
    <div className="relative flex h-36 w-full max-w-[300px] items-center justify-center">
      {/* clay padlock */}
      <div className="relative flex flex-col items-center">
        <div className="h-11 w-14 rounded-t-full border-[9px] border-b-0 border-[#9aa6cf]" />
        <div className="clay -mt-1 grid h-[72px] w-24 place-items-center rounded-[20px] bg-white">
          <span className="relative block h-9 w-4">
            <span className="absolute top-0 left-1/2 size-4 -translate-x-1/2 rounded-full bg-ink" />
            <span className="absolute top-3 left-1/2 h-6 w-2 -translate-x-1/2 rounded-full bg-ink" />
          </span>
        </div>
      </div>
      <Sticker className="absolute top-2 left-0 -rotate-6 bg-white text-xs!">0 uploads</Sticker>
      <Sticker className="absolute right-0 bottom-2 rotate-6 bg-white text-xs!">0 servers</Sticker>
    </div>
  );
}

function ZipDemo() {
  return (
    <div className="flex w-full flex-col items-center">
      <div className="relative h-32 w-full max-w-[240px]">
        {posters.map((poster, i) => (
          <StorePoster
            key={poster.id}
            poster={poster}
            className="absolute! bottom-0 w-[30%] ring-2 ring-ink shadow-pop-sm"
            style={{
              left: `${i * 17.5}%`,
              transform: `rotate(${(i - 2) * 7}deg) translateY(${Math.abs(i - 2) * 8}px)`,
              zIndex: 5 - Math.abs(i - 2),
            }}
          />
        ))}
      </div>
      <span className="relative z-10 -mt-3 inline-flex items-center gap-2 rounded-xl border-2 border-ink bg-ink px-3.5 py-2 text-sm font-bold text-white shadow-[3px_3px_0_#3D5AFE]">
        <svg viewBox="0 0 16 16" className="size-4">
          <path d="M8 2v8m0 0-3-3m3 3 3-3M3 13h10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        my-app-screenshots.zip
      </span>
    </div>
  );
}

const themeVariants: { color: string; fg: string }[] = [
  { color: "#3D5AFE", fg: "#FFFFFF" },
  { color: "#FF6FAE", fg: "#16131F" },
  { color: "#9BE7C4", fg: "#16131F" },
];

function CustomizeDemo() {
  const base = getPoster("sunny");
  const variants: PosterStyle[] = themeVariants.map((v, i) => ({
    ...base,
    id: `${base.id}-${i}`,
    background: v.color,
    foreground: v.fg,
    accent: v.fg === "#FFFFFF" ? v.color : "#16131F",
    decoration: "none",
  }));

  return (
    <div className="flex w-full flex-col items-center gap-4">
      <div className="relative h-32 w-full max-w-[200px]">
        {variants.map((poster, i) => (
          <StorePoster
            key={poster.id}
            poster={poster}
            className="absolute! bottom-0 w-[38%] ring-2 ring-ink"
            style={{ left: `${i * 31}%`, transform: `rotate(${(i - 1) * 6}deg)`, zIndex: i === 1 ? 3 : 1 }}
          />
        ))}
      </div>
      <div className="flex gap-2.5">
        {["#3D5AFE", "#FF6FAE", "#9BE7C4", "#16131F", "#FFFFFF"].map((c, i) => (
          <span
            key={c}
            className={`size-8 rounded-full ${i === 0 ? "ring-2 ring-ink ring-offset-2 ring-offset-mint" : "ring-1 ring-ink/15"}`}
            style={{ background: c }}
          />
        ))}
      </div>
    </div>
  );
}
