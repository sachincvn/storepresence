import { Difference } from "@/components/landing/Difference";
import { ExportShowcase } from "@/components/landing/ExportShowcase";
import { Faq } from "@/components/landing/Faq";
import { Features } from "@/components/landing/Features";
import { FinalCta } from "@/components/landing/FinalCta";
import { Hero } from "@/components/landing/Hero";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { Marquee } from "@/components/landing/Marquee";
import { RevealOnScroll } from "@/components/landing/RevealOnScroll";
import { SiteHeader } from "@/components/landing/SiteHeader";
import { TemplateShowcase } from "@/components/landing/TemplateShowcase";

export default function Home() {
  return (
    <div className="relative flex flex-1 flex-col">
      <a
        href="#main"
        className="sr-only z-[60] rounded-lg bg-ink px-4 py-2 font-medium text-white focus:not-sr-only focus:fixed focus:top-4 focus:left-4"
      >
        Skip to content
      </a>
      <RevealOnScroll />
      <SiteHeader />
      <main id="main" className="flex-1">
        <Hero />
        <Marquee />
        <Features />
        <HowItWorks />
        <Difference />
        <ExportShowcase />
        <TemplateShowcase />
        <Faq />
        <FinalCta />
      </main>
    </div>
  );
}
