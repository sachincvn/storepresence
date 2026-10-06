export type ButtonVariant = "primary" | "secondary" | "yellow";
export type ButtonSize = "sm" | "md" | "lg";

const variants: Record<ButtonVariant, string> = {
  primary:
    "text-white bg-[linear-gradient(var(--color-brand-400),var(--color-brand-600))] shadow-[0_0_0_1px_var(--color-brand-800),inset_0_1px_0_rgb(255_255_255/0.35),0_6px_16px_-8px_rgb(98_50_224/0.7)] hover:brightness-105",
  secondary:
    "text-ink bg-[linear-gradient(#fff,#f6f4fc)] shadow-[0_0_0_1px_var(--color-line),inset_0_1px_0_#fff,0_1px_2px_rgb(19_16_31/0.05)] hover:shadow-[0_0_0_1px_var(--color-brand-200),inset_0_1px_0_#fff,0_4px_12px_-6px_rgb(80_36_200/0.25)]",
  // Soft brand tint (name kept for existing call sites).
  yellow: "text-brand-700 bg-brand-50 shadow-[0_0_0_1px_var(--color-brand-100)] hover:bg-brand-100",
};

const sizes: Record<ButtonSize, string> = {
  sm: "h-9 rounded-[10px] px-3 text-sm",
  md: "h-10 rounded-xl px-4 text-sm",
  lg: "h-12 rounded-2xl px-5 text-base",
};

/** Soft, layered button: gradient fill, 1px ring and an inner top highlight. */
export function buttonClasses(variant: ButtonVariant, size: ButtonSize, className = ""): string {
  return `inline-flex shrink-0 items-center justify-center gap-2 font-medium whitespace-nowrap transition-[box-shadow,filter,background-color] duration-150 ease-out active:translate-y-px disabled:pointer-events-none disabled:opacity-50 ${variants[variant]} ${sizes[size]} ${className}`;
}
