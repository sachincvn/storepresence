"use client";

import type { Project } from "@/types/project";
import type { ResolvedTemplate } from "@/types/template";
import { getSlideCount, themeFor } from "@/templates/resolve";
import { SlideCanvas } from "./SlideCanvas";

type StorePreviewProps = {
  template: ResolvedTemplate;
  project: Project;
  appName: string;
  onAppNameChange: (name: string) => void;
  onSelectSlide: (index: number) => void;
};

/**
 * How the set reads in a store listing on a phone: app header, install
 * button and the horizontally scrolling screenshot row. Generic look,
 * no store branding.
 */
export function StorePreview({ template, project, appName, onAppNameChange, onSelectSlide }: StorePreviewProps) {
  const slideCount = getSlideCount(template, project);
  const theme = themeFor(template, project);
  const name = appName.trim() || "Your app";

  return (
    <div className="flex w-full flex-col items-center gap-4">
      <label className="flex items-center gap-2 text-sm font-bold">
        App name
        <input
          type="text"
          value={appName}
          maxLength={30}
          onChange={(e) => onAppNameChange(e.target.value)}
          className="w-44 rounded-xl border border-line bg-white px-3 py-1.5 text-sm font-medium"
        />
      </label>

      <div className="w-full max-w-[400px] overflow-hidden rounded-[40px] border border-line bg-white shadow-[0_30px_70px_-40px_rgb(22_19_31/0.5)]">
        {/* Status + app bar */}
        <div className="flex items-center justify-between px-6 pt-4 text-xs font-bold">
          <span>9:41</span>
          <span aria-hidden="true" className="flex gap-1">
            <span className="h-2.5 w-4 rounded-sm bg-ink" />
            <span className="h-2.5 w-6 rounded-sm bg-ink" />
          </span>
        </div>
        <div aria-hidden="true" className="flex items-center justify-between px-4 py-3 text-ink/70">
          <svg viewBox="0 0 24 24" className="size-6"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
          <span className="flex gap-4">
            <svg viewBox="0 0 24 24" className="size-6"><circle cx="11" cy="11" r="6" fill="none" stroke="currentColor" strokeWidth="2" /><path d="M20 20l-4.5-4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
            <svg viewBox="0 0 24 24" className="size-6"><circle cx="12" cy="5" r="1.6" fill="currentColor" /><circle cx="12" cy="12" r="1.6" fill="currentColor" /><circle cx="12" cy="19" r="1.6" fill="currentColor" /></svg>
          </span>
        </div>

        {/* App header */}
        <div className="flex items-center gap-4 px-6">
          {project.images?.appIcon ? (
            // eslint-disable-next-line @next/next/no-img-element -- object URL preview
            <img src={project.images.appIcon.url} alt="" className="size-[72px] shrink-0 rounded-[20px] object-cover shadow-[0_6px_16px_-8px_rgb(22_19_31/0.5)]" />
          ) : (
            <span
              aria-hidden="true"
              className="grid size-[72px] shrink-0 place-items-center rounded-[20px] font-display text-3xl font-extrabold text-white shadow-[0_6px_16px_-8px_rgb(22_19_31/0.5)]"
              style={{ background: `linear-gradient(135deg, ${theme.accent ?? "#3D5AFE"}, ${theme.primary ?? theme.background ?? "#16131F"})` }}
            >
              {name.charAt(0).toUpperCase()}
            </span>
          )}
          <div className="min-w-0">
            <p className="truncate text-xl font-bold">{name}</p>
            <p className="text-sm font-semibold text-[#1A7F5A]">Your Studio</p>
            <p className="text-xs text-muted">In-app purchases</p>
          </div>
        </div>

        <dl className="mt-5 grid grid-cols-3 px-6 text-center">
          {[
            ["4.8 ★", "2K reviews"],
            ["100K+", "Downloads"],
            ["E", "Everyone"],
          ].map(([value, label], i) => (
            <div key={label} className={i > 0 ? "border-l border-line" : ""}>
              <dt className="sr-only">{label}</dt>
              <dd className="text-sm font-bold">{value}</dd>
              <dd className="text-xs text-muted">{label}</dd>
            </div>
          ))}
        </dl>

        <div className="px-6 pt-5">
          <span aria-hidden="true" className="block rounded-full bg-[#1A7F5A] py-2.5 text-center text-sm font-bold text-white">
            Install
          </span>
        </div>

        {/* Screenshot row */}
        <ul aria-label="Store screenshots" className="mt-6 flex gap-2 overflow-x-auto px-6 pb-2 [scrollbar-width:thin]">
          {Array.from({ length: slideCount }, (_, i) => (
            <li key={i} className="shrink-0">
              <button type="button" onClick={() => onSelectSlide(i)} aria-label={`Edit slide ${i + 1}`} className="block rounded-lg">
                <SlideCanvas template={template} project={project} slideIndex={i} scale={0.2} delay={150} className="h-[236px] w-auto rounded-lg" />
              </button>
            </li>
          ))}
        </ul>

        <div className="px-6 pt-5 pb-8">
          <p className="flex items-center justify-between text-base font-bold">
            About this app
            <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5"><path d="M5 12h14m-6-6 6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </p>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            {name} helps you plan, track and finish what matters. Your screenshots above are exactly what people see first.
          </p>
        </div>
      </div>
    </div>
  );
}
