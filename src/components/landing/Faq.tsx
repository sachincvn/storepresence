import { OUTPUT_SIZES } from "@/templates/sizes";
import { container, Eyebrow, Icon } from "./Section";

const sizes = OUTPUT_SIZES.map((s) => `${s.store} ${s.label} (${s.width} × ${s.height})`);

const faqs = [
  {
    q: "Do I need an account?",
    a: "No. Open the editor and start. Your work is saved automatically in this browser, so you can close the tab and pick up later.",
  },
  {
    q: "Are my screenshots uploaded anywhere?",
    a: "No. Everything is rendered in your browser. Your screenshots never leave your device.",
  },
  {
    q: "Which sizes can I export?",
    a: `${sizes.join(", ")}. Templates are designed once and reflow to each size.`,
  },
  {
    q: "My screenshots are different sizes. Is that a problem?",
    a: "No. Each screenshot is scaled into its slot with its proportions kept, so nothing is ever stretched.",
  },
  {
    q: "Which file types work?",
    a: "Upload PNG, JPG or WEBP. Export a single PNG, or the whole set as a ZIP with files numbered in order.",
  },
  {
    q: "What can I change?",
    a: "Headlines, descriptions, theme colors, font, background and device frame. The template takes care of the layout.",
  },
];

export function Faq() {
  return (
    <section id="faq" aria-labelledby="faq-title" className="scroll-mt-24 py-20 lg:py-28">
      <div className={`${container} grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-12`}>
        <div className="lg:col-span-5">
          <div className="lg:sticky lg:top-28">
            <Eyebrow icon={<Icon name="question" />}>FAQ</Eyebrow>
            <h2 id="faq-title" className="mt-4 font-display text-[clamp(2.25rem,4.4vw,3.5rem)] leading-[1.04] font-medium tracking-[-0.035em]">
              Questions?
              <br />
              <span className="text-brand-500">We&apos;ve got answers.</span>
            </h2>
            <p className="mt-5 max-w-[24rem] text-[17px] leading-[1.6] text-muted">
              The short version: no account, nothing uploaded, every store size.
            </p>
          </div>
        </div>

        <div className="rounded-[26px] border border-hairline bg-white px-6 shadow-card sm:px-8 lg:col-span-7">
          {faqs.map((item, i) => (
            <details key={item.q} open={i === 0} className="group border-hairline [&:not(:first-child)]:border-t">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-6 rounded-lg py-5 text-[17px] font-medium [&::-webkit-details-marker]:hidden">
                {item.q}
                <svg
                  viewBox="0 0 16 16"
                  aria-hidden="true"
                  className="size-4 shrink-0 text-ink/45 transition-transform duration-200 group-open:rotate-45 group-open:text-brand-500"
                >
                  <path d="M8 3v10M3 8h10" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              </summary>
              <p className="-mt-1 max-w-[40rem] pb-6 text-[15px] leading-[1.65] text-muted">{item.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
