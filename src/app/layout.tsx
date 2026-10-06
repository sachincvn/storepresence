import type { Metadata } from "next";
import { Bricolage_Grotesque, Fraunces, Geist, Inter, Plus_Jakarta_Sans } from "next/font/google";
import { site } from "@/lib/site";
import "./globals.css";

// UI type: Geist for display, Inter for text.
const geist = Geist({ variable: "--font-geist", subsets: ["latin"] });
const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });

// Template fonts (read by the canvas renderer via CSS variables).
const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
  axes: ["opsz"],
});

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
});

// Template-only serif (editorial templates). Not preloaded: only some templates use it.
const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  axes: ["opsz"],
  preload: false,
});

export const metadata: Metadata = {
  title: `${site.name} — Store-ready app screenshots`,
  description: site.description,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geist.variable} ${inter.variable} ${bricolage.variable} ${jakarta.variable} ${fraunces.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col overflow-x-clip font-sans">{children}</body>
    </html>
  );
}
