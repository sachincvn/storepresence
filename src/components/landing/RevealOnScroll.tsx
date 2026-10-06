"use client";

import { useEffect } from "react";

/**
 * Reveals `.reveal` elements as they scroll into view, once. Elements that
 * enter together are staggered. Content stays visible if this never runs.
 */
export function RevealOnScroll() {
  useEffect(() => {
    const root = document.documentElement;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries
          .filter((entry) => entry.isIntersecting)
          .forEach((entry, i) => {
            const el = entry.target as HTMLElement;
            el.style.transitionDelay = `${Math.min(i, 6) * 80}ms`;
            el.classList.add("is-visible");
            // Drop the delay afterwards so hover transitions stay instant.
            window.setTimeout(() => el.style.removeProperty("transition-delay"), 700 + i * 80);
            observer.unobserve(el);
          });
      },
      { threshold: 0.15, rootMargin: "0px 0px -8% 0px" },
    );

    document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));
    root.classList.add("reveal-ready");
    return () => {
      observer.disconnect();
      root.classList.remove("reveal-ready");
    };
  }, []);

  return null;
}
