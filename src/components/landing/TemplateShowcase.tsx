import Link from "next/link";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { site } from "@/lib/site";
import { TemplateSetPreview } from "@/components/templates/TemplateSetPreview";
import { templates } from "@/templates/registry";
import { SectionHeading } from "./SectionHeading";

export function TemplateShowcase() {
  return (
    <section id="templates" aria-labelledby="templates-title" className="scroll-mt-24 px-4 py-20 sm:px-6 lg:px-10 lg:py-28">
      <div className="mx-auto max-w-[1200px]">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <SectionHeading
            id="templates-title"
            intro="Every template is a full store set that works with any app. Swap the words and the color, keep the polish."
          >
            Start from a finished design.
          </SectionHeading>
          <ButtonLink href={site.editorPath} variant="secondary" className="self-start sm:self-auto">
            Open the editor
          </ButtonLink>
        </div>

        <ul className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
          {templates.map((template, i) => (
            <li key={template.id}>
              <article
                className={`group relative flex h-full flex-col rounded-[28px] border border-line bg-white p-2.5 transition-[translate,rotate] duration-300 ease-out hover:-translate-y-2 focus-within:-translate-y-2 ${
                  i % 2 === 0 ? "hover:-rotate-1 focus-within:-rotate-1" : "hover:rotate-1 focus-within:rotate-1"
                }`}
              >
                <TemplateSetPreview templateId={template.id} />
                <div className="flex items-center justify-between gap-2 px-2.5 pt-4 pb-2">
                  <div>
                    <h3 className="font-display text-lg leading-tight font-extrabold tracking-[-0.02em]">
                      <Link
                        href={`${site.editorPath}?template=${template.id}`}
                        className="rounded-sm after:absolute after:inset-0 after:rounded-[28px] after:content-['']"
                      >
                        {template.name}
                      </Link>
                    </h3>
                    <p className="mt-0.5 text-xs font-semibold text-muted">
                      {template.category}, {template.designs.length}-slide set
                    </p>
                  </div>
                  <span
                    aria-hidden="true"
                    className="grid size-8 shrink-0 place-items-center rounded-lg border-2 border-ink bg-white opacity-0 shadow-pop-sm transition-opacity group-focus-within:opacity-100 group-hover:opacity-100"
                  >
                    <svg viewBox="0 0 16 16" className="size-3.5">
                      <path d="M4 12 12 4M6 4h6v6" fill="none" stroke="#16131F" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                </div>
              </article>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
