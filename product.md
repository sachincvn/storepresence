# Product Specification — Screenshot Generator

## 1. Product Overview

Screenshot Generator is a web application that allows app developers, indie hackers, agencies, and product teams to create professional Google Play / App Store screenshots quickly.

The core promise:

> **Upload your screenshots, choose a template, and get store-ready graphics.**

The product focuses on speed and automation rather than being a general-purpose design editor.

---

## 2. Problem

Creating app-store screenshots manually is repetitive.

Developers often need to:

- Design backgrounds
- Position screenshots
- Add headlines
- Create device mockups
- Maintain consistent spacing
- Export multiple images
- Repeat the work for every app update

Traditional design tools are too flexible for this simple workflow.

Users want:

**Upload → Choose → Generate → Download**

---

## 3. Target Users

### Primary

- Android developers
- Flutter developers
- Indie hackers
- Startup founders
- App agencies
- Mobile development teams

### Secondary

- Designers
- Marketing teams
- App publishers
- ASO consultants

---

## 4. Core Workflow

```text
Landing Page
     ↓
Template Gallery
     ↓
Choose Template
     ↓
Upload Screenshots
     ↓
Customize
     ↓
Preview
     ↓
Generate
     ↓
Download PNG / ZIP
```

---

## 5. MVP Scope

### Template System

Initial launch:

- 10–20 templates
- Multiple visual styles
- 1–5 screenshot layouts
- Light and dark templates
- Device-frame templates
- Text-focused templates

### Upload

Support:

- PNG
- JPG
- WEBP

Allow multiple uploads.

### Automatic Screenshot Handling

When an image is uploaded:

1. Read dimensions
2. Calculate aspect ratio
3. Fit into screenshot slot
4. Crop if necessary
5. Apply border radius
6. Apply device frame if enabled
7. Apply shadow
8. Render final output

---

## 6. Template Engine

Templates should not contain user-specific content.

Each template defines:

- Canvas
- Background
- Text placeholders
- Screenshot slots
- Device frames
- Decorative shapes
- Typography
- Colors

Example:

```json
{
  "id": "neo-pop-01",
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
      "default": "Your app, beautifully presented"
    },
    {
      "type": "screenshot",
      "id": "screenshot"
    }
  ]
}
```

---

## 7. Rendering

Recommended MVP architecture:

```text
React / Next.js
       ↓
Template Renderer
       ↓
HTML/CSS Editor
       ↓
SVG / Canvas
       ↓
PNG
```

Canvas is responsible for final raster output.

SVG can be used where scalable vector rendering is useful.

HTML/CSS should primarily handle the application interface and editor.

---

## 8. Export

Supported:

### Single

Download one PNG.

### Batch

Generate:

```text
01.png
02.png
03.png
04.png
05.png
```

### ZIP

Generate all files and download:

```text
my-app-screenshots.zip
```

---

## 9. Product Features

### MVP

- Template gallery
- Screenshot upload
- Multiple screenshots
- Template preview
- Headline editing
- Description editing
- Background color
- Accent color
- Device frame
- Automatic image fitting
- PNG export
- ZIP export
- Responsive editor

### V2

- Saved projects
- User accounts
- Cloud templates
- More fonts
- Brand kit
- Custom templates
- App icon support
- Screenshot ordering
- Duplicate template
- Undo/redo
- Export presets

### V3

- AI-generated screenshot copy
- AI template recommendations
- Automated ASO screenshot generation
- Brand-aware generation
- Localization
- Multiple languages
- Team collaboration
- Template marketplace

---

## 10. Monetization

Possible model:

### Free

- Limited templates
- Limited exports
- Small watermark or limited premium features

### Pro

- All templates
- Unlimited exports
- No watermark
- Premium device frames
- Brand kit
- Saved projects

### Template Packs

Optional one-time purchases for premium template collections.

---

## 11. Success Metrics

Track:

- Template selection rate
- Upload completion rate
- Export completion rate
- ZIP download rate
- Repeat usage
- Number of screenshots generated
- Free → paid conversion
- Most-used templates

The most important metric is:

**% of users who successfully export their first screenshot set.**

---

## 12. Product Principle

Do not become Canva.

The product wins by doing one thing extremely well:

> **Create beautiful app-store screenshots with almost no design work.**
