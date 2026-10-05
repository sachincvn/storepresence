# Claude Code Instructions — Screenshot Generator

## Project

Build a web application for generating professional app-store screenshots from predefined templates.

The core workflow is:

**Choose Template → Upload Screenshots → Customize → Export**

Do not turn this into a general-purpose design editor.

---

## Design System

The UI MUST follow the mixed direction in `design.md`:

**Soft Claymorphism + Neo-Pop accents + light Neo-Brutalism + Bento + Editorial**

Visual requirements:

- Claymorphism at medium strength in the hero only (`clay-hero`); light `clay` elsewhere
- Neo-brutalist 2px ink border + hard offset shadow only on CTAs, stickers, badges
- Electric blue `#3D5AFE` as the single dominant accent
- Yellow `#FFD43B` only inside the hero; pastels (lilac, mint, peach, sky) for tiles
- Bricolage Grotesque display (800) + Plus Jakarta Sans body, mid-size editorial type
- Bento feature grid with varied tile sizes
- Pop-art details: halftone dots, starburst badges
- Strong whitespace, premium visual hierarchy

Tokens and utilities live in `src/app/globals.css`. Decorative shapes live in `src/components/landing/Decor.tsx`.

Avoid generic SaaS styling.

Do not:

- Use oversized wide/black display type
- Put thick borders + hard shadows on every card
- Apply heavy claymorphism everywhere
- Use yellow fills below the hero
- Overuse glassmorphism, blur, pills or generic purple gradients

---

## Recommended Stack

Use:

- Next.js
- TypeScript
- React
- Tailwind CSS
- HTML/CSS
- Canvas API
- SVG where appropriate
- JSZip for batch export

Prefer browser-side processing for the MVP.

User screenshots should not need to leave the browser.

---

## Architecture

```text
src/
├── app/
├── components/
│   ├── editor/
│   ├── templates/
│   ├── upload/
│   └── export/
├── templates/
│   ├── modern/
│   ├── dark/
│   ├── neo-pop/
│   └── minimal/
├── renderer/
│   ├── canvasRenderer.ts
│   ├── imageFit.ts
│   ├── textRenderer.ts
│   └── templateRenderer.ts
├── types/
│   └── template.ts
├── utils/
└── lib/
```

---

## Template Architecture

Templates MUST be data-driven.

Do not create a separate React component for every template unless there is a strong reason.

Use:

```text
template.json
preview.png
assets/
```

A template should define:

- canvas size
- background
- elements
- screenshot slots
- text
- fonts
- colors
- shapes
- device frames
- shadows

---

## Template Type

Use a strongly typed model similar to:

```ts
type Template = {
  id: string;
  name: string;
  category: string;

  canvas: {
    width: number;
    height: number;
  };

  background: Background;

  elements: TemplateElement[];

  variables?: TemplateVariable[];
};
```

Elements may include:

```ts
type TemplateElement =
  | TextElement
  | ImageElement
  | ScreenshotElement
  | ShapeElement
  | DeviceElement;
```

---

## Screenshot Rendering

The renderer must automatically handle different source image sizes.

Required behavior:

- Preserve aspect ratio
- Support contain/cover modes
- Crop safely
- Center image
- Apply radius
- Apply shadow
- Apply device frame
- Never stretch screenshots unnaturally

Create a reusable utility:

```ts
fitImageToSlot(
  imageWidth,
  imageHeight,
  slotWidth,
  slotHeight,
  mode
)
```

---

## Export

Canvas output must match the template's exact dimensions.

Example:

```text
1080 × 1920
```

Do not rely on the browser viewport dimensions.

Export should work independently from UI zoom.

Provide:

```text
Export PNG
Export All
Download ZIP
```

Use JSZip for batch exports.

---

## Editor UX

The editor should contain:

### Left

Template selector.

### Center

Large preview canvas.

### Right

Minimal customization controls.

Controls:

- Screenshots
- Headline
- Description
- Colors
- Font
- Device frame
- Background

Do not expose raw x/y coordinates to users in the MVP.

---

## Upload

Drag-and-drop should be supported.

Also provide:

**Upload screenshots**

Support:

- PNG
- JPG
- WEBP

Show thumbnails after upload.

Allow:

- reorder
- remove
- replace

---

## State Management

Keep state simple initially.

A project state might contain:

```ts
type Project = {
  templateId: string;
  screenshots: Screenshot[];
  variables: Record<string, string>;
};
```

Do not introduce a heavy state-management library unless complexity requires it.

---

## Performance

Rendering must remain responsive.

Requirements:

- Resize large source images before rendering when appropriate
- Avoid unnecessary React re-renders
- Debounce expensive preview rendering
- Render final export at full resolution
- Keep preview resolution separate from export resolution

---

## Responsive Behavior

Desktop is the primary experience.

Desktop:

```text
Template Sidebar | Canvas | Inspector
```

Tablet:

```text
Templates
Canvas
Controls
```

Mobile:

```text
Canvas
Bottom controls
Template carousel
```

---

## Accessibility

Implement:

- Keyboard navigation
- Visible focus states
- Accessible labels
- Proper button semantics
- Sufficient contrast
- Reduced-motion support

---

## Development Rules

1. Build the smallest useful implementation first.
2. Avoid premature backend development.
3. Keep screenshot processing client-side.
4. Keep templates data-driven.
5. Do not hardcode template-specific editor logic.
6. Keep renderer independent from React UI.
7. Make export deterministic.
8. Test different screenshot aspect ratios.
9. Test high-resolution exports.
10. Test ZIP generation with multiple screenshots.

---

## Development Notes

- Stack in repo: Next.js 16 (App Router, `src/`), React 19, Tailwind CSS v4 (CSS-first `@theme`, no `tailwind.config`), TypeScript, JSZip.
- Next.js 16 differs from older versions. Check `node_modules/next/dist/docs/` before using unfamiliar APIs.
- Commands: `npm run dev`, `npm run build`, `npm run lint`, `npm test` (Vitest, `src/**/*.test.ts`), `npm run test:e2e` (Playwright, `e2e/`; builds and serves on port 3100, uses installed Chrome, `PW_BUNDLED=1` for bundled Chromium), `npm run schema` (regenerate template/layout JSON Schemas after changing `src/types/template.ts`).
- Golden images live in `e2e/visual.spec.ts-snapshots/` (per platform). After an intended visual change, review and run `npx playwright test e2e/visual.spec.ts --update-snapshots`.
- Editor/template engine build plan and status: `editor-plan.md`. Follow it step by step and tick steps when done.
- Next phases (premium templates, callouts, devices, blocks, multi-size, localization): `premium-plan.md`.
- When an AI agent runs `next dev`, Next.js appends a managed block to `AGENTS.md`. Prefer `npm run build` + `npx next start` for verification.
- `next.config.ts` pins `turbopack.root` because a stray lockfile exists in the user's home directory.
- Brand name: "StorePresence" (repo `storepresence`), set in `src/lib/site.ts`.
- Landing page: `src/components/landing/`. The template gallery renders real templates (`TemplateSetPreview`); hero, steps, features and CTA use decorative CSS mocks (`StorePoster` + `posters.ts`).
- Editor state: `editorState.ts` (pure reducer) wrapped by `history.ts` (undo/redo). Autosave: `useAutosave.ts` + `src/lib/projectStore.ts` (IndexedDB, this browser only). Uploaded images are freed only when no undo step references them, never directly on remove.
- Slides: `getSlides()` in `src/templates/resolve.ts` is the single source of the slide list (keys, designs, screenshots). Until the user arranges slides, slides follow screenshots; `project.slides` holds user-arranged slides.
- Store sizes: `src/templates/sizes.ts` (`OUTPUT_SIZES`, `adaptSpec` reflow) and `featureGraphic.ts`; templates stay designed at 1080 × 1920. Export dialog: `src/components/export/ExportDialog.tsx`.
- Editor: `/editor` (`src/components/editor/`). Templates: `src/templates/` (JSON + `registry.ts`). Renderer: `src/renderer/` (pure TS, no React).
- Adding or editing templates: follow `templates.md`, then check `/dev/templates` (Template Lab, dev only; `TEMPLATE_LAB=1 npx next start` opens it on a production build).

---

## Definition of Done for MVP

A user must be able to:

1. Open the application.
2. Choose one of at least 5 templates.
3. Upload multiple screenshots.
4. See screenshots automatically placed into the template.
5. Change headline/text.
6. Change the primary theme color.
7. Preview the result.
8. Export a PNG.
9. Export all screenshots as a ZIP.
10. Complete the entire workflow without creating an account.

The experience should feel like:

> **Pick → Drop → Done.**
