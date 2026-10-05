import type { HeadlineFontId, Project, Screenshot } from "@/types/project";
import type { ImageSlotKey, ThemeKey } from "@/types/template";
import { getTemplate } from "@/templates/registry";
import { designFor, getSlideCount, getSlideKey } from "@/templates/resolve";

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
  | { type: "deviceFrame"; on: boolean }
  | { type: "headlineFont"; font: HeadlineFontId | undefined }
  | { type: "slideLayout"; layout: string }
  | { type: "image"; key: ImageSlotKey; image: Screenshot | null }
  | { type: "device"; model?: Project["deviceModel"]; color?: string | null }
  /** `kind: null` restores the template background; `shuffle` moves to the next seed. */
  | { type: "backdrop"; kind?: "mesh" | "grid" | "dots" | null; shuffle?: boolean }
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

export function editorReducer(state: EditorState, action: EditorAction): EditorState {
  const { project } = state;
  const shots = project.screenshots;

  switch (action.type) {
    case "template":
      // Screenshots and text carry over; colors belong to the old template's palette.
      if (!getTemplate(action.id)) return state;
      return clampSlide({ ...state, project: { ...project, templateId: action.id, theme: {} } });

    case "variable": {
      if (!action.perSlide) {
        return { ...state, project: { ...project, variables: { ...project.variables, [action.key]: action.value } } };
      }
      const template = getTemplate(project.templateId);
      if (!template) return state;
      const slideKey = getSlideKey(template, project, state.slide);
      return {
        ...state,
        project: {
          ...project,
          slideVariables: {
            ...project.slideVariables,
            [slideKey]: { ...project.slideVariables[slideKey], [action.key]: action.value },
          },
        },
      };
    }

    case "color":
      return { ...state, project: { ...project, theme: { ...project.theme, [action.key]: action.value } } };

    case "resetColors":
      return { ...state, project: { ...project, theme: {} } };

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

    case "slideLayout": {
      const template = getTemplate(project.templateId);
      if (!template) return state;
      const key = getSlideKey(template, project, state.slide);
      const slideLayouts = { ...project.slideLayouts };
      // Picking the slide's own layout clears the override.
      if (designFor(template, state.slide).layout === action.layout) delete slideLayouts[key];
      else slideLayouts[key] = action.layout;
      return { ...state, project: { ...project, slideLayouts } };
    }

    case "samplesReady":
      if (shots.length > 0 && !state.usingSamples) return { ...state, samples: action.samples };
      return withScreenshots({ ...state, samples: action.samples }, action.samples, true);

    case "addScreenshots": {
      if (action.screenshots.length === 0) return state;
      if (state.usingSamples) {
        // First upload replaces the samples; text typed on sample slides moves to the new ones.
        const slideVariables = { ...project.slideVariables };
        const slideLayouts = { ...project.slideLayouts };
        action.screenshots.forEach((s, i) => {
          const sample = shots[i];
          if (sample && slideVariables[sample.id]) slideVariables[s.id] = slideVariables[sample.id];
          if (sample && slideLayouts[sample.id]) slideLayouts[s.id] = slideLayouts[sample.id];
        });
        return withScreenshots({ ...state, project: { ...project, slideVariables, slideLayouts } }, action.screenshots, false, 0);
      }
      return withScreenshots(state, [...shots, ...action.screenshots], false, shots.length);
    }

    case "removeScreenshot": {
      if (state.usingSamples) return state;
      const index = shots.findIndex((s) => s.id === action.id);
      if (index === -1) return state;
      const rest = shots.filter((s) => s.id !== action.id);
      if (rest.length === 0) return withScreenshots(state, state.samples, true, 0);
      return withScreenshots(state, rest, false, state.slide > index ? state.slide - 1 : state.slide);
    }

    case "moveScreenshot": {
      const from = shots.findIndex((s) => s.id === action.id);
      const to = from + action.offset;
      if (from === -1 || to < 0 || to >= shots.length) return state;
      const next = [...shots];
      [next[from], next[to]] = [next[to], next[from]];
      // The selection follows the moved screenshot.
      const slide = state.slide === from ? to : state.slide === to ? from : state.slide;
      return withScreenshots(state, next, state.usingSamples, slide);
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
