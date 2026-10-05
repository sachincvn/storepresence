# Premium Plan — StorePresence

How to get from "good templates" to screenshots that look like top-chart apps (Duolingo, Netflix, X, Revolut, Headspace…), while staying easy: no Figma, no Canva, no design skills.

Status of the MVP: `editor-plan.md` (all 13 steps done).

---

## 1. What makes top-app screenshots look premium

Patterns seen across top-grossing store listings:

| Pattern | What it looks like | Who does it |
|---|---|---|
| **Pop-out callouts** | A piece of the UI (a card, a button, a chat bubble) lifted out of the phone, enlarged, with a shadow | Duolingo, Revolut, banking apps |
| **Story across slides** | One idea per slide, slides read in order; first slide is the hook | Almost all top apps |
| **Panoramic sets** | A phone or shape straddles two slides; the carousel reads as one strip | Games, Duolingo, Calm |
| **Big confident type** | 2–5 word headlines, one or two weights, lots of air | X, Notion, Linear |
| **Characters and stickers** | Mascots, emoji-like 3D objects, playful shapes | Duolingo, Headspace |
| **Content-rich backdrops** | Posters, photos or UI collages behind or instead of the phone | Netflix, Spotify, Airbnb |
| **Social proof** | Rating badges, award laurels, review cards, "10M+ users" | Most growth-stage apps |
| **Real devices** | Current phone shapes (island, punch-hole), clean frames, or no frame at all | All |
| **Depth** | Tilted or perspective phones, layered shadows, glass cards | Fintech, games |
| **Brand consistency** | Colors and type taken straight from the app | All |
| **Localized sets** | Same design, translated copy per market | Every global app |

Today StorePresence covers: story sets (4+ slides), panorama shapes, big type, glows/clay/halftone, one phone frame, two-phone duo, zoom crops, badges, fonts, colors.

Missing for the premium bar: **callouts, richer devices, social proof blocks, image slots (logo, mascot, photos), backdrop modes, per-slide layout choice, light direct manipulation, brand palette from the app, localization and multi-size export.**

---

## 2. Principle: guided freedom, not a blank canvas

`product.md` says "Do not become Canva". The way to let users "create anything" without becoming Canva:

1. **Templates decide the design**: grid, spacing, type scale, palette rules.
2. **Users pick from variants**: every slide offers several layouts and blocks that already look right together.
3. **Users nudge, never draw**: move or scale an element by dragging *within safe bounds*, with snapping. No raw x/y, no layers panel, no pen tool.
4. **Blocks, not shapes**: "Add rating", "Add callout", "Add review". Each block is a styled, data-driven element.
5. **Everything stays data**: user edits are stored as overrides on top of the template, so templates can still improve and exports stay deterministic.

> Suggested addition to `product.md`: "Users can choose, combine and nudge; they never start from a blank canvas."

---

## 3. New template capabilities (engine)

Each item: what it adds, how it fits the current model, effort (S ≤ 1 day, M ≤ 3 days, L ≤ 1–2 weeks).

### 3.1 Pop-out callouts — **L, highest impact**

- New element `callout`: takes a **region of a screenshot** (normalized rect, e.g. `{ x: 0.08, y: 0.32, w: 0.84, h: 0.14 }`) and draws it enlarged at its own box, with radius, shadow, optional stroke and tilt.
- Template defines default regions per slide; the user re-picks the region by dragging a box over their screenshot (one simple crop UI).
- Optional connector: a soft line or glow from the phone to the callout.
- Variants: "lifted card" (white card + shadow), "glass" (blur behind), "bubble" (chat-tail).

### 3.2 Device library — **M–L**

- Models: modern phone with island, phone with punch-hole, flat (no frame, rounded screen), tablet (7" and 10"), browser window (for web apps), watch later.
- Colors: black, silver, white, theme color, clay (soft 3D).
- Perspective tilt: true perspective via triangle-mesh texture mapping in canvas (affine per triangle). Presets only: "tilt left", "tilt right", "lay flat", "isometric".
- Devices can **straddle slides**: allow screenshot elements in the panorama with explicit screenshot index.

### 3.3 Rich text — **M**

- Text spans: mixed weight and color in one headline ("Learn **anywhere**"), highlight marker under words, underline swoosh.
- Kicker labels (small line above the headline), numbered steps ("1 Learn  2 Practise  3 Win").
- Emoji support (color emoji fallback font), icon-in-text.
- Auto contrast: warn or auto-switch text color when the user picks a background that fails WCAG contrast.

### 3.4 Social proof blocks — **M**

- `rating`: stars + score + count ("4.9 ★ · 120K ratings"), user-editable numbers.
- `laurels`: award wreath with user text (generic; never imitate store-branded awards).
- `review`: quote card with name and stars.
- `stat`: big number + label ("10M+ learners").
- `feature-list`: 2–4 rows of icon + short text (icon set: Lucide, ISC license).

### 3.5 Image slots — **M**

- Template-defined slots users fill with their own images: **app icon**, **logo**, **mascot/character**, **photo**.
- Transparent PNG mascots float in front of phones (Duolingo-style).
- Photo backdrops with gradient fade into the background color (Netflix/Airbnb style).
- Optional built-in sticker pack (3D-style shapes, arrows, sparkles, hearts) drawn in code or bundled SVG.

### 3.6 Backdrop modes — **M**

- **Mesh gradient generator**: 3–5 blurred color points from the theme, with a "shuffle" button.
- **Patterns**: grid, dots, lines, noise; scale and opacity presets.
- **Screenshot collage**: tiles of the user's own screenshots, blurred or dimmed, as the background (cinematic look with zero extra assets).
- **Photo**: user image, cover-fit, with tint.

### 3.7 Text-only and special slides — **S**

- Intro slide (big promise + app icon + rating), outro slide ("Download free"), comparison slide (before/after), feature grid slide.
- Slides without a screenshot no longer consume one; slide order becomes independent of screenshot order (see 4.4).

### 3.8 Multi-size output — **L, needed for App Store**

- Sizes: Play phone 1080×1920 (9:16) and 1080×2400, Play 7"/10" tablets, **Play feature graphic 1024×500**, App Store 6.9" 1320×2868, 6.5" 1284×2778, iPad 13" 2064×2752.
- Approach: layouts get **size variants** (tall phone, standard phone, tablet, banner). Each template maps every slide to a variant per size; the renderer picks by target size.
- Export dialog: choose stores and sizes; ZIP gets folders (`play/phone/01.png`, `appstore/6.9/01.png`).

### 3.9 Localization — **M–L**

- Project holds text per language; editor language switcher; "add language" duplicates current copy.
- Paste translations as a table (one row per slide).
- Text fitting per language already exists (shrink + balance); add per-language font fallback (CJK, Arabic RTL, Devanagari).
- Export: `en/01.png`, `de/01.png`…

---

## 4. Editor upgrades (UX)

### 4.1 Per-slide layout picker — **S, quick win**

- Inspector shows the template's layout variants as thumbnails for the current slide: Hero, Tilt, Duo, Zoom, Text-bottom, Badge, Callout…
- Stored as a per-slide override; template colors and decor stay.

### 4.2 Direct manipulation on the canvas — **L**

- Click an element in the preview to select it (hit-test resolved boxes); the inspector switches to that element's options.
- Drag to move, corner handle to scale, rotate slider, all **clamped to safe areas** with snapping to center lines and margins.
- Hide/show toggles per element (description, badge, decorations).
- Keyboard nudging with arrow keys; accessible fallback controls in the inspector.

### 4.3 Blocks menu — **M**

- "Add" menu per slide: Callout, Rating, Laurels, Review, Stat, Feature list, Logo, Sticker, Text.
- Blocks drop into template-defined anchor areas (top, middle, bottom, beside phone), so placement starts right.

### 4.4 Slides as first-class items — **M**

- Slide list separate from screenshots: add, duplicate, delete, reorder slides; pick which screenshot each slide shows (or none).
- Undo/redo (command history on the reducer), autosave to IndexedDB, multiple projects, export/import project file (JSON + images).

### 4.5 Brand match — **S–M**

- Upload the app icon → extract a palette (k-means on pixels) → offer 3 theme suggestions.
- "Shuffle palette" and "Shuffle backdrop" buttons for quick exploration.
- Brand kit: save colors, fonts, logo; apply to any template.

### 4.6 Style controls — **S each**

- Device picker and device color; shadow strength (none, soft, strong, hard); screenshot corner radius; text color; text position presets (top, bottom); background type (solid, gradient, mesh, pattern, photo, collage).
- More font pairs (condensed display, rounded, mono-accent), all self-hosted via `next/font`.

### 4.7 Gallery — **S**

- Filters: style (Minimal, Bold, Dark, Gradient, Playful, Editorial, Photo), app category (Finance, Social, Education, Health, Productivity, Games), "has callouts", "panoramic".
- Hover to preview the full set; favorites.

---

## 5. New template collection ("inspired by", never copies)

Each is a style recipe, named generically. No logos, mascots, trade dress or names of real brands.

| Template | Recipe | Needs |
|---|---|---|
| **Playful Learning** | Saturated green/lime, chunky rounded display type, mascot slot, pop-out answer bubbles, bouncy blobs straddling slides | callouts, image slots, rounded font |
| **Cinematic** | Pure black, collage of the user's screenshots as a dimmed poster wall, red accent, flat devices, condensed bold type, bottom gradient | collage backdrop, flat device, condensed font |
| **Mono Minimal** | Black or white only, huge two-line headline, one phone, nothing else, kicker label | rich text kicker |
| **Fintech Glass** | Deep navy mesh gradient, frosted glass callout cards with numbers, perspective tilt, silver frames | callouts (glass), perspective, mesh |
| **Calm Wellness** | Soft pastel mesh, organic blobs, rounded serif, lots of air, stat block ("10 min a day") | mesh, stat block |
| **Social Pop** | Fanned 3 phones, floating avatar and chat bubbles, emoji stickers, bright gradient | 3-phone layout, stickers, callouts |
| **Pro Productivity** | Off-white, thin grid pattern, serif + sans, feature-list slide, laptop or browser frame option | pattern, feature list, browser frame |
| **Game Hype** | Full-bleed screenshot, angled color slabs, bold italic type, rating + laurels intro slide | full-bleed, slabs, social proof |
| **Health Stats** | Dark, big numbers and ring charts drawn in code, single neon accent | stat block, rings |
| **Commerce Bright** | White, product photo slots, price tags as callouts, coral accent | photo slots, tag callouts |

Target: 20+ templates in v1.5, each with 5–6 slide designs including an intro and an outro slide.

---

## 6. Quality and tooling

- **Golden-image tests**: Playwright renders every template slide and compares to stored PNGs (pixel tolerance), so engine changes never silently break templates.
- **JSON Schema** for `template.json`: autocomplete and inline errors in VS Code.
- **`npm run new-template`** scaffolder: copies a starter, registers it, opens the Lab.
- **Template Lab**: live JSON editing panel with instant re-render; contrast warnings; safe-area overlay.
- **Performance**: render exports in a Web Worker with `OffscreenCanvas`; cache decoded images; keep previews at 0.5 scale.
- **PNG size**: optional "optimize" pass (smaller grain, palette quantization) to keep files light.

---

## 7. Roadmap

Ordered by impact ÷ effort. Each phase ends usable and shippable.

### Phase D — Premium basics (≈ 2 weeks)

1. ☑ Per-slide layout picker (4.1): live thumbnails of the slide in every layout, stored per slide, follows reordering.
2. ◐ Rich text (3.3): ☑ `**emphasis**` and `==highlight==` markup with per-template styling; ☐ kicker label, emoji font.
3. ☑ Social proof blocks (3.4): rating, laurels, stat, review, plus layouts `proof-hero`, `review-phone`, `stat-hero`; adopted in Studio Blue, Aurora and Fresh Mint.
4. ☑ Image slots (3.5): `imageSlot` for app icon, logo, mascot with monogram fallback; Brand uploads in the editor; layout `brand-hero` (adopted on Midnight); app name shared with the store preview and ZIP name.
5. ☑ Generated backgrounds (3.6): `mesh` and `pattern` background types (set-wide, seeded); editor Background control with Shuffle.
6. ☑ Device library v1 (3.2): punch-hole, island and flat models; frame color swatches; per-set override.
7. ☑ 4 new templates: Mono Minimal, Calm Wellness, Pro Productivity, Health Stats (10 total).
8. ☑ Golden images (`e2e/visual.spec.ts`, 40 baselines) and JSON Schemas with VS Code mapping and a schema test.

### Phase E — Signature looks (≈ 3 weeks)

1. ◐ Pop-out callouts with region picker (3.1): ☑ `callout` element (card, glass, bubble; `follow` lifts it over its own spot), per-slide area picker with keyboard support and hide toggle, layouts `pop-out` and `pop-duo` (adopted in Studio Blue, Mono Minimal, Midnight, Pro Productivity); ☐ connector line from the phone.
2. ☑ Screenshot collage backdrop and full-bleed mode (3.6): `collage` background (set-wide tilted wall, blur, dim, shuffle; Background control and Cinematic) and `full-bleed` layout ("Full screen").
3. ◐ Intro/outro/text-only slides and slide list (3.7, 4.4): ☑ layouts `intro`, `statement`, `outro`; text-only designs no longer use a screenshot; slide toolbar (duplicate, text slide, move, delete) and per-slide screenshot picker; ☐ comparison and feature-grid slides.
4. ◐ Brand match from app icon (4.5): ☑ palette from the icon (`src/lib/palette.ts`), Accent / Bold / Soft suggestions limited to editable colors with WCAG contrast kept (4.5:1 text, 3:1 accents), one-click apply as one undo step; ☐ saved brand kit.
5. ◐ Undo/redo, autosave, projects (4.4): ☑ undo/redo (header + Ctrl+Z, typing merged per field), autosave to IndexedDB with restore and undoable Start over; ☐ multiple named projects.
6. ☑ 4 new templates: Playful Learning (bubble pop-outs, clay blobs), Cinematic (flat devices, glass, red glow), Fintech Glass (mesh, silver frames, glass cards), Social Pop (sunset gradient, pop-duo, review). 14 total.

### Phase F — Freedom without chaos (≈ 3 weeks)

1. ☑ Select and nudge on canvas with safe bounds and snapping (4.2): click/drag/corner-scale on the preview, keyboard nudges, snapping guides, per-slide element edits (move, size, rotation, hide) as deltas over the template, Elements list as accessible fallback.
2. Blocks menu (4.3).
3. Perspective device presets and slide-straddling phones (3.2).
4. Gallery filters and hover preview (4.7).

### Phase G — Scale (≈ 3–4 weeks)

1. ☑ Multi-size output incl. App Store and Play feature graphic (3.8): reflow from 1080 × 1920 to iPhone 6.9"/6.5" and iPad 13", feature graphic banner, preview size switch, Export dialog with store folders in the ZIP.
2. Localization with per-language export (3.9).
3. Worker-based export, PNG optimization (6).
4. Template count to 20+.

Later (product.md V2/V3): accounts, cloud projects, template marketplace, AI copy suggestions per slide, AI "make it premium" (auto-pick layouts and callout regions from the screenshots).

---

## 8. Model changes at a glance

```ts
// New element types
type CalloutElement = Box & { type: "callout"; slot: number; region: NormRect; radius?: number; shadow?: Shadow; style?: "card" | "glass" | "bubble" };
type RatingElement  = Box & { type: "rating"; score: string; count: string; color: Color };
type IconElement    = Box & { type: "icon"; name: string; color: Color };          // Lucide
type ImageSlot      = Box & { type: "imageSlot"; key: "appIcon" | "logo" | "mascot" | "photo"; fit: FitMode };

// Text spans
type TextElement = { /* … */ spans?: { text: string; weight?: number; color?: Color; highlight?: Color }[] };

// Project: per-slide overrides on top of the template
type SlideState = {
  id: string;
  screenshotId?: string;                 // or none for text-only slides
  layout?: string;                       // per-slide layout pick
  overrides?: Record<string, ElementOverride>; // nudges, hides, block settings
  blocks?: TemplateElement[];            // user-added blocks
  text: Record<string, Record<string, string>>; // per language
};
```

The renderer stays pure: template + project (+ size + language) → canvas.

---

## 9. Recommended next step

Phase D is done except the kicker label and emoji font. Phase E: undo/redo, autosave and pop-out callouts are in. The 4 new templates are in (14 total). Phase E is done except saved brand kits, multiple projects, comparison/feature-grid slides and the callout connector. Multi-size output is in. Next: **Phase F** (select and nudge on canvas, blocks menu) or **localization** (3.9).
