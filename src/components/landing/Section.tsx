import type { ReactNode } from "react";

export const container = "mx-auto w-full max-w-[1128px] px-4 sm:px-6";

export function Eyebrow({ children, icon, className = "" }: { children: ReactNode; icon?: ReactNode; className?: string }) {
  return (
    <p className={`inline-flex items-center gap-1.5 text-[13px] font-medium text-ink/60 [&_svg]:size-3.5 ${className}`}>
      {children}
      {icon}
    </p>
  );
}

/**
 * Eyebrow, two-line headline (line 2 in brand violet) and a one-sentence lede.
 * `split` (default) puts the lede at the right, on the headline's baseline.
 */
export function SectionHeader({
  id,
  eyebrow,
  icon,
  title,
  accent,
  lede,
  align = "split",
  tone = "light",
  children,
}: {
  id: string;
  eyebrow: string;
  icon?: ReactNode;
  title: ReactNode;
  accent: ReactNode;
  lede?: ReactNode;
  align?: "split" | "center";
  tone?: "light" | "brand";
  /** Extra content under the lede (e.g. a CTA). */
  children?: ReactNode;
}) {
  const onBrand = tone === "brand";
  const heading = (
    <h2
      id={id}
      className={`mt-4 font-display text-[clamp(2.25rem,4.4vw,3.5rem)] leading-[1.04] font-medium tracking-[-0.035em] text-balance ${onBrand ? "text-white" : ""}`}
    >
      {title}
      <br />
      <span className={onBrand ? "text-brand-100/80" : "text-brand-500"}>{accent}</span>
    </h2>
  );
  const ledeEl = lede && <p className={`text-[17px] leading-[1.6] ${onBrand ? "text-white/80" : "text-muted"}`}>{lede}</p>;
  const eyebrowEl = (
    <Eyebrow icon={icon} className={onBrand ? "text-white/75" : ""}>
      {eyebrow}
    </Eyebrow>
  );

  if (align === "center") {
    return (
      <div className="reveal mx-auto max-w-[44rem] text-center">
        {eyebrowEl}
        {heading}
        {ledeEl && <div className="mx-auto mt-5 max-w-[34rem]">{ledeEl}</div>}
        {children}
      </div>
    );
  }

  return (
    <div className="reveal grid gap-6 lg:grid-cols-12 lg:items-end lg:gap-10">
      <div className="lg:col-span-7">
        {eyebrowEl}
        {heading}
      </div>
      {(ledeEl || children) && (
        <div className="max-w-[26rem] lg:col-span-5 lg:justify-self-end lg:pb-2">
          {ledeEl}
          {children}
        </div>
      )}
    </div>
  );
}

/**
 * Feature card: white, hairline border, a recessed visual panel on top and
 * copy below. Border and a soft violet glow light up on hover.
 */
export function Card({
  visual,
  title,
  body,
  tags,
  number,
  className = "",
  visualClassName = "h-64",
}: {
  visual: ReactNode;
  title: string;
  body: string;
  tags?: string[];
  number?: string;
  className?: string;
  visualClassName?: string;
}) {
  return (
    <article
      className={`group reveal relative isolate flex flex-col overflow-hidden rounded-[26px] border border-hairline bg-white shadow-card transition-[border-color,box-shadow,translate] duration-300 hover:-translate-y-1 hover:border-brand-200 hover:shadow-card-hover ${className}`}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(380px_at_50%_0%,rgb(109_63_240/0.09),transparent_65%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
      />
      <div
        aria-hidden="true"
        className={`relative m-2 overflow-hidden rounded-[20px] border border-hairline/70 bg-paper shadow-inset ${visualClassName}`}
      >
        {visual}
      </div>
      <div className="flex flex-1 flex-col px-5 pt-3 pb-6 sm:px-6">
        {number && <p className="mb-1.5 font-display text-[13px] font-medium text-brand-500 tabular-nums">{number}</p>}
        <h3 className="font-display text-xl leading-7 font-medium tracking-[-0.02em]">{title}</h3>
        <p className="mt-1.5 max-w-[26rem] text-[15px] leading-6 text-muted">{body}</p>
        {tags && (
          <ul className="mt-auto flex flex-wrap gap-1.5 pt-5">
            {tags.map((tag) => (
              <li key={tag}>
                <Tag>{tag}</Tag>
              </li>
            ))}
          </ul>
        )}
      </div>
    </article>
  );
}

export function Tag({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border border-hairline bg-paper px-2.5 py-1 text-xs leading-none font-medium whitespace-nowrap text-ink/70 [&_svg]:size-3 ${className}`}
    >
      {children}
    </span>
  );
}

export function CheckIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" className={`size-4 shrink-0 ${className}`}>
      <path d="M3.5 8.5 6.5 11.5 12.5 5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function CrossIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" className={`size-4 shrink-0 ${className}`}>
      <path d="m4.5 4.5 7 7m0-7-7 7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

/** Small line icon set used by eyebrows, marquee and chips. */
export function Icon({ name, className = "" }: { name: IconName; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={`size-4 shrink-0 ${className}`} fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      {icons[name]}
    </svg>
  );
}

const icons = {
  sparkle: <path d="M12 3c.5 4.5 2.5 6.5 7 7-4.5.5-6.5 2.5-7 7-.5-4.5-2.5-6.5-7-7 4.5-.5 6.5-2.5 7-7ZM19 15c.2 1.6.9 2.3 2.5 2.5-1.6.2-2.3.9-2.5 2.5-.2-1.6-.9-2.3-2.5-2.5 1.6-.2 2.3-.9 2.5-2.5Z" />,
  phone: (
    <>
      <rect x="6.5" y="2.5" width="11" height="19" rx="2.5" />
      <path d="M10.5 18.5h3" />
    </>
  ),
  tablet: (
    <>
      <rect x="4" y="2.5" width="16" height="19" rx="2.5" />
      <path d="M10.5 18.5h3" />
    </>
  ),
  banner: (
    <>
      <rect x="2.5" y="6" width="19" height="12" rx="2" />
      <path d="m6 15 3.5-3.5 2.5 2.5 2-2 4 3" />
    </>
  ),
  type: <path d="M5 6.5V5h14v1.5M12 5v14m-3 0h6" />,
  palette: (
    <>
      <path d="M12 3a9 9 0 1 0 0 18c1.1 0 1.5-.8 1.5-1.5 0-1.3-1.2-1.6-1.2-2.8 0-.9.7-1.7 1.7-1.7H16a5 5 0 0 0 5-5C21 6.3 17 3 12 3Z" />
      <circle cx="7.5" cy="11" r="1" fill="currentColor" />
      <circle cx="10.5" cy="7" r="1" fill="currentColor" />
      <circle cx="15.5" cy="7.5" r="1" fill="currentColor" />
    </>
  ),
  frame: (
    <>
      <rect x="7" y="2.5" width="10" height="19" rx="2.5" />
      <path d="M3 6v12M21 6v12" />
    </>
  ),
  zip: (
    <>
      <path d="M6 2.5h8l4 4v15H6z" />
      <path d="M10 3v2m0 2v2m0 2v2m-1 2h2v3H9z" />
    </>
  ),
  layers: <path d="m12 3 9 5-9 5-9-5 9-5Zm-9 9 9 5 9-5m-18 4 9 5 9-5" />,
  shield: <path d="M12 3 4.5 6v5.5c0 4.6 3.2 8.4 7.5 9.5 4.3-1.1 7.5-4.9 7.5-9.5V6L12 3Zm-3 9 2 2 4-4.5" />,
  bolt: <path d="M13 2.5 5 13.5h6l-1 8 8-11h-6l1-8Z" />,
  question: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.3-1 .8-1 1.5v.4M12 17h.01" />
    </>
  ),
  scale: <path d="M12 3v18M7 21h10M4 7h16M4 7l-2.5 6a3 3 0 0 0 5 0L4 7Zm16 0-2.5 6a3 3 0 0 0 5 0L20 7Z" />,
  globe: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3Z" />
    </>
  ),
  upload: <path d="M12 15V4m0 0L7.5 8.5M12 4l4.5 4.5M4 15v3.5A1.5 1.5 0 0 0 5.5 20h13a1.5 1.5 0 0 0 1.5-1.5V15" />,
  image: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="2.5" />
      <circle cx="8.5" cy="9.5" r="1.5" />
      <path d="m21 16-5-5-9 9" />
    </>
  ),
  undo: <path d="M9 14 4 9l5-5M4 9h10a6 6 0 0 1 0 12h-3" />,
  laptop: <path d="M4.5 16V6.5A1.5 1.5 0 0 1 6 5h12a1.5 1.5 0 0 1 1.5 1.5V16M2.5 16h19l-1 2.5a1 1 0 0 1-1 .5h-15a1 1 0 0 1-1-.5L2.5 16Z" />,
  cloudOff: <path d="M3 3l18 18M8.5 6.3A6 6 0 0 1 17.6 10 4 4 0 0 1 20 17M17 19H7a5 5 0 0 1-1.6-9.7" />,
} as const;

export type IconName = keyof typeof icons;

/**
 * Ragged paper edge between a colored band and the page. Deterministic so
 * server and client render the same path.
 */
export function TornEdge({ position, seed = 1, className = "text-paper" }: { position: "top" | "bottom"; seed?: number; className?: string }) {
  let s = seed * 9301 + 49297;
  const rand = () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
  let d = "M0,48 L0,17";
  for (let x = 10; x < 1440; x += 6 + rand() * 14) d += ` L${x.toFixed(1)},${(4 + rand() * 28).toFixed(1)}`;
  d += " L1440,16 L1440,48 Z";
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 1440 48"
      preserveAspectRatio="none"
      className={`pointer-events-none absolute inset-x-0 z-10 h-7 w-full sm:h-11 ${position === "bottom" ? "-bottom-px" : "-top-px -scale-y-100"} ${className}`}
    >
      <path d={d} fill="currentColor" />
    </svg>
  );
}
