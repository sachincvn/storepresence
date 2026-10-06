import Link from "next/link";
import { useId } from "react";
import { site } from "@/lib/site";

/** App-icon style mark: a finished store slide over a second one, on a violet tile. */
export function LogoMark({ className = "size-9" }: { className?: string }) {
  const id = useId();
  return (
    <svg viewBox="0 0 36 36" className={`shrink-0 ${className}`} aria-hidden="true">
      <defs>
        <linearGradient id={`${id}t`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#8B64FF" />
          <stop offset="1" stopColor="#4A1FBF" />
        </linearGradient>
        <linearGradient id={`${id}s`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity=".35" />
          <stop offset=".5" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect width="36" height="36" rx="10" fill={`url(#${id}t)`} />
      <rect x=".5" y=".5" width="35" height="35" rx="9.5" fill={`url(#${id}s)`} stroke="#fff" strokeOpacity=".18" />
      <rect x="15" y="7.5" width="12" height="19" rx="3" fill="#fff" fillOpacity=".35" transform="rotate(10 21 17)" />
      <rect x="9" y="9" width="12.5" height="19.5" rx="3" fill="#fff" />
      <rect x="11.25" y="11.5" width="6.5" height="1.6" rx=".8" fill="#6D3FF0" />
      <rect x="11.25" y="14.3" width="4.2" height="1.6" rx=".8" fill="#6D3FF0" fillOpacity=".45" />
      <rect x="11.25" y="18" width="8" height="8" rx="1.6" fill="#EFEAFE" />
    </svg>
  );
}

/** `compact`: mark only on phones (the name stays for screen readers). */
export function Logo({ className = "", compact = false }: { className?: string; compact?: boolean }) {
  return (
    <Link href="/" className={`inline-flex items-center gap-2.5 rounded-lg font-display text-[19px] font-semibold tracking-[-0.02em] ${className}`}>
      <LogoMark />
      <span className={compact ? "max-sm:sr-only" : undefined}>{site.name}</span>
    </Link>
  );
}
