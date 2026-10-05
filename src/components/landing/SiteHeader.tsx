import { ButtonLink } from "@/components/ui/ButtonLink";
import { site } from "@/lib/site";
import { Logo } from "./Logo";

const links = [
  { href: "#how", label: "How it works" },
  { href: "#features", label: "Features" },
  { href: "#templates", label: "Templates" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 px-3 pt-3 sm:px-6 lg:px-10">
      <nav
        aria-label="Main"
        className="mx-auto flex h-16 max-w-[1200px] items-center justify-between gap-4 rounded-2xl border border-line bg-white/90 pr-3 pl-4 shadow-[0_8px_24px_-18px_rgb(22_19_31/0.3)] backdrop-blur-md sm:pl-5"
      >
        <Logo />
        <ul className="hidden items-center gap-1 md:flex">
          {links.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                className="rounded-xl px-3.5 py-2 text-sm font-semibold text-muted transition-colors hover:bg-lilac hover:text-ink"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>
        <ButtonLink href={site.editorPath} size="md">
          Create screenshots
        </ButtonLink>
      </nav>
    </header>
  );
}
