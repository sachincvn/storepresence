import type { Canvas, Layout, Template, ThemeKey } from "@/types/template";
import { listPlaceholders, resolveTemplate } from "./resolve";

/*
 * Template JSON has no compiler, so this is the safety net: every problem
 * comes back as a readable line ("studio-blue › slides[2] › headline: size must be …").
 * Returns [] when valid.
 */

/** A store listing needs a real set, not a single image. */
export const MIN_SLIDES = 4;

const THEME_KEYS: readonly ThemeKey[] = ["background", "foreground", "primary", "accent", "surface"];
const ELEMENT_TYPES = ["text", "screenshot", "shape", "image"] as const;
const FONT_KEYS = ["display", "sans", "serif"];
const FIT_MODES = ["contain", "cover"];
const DEVICES = ["phone"];
const ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

type Obj = Record<string, unknown>;
type Add = (where: string, message: string) => void;

const isObj = (v: unknown): v is Obj => typeof v === "object" && v !== null && !Array.isArray(v);
const isNum = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);
const isText = (v: unknown): v is string => typeof v === "string" && v.trim() !== "";
const oneOf = (v: unknown, list: readonly string[]) => typeof v === "string" && list.includes(v);

function reporter(scope: string): { errors: string[]; add: Add } {
  const errors: string[] = [];
  return { errors, add: (where, message) => errors.push(`${scope} › ${where}: ${message}`) };
}

/** Prefixes every message, e.g. "slides[2] › headline". */
function within(add: Add, prefix: string): Add {
  return (where, message) => add(`${prefix} › ${where}`, message);
}

export function validateLayout(input: unknown): string[] {
  if (!isObj(input)) return ["Layout must be a JSON object"];
  const { errors, add } = reporter(`layout ${isText(input.id) ? input.id : "(no id)"}`);

  checkId(input.id, "id", add);
  const canvasOk = checkCanvas(input.canvas, add);
  checkVariables(input.variables, add, true);
  if (!Array.isArray(input.elements)) {
    add("elements", "must be an array");
    return errors;
  }
  checkElements(input.elements, add, {
    canvas: canvasOk ? (input.canvas as Canvas) : undefined,
    variables: Array.isArray(input.variables) ? input.variables.filter(isObj).map((v) => String(v.key)) : undefined,
    tokens: THEME_KEYS,
    screenshots: true,
  });
  return errors;
}

export function validateTemplate(input: unknown, layouts: readonly Layout[]): string[] {
  if (!isObj(input)) return ["Template must be a JSON object"];
  const { errors, add } = reporter(isText(input.id) ? input.id : "(no id)");

  checkId(input.id, "id", add);
  if (!isText(input.name)) add("name", "is required");
  if (!isText(input.category)) add("category", "is required");
  const canvasOk = checkCanvas(input.canvas, add);
  if (input.variables !== undefined) checkVariables(input.variables, add, false);
  if (input.grain !== undefined && (!isNum(input.grain) || input.grain < 0 || input.grain > 0.3)) add("grain", "must be 0–0.3");

  const themeKeys: ThemeKey[] = [];
  if (!isObj(input.theme)) add("theme", "must be an object of colors");
  else {
    for (const [key, value] of Object.entries(input.theme)) {
      if (!oneOf(key, THEME_KEYS)) add(`theme.${key}`, `unknown key (use ${THEME_KEYS.join(", ")})`);
      else if (!isText(value) || value.startsWith("$")) add(`theme.${key}`, "must be a literal color");
      else themeKeys.push(key as ThemeKey);
    }
  }

  if (input.editableColors !== undefined) {
    if (!Array.isArray(input.editableColors)) add("editableColors", "must be an array");
    else
      for (const key of input.editableColors) {
        if (!themeKeys.includes(key)) add("editableColors", `"${String(key)}" is not defined in theme`);
        else if (!/^#[0-9a-f]{6}$/i.test(String((input.theme as Obj)[key]))) add("editableColors", `theme.${key} must be a #RRGGBB hex color to be editable`);
      }
  }

  checkBackground(input.background, "background", add, themeKeys);
  checkElementShapes(input.elements, "elements", add);
  checkElementShapes(input.panorama, "panorama", add);

  // Slides
  const usedLayouts: Layout[] = [];
  if (!Array.isArray(input.slides)) add("slides", "must be an array of slide designs");
  else {
    if (input.slides.length < MIN_SLIDES) add("slides", `needs at least ${MIN_SLIDES} slide designs (got ${input.slides.length})`);
    input.slides.forEach((slide: unknown, i: number) => {
      const at = within(add, `slides[${i}]`);
      if (!isObj(slide)) return at("slide", "must be an object");

      let layout: Layout | undefined;
      if (slide.layout !== undefined) {
        layout = layouts.find((l) => l.id === slide.layout);
        if (!layout) at("layout", `unknown layout "${String(slide.layout)}" (known: ${layouts.map((l) => l.id).join(", ") || "none"})`);
        else {
          if (!usedLayouts.includes(layout)) usedLayouts.push(layout);
          if (canvasOk) {
            const c = input.canvas as Canvas;
            if (layout.canvas.width !== c.width || layout.canvas.height !== c.height) {
              at("layout", `"${layout.id}" is ${layout.canvas.width}×${layout.canvas.height}, template is ${c.width}×${c.height}`);
            }
          }
        }
      }
      if (slide.background !== undefined) checkBackground(slide.background, "background", at, themeKeys);
      checkOverrides(slide.overrides, layout ? [layout] : [], at);
      checkElementShapes(slide.elements, "elements", at);
      if (slide.defaults !== undefined) {
        if (!isObj(slide.defaults)) at("defaults", "must be an object of strings");
        else for (const [key, value] of Object.entries(slide.defaults)) if (typeof value !== "string") at(`defaults.${key}`, "must be a string");
      }
    });
  }
  if (input.overrides !== undefined) checkOverrides(input.overrides, usedLayouts, add);

  // Structure is broken; merging would only produce noise.
  if (errors.length > 0) return errors;

  // Check the merged result, so bad overrides are caught too.
  const resolved = resolveTemplate(input as Template, layouts);
  const variables = resolved.variables.map((v) => v.key);

  resolved.designs.forEach((design, i) => {
    const at = within(add, `slides[${i}]`);
    checkElements(design.elements, at, { canvas: resolved.canvas, variables, tokens: themeKeys, screenshots: true });
    for (const key of Object.keys(design.defaults)) if (!variables.includes(key)) at(`defaults.${key}`, "no variable with this key");
  });

  checkElements(resolved.panorama, within(add, "panorama"), {
    canvas: { width: resolved.canvas.width * resolved.designs.length, height: resolved.canvas.height },
    variables,
    tokens: themeKeys,
    screenshots: false,
  });
  return errors;
}

function checkId(value: unknown, where: string, add: Add) {
  if (typeof value !== "string" || !ID.test(value)) add(where, `must be kebab-case, e.g. "studio-blue" (got ${JSON.stringify(value)})`);
}

function checkCanvas(value: unknown, add: Add): boolean {
  if (!isObj(value) || !Number.isInteger(value.width) || !Number.isInteger(value.height) || (value.width as number) <= 0 || (value.height as number) <= 0) {
    add("canvas", "must be { width, height } in whole positive pixels");
    return false;
  }
  return true;
}

/** Enough structure for merging: an array of objects with id and known type. */
function checkElementShapes(value: unknown, where: string, add: Add) {
  if (value === undefined) return;
  if (!Array.isArray(value)) return add(where, "must be an array");
  value.forEach((el, i) => {
    if (!isObj(el) || !isText(el.id) || !oneOf(el.type, ELEMENT_TYPES)) {
      add(`${where}[${i}]`, "needs a string id and a type (text, screenshot, shape, image)");
    }
  });
}

function checkOverrides(value: unknown, layouts: readonly Layout[], add: Add) {
  if (value === undefined) return;
  if (!isObj(value)) return add("overrides", "must be an object keyed by element id");
  if (layouts.length === 0) return add("overrides", "only work on slides with a layout");
  for (const [id, override] of Object.entries(value)) {
    if (!layouts.some((l) => l.elements.some((el) => el.id === id))) {
      add(`overrides.${id}`, `no element "${id}" in layout ${layouts.map((l) => `"${l.id}"`).join(", ")}`);
    } else if (!isObj(override)) add(`overrides.${id}`, "must be an object");
    else if ("type" in override || "id" in override) add(`overrides.${id}`, "cannot change type or id");
  }
}

function checkVariables(value: unknown, add: Add, required: boolean) {
  if (!Array.isArray(value)) {
    if (required || value !== undefined) add("variables", "must be an array");
    return;
  }
  const seen = new Set<string>();
  value.forEach((v, i) => {
    const where = `variables[${i}]`;
    if (!isObj(v)) return add(where, "must be an object");
    if (!isText(v.key) || !/^[\w-]+$/.test(v.key)) add(where, "key must be letters, numbers, - or _");
    else if (seen.has(v.key)) add(where, `duplicate key "${v.key}"`);
    else seen.add(v.key);
    if (!isText(v.label)) add(where, "label is required");
    if (typeof v.default !== "string") add(where, "default must be a string (can be empty)");
    if (v.maxLength !== undefined && (!Number.isInteger(v.maxLength) || (v.maxLength as number) <= 0)) add(where, "maxLength must be a positive integer");
    else if (typeof v.default === "string" && isNum(v.maxLength) && v.default.length > v.maxLength) add(where, "default is longer than maxLength");
  });
}

function checkColor(value: unknown, where: string, add: Add, tokens: readonly string[]) {
  if (!isText(value)) return add(where, "must be a color string");
  if (value.startsWith("$") && !tokens.includes(value.slice(1))) {
    add(where, `unknown theme token "${value}" (available: ${tokens.map((t) => `$${t}`).join(", ") || "none"})`);
  }
}

function checkStops(stops: unknown, where: string, add: Add, tokens: readonly string[]) {
  if (!Array.isArray(stops) || stops.length < 2) return add(`${where}.stops`, "needs at least 2 stops");
  stops.forEach((s: unknown, i: number) => {
    if (!isObj(s) || !isNum(s.at) || s.at < 0 || s.at > 1) add(`${where}.stops[${i}]`, "at must be 0–1");
    else checkColor(s.color, `${where}.stops[${i}].color`, add, tokens);
  });
}

function checkBackground(value: unknown, where: string, add: Add, tokens: readonly string[]) {
  if (!isObj(value)) return add(where, "is required");
  if (value.type === "solid") return checkColor(value.color, `${where}.color`, add, tokens);
  if (value.type !== "linear" && value.type !== "radial") return add(`${where}.type`, "must be solid, linear or radial");
  if (value.type === "linear" && !isNum(value.angle)) add(`${where}.angle`, "must be a number (degrees)");
  if (value.type === "radial" && (!isNum(value.cx) || !isNum(value.cy))) add(where, "radial needs cx and cy (0–1)");
  checkStops(value.stops, where, add, tokens);
}

type ElementContext = {
  canvas?: Canvas;
  /** Declared variable keys, for placeholder checks. */
  variables?: string[];
  tokens: readonly string[];
  /** Panorama elements cannot hold screenshots. */
  screenshots: boolean;
};

function checkElements(elements: readonly unknown[], add: Add, ctx: ElementContext) {
  const ids = new Set<string>();
  const slots = new Set<number>();

  elements.forEach((el, i) => {
    if (!isObj(el)) return add(`elements[${i}]`, "must be an object");
    const where = isText(el.id) ? el.id : `elements[${i}]`;
    const bad = (message: string) => add(where, message);

    if (!oneOf(el.type, ELEMENT_TYPES)) return bad(`unknown type "${String(el.type)}" (use ${ELEMENT_TYPES.join(", ")})`);
    checkId(el.id, where, add);
    if (isText(el.id)) {
      if (ids.has(el.id)) bad("duplicate id");
      ids.add(el.id);
    }

    // Box
    for (const key of ["x", "y"]) if (!isNum(el[key])) bad(`${key} must be a number`);
    for (const key of ["width", "height"]) if (!isNum(el[key]) || (el[key] as number) <= 0) bad(`${key} must be a positive number`);
    if (el.rotation !== undefined && !isNum(el.rotation)) bad("rotation must be a number (degrees)");
    if (el.opacity !== undefined && (!isNum(el.opacity) || el.opacity < 0 || el.opacity > 1)) bad("opacity must be 0–1");
    if (el.layer !== undefined && !oneOf(el.layer, ["back", "front"])) bad('layer must be "back" or "front"');
    if (ctx.canvas && [el.x, el.y, el.width, el.height].every(isNum)) {
      const [x, y, w, h] = [el.x, el.y, el.width, el.height] as number[];
      // Bleeding off the edge is fine (decorations); fully off-canvas is a mistake.
      if (x + w <= 0 || y + h <= 0 || x >= ctx.canvas.width || y >= ctx.canvas.height) bad("is completely outside the canvas");
    }
    checkShadow(el.shadow, where, add, ctx.tokens);

    switch (el.type) {
      case "text": {
        if (typeof el.text !== "string") bad("text must be a string");
        else if (ctx.variables)
          for (const key of listPlaceholders(el.text)) {
            if (!ctx.variables.includes(key)) bad(`placeholder {{${key}}} has no matching variable`);
          }
        if (!oneOf(el.font, FONT_KEYS)) bad(`font must be ${FONT_KEYS.join(", ")}`);
        if (!isNum(el.size) || el.size <= 0) bad("size must be a positive number");
        if (el.minSize !== undefined && (!isNum(el.minSize) || el.minSize <= 0 || (isNum(el.size) && el.minSize > el.size))) bad("minSize must be positive and ≤ size");
        if (!isNum(el.weight) || el.weight < 100 || el.weight > 900) bad("weight must be 100–900");
        if (el.lineHeight !== undefined && (!isNum(el.lineHeight) || el.lineHeight <= 0)) bad("lineHeight must be positive");
        if (el.letterSpacing !== undefined && !isNum(el.letterSpacing)) bad("letterSpacing must be a number");
        if (!oneOf(el.align, ["left", "center", "right"])) bad("align must be left, center or right");
        if (el.verticalAlign !== undefined && !oneOf(el.verticalAlign, ["top", "middle", "bottom"])) bad("verticalAlign must be top, middle or bottom");
        if (el.maxLines !== undefined && (!Number.isInteger(el.maxLines) || (el.maxLines as number) < 1)) bad("maxLines must be a whole number ≥ 1");
        checkColor(el.color, `${where}.color`, add, ctx.tokens);
        if (el.pill !== undefined) {
          if (!isObj(el.pill)) bad("pill must be an object");
          else {
            checkColor(el.pill.fill, `${where}.pill.fill`, add, ctx.tokens);
            for (const key of ["paddingX", "paddingY", "radius"]) {
              if (el.pill[key] !== undefined && (!isNum(el.pill[key]) || (el.pill[key] as number) < 0)) bad(`pill.${key} must be ≥ 0`);
            }
            checkStroke(el.pill.stroke, `${where}.pill`, add, ctx.tokens);
          }
        }
        break;
      }
      case "screenshot": {
        if (!ctx.screenshots) bad("screenshots are not allowed here");
        if (!Number.isInteger(el.slot) || (el.slot as number) < 0) bad("slot must be a whole number ≥ 0");
        else slots.add(el.slot as number);
        if (!oneOf(el.fit, FIT_MODES)) bad("fit must be contain or cover");
        if (el.align !== undefined && !oneOf(el.align, ["center", "top"])) bad("align must be center or top");
        if (el.radius !== undefined && (!isNum(el.radius) || el.radius < 0)) bad("radius must be ≥ 0");
        if (el.device !== undefined && !oneOf(el.device, DEVICES)) bad(`device must be ${DEVICES.join(", ")}`);
        if (el.frameColor !== undefined) checkColor(el.frameColor, `${where}.frameColor`, add, ctx.tokens);
        if (el.placeholderColor !== undefined) checkColor(el.placeholderColor, `${where}.placeholderColor`, add, ctx.tokens);
        break;
      }
      case "shape": {
        if (!oneOf(el.shape, ["rect", "circle", "pill"])) bad("shape must be rect, circle or pill");
        if (el.style !== undefined && !oneOf(el.style, ["flat", "clay", "halftone"])) bad("style must be flat, clay or halftone");
        if (el.radius !== undefined && (!isNum(el.radius) || el.radius < 0)) bad("radius must be ≥ 0");
        if (el.blur !== undefined && (!isNum(el.blur) || el.blur < 0)) bad("blur must be ≥ 0");
        checkColor(el.fill, `${where}.fill`, add, ctx.tokens);
        if (el.gradient !== undefined) {
          if (!isObj(el.gradient) || !isNum(el.gradient.angle)) bad("gradient needs an angle (degrees) and stops");
          else checkStops(el.gradient.stops, `${where}.gradient`, add, ctx.tokens);
        }
        checkStroke(el.stroke, where, add, ctx.tokens);
        break;
      }
      case "image": {
        if (!isText(el.src)) bad("src is required");
        if (!oneOf(el.fit, FIT_MODES)) bad("fit must be contain or cover");
        if (el.radius !== undefined && (!isNum(el.radius) || el.radius < 0)) bad("radius must be ≥ 0");
        break;
      }
    }
  });

  // Slots must be 0..n-1 so screenshots map to slides predictably.
  const sorted = [...slots].sort((a, b) => a - b);
  if (sorted.some((slot, i) => slot !== i)) add("elements", `screenshot slots must be 0, 1, 2… without gaps (got ${sorted.join(", ")})`);
}

function checkStroke(value: unknown, where: string, add: Add, tokens: readonly string[]) {
  if (value === undefined) return;
  if (!isObj(value) || !isNum(value.width) || value.width <= 0) return add(where, "stroke needs a positive width");
  checkColor(value.color, `${where}.stroke.color`, add, tokens);
}

function checkShadow(value: unknown, where: string, add: Add, tokens: readonly string[]) {
  if (value === undefined) return;
  if (!isObj(value) || !isNum(value.blur) || value.blur < 0) return add(where, "shadow needs blur ≥ 0");
  if (value.x !== undefined && !isNum(value.x)) add(where, "shadow.x must be a number");
  if (value.y !== undefined && !isNum(value.y)) add(where, "shadow.y must be a number");
  checkColor(value.color, `${where}.shadow.color`, add, tokens);
}
