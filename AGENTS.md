# AGENTS.md — Screenshot Generator

## Mission

You are building a focused web application that turns raw mobile app screenshots into polished Google Play / App Store marketing screenshots.

The product is NOT a general-purpose image editor.

The core promise is:

> **Pick a template. Drop in your screenshots. Download the finished screenshot set.**

---

## Primary User Flow

```text
Choose Template
      ↓
Upload Screenshots
      ↓
Automatic Placement
      ↓
Optional Customization
      ↓
Preview
      ↓
Export
```

This flow should always remain obvious.

---

## Product Priorities

Priority 1:
- Correct screenshot rendering

Priority 2:
- Extremely simple workflow

Priority 3:
- High-quality templates

Priority 4:
- Fast browser-side export

Priority 5:
- Visual polish

Do not sacrifice usability for decorative UI.

---

## Design Direction

Use (full spec in `design.md`):

**Soft Claymorphism + Neo-Pop accents + light Neo-Brutalism + Bento + Editorial**

Visual characteristics:

- Medium claymorphism in the hero only; light clay touch elsewhere
- 2px ink border + hard shadow reserved for CTAs, stickers and badges
- Electric blue as the one dominant accent; yellow only in the hero
- Pastel bento tiles
- Bricolage Grotesque display type at moderate sizes
- Halftone dots and starburst badges as pop-art details
- Clean spacing
- Premium composition

The interface should feel modern, creative and premium, not childish, not loud and not plain.

---

## Technical Principles

### Client-side first

The MVP should not require a backend for screenshot generation.

User images should be processed in the browser.

Benefits:

- Privacy
- Lower infrastructure cost
- Faster generation
- Works offline after assets load
- No image upload bandwidth

---

## Rendering Architecture

Use a dedicated renderer.

```text
Template JSON
      +
Project Data
      ↓
Renderer
      ↓
Canvas / SVG
      ↓
PNG
```

React should manage the UI.

The renderer should not depend heavily on React.

This makes exporting predictable and testable.

---

## Template System

Templates are configuration.

Example:

```text
templates/
├── template-001/
│   ├── template.json
│   └── preview.png
├── template-002/
│   ├── template.json
│   └── preview.png
└── template-003/
    ├── template.json
    └── preview.png
```

Do not build:

```text
Template1.tsx
Template2.tsx
Template3.tsx
...
```

unless a template genuinely needs custom behavior.

---

## Template Rules

Every template should define:

- Output size
- Background
- Screenshot slots
- Text slots
- Optional device frame
- Decorative elements
- Typography
- Theme variables

A template should be usable with different apps without changing its structure.

---

## Screenshot Rules

Never distort user screenshots.

Use:

- contain
- cover
- crop
- center

depending on the slot configuration.

Default behavior should prioritize preserving the actual UI screenshot.

---

## Export Rules

The final export must:

- Match exact dimensions
- Have no editor UI
- Have no selection outlines
- Have no debug elements
- Have deterministic positioning
- Preserve image quality

For batch export:

```text
01.png
02.png
03.png
04.png
05.png
```

Create a ZIP.

---

## UX Rules

Avoid asking users technical questions.

Do not ask:

- What canvas size?
- What DPI?
- What crop coordinates?
- What x/y position?

Templates should make those decisions.

Users should primarily choose:

- Template
- Screenshots
- Headline
- Description
- Theme

---

## Code Quality

Prefer:

- Small components
- Strong TypeScript types
- Pure rendering functions
- Reusable utilities
- Clear naming
- Minimal dependencies

Avoid:

- Giant components
- Global mutable state
- Template-specific hacks
- Unnecessary abstractions
- Premature backend services

---

## Testing

Every renderer change should test:

1. Portrait screenshot
2. Landscape screenshot
3. Very tall screenshot
4. Small screenshot
5. PNG export
6. Batch export
7. ZIP export
8. Text overflow
9. Long headline
10. Missing optional fields

---

## Future Features

Do not implement these in MVP unless required:

- Authentication
- Payments
- Cloud projects
- Collaboration
- AI copywriting
- Template marketplace
- Team accounts

Build the rendering engine correctly first.

The step-by-step build plan for the template engine and editor lives in `editor-plan.md`.
Template authoring rules and the element reference live in `templates.md`.

---

## Final Product Standard

The final experience should make a developer think:

> "I uploaded my screenshots and got professional Play Store graphics in seconds."

If a feature makes the workflow feel like a complicated design application, reconsider it.
