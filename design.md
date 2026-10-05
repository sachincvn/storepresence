# Design Specification — Screenshot Generator

## 1. Product Design Direction

The product uses a **mixed modern aesthetic**:

> **Soft Claymorphism + Neo-Pop accents + light Neo-Brutalism + Bento + Editorial**

Each style has a specific, limited job:

| Style | Where it is used | Where it is NOT used |
|---|---|---|
| Claymorphism | Hero stage, hero chips, a few clay spheres/pills. Medium strength in the hero only. | Everywhere else is flat or a very light clay touch. |
| Neo-Pop / Pop Art | Halftone dots, starburst badges, colourful template previews. | Never as full-page colour floods. |
| Neo-Brutalism | 2px ink outline + hard offset shadow on CTAs, stickers, step badges, one feature tile. | Never on every card or section. |
| Bento | Features grid with varied tile sizes. | — |
| Editorial | Bricolage Grotesque display type, inline image chips in the hero headline, split heading/intro rows. | No oversized wide/black type. |

The interface should feel like a premium, modern creative tool, not a generic SaaS dashboard and not a loud poster.

The visual personality:

> **Modern. Playful. Clean. Fast. Precise.**

Design history (do not repeat):

- v1 pure Neo-Pop Brutalism — rejected: type too large, too colourful, too boxy.
- v2 plain minimal — rejected: looked old and generic.
- v3 mixed direction (this spec) — approved, with clay reduced outside the hero and yellow limited to the hero.

---

## 2. Core UX Principle

The main workflow must be obvious:

**Choose Template → Upload Screenshots → Customize → Export**

Do not turn the product into a full Canva-like editor.

Users should not need to understand layers, coordinates, canvas dimensions, or design systems.

Templates control the layout.

Users provide the content.

---

## 3. Visual Language

Source of truth for tokens: `src/app/globals.css` (`@theme`).

### 3.1 Surfaces

- Page background: `canvas` `#F6F4FB` (very light lilac-grey).
- Cards: white or a pastel tint, `rounded-[28–44px]`.
- Card edge: hairline (`0 0 0 1px rgb(22 19 31 / 0.06)`) or `border-line` `#E4E0EE`.
- Thick ink borders (`2px #16131F`) only on neo-brutalist accents (see 3.3).

### 3.2 Clay utilities

| Utility | Strength | Use |
|---|---|---|
| `clay` | Light: top highlight + hairline + soft lift | Bento tiles, step tiles, small surfaces |
| `clay-hero` | Medium: puffier inner highlight + shading | Hero only (stage, chips) |
| `clay-dark` | Light, for dark surfaces | Ink tiles, blue CTA panel |

`ClaySphere` / `ClayPill` (`src/components/landing/Decor.tsx`) accept `rich` for the hero's glossier look. Keep decorative shapes to 2–3 in the hero and at most 1 per section elsewhere.

### 3.3 Neo-brutalist accents

```css
border: 2px solid #16131F;
box-shadow: 3px 3px 0 #16131F; /* shadow-pop-sm */
box-shadow: 5px 5px 0 #16131F; /* shadow-pop, hover */
```

Use on: buttons, stickers, step-number badges, one "pop" bento tile.

Buttons press in on `:active` (translate + shadow removed).

### 3.4 Color System

Base:

- Ink: `#16131F`
- Canvas: `#F6F4FB`
- White: `#FFFFFF`
- Muted text: `#5B5668`
- Line: `#E4E0EE`

Primary accent:

- Electric Blue: `#3D5AFE` (primary buttons, checks, links, CTA panel)

Pop accents:

- Yellow: `#FFD43B` — **hero only** (stage sphere, starburst, headline chip, template preview). Do not use yellow fills below the hero.
- Pink: `#FF6FAE` — small decorative touches only.

Clay pastels (tile backgrounds):

- Lilac `#E6DEFF`, Mint `#D3F4E4`, Peach `#FFE3D3`, Sky `#DCE8FF`

Rules:

- One dominant accent (blue) per screen, pastels for surfaces, pop colours as small details.
- Template previews may use their own palettes; they are product content, not UI chrome.

### 3.5 Typography

- Display: **Bricolage Grotesque** (`font-display`), weight 800, tight tracking (`-0.03em` to `-0.045em`).
- Body/UI: **Plus Jakarta Sans** (`font-sans`).

Scale:

- Hero: `clamp(2.6rem, 5.2vw, 4.5rem)`
- Section heading: `clamp(2.1rem, 3.8vw, 3.4rem)`
- Card heading: 24–28px
- Body: 16–18px
- Labels: 12–14px, bold, sentence case

Avoid all-caps eyebrow labels above every heading.

---

## 4. Bento Layout

Use modular cards rather than long flat sections.

Desktop features grid uses 12 columns with varied spans, for example:

```text
┌──────────────────────────────┬───────────────────┐
│  Any size in, perfect fit    │  Exact pixels     │
│  (7 cols, white)             │  (5 cols, ink)    │
├──────────────┬───────────────┼───────────────────┤
│  Private     │  ZIP (pop)    │  Customize        │
│  (sky)       │  (white+ink)  │  (mint)           │
└──────────────┴───────────────┴───────────────────┘
```

Each tile: heading + one-line body on top, an explanatory visual filling the bottom.

Recommended radius:

- Small: 12px
- Medium: 20–28px
- Large: 32–44px

---

## 5. Main Application Screens

### Landing Page

Hero:

> **Turn app screenshots into store-ready graphics.**

The headline contains two inline chips: a fan of mini template previews and a blue export icon.

Supporting copy:

> Pick a template, drop in your screenshots and export your entire Play Store set in seconds.

Primary CTA:

**Create screenshots**

Secondary CTA:

**Explore templates**

Hero visual: clay stage (lilac) holding a fanned stack of generated store screenshots, with a starburst, a size sticker and 2–3 clay shapes.

Sections in order: Hero → Three moves (steps) → Features bento → Template gallery → Closing CTA → Footer.

---

### Template Gallery

Grid of template cards.

Each card should show:

- Template preview
- Template name
- Category
- Number of screenshots supported
- Use Template affordance (whole card is the link)

Categories:

- Minimal
- Bold
- Dark
- Soft
- Gradient
- Product
- SaaS
- Finance
- CRM
- E-commerce
- Creative

---

### Editor

Desktop layout:

```text
┌───────────────────────────────────────────────────────┐
│ Logo                    Save          Export          │
├────────────┬──────────────────────────┬───────────────┤
│ Templates  │                          │ Customize     │
│            │                          │               │
│ Template   │        CANVAS            │ Screenshots   │
│ thumbnails │                          │ Text          │
│            │                          │ Colors        │
│            │                          │ Device        │
└────────────┴──────────────────────────┴───────────────┘
```

The canvas should be the visual focus.

Controls should remain minimal. Editor chrome follows the same rules: light clay surfaces, blue primary actions, neo-brutalist buttons, no yellow fills.

---

## 6. Template Design System

Templates are data-driven.

A template consists of:

```text
template/
├── template.json
├── preview.png
└── assets/
```

`template.json` controls:

- Canvas size
- Background
- Text blocks
- Screenshot slots
- Device frames
- Shapes
- Decorations
- Shadows
- Typography
- Export settings

Example:

```json
{
  "id": "bold-gradient-01",
  "name": "Bold Gradient",
  "canvas": {
    "width": 1080,
    "height": 1920
  },
  "elements": [
    {
      "type": "text",
      "id": "headline",
      "x": 540,
      "y": 180,
      "align": "center",
      "fontSize": 76
    },
    {
      "type": "screenshot",
      "id": "screen",
      "x": 140,
      "y": 480,
      "width": 800,
      "height": 1200
    }
  ]
}
```

---

### Template quality bar

Every template is a set of at least 4 slides that look designed together:

- Vary layouts across the set (hero, tilt, duo, zoom, text-bottom, badge).
- Connect slides with a panorama layer (glows, clay shapes or halftone crossing slide edges), or alternate deliberate per-slide backgrounds.
- One strong idea per template (aurora glows, clay, pop hard shadows, editorial serif, airy minimal).
- Headlines 2 lines max at full size, balanced; descriptions optional.
- Check every template in the editor's Full set and Store preview views before shipping.

## 7. Export Experience

Primary action:

**Export**

Options:

- PNG
- JPG
- ZIP

If multiple screenshots are uploaded:

```text
01.png
02.png
03.png
04.png
05.png
```

Then:

**Download ZIP**

Export must preserve exact template dimensions.

---

## 8. Interaction Principles

Animations should be subtle but playful.

Good:

- Hero entrance (posters rise in once)
- Slow idle float on hero clay shapes
- Card lift / slight tilt on hover
- Button press animation (hard shadow collapses)
- Smooth canvas transitions

Avoid:

- Excessive parallax
- Slow page transitions
- Fade-and-slide on every section
- Decorative animation that delays work

All motion must stop under `prefers-reduced-motion`.

---

## 9. Responsive Design

Desktop is the primary design target.

Mobile must remain functional.

Desktop:

- 3-column editor
- Large canvas
- Template sidebar
- Inspector panel

Tablet:

- 2-column editor

Mobile:

- Canvas first
- Bottom-sheet controls
- Horizontal template carousel
- Full-screen preview

No horizontal page scroll at 390px width.

---

## 10. Accessibility

Despite the bold visual style:

- Maintain readable contrast
- Never communicate state using color alone
- Keyboard navigation must work
- Buttons need accessible labels
- Focus states must be visible (3px blue outline)
- Decorative visuals are `aria-hidden`
- Text should remain selectable where appropriate

---

## 11. Design Anti-Patterns

Do not use:

- Oversized extra-wide/black display type (v1 mistake)
- Flat grey minimal pages with no character (v2 mistake)
- Yellow fills outside the hero
- Heavy claymorphism on every surface
- Thick borders + hard shadows on every card
- Generic purple SaaS gradients
- Excessive glassmorphism or blur
- Tiny typography
- Dense dashboards
- Too many controls
- Random colors
- Decorative elements that reduce clarity

The product should feel **designed**, not decorated.
