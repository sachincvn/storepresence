# Editor Build Plan — Screenshot Generator

Step-by-step plan for the template engine and editor. Each step is small, ships something testable, and is checked off before the next one starts.

Source specs: `product.md`, `architecture.md`, `AGENTS.md`, `claude.md`, `design.md`.

---

## 1. Goals

1. MVP Definition of Done (`claude.md`): pick one of 5+ templates → upload → auto placement → edit text + theme color → preview → PNG + ZIP, no account.
2. **Adding a template is a data change, not a code change.** Target: a new template in ~10 minutes by copying a JSON file.
3. **Templates scale by combination.** Shared layouts × themes, so 5 layouts and 6 themes give 30 templates without duplicating geometry.
4. Renderer is pure TypeScript (no React), deterministic and export size independent of UI zoom.

---

## 2. Key Decisions

| Decision | Choice | Why |
|---|---|---|
| Template format | `template.json` per folder | Data-driven per spec; same files can later be served from a CDN/Supabase (architecture §17). |
| Validation | `validateTemplate()` at load + dev Template Lab | JSON has no compiler, so errors must be loud and early. |
| Reuse | Optional shared **layout** (`layouts/*.json`) referenced by templates | Geometry written once, re-themed many times. Standalone templates still allowed. |
| Colors | Theme tokens (`$primary`, `$background`, `$foreground`, `$accent`, `$surface`) | One color picker recolors any template; no template-specific editor logic. |
| Text | `{{variable}}` placeholders declared in `variables` | Editor builds text inputs from the template; renderer fills values. |
| Editor controls | Generated from template `variables` + `editableColors` | Adding a template never touches editor code. |
| Device frames | Drawn in code (`deviceRenderer.ts`), referenced by key (`"phone"`) | No image assets to maintain; toggle on/off from editor. |
| Fonts | Font registry keys (`"display"`, `"sans"`) mapped to loaded `next/font` families | Templates stay portable; renderer waits for `document.fonts` before drawing. |
| Previews | Rendered live by the engine with sample screenshots | No hand-made `preview.png` to keep in sync (optional override allowed). |
| Units | Pixels in the template's own canvas (e.g. 1080×1920) | Matches export exactly; preview just scales the canvas. |
| Tests | Vitest for pure modules (fit, validate, resolve, text wrap) | Architecture §22 asks for independent tests. |
| State | React `useReducer` in the editor | Spec: no heavy state library. |

Deviation from the `TemplateElement` sketch in `claude.md`: the device frame is a property of the screenshot element (`device: "phone"`) instead of a separate `DeviceElement`, so "Device frame on/off" is one flag and the screenshot and its frame can never drift apart.

---

## 3. Folder Structure

```text
src/
├── types/
│   ├── template.ts        # Template, Layout, elements, theme, variables
│   └── project.ts         # Project, Screenshot, Slide
├── templates/
│   ├── layouts/           # shared geometry
│   │   ├── phone-center.json
│   │   └── phone-tilt.json
│   ├── studio-blue/template.json
│   ├── sunny-pop/template.json
│   ├── ...
│   ├── registry.ts        # list of templates (one import line each)
│   ├── resolve.ts         # layout + overrides + theme + variables → flat render spec
│   └── validate.ts        # readable errors for bad JSON
├── renderer/
│   ├── imageFit.ts        # fitImageToSlot (pure)
│   ├── fonts.ts           # font key → family, wait for load
│   ├── textRenderer.ts    # wrap, max lines, auto-shrink
│   ├── shapeRenderer.ts   # rect, circle, pill, halftone, sphere
│   ├── deviceRenderer.ts  # code-drawn phone frame
│   ├── canvasRenderer.ts  # background + layer loop
│   ├── templateRenderer.ts# renderSlide(template, project, slideIndex, scale)
│   └── exportRenderer.ts  # PNG blob, ZIP
├── components/
│   ├── editor/            # shell, preview canvas, inspector
│   ├── templates/         # sidebar, carousel
│   ├── upload/            # dropzone, thumbnail list
│   └── export/            # export menu
├── lib/
│   ├── download.ts
│   └── sampleShots.ts     # generated placeholder screenshots for previews/Lab
└── app/
    ├── editor/page.tsx
    └── dev/templates/page.tsx   # Template Lab (dev only)
```

---

## 4. Template Model

A template is a **set** of at least 4 slide designs (`MIN_SLIDES` in `validate.ts`). Each slide picks its own layout and background; a **panorama** layer spans the whole set so the store carousel reads as one connected piece.

```jsonc
// src/templates/aurora/template.json (shortened)
{
  "id": "aurora", "name": "Aurora", "category": "Gradient",
  "canvas": { "width": 1080, "height": 1920 },
  "theme": { "background": "#0D1033", "foreground": "#FFFFFF", "primary": "#4F6BFF", "accent": "#FF5FA2", "surface": "#1C2155" },
  "editableColors": ["background", "primary", "accent"],
  "background": { "type": "solid", "color": "$background" },
  "grain": 0.08,                                  // film grain over the background
  "overrides": { "shot": { "shadow": { "y": 50, "blur": 110, "color": "rgba(0,0,0,0.55)" } } }, // all slides
  "panorama": [                                   // x runs 0 … 1080 × slides
    { "type": "shape", "id": "glow-1", "shape": "circle", "x": -260, "y": 860, "width": 1050, "height": 1050,
      "fill": "$primary", "blur": 160, "opacity": 0.85 }
  ],
  "slides": [
    { "layout": "badge-hero", "defaults": { "badge": "New: Smart lists", "headline": "Plan your day in seconds" } },
    { "layout": "duo" },
    { "layout": "zoom", "background": { "type": "solid", "color": "#111" } },
    { "layout": "phone-center", "overrides": { "headline": { "size": 96 } } }
  ]
}
```

- **Layouts** (`src/templates/layouts/`): `phone-center`, `phone-tilt`, `text-bottom`, `duo` (2 phones), `zoom` (cropped big phone), `badge-hero` (pill badge + headline).
- **Screenshots**: one slide per screenshot; designs repeat in order. Slot 0 = the slide's own screenshot, slot 1 = the next one (duo).
- **Draw order per slide**: background → panorama back → grain → template back → slide back → layout → slide front → template front → panorama front.
- **Elements**: `text` (fonts display/sans/serif, optional `pill` badge), `screenshot` (`device`, `frameColor`, hard or soft `shadow`), `shape` (rect/circle/pill; flat, clay, halftone; `gradient`, `blur` glows), `image`.
- New template: copy a folder, change theme, panorama and slide layouts, register it, then check Full set + Store preview.

---

## 5. Steps

Status: ☐ todo · ◐ in progress · ☑ done

### Phase A — Engine foundation (no UI)

**☑ Step 1. Types**
- `src/types/template.ts`: `Template`, `Layout`, `TemplateElement` union, `Background`, `ThemeTokens`, `TemplateVariable`, `Shadow`, `FitMode`.
- `src/types/project.ts`: `Screenshot`, `Project`.
- Done when: `npm run lint` + `tsc` pass.

**☑ Step 2. `fitImageToSlot`**
- `src/renderer/imageFit.ts`: returns source crop + destination rect for `drawImage`.
- Modes `contain` / `cover`, align `center` / `top` (top keeps status bar and header when cropping tall shots).
- Add Vitest. Tests: portrait, landscape, very tall, tiny, square, exact match, invalid sizes.
- Done when: `npm test` passes.

**☑ Step 3. Template resolver + validator + registry**
- `resolve.ts`: merge layout + overrides + extra elements, replace `$tokens` with theme (user colors win, only for `editableColors`), replace `{{vars}}` with slide values or defaults.
- `validate.ts`: unknown element type, missing ids, duplicate ids, unknown token, slot index gaps, element outside canvas → clear messages with template id + element id.
- `registry.ts`: `templates`, `getTemplate(id)`, `layouts`.
- First layout `phone-center` + first template `studio-blue`.
- Tests for resolve and validate.

**☑ Step 4. Canvas renderer**
- `fonts.ts`: read `--font-bricolage` / `--font-jakarta` families, `await document.fonts.load(...)` before render.
- `canvasRenderer.ts`: background (solid, linear, radial), layer loop, `scale` param (preview 0.5, export 1).
- `textRenderer.ts` + pure `textLayout.ts`: word wrap, balanced lines, `maxLines`, shrink from `size` to `minSize`, ellipsis as last resort.
- `shapeRenderer.ts`: rect/circle/pill, clay style (gradient highlight + shade), halftone pattern.
- `deviceRenderer.ts`: phone bezel + speaker/punch-hole, screen clip.
- `templateRenderer.ts`: `renderSlide({ template, project, slideIndex, scale }) → HTMLCanvasElement`.
- Done when: a canvas renders at exactly 1080×1920 at `scale: 1`.

**☑ Step 5. Template Lab (`/dev/templates`)**
- Ratio test cards (`createRatioSamples`): 9:19.5, 9:16, 3:4, 16:10, 1:1, tiny 200×400, with TOP/BOTTOM bars so crops are obvious.
- Every template's set against mixed or single ratios, longest-allowed-text toggle, phone frame toggle, validation report, layout wireframes with element boxes.
- Hidden in production unless `TEMPLATE_LAB=1` (checked per request).
- Found and fixed with it: decoration colliding with long headlines (Sunny Pop); black bars around contained screenshots → blurred backdrop.

**☑ Step 6. Starter template library (5+)**
- ☑ Set model (4+ slides, per-slide layout/background, panorama, grain, glows, pill badges, serif font).
- ☑ 6 layouts and 6 premium sets: Aurora, Studio Blue, Sunny Pop, Lilac Clay, Midnight, Fresh Mint.
- ☑ Authoring guide: `templates.md`.
- Write `templates.md`: authoring guide ("copy folder → edit theme → register → check Lab").
- Done when: all pass validation and look right in the Lab for all ratios.

### Phase B — Editor

**☑ Step 7. Editor shell**
- ☑ Views: Slide, Full set (carousel with tight gaps), Store preview (generic listing page with the screenshot row).
- `/editor` layout: Template sidebar | Preview canvas | Inspector (desktop); stacked on tablet; canvas + bottom controls + template carousel on mobile.
- Template sidebar from registry with live mini previews; `?template=id` preselects (landing links already use it).
- Editor state with `useReducer`: `templateId`, `screenshots`, `slides`, `theme`, `deviceFrame`.
- Preview: render at preview scale, debounced, CSS-scaled to fit; slide strip below canvas.

**☑ Step 8. Upload**
- Dropzone + "Upload screenshots" button + drop anywhere in the editor; PNG/JPG/WEBP only, clear error for others; max 10 per set.
- Decode with `createImageBitmap`; downscale huge images (longest side > 3000px) for memory.
- Thumbnails with reorder (buttons + keyboard, drag later), remove, replace.
- Object URLs revoked on remove/unmount.
- Empty state uses sample screenshots so the preview is never blank; first upload replaces them (typed text carries over), removing all brings them back.
- Crop safety (`safeFitMode`): cover may trim the bottom of tall shots, but wide images that would lose >35% of their sides switch to contain.

**☑ Step 9. Customize**
- ☑ Inspector generated from template: one input per `variable` (per slide or global), color pickers for `editableColors`, device frame toggle.
- ☑ Headline font: Template, Bold grotesk, Editorial serif, Clean sans (`src/templates/headlineFonts.ts`). Swaps display/serif text only, with matching weight and spacing; body text keeps the template font.
- Per-slide text follows its screenshot when reordered.
- Switching template keeps screenshots and text.

**☑ Step 10. Export**
- `exportRenderer.ts`: render each slide at scale 1 → `canvas.toBlob("image/png")`.
- ☑ "Export slide N" (PNG) and "Download ZIP" (`01.png…`, `<app-name>-screenshots.zip`, JSZip loaded on demand). Verified end to end: 4 files, each exactly 1080×1920.
- Progress + error states; editor state never lost on failure.

### Phase C — Quality

**☑ Step 11. Responsive + accessibility pass**
- Layouts by `useLayoutMode`: desktop 3 columns; tablet templates → canvas → 2-column controls; mobile canvas → template carousel → bottom bar opening native `<dialog>` sheets (Screenshots, Text, Style). Controls render once per mode, so no duplicate ids.
- Skip link, sr-only h1 inside main, labelled export buttons, live regions for uploads and export progress, export errors visible on every size, arrow/Home/End keys on the slide strip, focus returns after closing a sheet.
- Verified with axe-core: 0 violations in the editor at 1440, 820 and 390 px and with a sheet open; no horizontal overflow; reduced motion disables the sheet animation.
- Known: axe flags tiny text inside the landing page's `aria-hidden` poster mockups (decorative, exempt); landing left unchanged.

**☑ Step 12. QA checklist (AGENTS.md Testing)**

Automated browser run against a production build, 19/19 passed:

| # | Check | Result |
|---|---|---|
| 1 | Portrait upload (1080×2340) | Pass |
| 2 | Landscape upload (2560×1600) | Pass, shown whole (crop safety + blurred backdrop) |
| 3 | Very tall capture (1440×6000) | Pass, downscaled to 720×3000, top kept |
| 4 | Small screenshot (200×400) | Pass |
| 5 | PNG export | Pass, exactly 1080×1920 |
| – | Deterministic export | Pass, identical bytes on repeat |
| 6 | Batch export | Pass, one PNG per screenshot |
| 7 | ZIP export, 5 shots | Pass, `01.png…05.png`, all 1080×1920 |
| 8 | Text overflow | Pass, input capped at maxLength |
| 9 | Long headline | Pass, shrinks and balances |
| 10 | Missing optional fields | Pass, empty headline/description export cleanly |
| – | Headline font switch | Pass |
| – | All 6 templates via ZIP | Pass, 1080×1920, largest file 2.6 MB (Aurora, grain), well under the 8 MB store limit |
| – | Page errors | None |

Plus 117 unit tests (`npm test`) and axe-core with 0 editor violations at 1440, 820 and 390 px.
Now repeatable in the repo: `npm run test:e2e` (Playwright, `e2e/`, 20 tests: upload shapes, reorder/remove/replace, exact-size and deterministic PNG, ZIP, long/empty text, font and color, every template's ZIP, Template Lab, axe at 3 sizes, sheet focus, keyboard, landing gallery links).

**☑ Step 13. Landing uses real engine (optional)**
- Template gallery (`TemplateShowcase`) renders real templates: first 3 slides of each set via `TemplateSetPreview`, lazy (IntersectionObserver), all 6 templates.
- Fixed: gallery links used mock ids (`sunny`, `lilac`, `mint`) the editor didn't know. Links now use real template ids (covered by an e2e test).
- Hero, steps, features and closing CTA keep their CSS-mock posters (decorative, approved design).

---

## 6. Adding a Template (full guide: `templates.md`)

1. Copy `src/templates/studio-blue/` to `src/templates/<new-id>/`.
2. Edit `id`, `name`, `category`, `theme`, optionally pick another `layout` or add `elements`.
3. Add one import line to `src/templates/registry.ts`.
4. Open `/dev/templates`, check all aspect ratios and the long-headline toggle, fix validation errors.

New layout = new file in `src/templates/layouts/`, then any number of templates can use it.

---

## 7. Later (not MVP)

- JSON Schema for editor autocompletion in `template.json`.
- More output sizes per template (App Store 1290×2796) via per-size layouts.
- Multi-screenshot slides (2–3 phones per image) — the model already supports `slot` indexes.
- Cloud-loaded templates (architecture §17), undo/redo, saved projects.
