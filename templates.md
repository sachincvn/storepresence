# Template Authoring Guide

How to add or change a screenshot template. No editor code changes are needed: a template is one JSON file.

Source of truth for types: `src/types/template.ts`. Validation rules: `src/templates/validate.ts`.

---

## 1. Quick start (about 10 minutes)

1. Copy a folder: `src/templates/studio-blue/` → `src/templates/<your-id>/`.
2. In `template.json`, change `id` (kebab-case, same as the folder), `name`, `category`, `description`.
3. Change `theme` colors, `background`, `panorama`, and the `layout` of each slide.
4. Register it in `src/templates/registry.ts`: one `import` line and one entry in `templateSources` (order = gallery order).
5. Run `npm run dev` and open **`/dev/templates`** (Template Lab):
   - Validation box must be green.
   - Check **Mixed ratios** and every single ratio.
   - Turn on **Longest allowed text**.
   - Toggle **Phone frame** off.
6. Open the editor's **Full set** and **Store preview** views.
7. Run `npm test`. A broken template fails the registry test.

The Lab is hidden in production builds. To open it there, run `TEMPLATE_LAB=1 npx next start`.

---

## 2. Anatomy

```jsonc
{
  "id": "aurora",
  "name": "Aurora",
  "category": "Gradient",
  "description": "One sentence for the gallery.",
  "canvas": { "width": 1080, "height": 1920 },

  "theme": { "background": "#0D1033", "foreground": "#FFFFFF", "primary": "#4F6BFF", "accent": "#FF5FA2", "surface": "#1C2155" },
  "editableColors": ["background", "primary", "accent"],

  "background": { "type": "solid", "color": "$background" },
  "grain": 0.08,

  "overrides": { "shot": { "frameColor": "#2B2838" } },
  "elements": [],
  "panorama": [],

  "slides": [
    { "layout": "badge-hero", "defaults": { "badge": "New", "headline": "Plan your day in seconds" } },
    { "layout": "duo" },
    { "layout": "zoom", "background": { "type": "solid", "color": "#111" } },
    { "layout": "phone-center", "overrides": { "headline": { "size": 96 } } }
  ]
}
```

| Field | Required | Notes |
|---|---|---|
| `id` | yes | kebab-case, unique, matches the folder |
| `canvas` | yes | Output size in px. Layouts must use the same size |
| `theme` | yes | Literal colors for `background`, `foreground`, `primary`, `accent`, `surface` |
| `editableColors` | no | Theme keys users can recolor. Values must be `#RRGGBB` |
| `background` | yes | Default for every slide |
| `grain` | no | Film grain 0–0.3 over the background (not over screenshots). Adds PNG size |
| `variables` | no | Extra or replacement text fields (same `key` replaces a layout's) |
| `overrides` | no | Edits to layout elements on **every** slide, by element id |
| `elements` | no | Elements repeated on every slide |
| `panorama` | no | Elements spanning the whole set (see §5) |
| `slides` | yes | **At least 4** slide designs |

---

## 3. Slides and screenshots

- One output image per uploaded screenshot. Slide designs repeat in order (5 screenshots on a 4-design template: designs 1, 2, 3, 4, 1).
- Before any upload the editor shows the template's full set with 4 sample screens.
- In a layout, `slot: 0` is the slide's own screenshot. `slot: 1` is the **next** screenshot (used by `duo` for the back phone), wrapping around.
- Each slide can set `layout`, `background`, `overrides` (these win over template overrides), extra `elements` and `defaults` (default text per variable for that slide).

Draw order on each slide:

```text
background → panorama (back) → grain → template elements (back) → slide elements (back)
→ layout elements → slide elements (front) → template elements (front) → panorama (front)
```

Extra elements are drawn behind the layout unless they have `"layer": "front"`.

---

## 4. Layouts (`src/templates/layouts/`)

| Layout | Look | Text fields | Screenshots |
|---|---|---|---|
| `phone-center` | Headline top, phone centered, bleeding off the bottom | headline, description | 1 |
| `phone-tilt` | Left-aligned headline, phone tilted −7° | headline, description | 1 |
| `text-bottom` | Whole phone on top, headline below | headline, description | 1 |
| `duo` | Two overlapping tilted phones | headline, description | 2 |
| `zoom` | Huge cropped phone, feature close-up | headline, description | 1 |
| `badge-hero` | Pill badge, headline, phone | badge, headline, description | 1 |

Element ids you can target with `overrides`: `headline`, `description`, `badge`, `shot`, `shot-back`.

The Lab's **Layouts** section shows each layout with its element boxes outlined. A new layout is a new JSON file plus one line in `layoutSources`. Any template can then use it.

---

## 5. Panorama

Panorama elements use one wide coordinate space: `x` runs from `0` to `canvas.width × slides.length`. With 4 slides at 1080 px, that is 0–4320, and the slide seams are at 1080, 2160 and 3240.

Place shapes **across a seam** so neighbouring screenshots read as one piece in the store carousel. Example: a sphere at `x: 840, width: 480` spans the seam at 1080.

Screenshots are not allowed in the panorama.

---

## 6. Elements

All elements need `type`, `id`, `x`, `y`, `width`, `height`. Optional on all of them: `rotation` (degrees), `opacity` (0–1), `layer`.

**text**
- Content: `text` (may contain `{{variable}}`).
- Font: `font` (`display` = Bricolage Grotesque, `sans` = Plus Jakarta Sans, `serif` = Fraunces) and `weight`.
- Size: `size`, `minSize` (auto-shrink floor), `maxLines`, `lineHeight`, `letterSpacing` (em).
- Layout: `align` and `verticalAlign`.
- Color: `color`.
- Badge: `pill: { fill, paddingX, paddingY, radius, stroke }` draws a badge sized to the text.
- Lines are balanced automatically, and text shrinks before it ever gets an ellipsis.

**screenshot**
- `slot`, `fit` (`cover` or `contain`), `align` (`top` or `center`), `radius`, `shadow`.
- `device: "phone"`, `frameColor`, `placeholderColor`.
- Crop safety: `cover` may trim the bottom of tall screenshots, but if it would cut more than 35% off the sides (landscape, square, tablet captures) the renderer switches to `contain`. The empty bands get a blurred copy of the screenshot.

**shape**
- `shape` (`rect`, `circle`, `pill`), `fill`, `gradient: { angle, stops }`.
- `style`: `flat`, `clay` (soft 3D shading) or `halftone` (pop-art dots).
- `blur` in px: big values make glows for the mesh-gradient look.
- Also `radius`, `stroke`, `shadow` (`blur: 0` gives a hard brutalist shadow).

**image**
- `src` (a URL in `public/`, e.g. `/templates/<id>/logo.png`), `fit`, `radius`.

**Colors** are literal CSS colors (`#FFD43B`, `rgba(…)`, `transparent`) or theme tokens (`$background`, `$foreground`, `$primary`, `$accent`, `$surface`). Use tokens for anything that should follow the user's color picks.

---

## 7. Quality bar (from `design.md`)

- At least 4 slides that look designed together: vary layouts and connect slides with a panorama or deliberate per-slide backgrounds.
- One strong idea per template (glows, clay, hard shadows, serif, airy minimal).
- Headlines must read well at the longest allowed length. Check with the Lab toggle.
- No decoration over headlines or the phone's screen.
- Keep text contrast high against every background the user can pick.

---

## 8. Common validator messages

| Message | Fix |
|---|---|
| `slides: needs at least 4 slide designs` | Add slides |
| `slides[2] › layout: unknown layout "x"` | Typo, or the layout isn't registered |
| `overrides.foo: no element "foo" in layout …` | The id doesn't exist in any layout the template uses |
| `unknown theme token "$brand"` | Use one of the five theme keys |
| `editableColors: theme.x must be a #RRGGBB hex color` | Editable colors need 6-digit hex |
| `placeholder {{tagline}} has no matching variable` | Add the variable to the template's `variables` |
| `panorama › x: is completely outside the canvas` | Panorama width is `canvas.width × slides.length` |
| `screenshot slots must be 0, 1, 2… without gaps` | Number slots from 0 |
