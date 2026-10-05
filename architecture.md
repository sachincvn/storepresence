# Architecture — Screenshot Generator

## 1. Architecture Overview

Screenshot Generator is a client-first web application for creating professional Google Play and App Store screenshots from predefined templates.

The primary architecture principle is:

> Templates define the design. Users provide the content. The renderer produces the final image.

Core workflow:

Choose Template → Upload Screenshots → Apply Template → Customize → Preview → Render → PNG / ZIP

## 2. High-Level Architecture

```text
Next.js Application
│
├── Template Gallery
├── Editor UI
│   ├── Upload
│   ├── Customize
│   └── Preview
│
├── Template Engine
│
├── Render Engine
│   └── Canvas + SVG
│
└── Export Engine
    └── PNG + ZIP

MVP: No Backend
```

## 3. Technology Stack

- Next.js
- React
- TypeScript
- Tailwind CSS
- HTML/CSS for editor UI
- Canvas API for raster rendering
- SVG for vector graphics
- JSZip for batch exports
- React state initially
- Vercel or similar for deployment

No backend, database, or storage is required for the MVP.

## 4. Core Architecture Principles

### Client First

All screenshot processing should happen in the browser.

```text
User Image
    ↓
Browser Memory
    ↓
Template Renderer
    ↓
Canvas
    ↓
PNG
    ↓
Download
```

Benefits:

- Better privacy
- Lower infrastructure cost
- Faster processing
- No image storage cost
- No backend image-processing service
- No account required

## 5. Application Layers

```text
Presentation
     ↓
Application
     ↓
Template
     ↓
Rendering
     ↓
Export
```

### Presentation Layer

Responsible for website UI.

```text
components/
├── editor/
├── templates/
├── upload/
├── preview/
├── controls/
└── export/
```

The presentation layer must not contain rendering logic.

### Application Layer

Responsible for project state and user actions.

```ts
type Project = {
  templateId: string;
  screenshots: Screenshot[];
  variables: Record<string, string>;
  theme: {
    primary: string;
    secondary?: string;
  };
};
```

## 6. Template Layer

Templates are data-driven.

```text
templates/
├── modern-blue/
│   ├── template.json
│   ├── preview.png
│   └── assets/
├── neo-pop/
│   ├── template.json
│   ├── preview.png
│   └── assets/
└── dark-minimal/
    ├── template.json
    ├── preview.png
    └── assets/
```

A template defines:

- Canvas size
- Background
- Text blocks
- Screenshot slots
- Device frames
- Decorative shapes
- Typography
- Colors
- Shadows

Example:

```json
{
  "id": "neo-pop-01",
  "name": "Neo Pop",
  "category": "Bold",
  "canvas": {
    "width": 1080,
    "height": 1920
  },
  "background": {
    "type": "solid",
    "value": "#FFE500"
  },
  "elements": [
    {
      "type": "text",
      "id": "headline",
      "x": 540,
      "y": 180,
      "width": 900,
      "fontSize": 76,
      "fontWeight": 800,
      "align": "center"
    },
    {
      "type": "screenshot",
      "id": "main-screen",
      "x": 140,
      "y": 480,
      "width": 800,
      "height": 1200,
      "fit": "contain",
      "radius": 40,
      "shadow": true
    }
  ]
}
```

## 7. Template Elements

Support reusable elements:

- Text
- Screenshot
- Image
- Shape
- Device frame

Example:

```ts
type TemplateElement =
  | TextElement
  | ImageElement
  | ScreenshotElement
  | ShapeElement
  | DeviceElement;
```

## 8. Template Variables

Templates support dynamic variables:

```text
{{headline}}
{{description}}
{{appName}}
{{screenshot}}
{{primaryColor}}
{{secondaryColor}}
```

The editor supplies values and the renderer applies them.

## 9. Rendering Engine

The rendering engine is the core technical component.

```text
Template
   +
Project
   +
Assets
   ↓
Renderer
   ↓
Canvas
   ↓
Image
```

Keep the renderer independent from React.

Recommended structure:

```text
renderer/
├── templateRenderer.ts
├── canvasRenderer.ts
├── textRenderer.ts
├── imageRenderer.ts
├── shapeRenderer.ts
├── deviceRenderer.ts
├── imageFit.ts
└── exportRenderer.ts
```

## 10. Canvas Rendering

The canvas represents the final output.

```ts
const canvas = document.createElement("canvas");

canvas.width = 1080;
canvas.height = 1920;

const ctx = canvas.getContext("2d");
```

Recommended layer order:

```text
Background
    ↓
Shapes
    ↓
Decorations
    ↓
Text
    ↓
Screenshot
    ↓
Device Frame
    ↓
Foreground Elements
```

## 11. Screenshot Fitting

User screenshots can have different dimensions.

Never stretch screenshots unnaturally.

Support:

- contain
- cover
- crop

Default to `contain` unless a template explicitly requires another mode.

A reusable utility should handle this:

```ts
fitImageToSlot(
  imageWidth,
  imageHeight,
  slotWidth,
  slotHeight,
  mode
)
```

## 12. Preview vs Export

Do not render every preview at full resolution.

Example:

```text
Final:   1080 × 1920
Preview: 540 × 960
```

Preview should be fast.

Export should render at full template resolution.

## 13. Export Architecture

Single export:

```text
Project
   ↓
Renderer
   ↓
Canvas
   ↓
Blob
   ↓
Browser Download
```

Use Canvas `toBlob()` for PNG generation.

## 14. Batch Export

For five uploaded screenshots:

```text
Screenshot 1 → 01.png
Screenshot 2 → 02.png
Screenshot 3 → 03.png
Screenshot 4 → 04.png
Screenshot 5 → 05.png
```

Then:

```text
PNG files
   ↓
JSZip
   ↓
ZIP
   ↓
Download
```

## 15. Recommended Project Structure

```text
screenshot-generator/
│
├── app/
│   ├── page.tsx
│   ├── editor/
│   └── templates/
│
├── components/
│   ├── editor/
│   ├── templates/
│   ├── upload/
│   └── export/
│
├── renderer/
│   ├── templateRenderer.ts
│   ├── canvasRenderer.ts
│   ├── imageRenderer.ts
│   ├── textRenderer.ts
│   ├── shapeRenderer.ts
│   ├── deviceRenderer.ts
│   ├── imageFit.ts
│   └── exportRenderer.ts
│
├── templates/
│   ├── modern-blue/
│   ├── neo-pop/
│   ├── dark-minimal/
│   └── gradient-phone/
│
├── types/
│   ├── template.ts
│   ├── project.ts
│   └── screenshot.ts
│
├── lib/
│   ├── zip.ts
│   └── download.ts
│
└── public/
    ├── fonts/
    └── assets/
```

## 16. State Flow

```text
User Action
    ↓
React State
    ↓
Project State
    ↓
Renderer
    ↓
Canvas Preview
```

React/project state remains the source of truth.

## 17. Template Loading

### MVP

Templates are bundled with the application:

```text
templates/
    ↓
Next.js Build
    ↓
Browser
```

### Future

Templates can be loaded from Supabase or another CDN:

```text
Cloud Template Store
        ↓
Template API
        ↓
Browser
```

This allows new templates to be added without releasing a new application version.

## 18. Performance

Preview:

```text
Low Resolution
    ↓
Fast Render
    ↓
Interactive Preview
```

Export:

```text
Full Resolution
    ↓
High Quality Render
    ↓
PNG
```

Web Workers may be introduced later for expensive batch rendering.

Do not add them before profiling shows they are needed.

## 19. Privacy

Because processing is client-side:

- Screenshots do not need to leave the browser.
- No image storage is required.
- No server-side image processing is required.
- No account is required for the MVP.

Use temporary object URLs for uploaded files and revoke them when no longer needed.

## 20. Error Handling

Handle:

- Invalid file type
- Very large images
- Rendering failures
- Export failures

Never lose the user's editor state when an export fails.

## 21. Accessibility

Support:

- Keyboard navigation
- Visible focus states
- Accessible upload controls
- Proper button labels
- Sufficient contrast
- Screen-reader-friendly controls

## 22. Testing

Test independently:

### Template parser

```text
JSON → Valid Template
```

### Image fitting

```text
Input image + slot → Correct contain/cover result
```

### Renderer

```text
Template + Project → Canvas
```

### Export

```text
Canvas → PNG
```

### Batch export

```text
Multiple screenshots → PNG files → ZIP
```

Test portrait, landscape, very tall, small, long-headline, and missing-optional-field cases.

## 23. Future Cloud Architecture

When required:

```text
                 Next.js
                    │
        ┌───────────┼───────────┐
        ↓           ↓           ↓
     Supabase     Storage     Payments
       Auth       Templates
        │
        ↓
    User Projects
```

Possible services:

- Supabase Auth
- Supabase Database
- Supabase Storage
- Stripe/Razorpay
- Vercel

The rendering engine should remain client-side.

## 24. Evolution

### Phase 1

```text
Local templates
      ↓
Local rendering
      ↓
PNG / ZIP
```

### Phase 2

```text
Cloud templates
      ↓
Premium templates
```

### Phase 3

```text
Accounts
      ↓
Saved projects
      ↓
Brand kits
```

### Phase 4

```text
AI
 ↓
Copy generation
 ↓
Template recommendation
 ↓
Automatic screenshot generation
```

## 25. Final Principle

Keep the system simple:

```text
                TEMPLATE
                    │
                    ↓
USER SCREENSHOTS → RENDERER → PNG
                    ↑
                    │
                VARIABLES
```

The renderer is the core product.

The website is the interface around it.

The templates are the design library.

The ideal experience is:

> Pick a beautiful template → drop your screenshots → make one or two changes → download.
