import { Logo } from "./Logo";

export function SiteFooter() {
  return (
    <footer className="px-4 pb-10 sm:px-6 lg:px-10">
      <div className="mx-auto flex max-w-[1200px] flex-col gap-4 border-t-2 border-ink/10 pt-8 sm:flex-row sm:items-center sm:justify-between">
        <Logo />
        <p className="text-sm font-medium text-muted">Made for app developers. Everything runs in your browser.</p>
      </div>
    </footer>
  );
}
