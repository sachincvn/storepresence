import Link from "next/link";
import { site } from "@/lib/site";
import { TemplateSetPreview } from "@/components/templates/TemplateSetPreview";
import { templates } from "@/templates/registry";
import { CtaLink } from "./Cta";
import { container, Icon, SectionHeader, Tag } from "./Section";

export function TemplateShowcase() {
  return (
    <section id="templates" aria-labelledby="templates-title" className="scroll-mt-24 py-20 lg:py-28">
      <div className={container}>
        <SectionHeader
          id="templates-title"
          eyebrow="Templates"
          icon={<Icon name="layers" />}
          title="Start from a finished design."
          accent="Make it yours."
          lede="Every template is a full store set that works with any app. Swap the words and the color, keep the polish."
        >
          <CtaLink href={site.editorPath} variant="dark" size="md" className="mt-6">
            Open the editor
          </CtaLink>
        </SectionHeader>

        <ul className="mt-12 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
          {templates.map((template) => (
            <li key={template.id} className="reveal">
              <article className="group relative flex h-full flex-col rounded-[26px] border border-hairline bg-white shadow-card transition-[border-color,box-shadow] duration-300 focus-within:border-brand-200 focus-within:shadow-card-hover hover:border-brand-200 hover:shadow-card-hover">
                <div className="m-2 rounded-[20px] border border-hairline/70 bg-paper p-3 shadow-inset">
                  <TemplateSetPreview templateId={template.id} className="rounded-xl" />
                </div>
                <div className="flex items-center justify-between gap-3 px-5 pt-2 pb-4">
                  <div className="min-w-0">
                    <h3 className="font-display text-[17px] leading-tight font-medium tracking-[-0.01em]">
                      <Link
                        href={`${site.editorPath}?template=${template.id}`}
                        className="rounded-sm after:absolute after:inset-0 after:rounded-[26px] after:content-['']"
                      >
                        {template.name}
                      </Link>
                    </h3>
                    <p className="mt-1 text-[13px] text-muted">{template.designs.length}-slide set</p>
                  </div>
                  <Tag className="transition-colors group-hover:border-brand-200 group-hover:bg-brand-50 group-hover:text-brand-700">
                    {template.category}
                  </Tag>
                </div>
              </article>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
