import type { CSSProperties, ReactNode } from "react";

type ClayShapeProps = {
  color: string;
  className?: string;
  style?: CSSProperties;
  /** Puffier highlight + shadow. Reserved for the hero. */
  rich?: boolean;
};

function clayShadow(rich: boolean) {
  return rich ? "0 18px 28px -14px rgb(22 19 31 / 0.38)" : "0 12px 20px -12px rgb(22 19 31 / 0.3)";
}

/** Clay ball. Purely decorative. */
export function ClaySphere({ color, className = "", style, rich = false }: ClayShapeProps) {
  const light = rich ? 0.75 : 0.5;
  const dark = rich ? 0.2 : 0.12;
  return (
    <span
      aria-hidden="true"
      className={`block aspect-square rounded-full ${className}`}
      style={{
        background: `radial-gradient(circle at 32% 28%, rgb(255 255 255 / ${light}) 0%, rgb(255 255 255 / 0) 32%), radial-gradient(circle at 70% 78%, rgb(0 0 0 / ${dark}) 0%, rgb(0 0 0 / 0) 55%), ${color}`,
        boxShadow: clayShadow(rich),
        ...style,
      }}
    />
  );
}

/** Clay capsule. Purely decorative. */
export function ClayPill({ color, className = "", style, rich = false }: ClayShapeProps) {
  const light = rich ? 0.65 : 0.45;
  const dark = rich ? 0.16 : 0.1;
  return (
    <span
      aria-hidden="true"
      className={`block rounded-full ${className}`}
      style={{
        background: `linear-gradient(160deg, rgb(255 255 255 / ${light}) 0%, rgb(255 255 255 / 0) 40%), linear-gradient(340deg, rgb(0 0 0 / ${dark}) 0%, rgb(0 0 0 / 0) 45%), ${color}`,
        boxShadow: clayShadow(rich),
        ...style,
      }}
    />
  );
}

/** Pop-art starburst badge. */
export function Starburst({
  children,
  className = "",
  fill = "#FFD43B",
}: {
  children: ReactNode;
  className?: string;
  fill?: string;
}) {
  const points = Array.from({ length: 28 }, (_, i) => {
    const angle = (i / 28) * Math.PI * 2;
    const r = i % 2 === 0 ? 50 : 41;
    return `${(50 + r * Math.cos(angle)).toFixed(2)},${(50 + r * Math.sin(angle)).toFixed(2)}`;
  }).join(" ");

  return (
    <span className={`grid aspect-square place-items-center ${className}`}>
      <svg viewBox="-4 -4 108 108" className="absolute inset-0 size-full" aria-hidden="true">
        <polygon points={points} transform="translate(4 4)" fill="#16131F" />
        <polygon points={points} fill={fill} stroke="#16131F" strokeWidth="2.5" strokeLinejoin="round" />
      </svg>
      <span className="relative -translate-x-0.5 -translate-y-0.5 text-center font-display leading-none font-extrabold">
        {children}
      </span>
    </span>
  );
}

/** Small neo-brutalist label with hard shadow. */
export function Sticker({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-xl border-2 border-ink px-3 py-1.5 text-sm font-bold shadow-pop-sm ${className}`}
    >
      {children}
    </span>
  );
}
