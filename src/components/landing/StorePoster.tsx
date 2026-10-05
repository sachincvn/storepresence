import type { CSSProperties } from "react";
import { ClaySphere } from "./Decor";
import type { PosterApp, PosterDecoration, PosterStyle } from "./posters";

/**
 * Decorative CSS mock of a finished store screenshot. Sized entirely in
 * container units so it scales cleanly from thumbnail to hero.
 */
export function StorePoster({
  poster,
  className = "",
  style,
}: {
  poster: PosterStyle;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div
      aria-hidden="true"
      className={`@container relative aspect-[9/16] overflow-hidden rounded-[16px] ${className}`}
      style={{ background: poster.background, color: poster.foreground, ...style }}
    >
      <Decoration kind={poster.decoration} color={poster.decorColor} />

      <p className="relative px-[9cqw] pt-[11cqw] font-display text-[length:9.4cqw] leading-[1] font-extrabold tracking-[-0.03em] text-balance">
        {poster.headline}
      </p>

      <div
        className="absolute top-[38%] left-1/2 aspect-[9/19] w-[66%] overflow-hidden rounded-[8cqw] border-[length:1.8cqw] border-[#16131F] bg-white text-ink shadow-[0_5cqw_9cqw_-2cqw_rgb(0_0_0/0.4)]"
        style={{ transform: `translateX(-50%) rotate(${poster.phoneTilt ?? 0}deg)` }}
      >
        <div className="mx-auto mt-[2.2cqw] h-[2.4cqw] w-[16cqw] rounded-full bg-[#16131F]" />
        <AppScreen app={poster.app} accent={poster.accent} />
      </div>
    </div>
  );
}

function Decoration({ kind, color }: { kind: PosterDecoration; color: string }) {
  if (kind === "sphere") {
    return (
      <ClaySphere color={color} className="absolute top-[50%] -right-[10cqw] w-[38cqw]" />
    );
  }
  if (kind === "halftone") {
    return (
      <div
        className="halftone absolute -right-[6cqw] -bottom-[6cqw] h-[60%] w-[70%] opacity-25 [mask-image:radial-gradient(circle_at_70%_70%,black_20%,transparent_70%)]"
        style={{ color }}
      />
    );
  }
  return null;
}

function AppScreen({ app, accent }: { app: PosterApp; accent: string }) {
  switch (app) {
    case "finance":
      return <FinanceScreen accent={accent} />;
    case "tasks":
      return <TasksScreen accent={accent} />;
    case "fitness":
      return <FitnessScreen accent={accent} />;
    case "chat":
      return <ChatScreen accent={accent} />;
  }
}

const line = "h-[1.8cqw] rounded-full bg-[#111111]/10";
const tile = "#F3F4F6";

function FinanceScreen({ accent }: { accent: string }) {
  const bars = [40, 65, 50, 85, 60, 95, 70];
  return (
    <div className="flex flex-col gap-[2.6cqw] p-[4.5cqw]">
      <p className="text-[length:2.6cqw] font-medium opacity-50">Total balance</p>
      <p className="text-[length:6.4cqw] leading-none font-semibold tracking-tight">$12,480</p>
      <div className="flex h-[17cqw] items-end gap-[1.4cqw]">
        {bars.map((h, i) => (
          <div
            key={i}
            className="flex-1 rounded-[0.8cqw]"
            style={{ height: `${h}%`, background: i === 5 ? accent : tile }}
          />
        ))}
      </div>
      {[70, 55, 62].map((w, i) => (
        <div key={i} className="flex items-center gap-[2cqw]">
          <div className="aspect-square w-[6cqw] rounded-full" style={{ background: tile }} />
          <div className={line} style={{ width: `${w}%` }} />
        </div>
      ))}
    </div>
  );
}

function TasksScreen({ accent }: { accent: string }) {
  const rows = [
    { w: 70, done: true },
    { w: 55, done: true },
    { w: 78, done: false },
    { w: 48, done: false },
    { w: 64, done: false },
  ];
  return (
    <div className="flex flex-col gap-[2.8cqw] p-[4.5cqw]">
      <p className="text-[length:5cqw] leading-none font-semibold tracking-tight">Today</p>
      <div className="h-[6cqw] rounded-[1.5cqw]" style={{ background: accent, opacity: 0.9 }} />
      {rows.map((row, i) => (
        <div key={i} className="flex items-center gap-[2cqw]">
          <div
            className="aspect-square w-[4.6cqw] rounded-full border-[length:0.5cqw]"
            style={{
              background: row.done ? accent : "transparent",
              borderColor: row.done ? accent : "#D1D5DB",
            }}
          />
          <div className={line} style={{ width: `${row.w}%`, opacity: row.done ? 0.5 : 1 }} />
        </div>
      ))}
    </div>
  );
}

function FitnessScreen({ accent }: { accent: string }) {
  return (
    <div className="flex flex-col items-center gap-[3cqw] p-[4.5cqw]">
      <svg viewBox="0 0 100 100" className="mt-[1cqw] w-[32cqw] -rotate-90">
        <circle cx="50" cy="50" r="40" fill="none" stroke={tile} strokeWidth="12" />
        <circle
          cx="50"
          cy="50"
          r="40"
          fill="none"
          stroke={accent}
          strokeWidth="12"
          strokeDasharray="251"
          strokeDashoffset="64"
          strokeLinecap="round"
        />
      </svg>
      <div className="grid w-full grid-cols-2 gap-[2cqw]">
        {["8.2k", "46m", "520", "4/5"].map((v) => (
          <div key={v} className="rounded-[1.8cqw] p-[2.2cqw]" style={{ background: tile }}>
            <p className="text-[length:4cqw] leading-none font-semibold">{v}</p>
            <div className="mt-[1.4cqw] h-[1.2cqw] w-2/3 rounded-full bg-[#111111]/10" />
          </div>
        ))}
      </div>
    </div>
  );
}

function ChatScreen({ accent }: { accent: string }) {
  const bubbles = [
    { mine: false, w: 62 },
    { mine: true, w: 50 },
    { mine: false, w: 74 },
    { mine: true, w: 40 },
    { mine: false, w: 56 },
  ];
  return (
    <div className="flex flex-col gap-[2.4cqw] p-[4.5cqw]">
      <div className="flex items-center gap-[2cqw]">
        <div className="aspect-square w-[6.5cqw] rounded-full" style={{ background: tile }} />
        <div className={line} style={{ width: "40%" }} />
      </div>
      {bubbles.map((b, i) => (
        <div
          key={i}
          className={`h-[6.5cqw] rounded-[2.4cqw] ${b.mine ? "self-end" : "self-start"}`}
          style={{ width: `${b.w}%`, background: b.mine ? accent : tile }}
        />
      ))}
    </div>
  );
}
