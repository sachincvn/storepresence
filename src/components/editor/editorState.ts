import type { HeadlineFontId, Project, Screenshot, SlideEntry } from "@/types/project";
import type { ImageSlotKey, NormRect, ResolvedTemplate, ThemeKey, ThemeTokens } from "@/types/template";
import { getTemplate } from "@/templates/registry";
import { designFor, getSlideCount, getSlideKey, getSlides, ownDesign, slideEntries, slideIndexForShot, textLayoutFor } from "@/templates/resolve";

/** Starting headline for a new text slide. */
export const TEXT_SLIDE_HEADLINE = "Everything you need, **in one place**";

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
  /** Replaces all user colors at once (e.g. a brand suggestion), as one undo step. */
  | { type: "theme"; theme: ThemeTokens }
  | { type: "deviceFrame"; on: boolean }
  | { type: "headlineFont"; font: HeadlineFontId | undefined }
  | { type: "slideLayout"; layout: string }
  /** Current slide's callout area: a rect, `null` hides the callout, `undefined` restores the template's. */
  | { type: "calloutRegion"; id: string; region: NormRect | null | undefined }
  | { type: "image"; key: ImageSlotKey; image: Screenshot | null }
  | { type: "device"; model?: Project["deviceModel"]; color?: string | null }
  /** `kind: null` restores the template background; `shuffle` moves to the next seed. */
  | { type: "backdrop"; kind?: "mesh" | "grid" | "dots" | null; shuffle?: boolean }
  | { type: "samplesReady"; samples: Screenshot[] }
  | { type: "addScreenshots"; screenshots: Screenshot[] }
  | { type: "removeScreenshot"; id: string }
  | { type: "moveScreenshot"; id: string; offset: -1 | 1 }
  | { type: "replaceScreenshot"; id: string; screenshot: Screenshot }
  | { type: "slide"; index: number }
  /** Slide list edits act on the selected slide. `key` is the new slide's id (made by the caller, so the reducer stays pure). */
  | { type: "addTextSlide"; key: string }
  | { type: "duplicateSlide"; key: string }
  | { type: "removeSlide" }
  | { type: "moveSlide"; offset: -1 | 1 }
  /** Which screenshot the selected slide shows. */
  | { type: "slideShot"; shotId: string };

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

/** Selects the slide with `key` if it still exists, else keeps the index in range. */
function selectKey(state: EditorState, template: ResolvedTemplate, key: string): EditorState {
  const index = getSlides(template, state.project).findIndex((p) => p.key === key);
  return clampSlide(index >= 0 ? { ...state, slide: index } : state);
}

/** True when a slide shows no screenshot on its current layout. */
function isTextSlide(template: ResolvedTemplate, project: Project, index: number): boolean {
  return designFor(template, index, project).slots === 0;
}

/** Can a text slide be added after the selected one? Needs a layout without screenshots. */
export function canAddTextSlide(template: ResolvedTemplate, project: Project, slide: number): boolean {
  const design = getSlides(template, project)[slide]?.design ?? 0;
  return template.designs[design]?.slots === 0 || textLayoutFor(template, design) !== null;
}

/** Copies one slide's choices (text, layout, callouts) to a new key. */
function copySlideChoices(project: Project, from: string, to: string, layout?: string | null): Project {
  const slideLayouts = { ...project.slideLayouts };
  if (layout) slideLayouts[to] = layout;
  else if (project.slideLayouts?.[from]) slideLayouts[to] = project.slideLayouts[from];
  return {
    ...project,
    slideLayouts,
    slideVariables: project.slideVariables[from] ? { ...project.slideVariables, [to]: { ...project.slideVariables[from] } } : project.slideVariables,
    calloutRegions: project.calloutRegions?.[from] ? { ...project.calloutRegions, [to]: { ...project.calloutRegions[from] } } : project.calloutRegions,
  };
}

/** After a template switch, keep text slides text-only and screenshot slides on designs that show one. */
function fitSlidesToTemplate(template: ResolvedTemplate, project: Project): Project {
  if (!project.slides) return project;
  const phone = template.designs.flatMap((d, i) => (d.slots > 0 ? [i] : []));
  const text = template.designs.findIndex((d) => d.slots === 0);
  const slideLayouts = { ...project.slideLayouts };
  const slides = project.slides.map((entry, i): SlideEntry => {
    const design = entry.design % template.designs.length;
    const hasShot = template.designs[design].slots > 0;
    if (entry.shot && !hasShot && phone.length > 0) return { ...entry, design: phone[i % phone.length] };
    if (!entry.shot && hasShot) {
      if (text >= 0) return { ...entry, design: text };
      const layout = slideLayouts[entry.key];
      if (!layout || template.alternates[design]?.[layout]?.slots !== 0) {
        const fallback = textLayoutFor(template, design);
        if (fallback) slideLayouts[entry.key] = fallback;
      }
    }
    return { ...entry, design };
  });
  return { ...project, slides, slideLayouts };
}

export function editorReducer(state: EditorState, action: EditorAction): EditorState {
  const { project } = state;
  const shots = project.screenshots;

  switch (action.type) {
    case "template": {
      // Screenshots and text carry over; colors belong to the old template's palette.
      const next = getTemplate(action.id);
      if (!next) return state;
      return clampSlide({ ...state, project: fitSlidesToTemplate(next, { ...project, templateId: action.id, theme: {} }) });
    }

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

    case "theme":
      return { ...state, project: { ...project, theme: { ...action.theme } } };

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
      if (ownDesign(template, state.slide, project).layout === action.layout) delete slideLayouts[key];
      else slideLayouts[key] = action.layout;
      return { ...state, project: { ...project, slideLayouts } };
    }

    case "calloutRegion": {
      const template = getTemplate(project.templateId);
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
      if (action.screenshots.length === 0) return state;
      const template = getTemplate(project.templateId);
      if (!template) return state;
      const first = action.screenshots[0].id;
      if (state.usingSamples) {
        // First upload replaces the samples; text typed on sample slides moves to the new ones.
        const slideVariables = { ...project.slideVariables };
        const slideLayouts = { ...project.slideLayouts };
        action.screenshots.forEach((s, i) => {
          const sample = shots[i];
          if (sample && slideVariables[sample.id]) slideVariables[s.id] = slideVariables[sample.id];
          if (sample && slideLayouts[sample.id]) slideLayouts[s.id] = slideLayouts[sample.id];
        });
        // Slides arranged around the samples start over around the uploads.
        const next = { ...project, slideVariables, slideLayouts, slides: undefined, screenshots: action.screenshots };
        return withScreenshots({ ...state, project: next }, action.screenshots, false, Math.max(0, slideIndexForShot(template, next, first)));
      }
      let slides = project.slides;
      if (slides) {
        // New screenshot slides go after the last one that shows a screenshot, before any closing text slides.
        const phone = template.designs.flatMap((d, i) => (d.slots > 0 ? [i] : []));
        const used = slides.filter((e) => e.shot).length;
        const added = action.screenshots.map((s, i): SlideEntry => ({ key: s.id, shot: s.id, design: phone.length ? phone[(used + i) % phone.length] : 0 }));
        const at = slides.findLastIndex((e) => e.shot) + 1;
        slides = [...slides.slice(0, at), ...added, ...slides.slice(at)];
      }
      const next = { ...project, slides, screenshots: [...shots, ...action.screenshots] };
      return withScreenshots({ ...state, project: next }, next.screenshots, false, Math.max(0, slideIndexForShot(template, next, first)));
    }

    case "removeScreenshot": {
      if (state.usingSamples) return state;
      const template = getTemplate(project.templateId);
      if (!template || !shots.some((s) => s.id === action.id)) return state;
      const rest = shots.filter((s) => s.id !== action.id);
      if (rest.length === 0) return withScreenshots({ ...state, project: { ...project, slides: undefined } }, state.samples, true, 0);
      const slides = project.slides?.filter((e) => e.shot !== action.id);
      const next = { ...project, screenshots: rest, slides: slides && slides.length > 0 ? slides : undefined };
      return selectKey({ ...state, project: next }, template, getSlideKey(template, project, state.slide));
    }

    case "moveScreenshot": {
      const template = getTemplate(project.templateId);
      const from = shots.findIndex((s) => s.id === action.id);
      const to = from + action.offset;
      if (!template || from === -1 || to < 0 || to >= shots.length) return state;
      const next = [...shots];
      [next[from], next[to]] = [next[to], next[from]];
      // Arranged slides swap too, so the screenshot list still reads as the slide order.
      let slides = project.slides;
      if (slides) {
        const a = slides.findIndex((e) => e.shot === shots[from].id);
        const b = slides.findIndex((e) => e.shot === shots[to].id);
        if (a !== -1 && b !== -1) {
          slides = [...slides];
          [slides[a], slides[b]] = [slides[b], slides[a]];
        }
      }
      // The selection follows its slide.
      return selectKey({ ...state, project: { ...project, screenshots: next, slides } }, template, getSlideKey(template, project, state.slide));
    }

    case "replaceScreenshot": {
      if (state.usingSamples) return state;
      // Same id, so per-slide text stays with the slot.
      const next = shots.map((s) => (s.id === action.id ? { ...action.screenshot, id: s.id } : s));
      return withScreenshots(state, next, false);
    }

    case "addTextSlide": {
      const template = getTemplate(project.templateId);
      if (!template || !canAddTextSlide(template, project, state.slide)) return state;
      const entries = project.slides ?? slideEntries(template, project);
      const design = entries[state.slide]?.design ?? 0;
      const layout = textLayoutFor(template, design);
      const slides = [...entries.slice(0, state.slide + 1), { key: action.key, shot: null, design }, ...entries.slice(state.slide + 1)];
      return {
        ...state,
        slide: state.slide + 1,
        project: {
          ...project,
          slides,
          slideLayouts: layout ? { ...project.slideLayouts, [action.key]: layout } : project.slideLayouts,
          slideVariables: { ...project.slideVariables, [action.key]: { headline: TEXT_SLIDE_HEADLINE } },
        },
      };
    }

    case "duplicateSlide": {
      const template = getTemplate(project.templateId);
      if (!template) return state;
      const entries = project.slides ?? slideEntries(template, project);
      const current = entries[state.slide];
      if (!current) return state;
      const slides = [...entries.slice(0, state.slide + 1), { ...current, key: action.key }, ...entries.slice(state.slide + 1)];
      return { ...state, slide: state.slide + 1, project: { ...copySlideChoices(project, current.key, action.key), slides } };
    }

    case "removeSlide": {
      const template = getTemplate(project.templateId);
      if (!template) return state;
      const entries = project.slides ?? slideEntries(template, project);
      if (entries.length <= 1) return state;
      return clampSlide({ ...state, project: { ...project, slides: entries.filter((_, i) => i !== state.slide) } });
    }

    case "moveSlide": {
      const template = getTemplate(project.templateId);
      if (!template) return state;
      const entries = project.slides ?? slideEntries(template, project);
      const to = state.slide + action.offset;
      if (to < 0 || to >= entries.length) return state;
      const slides = [...entries];
      [slides[state.slide], slides[to]] = [slides[to], slides[state.slide]];
      return { ...state, slide: to, project: { ...project, slides } };
    }

    case "slideShot": {
      const template = getTemplate(project.templateId);
      if (!template || !shots.some((s) => s.id === action.shotId) || isTextSlide(template, project, state.slide)) return state;
      const entries = project.slides ?? slideEntries(template, project);
      const slides = entries.map((e, i) => (i === state.slide ? { ...e, shot: action.shotId } : e));
      return { ...state, project: { ...project, slides } };
    }

    case "slide":
      return clampSlide({ ...state, slide: Math.max(0, action.index) });
  }
}
