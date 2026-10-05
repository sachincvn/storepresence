export type PosterApp = "finance" | "tasks" | "fitness" | "chat";
export type PosterDecoration = "sphere" | "halftone" | "none";

/**
 * Landing-page showcase data. Mirrors the look of the starter templates
 * so the marketing page previews real output styles.
 */
export type PosterStyle = {
  id: string;
  name: string;
  category: string;
  screens: string;
  background: string;
  foreground: string;
  accent: string;
  /** Colour of the decorative shape. */
  decorColor: string;
  headline: string;
  app: PosterApp;
  decoration: PosterDecoration;
  phoneTilt?: number;
};

export const posters: PosterStyle[] = [
  {
    id: "studio-blue",
    name: "Studio Blue",
    category: "Product",
    screens: "1–5 screens",
    background: "#3D5AFE",
    foreground: "#FFFFFF",
    accent: "#3D5AFE",
    decorColor: "#FFD43B",
    headline: "Plan your day in seconds",
    app: "tasks",
    decoration: "sphere",
  },
  {
    id: "sunny",
    name: "Sunny Pop",
    category: "Bold",
    screens: "1–3 screens",
    background: "#FFD43B",
    foreground: "#16131F",
    accent: "#16131F",
    decorColor: "#16131F",
    headline: "Money, sorted.",
    app: "finance",
    decoration: "halftone",
  },
  {
    id: "lilac",
    name: "Lilac Clay",
    category: "Soft",
    screens: "1–3 screens",
    background: "#C9B8FF",
    foreground: "#16131F",
    accent: "#3D5AFE",
    decorColor: "#FF6FAE",
    headline: "Chat without the clutter",
    app: "chat",
    decoration: "sphere",
    phoneTilt: -5,
  },
  {
    id: "midnight",
    name: "Midnight",
    category: "Dark",
    screens: "1–5 screens",
    background: "#16131F",
    foreground: "#FFFFFF",
    accent: "#FFD43B",
    decorColor: "#FFFFFF",
    headline: "Train smarter every week",
    app: "fitness",
    decoration: "halftone",
  },
  {
    id: "mint",
    name: "Fresh Mint",
    category: "Minimal",
    screens: "1–5 screens",
    background: "#9BE7C4",
    foreground: "#16131F",
    accent: "#16131F",
    decorColor: "#3D5AFE",
    headline: "Everything in one tidy place",
    app: "tasks",
    decoration: "sphere",
  },
];

export function getPoster(id: string): PosterStyle {
  const poster = posters.find((p) => p.id === id);
  if (!poster) throw new Error(`Unknown poster: ${id}`);
  return poster;
}
