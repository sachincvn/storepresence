


Design · MD
# design.md — Product Landing Page
 
> Design spec reverse-engineered from finderbuddy.net (a native-Mac utility landing page) and generalized so it can be applied to **your product**. Values marked *measured* come from the live page's computed styles; replace `{Product}` and copy placeholders with your own. Use it as a style reference, not a copy: swap in your own brand color, fonts, mascot and illustrations.
 
---
 
## 1. Design principles
 
1. **Show the product working, not screenshots of it.** Every section has a live, coded mini-UI (a fake Finder window, a compression card, a rename list) that demonstrates the benefit in one glance.
2. **One idea per section.** Eyebrow → 2-line headline → one-sentence lede → proof visual. Nothing more.
3. **Two-tone headlines.** Line 1 in ink, line 2 in brand purple ("Feels like it belongs / *on your Mac.*").
4. **Calm, premium, native feel.** Soft lavender canvas, white glassy cards, hairline borders, layered soft shadows; looks like the OS it lives in.
5. **Trust everywhere.** Small reassurance lines under every CTA ("100% local · No account · No subscription").
6. **Concrete numbers > adjectives.** "4.2 MB → 1.1 MB · 74% smaller", "0 uploads", "96 left".
---
 
## 2. Color tokens
 
| Token | Value | Use |
|---|---|---|
| `--ink` | `#13101F` *measured* | Headlines, body text on light |
| `--ink-muted` | `#625E75` *measured* | Paragraphs, secondary labels |
| `--ink-a35 / a55 / a70 / a80` | `rgba(19,16,31,.35/.55/.7/.8)` | Tertiary text, icons, meta |
| `--canvas` | `#F4F3F9` *measured* | Page background |
| `--surface` | `#FFFFFF` | Cards, nav, panels |
| `--surface-glass` | `rgba(255,255,255,.8)` + `backdrop-filter: blur(16px)` | Sticky nav, floating chips |
| `--brand-500` | `#6D3FF0` *measured* | Accent text, links, line-2 headlines |
| `--brand-600` | `#6232E0` | Primary button gradient end |
| `--brand-700` | `#5024C8` *measured* | Pressed / dark accents |
| `--brand-800` | `#4A1FBF` | Primary button 1px ring |
| `--brand-400` | `#8B64FF` | Primary button gradient start |
| `--brand-50` | `#EFEAFE` *measured* | Tag/pill backgrounds, icon tiles |
| `--success` | green (≈ `#22A55B`) | "Done", "Saved", savings figures |
| `--danger` | red (≈ `#E5484D`) | PDF file badges, macOS close dot |
| `--hairline` | `rgba(0,0,0,.06–.10)` | Borders, dividers, 1px rings |
 
**Hero gradient** *measured*
```css
background: linear-gradient(180deg, #5530D6 0%, #7C5CEE 55%, #E2D9FC 100%);
```
Overlay with soft blurred white "cloud" blobs and a subtle grain/noise texture. The CTA band before the footer reuses it and ends in a **torn-paper edge**.
 
**Rule:** ~85% neutrals, ~12% brand purple, ~3% semantic colors (green/red/orange only inside product mock-ups and file-type icons).
 
---
 
## 3. Typography
 
| Role | Font | Size / line-height | Weight | Tracking |
|---|---|---|---|---|
| Display / H1 | **Geomini** (geometric grotesk) | 57.6px / 1.04 *measured* (clamp 40→72px) | 500 | −0.035em (−2px) |
| H2 section | Geomini | 48px / 1.05 *measured* (clamp 34→56px) | 500 | −0.03em |
| H3 card title | Geomini | 20px / 28px *measured* | 500 | −0.5px |
| Lede | **Uncut Sans** | 18px / 1.625 | 400 | 0 |
| Body | Uncut Sans | 16px / 24px *measured* | 400 | 0 |
| Small / meta | Uncut Sans | 13–14px | 400–500 | 0 |
| Eyebrow / labels | Uncut Sans | 12–13px | 500 | +0.06em, UPPERCASE for "MOST USED" style labels; sentence case + icon for section eyebrows ("Made for Mac ⌘") |
 
Free alternatives if you don't license these: **Display:** "Satoshi", "General Sans", "Geist". **Text:** "Inter", "Geist", "Uncut Sans" (free).
 
Headlines are always **2 lines**, with a manual `<br>`; second line often in `--brand-500`.
 
---
 
## 4. Spacing, layout & grid
 
- **Container:** `max-width: 1128px` *measured*, side padding 24px (16px mobile).
- **Text measure:** ledes capped at 576–672px; card copy 320–384px.
- **Section padding:** 80px top/bottom default *measured*, 112–128px for hero & final CTA; 56px on mobile.
- **Spacing scale (4-pt):** 4, 8, 12, 16, 20, 24, 32, 40, 56, 80, 112, 128.
- **Section header layouts (alternate them):**
  - *Centered* — hero, "One app", "How it works".
  - *Split* — headline left, lede right-aligned to baseline ("Feels like it belongs…").
  - *Sticky left / content right* — FAQ, Pricing.
- **Grids:** Bento (features) 3-col with mixed spans; tools list 2×5; personas 3-col; feature list 4×2.
---
 
## 5. Shape, depth & effects
 
**Radius scale** *measured*: `4` (badges), `8` (inputs/rows), `12` (buttons small, inner cards), `16` (buttons large, cards), `22–24` (big panels / bento tiles), `9999` (pills, chips).
 
**Elevation**
```css
--ring:     0 0 0 1px rgba(0,0,0,.06);
--shadow-1: var(--ring), 0 1px 2px rgba(19,16,31,.04);
--shadow-2: var(--ring), 0 8px 24px -12px rgba(19,16,31,.18);
--shadow-3: var(--ring), 0 24px 60px -24px rgba(80,36,200,.30); /* hero window, app mock */
--inner-hi: inset 0 1px 0 rgba(255,255,255,.35);               /* top highlight on buttons */
```
- Cards: white, `--shadow-1`, 1px hairline ring; hover lifts to `--shadow-2` and `translateY(-2px)`.
- Large mock panels sit inside a **tinted frame** (lavender 1px border + 6–8px padding) — a "device bezel" effect.
- Glass: nav and floating toasts use `rgba(255,255,255,.8)` + blur.
- Subtle **noise texture** on the canvas and hero to avoid flat digital look.
---
 
## 6. Components
 
### Navigation
Floating, sticky pill bar, 24px from top, inset from edges, `radius 16`, glass surface. Logo (mascot icon + wordmark) left; 5–6 text links center (`--ink-a70`, 14px); primary CTA right.
 
### Buttons
| Variant | Style *measured* |
|---|---|
| **Primary** | `linear-gradient(#8B64FF → #6232E0)`, white text 16/500, radius 16, height 56 (L) / 48 (M) / 40 (S), ring `0 0 0 1px #4A1FBF`, `--inner-hi`, glow `0 8px 20px -8px rgba(98,50,224,.75)` |
| **Secondary (light)** | `linear-gradient(#FFFFFF → #F1EEFA)`, ink text, hairline ring, same sizes |
| **Dark** | `--ink` fill, white text (footer) |
| **Text link** | ▶ icon + underlined label ("See how it works") |
 
Signature detail: every CTA has a **trailing arrow inside its own square tile** (32–40px, radius 10, slightly darker/brand fill). Padding is asymmetric: `0 8px 0 24px`.
 
### Badges & pills
- **Announcement pill** above H1: glass, sparkle icon, "Launch price: ₹499 · only 96 left (regular ₹1,599)".
- **Feature tags**: `--brand-50` bg, `--brand-500` text, 13px, pill radius.
- **Status chips**: "Local" (green dot), "Saved 74%" (green text).
### Cards
- **Bento feature card:** visual on top (live mini-UI), H3 + 1-line description, tag row at bottom. Radius 22–24, padding 24–28.
- **Step card** (How it works): big muted number "01", visual, title, one line.
- **Persona card:** icon tile, persona name, quote-style pain line, "MOST USED" label + tags.
- **Tool tile:** colored icon square (soft tint) + name + 1-line description.
### Comparison table ("The old way vs. {Product} way")
Two columns, same row labels; old way in muted ink with strike-through-feeling grey icons, new way in brand card with check icons and slight elevation.
 
### Pricing card
Product name + "One payment, no subscription" → big price with struck-through regular price → "Save 69%" green badge → scarcity progress ("96 left") → full-width primary CTA → micro-reassurance → "EVERYTHING INCLUDED" checklist. Secondary card below: "Not ready to buy? Try it free" + secondary button.
 
### FAQ accordion
Single white card, rows divided by hairlines, question 18px/500, `+` icon rotating to `×` (brand color) when open, answer in `--ink-muted`.
 
### Footer
Logo + one-line description + dark CTA + social icon; trust micro-links (14-day money-back, Lifetime updates); 3 link columns; bottom bar with © and a human note ("Built by two school friends in India"). **Giant outlined wordmark** in a vertical-stripe pattern bleeds off the bottom.
 
---
 
## 7. Page structure (section-by-section)
 
| # | Section | Purpose | Key pattern |
|---|---|---|---|
| 1 | **Hero** | Promise + CTA | Purple gradient; announcement pill; 2-line H1 ("Your Mac's right-click menu. / But useful."); lede; primary + text CTA; trust line; "Ask AI" chip row (ChatGPT, Claude, Perplexity…); large interactive product mock overlapping into next section with floating toasts ("Done · Saved next to the original") and a 3-step strip |
| 2 | **Marquee** | Breadth | Infinite scrolling pill row of categories |
| 3 | **Features (bento)** | What it does | 6 tiles, each with a live micro-demo |
| 4 | **How it works** | Reduce friction | 3 numbered steps: Select → Right-click → Do it |
| 5 | **The difference** | Why switch | Old-way vs new-way comparison + CTA |
| 6 | **Batch tools** | Depth feature | Split: copy + bullet list left, interactive app panel right (before/after totals) |
| 7 | **Utilities** | Catalog | 10 tool tiles grid |
| 8 | **Privacy** | Trust | "Your files stay yours." + 3 pillars + "Recent activity · On this Mac" panel with "Uploaded 0 KB / Accounts None" stats |
| 9 | **Made for {platform}** | Native quality | Full app UI recreation + 8-item feature grid |
| 10 | **Pricing** | Convert | Launch/scarcity pricing card + free tier + existing-customer note |
| 11 | **Who it's for** | Relevance | 3 persona cards with mini-demos |
| 12 | **FAQ** | Objections | Sticky heading left, accordion right |
| 13 | **Final CTA** | Last push | Purple band, eyebrow "YOUR FILES HAVE A NEW BUDDY", H2, two CTAs, 4 trust chips, drop-zone visual, torn edge |
| 14 | **Footer** | Navigate | As above |
 
---
 
## 8. Motion
 
- **Entrance:** fade + 12–16px rise, 500–600ms, `cubic-bezier(.22,1,.36,1)`, staggered 60–80ms within groups; trigger once at 20% in view.
- **Marquee:** linear, ~40s loop, pause on hover; duplicated row for seamless loop.
- **Micro-demos:** looping 3–5s scripted sequences (cursor moves, menu opens, toast appears, numbers count up 4.2 → 1.1 MB).
- **Hover:** cards lift 2px; button arrow tile nudges 2px right; 150–200ms.
- Respect `prefers-reduced-motion`: disable loops, keep static end-state.
---
 
## 9. Voice & copy rules
 
- Headlines: short, conversational, a twist on line 2 ("Your files. / More useful.", "One file is easy. / 100 files shouldn't be harder.").
- Name the pain plainly ("sketchy websites", "Queues and ads").
- Every claim paired with a number or proof visual.
- Micro-copy under CTAs: 3 reassurances separated by `·`.
- Eyebrows: 1–2 words ("Features", "The difference", "Privacy").
---
 
## 10. Responsive
 
| Breakpoint | Changes |
|---|---|
| ≥1024px | Full layouts as described |
| 768–1023 | Bento → 2 cols; split headers stack; nav links collapse to menu |
| <768 | Single column; H1 40px, H2 34px; section padding 56px; hero mock scales/crops (show one focused card instead of the full window); comparison table becomes two stacked cards; sticky CTA bar at bottom optional |
 
Touch targets ≥44px; marquees remain but slower.
 
---
 
## 11. Accessibility
 
- Contrast: `--ink-muted` on `--canvas` ≥ 4.5:1; white on hero purple only above the 55% gradient stop (keep text in the top half).
- Decorative mock-ups `aria-hidden="true"`; provide a short text equivalent.
- Accordion uses `<button aria-expanded>`; marquee has a pause control.
- Visible focus ring: `0 0 0 3px rgba(109,63,240,.35)`.
---
 
## 12. Starter CSS tokens
 
```css
:root{
  --ink:#13101F; --ink-muted:#625E75; --canvas:#F4F3F9; --surface:#FFF;
  --brand-50:#EFEAFE; --brand-400:#8B64FF; --brand-500:#6D3FF0;
  --brand-600:#6232E0; --brand-700:#5024C8; --brand-800:#4A1FBF;
  --success:#22A55B; --hairline:rgba(0,0,0,.08);
  --font-display:"Geomini","Satoshi",ui-sans-serif,sans-serif;
  --font-text:"Uncut Sans","Inter",ui-sans-serif,system-ui,sans-serif;
  --r-sm:8px; --r-md:12px; --r-lg:16px; --r-xl:24px; --r-pill:9999px;
  --container:1128px; --section-y:80px;
  --ease:cubic-bezier(.22,1,.36,1);
}
.btn-primary{
  height:56px; padding:0 8px 0 24px; border-radius:var(--r-lg);
  display:inline-flex; align-items:center; gap:16px;
  font:500 16px/1 var(--font-text); color:#fff;
  background:linear-gradient(var(--brand-400),var(--brand-600));
  box-shadow:0 0 0 1px var(--brand-800), inset 0 1px 0 rgba(255,255,255,.35),
             0 8px 20px -8px rgba(98,50,224,.75);
}
.btn-primary .arrow{width:40px;height:40px;border-radius:10px;
  display:grid;place-items:center;background:rgba(255,255,255,.18)}
.h-display{font:500 clamp(40px,5vw,72px)/1.04 var(--font-display);letter-spacing:-.035em}
.h-section{font:500 clamp(34px,4vw,56px)/1.05 var(--font-display);letter-spacing:-.03em}
.h-section em{font-style:normal;color:var(--brand-500)}
.card{background:var(--surface);border-radius:var(--r-xl);
  box-shadow:0 0 0 1px var(--hairline),0 1px 2px rgba(19,16,31,.04)}
```
 
---
 
## 13. Adapting to your product — checklist
 
- [ ] Replace brand purple with your primary (keep the 50/400/500/600/800 ramp structure).
- [ ] Choose your mascot/logo and the "native environment" to mock (browser, phone, CRM dashboard, etc.).
- [ ] Write the hero as *"Your {familiar thing}. / But {better}."*
- [ ] Pick 6 features for the bento, each with one measurable micro-demo.
- [ ] Define 3 steps for "How it works".
- [ ] Build the old-way vs new-way table from real customer pain.
- [ ] Choose 3 personas and their "most used" features.
- [ ] Decide pricing model + one honest urgency lever.
- [ ] Collect 6–8 FAQs from sales/support.
 
