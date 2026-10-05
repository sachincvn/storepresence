import { Features } from "@/components/landing/Features";
import { FinalCta } from "@/components/landing/FinalCta";
import { Hero } from "@/components/landing/Hero";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { SiteFooter } from "@/components/landing/SiteFooter";
import { SiteHeader } from "@/components/landing/SiteHeader";
import { TemplateShowcase } from "@/components/landing/TemplateShowcase";

export default function Home() {
  return (
    <>
      <a
        href="#main"
        className="sr-only z-50 rounded-lg bg-ink px-4 py-2 font-semibold text-white focus:not-sr-only focus:fixed focus:top-4 focus:left-4"
      >
        Skip to content
      </a>
      <SiteHeader />
      <main id="main" className="flex-1">
        <Hero />
        <HowItWorks />
        <Features />
        <TemplateShowcase />
        <FinalCta />
      </main>
      <SiteFooter />
    </>
  );
}
