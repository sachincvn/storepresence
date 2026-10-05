"use client";

import type { Dispatch } from "react";
import type { Project } from "@/types/project";
import type { EditorAction } from "./editorState";

const KINDS = [
  { id: null, label: "Template" },
  { id: "mesh", label: "Mesh" },
  { id: "grid", label: "Grid" },
  { id: "dots", label: "Dots" },
  { id: "collage", label: "Collage" },
] as const;

/** Template background, or a generated one from the theme colors, with Shuffle. */
export function BackgroundControls({ project, dispatch }: { project: Project; dispatch: Dispatch<EditorAction> }) {
  const current = project.backdrop?.kind ?? null;

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <fieldset className="contents">
        <legend className="sr-only">Background style</legend>
        {KINDS.map((k) => (
          <label
            key={k.label}
            className={`cursor-pointer rounded-xl border bg-white px-3 py-1.5 text-sm font-bold has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-blue ${
              current === k.id ? "border-blue ring-1 ring-blue" : "border-line hover:border-ink/30"
            }`}
          >
            <input type="radio" name="backdrop" checked={current === k.id} onChange={() => dispatch({ type: "backdrop", kind: k.id })} className="sr-only" />
            {k.label}
          </label>
        ))}
      </fieldset>
      <button
        type="button"
        disabled={!current}
        onClick={() => dispatch({ type: "backdrop", shuffle: true })}
        className="ml-auto inline-flex items-center gap-1.5 rounded-xl border border-line bg-white px-3 py-1.5 text-sm font-bold disabled:opacity-40"
      >
        <svg viewBox="0 0 16 16" className="size-4" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 4h3l6 8h3M2 12h3l1.5-2M9.5 6 11 4h3M12 2l2 2-2 2M12 10l2 2-2 2" />
        </svg>
        Shuffle
      </button>
    </div>
  );
}
