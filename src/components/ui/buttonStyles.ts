export type ButtonVariant = "primary" | "secondary" | "yellow";
export type ButtonSize = "sm" | "md" | "lg";

const variants: Record<ButtonVariant, string> = {
  primary: "bg-blue text-white",
  secondary: "bg-white text-ink",
  yellow: "bg-yellow text-ink",
};

const sizes: Record<ButtonSize, string> = {
  sm: "h-9 px-3 text-sm",
  md: "h-10 px-4 text-sm",
  lg: "h-13 px-6 text-base",
};

/** Neo-brutalist button: ink border, hard shadow that collapses on press. */
export function buttonClasses(variant: ButtonVariant, size: ButtonSize, className = ""): string {
  return `inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl border-2 border-ink font-bold whitespace-nowrap shadow-pop-sm transition-[translate,box-shadow] duration-150 ease-out hover:-translate-x-px hover:-translate-y-px hover:shadow-pop active:translate-x-[3px] active:translate-y-[3px] active:shadow-none disabled:pointer-events-none disabled:opacity-50 ${variants[variant]} ${sizes[size]} ${className}`;
}
