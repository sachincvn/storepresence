import Link from "next/link";
import type { ComponentProps } from "react";

type CtaVariant = "primary" | "light" | "dark";
type CtaSize = "sm" | "md" | "lg";

const variants: Record<CtaVariant, { button: string; tile: string }> = {
  primary: {
    button:
      "text-white bg-[linear-gradient(var(--color-brand-400),var(--color-brand-600))] shadow-[0_0_0_1px_var(--color-brand-800),inset_0_1px_0_rgb(255_255_255/0.35),0_8px_20px_-8px_rgb(98_50_224/0.75)] hover:brightness-105",
    tile: "bg-white/18",
  },
  light: {
    button:
      "text-ink bg-[linear-gradient(#fff,#f1eefa)] shadow-[0_0_0_1px_rgb(0_0_0/0.06),inset_0_1px_0_#fff,0_8px_20px_-10px_rgb(19_16_31/0.35)] hover:shadow-[0_0_0_1px_rgb(0_0_0/0.06),inset_0_1px_0_#fff,0_12px_26px_-10px_rgb(19_16_31/0.4)]",
    tile: "text-white bg-[linear-gradient(var(--color-brand-400),var(--color-brand-600))] shadow-[0_0_0_1px_var(--color-brand-800),inset_0_1px_0_rgb(255_255_255/0.3)]",
  },
  dark: {
    button: "text-white bg-ink shadow-[0_0_0_1px_#000,inset_0_1px_0_rgb(255_255_255/0.15),0_8px_20px_-10px_rgb(19_16_31/0.6)] hover:bg-[#25212f]",
    tile: "bg-white/14",
  },
};

const sizes: Record<CtaSize, { button: string; tile: string }> = {
  sm: { button: "h-10 gap-2.5 pr-1 pl-4 text-sm", tile: "size-8 rounded-[9px]" },
  md: { button: "h-12 gap-3 pr-1.5 pl-5 text-[15px]", tile: "size-9 rounded-[10px]" },
  lg: { button: "h-14 gap-4 pr-2 pl-6 text-base", tile: "size-10 rounded-[11px]" },
};

/** Landing CTA: label plus a trailing arrow in its own square tile. */
export function CtaLink({
  variant = "primary",
  size = "lg",
  className = "",
  children,
  ...props
}: ComponentProps<typeof Link> & { variant?: CtaVariant; size?: CtaSize }) {
  return (
    <Link
      className={`group inline-flex shrink-0 items-center rounded-2xl font-medium whitespace-nowrap transition-[box-shadow,filter,background-color] duration-200 ${variants[variant].button} ${sizes[size].button} ${className}`}
      {...props}
    >
      {children}
      <span
        aria-hidden="true"
        className={`grid place-items-center transition-transform duration-200 group-hover:translate-x-0.5 ${variants[variant].tile} ${sizes[size].tile}`}
      >
        <svg viewBox="0 0 16 16" className="size-4">
          <path d="M3 8h10m0 0L8.5 3.5M13 8l-4.5 4.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    </Link>
  );
}

/** "▶ See how it works" style text link. */
export function PlayLink({ href, children, className = "" }: { href: string; children: string; className?: string }) {
  return (
    <a href={href} className={`group inline-flex items-center gap-2.5 rounded-md text-base font-medium ${className}`}>
      <svg viewBox="0 0 16 16" aria-hidden="true" className="size-3.5">
        <path d="M4 2.5v11l9-5.5z" fill="currentColor" />
      </svg>
      <span className="border-b-[1.5px] border-current/40 pb-0.5 transition-colors group-hover:border-current">{children}</span>
    </a>
  );
}
