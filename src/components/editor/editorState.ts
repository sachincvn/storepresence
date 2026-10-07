import type { HeadlineFontId, Project, Screenshot } from "@/types/project";
import type { ImageSlotKey, NormRect, ThemeKey } from "@/types/template";
import { getTemplate } from "@/templates/registry";
import { getSlideCount, getSlideKey, getSlides, slideIndexForShot } from "@/templates/resolve";

export type EditorState = {
  project: Project;
  /** Selected slide (output image) index. */
  slide: number;
  /** Placeholder screenshots shown until the user uploads. */
  samples: Screenshot[];
  /** True while `project.screenshots` are the samples. */
  usingSamples: boolean;
};

export type EditorAction =
  | { type: "template"; id: string }
  | { type: "variable"; key: string; value: string; perSlide: boolean }
  | { type: "color"; key: ThemeKey; value: string }
  | { type: "resetColors" }
  | { type: "exportSizes"; sizes: string[] }
  | { type: "deviceFrame"; on: boolean }
  | { type: "headlineFont"; font: HeadlineFontId | undefined }
  | { type: "image"; key: ImageSlotKey; image: Screenshot | null }
  /** Current slide's pop-out area: a rect, `null` hides the pop-out, `undefined` restores the template's. */
  | { type: "calloutRegion"; id: string; region: NormRect | null | undefined }
  | { type: "device"; model?: Project["deviceModel"]; color?: string | null }
  /** `kind: null` restores the template background; `shuffle` moves to the next seed. */
  | { type: "backdrop"; kind?: NonNullable<Project["backdrop"]>["kind"] | null; shuffle?: boolean }
  | { type: "samplesReady"; samples: Screenshot[] }
  | { type: "addScreenshots"; screenshots: Screenshot[] }
  | { type: "removeScreenshot"; id: string }
  | { type: "moveScreenshot"; id: string; offset: -1 | 1 }
  | { type: "replaceScreenshot"; id: string; screenshot: Screenshot }
  | { type: "slide"; index: number };

export function initialEditorState(templateId: string): EditorState {
  return {
    project: {
      templateId,
      screenshots: [],
      variables: {},
      slideVariables: {},
      theme: {},
      deviceFrame: true,
    },
    slide: 0,
    samples: [],
    usingSamples: true,
  };
}

function clampSlide(state: EditorState): EditorState {
  const template = getTemplate(state.project.templateId);
  if (!template) return state;
  const last = getSlideCount(template, state.project) - 1;
  return state.slide > last ? { ...state, slide: last } : state;
}

function withScreenshots(state: EditorState, screenshots: Screenshot[], usingSamples: boolean, slide = state.slide): EditorState {
  return clampSlide({ ...state, slide, usingSamples, project: { ...state.project, screenshots } });
}

/** Keeps the slide with `key` selected after the list changes, or the index in range. */
function selectKey(state: EditorState, key: string): EditorState {
  const template = getTemplate(state.project.templateId);
  const index = template ? getSlides(template, state.project).findIndex((p) => p.key === key) : -1;
  return clampSlide(index >= 0 ? { ...state, slide: index } : state);
}

export function editorReducer(state: EditorState, action: EditorAction): EditorState {
  const { project } = state;
  const shots = project.screenshots;
  const template = getTemplate(project.templateId);

  switch (action.type) {
    case "template":
      // Screenshots and text carry over; colors belong to the old template's palette.
      if (!getTemplate(action.id)) return state;
      return clampSlide({ ...state, project: { ...project, templateId: action.id, theme: {} } });

    case "variable": {
      if (!action.perSlide) {
        return { ...state, project: { ...project, variables: { ...project.variables, [action.key]: action.value } } };
      }
      if (!template) return state;
      const slideKey = getSlideKey(template, project, state.slide);
      return {
        ...state,
        project: {
          ...project,
          slideVariables: { ...project.slideVariables, [slideKey]: { ...project.slideVariables[slideKey], [action.key]: action.value } },
        },
      };
    }

    case "color":
      return { ...state, project: { ...project, theme: { ...project.theme, [action.key]: action.value } } };

    case "resetColors":
      return { ...state, project: { ...project, theme: {} } };

    case "exportSizes":
      return { ...state, project: { ...project, exportSizes: [...action.sizes] } };

    case "deviceFrame":
      return { ...state, project: { ...project, deviceFrame: action.on } };

    case "headlineFont":
      return { ...state, project: { ...project, headlineFont: action.font } };

    case "device":
      return {
        ...state,
        project: {
          ...project,
          ...("model" in action ? { deviceModel: action.model } : {}),
          // null resets the color to the template's.
          ...("color" in action ? { deviceColor: action.color ?? undefined } : {}),
        },
      };

    case "backdrop": {
      if (action.kind === null) return { ...state, project: { ...project, backdrop: undefined } };
      const kind = action.kind ?? project.backdrop?.kind;
      if (!kind) return state;
      // Seeds step deterministically so the reducer stays pure.
      const seed = (project.backdrop?.seed ?? 1) + (action.shuffle ? 1 : 0);
      return { ...state, project: { ...project, backdrop: { kind, seed } } };
    }

    case "image": {
      const images = { ...project.images };
      if (action.image) images[action.key] = action.image;
      else delete images[action.key];
      return { ...state, project: { ...project, images } };
    }

    case "calloutRegion": {
      if (!template) return state;
      const key = getSlideKey(template, project, state.slide);
      const slide = { ...project.calloutRegions?.[key] };
      if (action.region === undefined) delete slide[action.id];
      else slide[action.id] = action.region;
      return { ...state, project: { ...project, calloutRegions: { ...project.calloutRegions, [key]: slide } } };
    }

    case "samplesReady":
      if (shots.length > 0 && !state.usingSamples) return { ...state, samples: action.samples };
      return withScreenshots({ ...state, samples: action.samples }, action.samples, true);

    case "addScreenshots": {
      if (action.screenshots.length === 0 || !template) return state;
      const first = action.screenshots[0].id;
      if (state.usingSamples) {
        // First upload replaces the samples; text typed on sample slides moves to the new ones.
        const slideVariables = { ...project.slideVariables };
        action.screenshots.forEach((s, i) => {
          const sample = shots[i];
          if (sample && slideVariables[sample.id]) slideVariables[s.id] = slideVariables[sample.id];
        });
        const next = { ...project, slideVariables, screenshots: action.screenshots };
        return withScreenshots({ ...state, project: next }, action.screenshots, false, Math.max(0, slideIndexForShot(template, next, first)));
      }
      const next = { ...project, screenshots: [...shots, ...action.screenshots] };
      return withScreenshots({ ...state, project: next }, next.screenshots, false, Math.max(0, slideIndexForShot(template, next, first)));
    }

    case "removeScreenshot": {
      if (state.usingSamples || !template || !shots.some((s) => s.id === action.id)) return state;
      const rest = shots.filter((s) => s.id !== action.id);
      if (rest.length === 0) return withScreenshots(state, state.samples, true, 0);
      return selectKey({ ...state, project: { ...project, screenshots: rest } }, getSlideKey(template, project, state.slide));
    }

    case "moveScreenshot": {
      const from = shots.findIndex((s) => s.id === action.id);
      const to = from + action.offset;
      if (!template || from === -1 || to < 0 || to >= shots.length) return state;
      const next = [...shots];
      [next[from], next[to]] = [next[to], next[from]];
      // The selection follows its slide.
      return selectKey({ ...state, project: { ...project, screenshots: next } }, getSlideKey(template, project, state.slide));
    }

    case "replaceScreenshot": {
      if (state.usingSamples) return state;
      // Same id, so per-slide text stays with the slot.
      const next = shots.map((s) => (s.id === action.id ? { ...action.screenshot, id: s.id } : s));
      return withScreenshots(state, next, false);
    }

    case "slide":
      return clampSlide({ ...state, slide: Math.max(0, action.index) });
  }
}
