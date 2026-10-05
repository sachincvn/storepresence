import { ButtonLink } from "@/components/ui/ButtonLink";
import { site } from "@/lib/site";
import { ClaySphere, Starburst } from "./Decor";
import { StorePoster } from "./StorePoster";
import { getPoster } from "./posters";

export function FinalCta() {
  return (
    <section aria-labelledby="cta-title" className="px-4 py-20 sm:px-6 lg:px-10 lg:py-28">
      <div className="clay-dark relative mx-auto max-w-[1200px] overflow-hidden rounded-[44px] bg-blue px-6 py-16 text-white sm:px-12 sm:py-20 lg:px-16 lg:py-24">
        <div className="halftone pointer-events-none absolute inset-0 text-white opacity-15 [mask-image:radial-gradient(70%_90%_at_100%_100%,black_10%,transparent_70%)]" />

        <div aria-hidden="true" className="absolute top-10 right-[6%] hidden h-[130%] w-[42%] lg:block">
          <StorePoster
            poster={getPoster("mint")}
            className="absolute! top-6 left-0 w-[48%] -rotate-8 ring-2 ring-ink shadow-float"
          />
          <StorePoster
            poster={getPoster("lilac")}
            className="absolute! top-20 right-0 w-[48%] rotate-6 ring-2 ring-ink shadow-float"
          />
          <ClaySphere color="#FF6FAE" className="float absolute top-0 left-[42%] w-14" />
        </div>

        <div className="relative max-w-xl">
          <Starburst fill="#FFFFFF" className="relative mb-8 w-24 -rotate-12 text-sm text-ink">
            Ready
            <br />
            in secs
          </Starburst>
          <h2
            id="cta-title"
            className="font-display text-[clamp(2.75rem,6vw,5rem)] leading-[0.98] font-extrabold tracking-[-0.045em]"
          >
            Pick. Drop. Done.
          </h2>
          <p className="mt-5 max-w-[26rem] text-lg leading-relaxed text-white/80">
            No account, no uploads. Your first screenshot set is a few clicks away.
          </p>
          <ButtonLink href={site.editorPath} variant="secondary" className="mt-9">
            Create screenshots
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}
