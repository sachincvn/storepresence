"use client";

import { useSyncExternalStore } from "react";

export type LayoutMode = "desktop" | "tablet" | "mobile";

const DESKTOP = "(min-width: 1024px)";
const TABLET = "(min-width: 768px)";

function subscribe(onChange: () => void) {
  const queries = [DESKTOP, TABLET].map((q) => window.matchMedia(q));
  queries.forEach((q) => q.addEventListener("change", onChange));
  return () => queries.forEach((q) => q.removeEventListener("change", onChange));
}

function snapshot(): LayoutMode {
  if (window.matchMedia(DESKTOP).matches) return "desktop";
  return window.matchMedia(TABLET).matches ? "tablet" : "mobile";
}

/**
 * Editor layout per spec: desktop 3 columns, tablet stacked, mobile canvas +
 * bottom sheets. JS rather than CSS so controls render once (no duplicate ids).
 * The server renders desktop; phones switch right after hydration.
 */
export function useLayoutMode(): LayoutMode {
  return useSyncExternalStore(subscribe, snapshot, () => "desktop");
}
