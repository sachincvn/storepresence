"use client";

import { useEffect, useState } from "react";
import { site } from "@/lib/site";
import { CtaLink } from "./Cta";
import { Logo } from "./Logo";

const links = [
  { href: "#features", label: "Features" },
  { href: "#how", label: "How it works" },
  { href: "#templates", label: "Templates" },
  { href: "#faq", label: "FAQ" },
];

/** Floating glass bar: clear over the violet hero, frosted white once scrolled. */
export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const update = () => setScrolled(window.scrollY > 24);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  return (
    <header className="fixed inset-x-0 top-0 z-50 pt-3">
      <div className="mx-auto w-full max-w-[calc(1080px+3rem)] px-4 sm:px-6">
        <nav
          aria-label="Main"
          className={`flex h-14 items-center justify-between gap-6 rounded-[18px] border pr-2 pl-4 backdrop-blur-md backdrop-saturate-150 transition-[background-color,border-color,box-shadow,color] duration-300 sm:pl-5 ${
            scrolled
              ? "border-white/70 bg-white/75 text-ink shadow-[0_8px_30px_-12px_rgb(19_16_31/0.18)]"
              : "on-brand border-white/35 bg-white/10 text-white"
          }`}
        >
          <Logo />
          <ul className="hidden items-center gap-1 whitespace-nowrap lg:flex">
            {links.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                    scrolled ? "text-ink/70 hover:text-ink" : "text-white/85 hover:text-white"
                  }`}
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
          <CtaLink href={site.editorPath} size="sm" variant={scrolled ? "primary" : "light"}>
            <span className="sm:hidden">Create</span>
            <span className="hidden sm:inline">Create screenshots</span>
          </CtaLink>
        </nav>
      </div>
    </header>
  );
}
