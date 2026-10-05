import type { Project, Screenshot } from "@/types/project";
import { getTemplate } from "@/templates/registry";
import { getSlideKey } from "@/templates/resolve";
import { editorReducer, initialEditorState, type EditorAction, type EditorState } from "./editorState";

/** What one undo step restores. Samples are not part of it: they are regenerated per session. */
type Snapshot = Pick<EditorState, "project" | "slide" | "usingSamples">;

export type HistoryState = {
  past: Snapshot[];
  present: EditorState;
  future: Snapshot[];
  /** Last recorded edit, for merging bursts (typing, dragging a color) into one step. */
  last?: { group: string; at: number };
};

export type SavedSession = Snapshot;

export type HistoryAction =
  /** `at` (ms) lets bursts of the same edit merge into one undo step. */
  | (EditorAction & { at?: number })
  | { type: "undo" }
  | { type: "redo" }
  /** Loads an autosaved session. Clears history: undo never goes back to the empty start. */
  | { type: "restore"; session: SavedSession; templateId?: string }
  /** Starts a new project on the current template. Undoable. */
  | { type: "reset"; at?: number };

/** Steps kept. Each holds a project (small) and references, not copies, of images. */
export const HISTORY_LIMIT = 100;
/** Edits of the same field closer together than this become one undo step. */
export const MERGE_WINDOW_MS = 1000;

/** Selection and setup actions change what is shown, not the project. */
const UNRECORDED = new Set<HistoryAction["type"]>(["slide", "samplesReady"]);

export function initialHistory(templateId: string): HistoryState {
  return { past: [], present: initialEditorState(templateId), future: [] };
}

const snapshot = ({ project, slide, usingSamples }: EditorState): Snapshot => ({ project, slide, usingSamples });

/** Same group = same field on the same slide, so typing one headline is one step. */
function groupOf(action: HistoryAction, state: EditorState): string | null {
  if (action.type === "variable") {
    if (!action.perSlide) return `variable:${action.key}`;
    const template = getTemplate(state.project.templateId);
    return template ? `variable:${action.key}:${getSlideKey(template, state.project, state.slide)}` : null;
  }
  if (action.type === "color") return `color:${action.key}`;
  if (action.type === "calloutRegion" && action.region) {
    const template = getTemplate(state.project.templateId);
    return template ? `callout:${action.id}:${getSlideKey(template, state.project, state.slide)}` : null;
  }
  return null;
}

function apply(state: HistoryState, target: Snapshot, past: Snapshot[], future: Snapshot[]): HistoryState {
  const present = { ...state.present, ...target };
  // An undone upload may bring the samples back; they are this session's, not the snapshot's.
  if (target.usingSamples) present.project = { ...target.project, screenshots: state.present.samples };
  return { past, present: editorReducer(present, { type: "slide", index: present.slide }), future };
}

export function historyReducer(state: HistoryState, action: HistoryAction): HistoryState {
  switch (action.type) {
    case "undo": {
      const target = state.past.at(-1);
      if (!target) return state;
      return apply(state, target, state.past.slice(0, -1), [snapshot(state.present), ...state.future]);
    }

    case "redo": {
      const [target, ...future] = state.future;
      if (!target) return state;
      return apply(state, target, [...state.past, snapshot(state.present)], future);
    }

    case "restore": {
      const { session } = action;
      if (!getTemplate(session.project.templateId)) return state;
      let present: EditorState = {
        ...state.present,
        ...session,
        project: session.usingSamples ? { ...session.project, screenshots: state.present.samples } : session.project,
      };
      // A template picked in the URL (e.g. from the landing gallery) wins over the saved one.
      if (action.templateId && action.templateId !== present.project.templateId) {
        present = editorReducer(present, { type: "template", id: action.templateId });
      }
      return { past: [], present: editorReducer(present, { type: "slide", index: present.slide }), future: [] };
    }

    case "reset": {
      const fresh = initialEditorState(state.present.project.templateId);
      const present: EditorState = {
        ...fresh,
        samples: state.present.samples,
        project: { ...fresh.project, screenshots: state.present.samples },
      };
      return record(state, present, null, action.at);
    }

    default: {
      const present = editorReducer(state.present, action);
      if (present === state.present) return state;
      if (UNRECORDED.has(action.type)) return { ...state, present };
      return record(state, present, groupOf(action, state.present), action.at);
    }
  }
}

function record(state: HistoryState, present: EditorState, group: string | null, at = 0): HistoryState {
  const merge = group !== null && state.last?.group === group && at - state.last.at < MERGE_WINDOW_MS && state.future.length === 0;
  const last = group ? { group, at } : undefined;
  if (merge) return { ...state, present, last };
  const past = [...state.past, snapshot(state.present)].slice(-HISTORY_LIMIT);
  return { past, present, future: [], last };
}

/** Every uploaded image any step can still show. Anything else can be freed. */
export function referencedImages(state: HistoryState): Map<string, Screenshot> {
  const found = new Map<string, Screenshot>();
  const add = (project: Project) => {
    for (const s of [...project.screenshots, ...Object.values(project.images ?? {})]) found.set(s.url, s);
  };
  [...state.past, state.present, ...state.future].forEach((s) => add(s.project));
  return found;
}

export const canUndo = (state: HistoryState) => state.past.length > 0;
export const canRedo = (state: HistoryState) => state.future.length > 0;
