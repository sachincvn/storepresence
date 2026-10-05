import type { ReactNode } from "react";

export function SectionHeading({
  id,
  children,
  intro,
  className = "",
}: {
  id: string;
  children: ReactNode;
  intro?: ReactNode;
  className?: string;
}) {
  return (
    <div className={`max-w-2xl ${className}`}>
      <h2
        id={id}
        className="font-display text-[clamp(2.1rem,3.8vw,3.4rem)] leading-[1.02] font-extrabold tracking-[-0.04em] text-balance"
      >
        {children}
      </h2>
      {intro && <p className="mt-4 max-w-[34rem] text-lg leading-relaxed text-muted">{intro}</p>}
    </div>
  );
}
