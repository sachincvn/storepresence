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
7. Run `npm test`. A broken template fails the registry test, and the JSON Schema test checks every file.
8. Run `npm run test:e2e`. A new template needs golden images: review the render, then `npx playwright test e2e/visual.spec.ts --update-snapshots`.

**Autocomplete:** VS Code validates `template.json` and layout files against `src/templates/template.schema.json` / `layout.schema.json` (mapped in `.vscode/settings.json`). After changing `src/types/template.ts`, run `npm run schema`.

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
| `layoutChoices` | no | Layouts users may switch a slide to in the editor. Default: every registered layout with the same canvas size (the template's own layouts first) |

---

## 3. Slides and screenshots

- One output image per uploaded screenshot. Slide designs repeat in order (5 screenshots on a 4-design template: designs 1, 2, 3, 4, 1).
- **Text-only designs** (a layout without screenshots, e.g. `intro`, `statement`, `outro`) appear once, in place, and do not use up a screenshot. Text designs after the last phone design close the set. Example: `[intro, A, B, outro]` with 4 screenshots gives intro, A, B, A, B, outro.
- Users can also arrange slides themselves: add a text slide, duplicate, move, delete, and pick which screenshot a slide shows. Their slides keep the design they were created from.
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
| `proof-hero` | Laurels award, headline, star rating, phone (great first slide) | laurelTitle, laurelSubtitle, headline, ratingScore, ratingLabel | 1 |
| `review-phone` | Headline, tilted phone, floating review card | headline, description, reviewQuote, reviewAuthor | 1 |
| `stat-hero` | Big number with label, headline, phone | statValue, statLabel, headline | 1 |
| `brand-hero` | App icon (monogram fallback), app name, headline, rating, phone, optional mascot | appName, headline, ratingScore, ratingLabel | 1 |
| `pop-out` | Headline top, phone, one area of the screen lifted out on a card over its own spot | headline, description | 1 |
| `pop-duo` | Smaller phone with two tilted pop-out cards (left and right) | headline, description | 1 |
| `intro` | Big app icon, app name, headline, rating, award wreath | appName, headline, ratingScore, ratingLabel, laurelTitle, laurelSubtitle | 0 |
| `statement` | Small app icon and a huge headline; the default for new text slides | appName, headline, description | 0 |
| `outro` | Headline, app icon, app name, download button, rating | headline, appName, ctaLabel, ratingScore, ratingLabel | 0 |

Element ids you can target with `overrides`: `headline`, `description`, `badge`, `shot`, `shot-back`, `laurels`, `rating`, `review`, `stat`, `callout`, `callout-2`, `app-icon`, `app-name`, `cta`.

**Users can switch any slide to another layout** in the editor (Layout section). The slide keeps its background, extra elements and default text; slide-level `overrides` only apply on the slide's own layout, template-level `overrides` apply everywhere. The validator checks every slide on every layout choice, so a template override that breaks on another layout is reported as `slides[2] › as review-phone › …`.

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
- Inline markup, in template text or typed by users: `**word**` = emphasis, `==word==` = highlighter mark. Style with `emphasis: { color, weight, font }` and `marker` (both default to the theme accent). Set them when the accent is too close to a slide's background.

**screenshot**
- `slot`, `fit` (`cover` or `contain`), `align` (`top` or `center`), `radius`, `shadow`.
- `device`: `phone` (punch-hole), `phone-island` (pill camera), `flat` (screen only); plus `frameColor`, `placeholderColor`. Users can switch the model and frame color for the whole set; only elements that already have a `device` change.
- Crop safety: `cover` may trim the bottom of tall screenshots, but if it would cut more than 35% off the sides (landscape, square, tablet captures) the renderer switches to `contain`. The empty bands get a blurred copy of the screenshot.

**shape**
- `shape` (`rect`, `circle`, `pill`), `fill`, `gradient: { angle, stops }`.
- `style`: `flat`, `clay` (soft 3D shading) or `halftone` (pop-art dots).
- `blur` in px: big values make glows for the mesh-gradient look.
- Also `radius`, `stroke`, `shadow` (`blur: 0` gives a hard brutalist shadow).

**Social proof blocks** (drawn in code, recolor with the theme; text fields accept `{{variables}}`)
- `rating`: `score`, `label`, `color`, `starColor`, `align`. Stars fill from the score (4.5 = four and a half).
- `laurels`: `title`, `subtitle`, `stars`, `color`, `leafColor`, `starColor`. Generic award wreath; never imitate store-branded awards.
- `stat`: `value`, `label`, `color`, `font`, `align`. The value shrinks to fit the box width.
- `review`: `quote`, `author`, `color`, `cardColor`, `starColor`, `size`, `radius`, `shadow`. The card hugs its content.

**imageSlot** (user's own images)
- `key`: `appIcon`, `logo` or `mascot`; `fit`, `radius`, `shadow`. Empty slots draw nothing.
- `monogram: { text, fill, color }` draws a glossy tile with the first letter when no image is uploaded (use `"{{appName}}"`).
- The editor shows a Brand upload only for slot keys the template (or its layout choices) uses. Contained images (mascots) cast shadows from their own shape.

**callout** (pop-out)
- Enlarges an area of a screenshot on its own panel. `slot` must match a screenshot element on the slide.
- `region: { x, y, w, h }` in fractions (0–1) of the screenshot is the default area; set it per slide in `overrides` to hit the right row of each sample. Users re-pick it per slide by dragging a box (or with arrow keys) and can hide it.
- The area keeps its aspect ratio, fits inside the box minus `padding` (default 16) and is centered; the panel hugs it.
- `style`: `card` (solid panel, default), `glass` (frosted blur of what is behind, best on dark or busy backgrounds) or `bubble` (card with a chat tail: `tail` side, `tailAt` 0–1).
- `follow: "y"` moves the box up or down to sit over its area on the phone, so the area lifts out in place.
- Also `fill`, `radius` (default 40), `shadow`, `stroke`, `rotation` (a small tilt, ±2–3°, looks best).

**image**
- `src` (a URL in `public/`, e.g. `/templates/<id>/logo.png`), `fit`, `radius`.

**Backgrounds** (template `background` or a slide's `background`)
- `solid`, `linear` (CSS angle), `radial` (`cx`, `cy` 0–1).
- `mesh`: `{ colors: [base, ...blobs], seed }`, soft blobs laid out across the whole set (continuous over slide edges, deterministic per seed).
- `pattern`: `{ color, ink, pattern: "grid" | "dots" | "lines", size, opacity }`, continuous across slides.
- Users can replace template backgrounds with a generated Mesh, Grid or Dots and press Shuffle; mesh colors are mixed from the template's own background and accent.

**Brand match**: users can upload their app icon and get up to three color suggestions. Suggestions only change `editableColors`; backgrounds keep 4.5:1 contrast with fixed text colors and accents 3:1 with their background. Make `foreground` editable only if every layout reads well in both light and dark text.

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
