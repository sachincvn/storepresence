import type { HeadlineFontId, Project, Screenshot } from "@/types/project";
import type { ThemeKey } from "@/types/template";
import { getTemplate } from "@/templates/registry";
import { getSlideCount, getSlideKey } from "@/templates/resolve";

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

    case "samplesReady":
      if (shots.length > 0 && !state.usingSamples) return { ...state, samples: action.samples };
      return withScreenshots({ ...state, samples: action.samples }, action.samples, true);

    case "addScreenshots": {
      if (action.screenshots.length === 0) return state;
      if (state.usingSamples) {
        // First upload replaces the samples; text typed on sample slides moves to the new ones.
        const slideVariables = { ...project.slideVariables };
        action.screenshots.forEach((s, i) => {
          const sample = shots[i];
          if (sample && slideVariables[sample.id]) slideVariables[s.id] = slideVariables[sample.id];
        });
        return withScreenshots({ ...state, project: { ...project, slideVariables } }, action.screenshots, false, 0);
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
