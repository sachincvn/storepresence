import Link from "next/link";
import { site } from "@/lib/site";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link
      href="/"
      className={`inline-flex items-center gap-2.5 rounded-lg font-display text-xl font-extrabold tracking-tight ${className}`}
    >
      <svg viewBox="0 0 36 36" className="size-9 shrink-0" aria-hidden="true">
        <rect x="3" y="3" width="32" height="32" rx="10" fill="#16131F" />
        <rect x="1" y="1" width="32" height="32" rx="10" fill="#3D5AFE" stroke="#16131F" strokeWidth="2" />
        <rect x="11" y="7" width="12" height="20" rx="3.5" fill="#FFFFFF" stroke="#16131F" strokeWidth="2" transform="rotate(-10 17 17)" />
        <circle cx="25" cy="24" r="5" fill="#FFD43B" stroke="#16131F" strokeWidth="2" />
      </svg>
      {site.name}
    </Link>
  );
}
