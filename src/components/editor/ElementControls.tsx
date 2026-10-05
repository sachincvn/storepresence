"use client";

import type { ElementEdit, Project } from "@/types/project";
import type { ResolvedTemplate } from "@/types/template";
import { EDIT_LIMITS, elementName, isAddedBlock } from "@/templates/edits";
import { designFor, getSlideKey } from "@/templates/resolve";

type Props = {
  template: ResolvedTemplate;
  project: Project;
  slide: number;
  selected: string | null;
  onSelect: (id: string | null) => void;
  onEdit: (id: string, edit: ElementEdit | null) => void;
  onRemove: (id: string) => void;
};

const EYE = "M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12zm10 3a3 3 0 1 0 0-6 3 3 0 0 0 0 6z";
const EYE_OFF = "M3 3l18 18M10.6 5.1A10 10 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-3.2 4.2M6.6 6.6C3.8 8.4 2 12 2 12s3.5 7 10 7c1.6 0 3-.4 4.3-1";

/** Every element on the slide: select it, hide or show it, resize and rotate it. Works without a pointer. */
export function ElementControls({ template, project, slide, selected, onSelect, onEdit, onRemove }: Props) {
  const elements = designFor(template, slide, project).elements;
  const edits = project.elementEdits?.[getSlideKey(template, project, slide)] ?? {};
  const current = elements.find((el) => el.id === selected);
  const edit = (current && edits[current.id]) ?? {};

  return (
    <div className="flex flex-col gap-3">
      <ul className="flex flex-col gap-1">
        {elements.map((el) => {
          const hidden = edits[el.id]?.hidden ?? false;
          const name = elementName(el);
          return (
            <li key={el.id} className={`flex items-center gap-1 rounded-lg ${el.id === selected ? "bg-blue/10" : ""}`}>
              <button
                type="button"
                aria-pressed={el.id === selected}
                onClick={() => onSelect(el.id === selected ? null : el.id)}
                disabled={hidden}
                className={`flex-1 truncate rounded-lg px-2 py-1.5 text-left text-sm font-bold disabled:text-muted ${hidden ? "line-through" : ""}`}
              >
                {name}
                {edits[el.id] && !hidden && <span className="ml-1.5 text-xs font-semibold text-blue">edited</span>}
              </button>
              {isAddedBlock(el.id) ? (
                <button
                  type="button"
                  aria-label={`Remove ${name.toLowerCase()}`}
                  onClick={() => {
                    onRemove(el.id);
                    if (el.id === selected) onSelect(null);
                  }}
                  className="grid size-8 shrink-0 place-items-center rounded-lg text-muted hover:bg-white hover:text-ink"
                >
                  <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 7h14M10 11v6M14 11v6M6 7l1 12h10l1-12M9 7V4h6v3" />
                  </svg>
                </button>
              ) : (
              <button
                type="button"
                aria-label={hidden ? `Show ${name.toLowerCase()}` : `Hide ${name.toLowerCase()}`}
                onClick={() => {
                  onEdit(el.id, { ...edits[el.id], hidden: !hidden });
                  if (!hidden && el.id === selected) onSelect(null);
                }}
                className="grid size-8 shrink-0 place-items-center rounded-lg text-muted hover:bg-white hover:text-ink"
              >
                <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d={hidden ? EYE_OFF : EYE} />
                </svg>
              </button>
              )}
            </li>
          );
        })}
      </ul>

      {current && (
        <div className="flex flex-col gap-3 rounded-xl border border-line bg-white p-3">
          <label className="flex flex-col gap-1.5 text-sm font-bold">
            <span className="flex justify-between">
              Size <span className="font-semibold text-muted tabular-nums">{Math.round((edit.scale ?? 1) * 100)}%</span>
            </span>
            <input
              type="range"
              min={EDIT_LIMITS.minScale * 100}
              max={EDIT_LIMITS.maxScale * 100}
              step={1}
              value={Math.round((edit.scale ?? 1) * 100)}
              onChange={(e) => onEdit(current.id, { ...edit, scale: Number(e.target.value) / 100 })}
              className="accent-blue"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-bold">
            <span className="flex justify-between">
              Rotation <span className="font-semibold text-muted tabular-nums">{Math.round(edit.rotation ?? 0)}°</span>
            </span>
            <input
              type="range"
              min={-EDIT_LIMITS.maxRotation}
              max={EDIT_LIMITS.maxRotation}
              step={1}
              value={Math.round(edit.rotation ?? 0)}
              onChange={(e) => onEdit(current.id, { ...edit, rotation: Number(e.target.value) })}
              className="accent-blue"
            />
          </label>
          <p className="text-xs leading-relaxed text-muted">Drag it on the slide to move. Arrow keys nudge, Shift moves further.</p>
          <button type="button" onClick={() => onEdit(current.id, null)} disabled={!edits[current.id]} className="self-start rounded-md text-xs font-bold text-blue hover:underline disabled:opacity-40">
            Reset {elementName(current).toLowerCase()}
          </button>
        </div>
      )}
    </div>
  );
}
