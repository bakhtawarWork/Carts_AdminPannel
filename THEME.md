# Carts Admin — Theme, Colors & UI Spec

Use this document as the **single source of truth** when building the Vendor Panel so it matches the Admin app visually and structurally.

**Stack in Admin:** Next.js 16 + React 19 + **Tailwind CSS v4** (via `@tailwindcss/postcss`). No shadcn/ui, no Material UI, no separate design-system package. Styling is almost entirely Tailwind utility classes plus a small set of CSS variables in `src/app/globals.css`.

---

## 1. Design personality

| Trait | Guidance |
| --- | --- |
| Mood | Clean, operational admin UI — light, airy, professional |
| Density | Comfortable (not cramped); generous white cards on a cool gray canvas |
| Brand accent | Strong **red** (`#e31e24`) used sparingly for CTAs, active nav, focus rings, eyebrow labels |
| Neutrals | Tailwind **slate** scale for text, borders, surfaces |
| Corners | Soft: `rounded-lg` (controls), `rounded-xl` / `rounded-2xl` (cards/panels) |
| Shadows | Very subtle slate-tinted elevation — never heavy drop shadows |
| Icons | Inline SVG, `strokeWidth="1.75"`, `currentColor`, typically `h-4 w-4` or `h-5 w-5` |
| Dark mode | **Not used** for content areas. Only the sidebar is dark (`slate-950`) |

Avoid: purple/indigo themes, cream/serif looks, neon glows, pill-heavy marketing UI, emoji decoration.

---

## 2. CSS variables & Tailwind theme tokens

Defined in `src/app/globals.css`:

```css
:root {
  --background: #f7f7f8;
  --foreground: #0f172a;
  --brand: #e31e24;
  --brand-hover: #c4181e;
  --brand-soft: #fdecec;
  --scrollbar-size: 6px;
  --scrollbar-track: var(--brand-soft);
  --scrollbar-thumb: var(--brand);
  --scrollbar-thumb-hover: var(--brand-hover);
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-brand: var(--brand);
  --color-brand-hover: var(--brand-hover);
  --color-brand-soft: var(--brand-soft);
  --font-sans: var(--font-geist-sans);
  --font-mono: var(--font-geist-mono);
}
```

### Tailwind class mapping

| Token | Hex / value | Tailwind usage |
| --- | --- | --- |
| Brand | `#e31e24` | `bg-brand`, `text-brand`, `border-brand`, `ring-brand`, `focus:border-brand` |
| Brand hover | `#c4181e` | `hover:bg-brand-hover`, `hover:text-brand-hover` |
| Brand soft | `#fdecec` | `bg-brand-soft`, soft badges / selected states |
| Page background | `#f7f7f8` | `bg-background` or hard-coded `bg-[#f7f7f8]` / shell uses `bg-slate-50` |
| Foreground | `#0f172a` (slate-900) | body text default |

### Opacity variants used often

- `bg-brand/5`, `bg-brand/10`
- `border-brand/20`, `border-brand/30`, `border-brand/40`
- `ring-brand/15`, `ring-brand/20`, `ring-brand/30`
- `text-brand/70`

---

## 3. Full color palette

### Brand (primary)

| Role | Hex | Notes |
| --- | --- | --- |
| Primary | `#E31E24` / `#e31e24` | Buttons, active sidebar link, avatar, chart accent |
| Hover | `#C4181E` / `#c4181e` | Primary button hover |
| Soft fill | `#FDECEC` / `#fdecec` | Soft badges, selected step, scroll track |

### Neutrals (Tailwind slate)

| Role | Typical classes | Approx hex |
| --- | --- | --- |
| Page / shell | `bg-slate-50`, `#f7f7f8` | `#F8FAFC` / `#F7F7F8` |
| Card surface | `bg-white` | `#FFFFFF` |
| Borders | `border-slate-200`, often `/80` | `#E2E8F0` |
| Soft dividers | `border-slate-100` | `#F1F5F9` |
| Table header bg | `bg-slate-50/80` | — |
| Heading text | `text-slate-900` | `#0F172A` |
| Body / labels | `text-slate-700`, `text-slate-800` | — |
| Secondary / muted | `text-slate-500`, `text-slate-400` | — |
| Sidebar bg | `bg-slate-950` | `#020617` |
| Sidebar text | `text-slate-200`, inactive `text-slate-300` | — |
| Sidebar muted | `text-slate-400` | — |
| Pagination bar | `bg-slate-900` | `#0F172A` |

### Semantic / status colors

| Meaning | Background | Text / accents | Examples |
| --- | --- | --- | --- |
| Error / danger | `bg-red-50`, `border-red-100` / `border-red-200` | `text-red-600`, `text-red-700` | Form errors, delete buttons |
| Success | `bg-emerald-50`, `border-emerald-100` / `border-emerald-200` | `text-emerald-700`, `text-emerald-800` | Success toasts, approved, active |
| Warning / pending | `bg-amber-50`, `border-amber-100` | `text-amber-700`, `text-amber-800` | Draft, pending, caution banners |
| Info / secondary action | `bg-sky-50`, `border-sky-200` | `text-sky-700` | Soft action icon buttons |
| Extra accent | `bg-violet-50` | `text-violet-700`, `bg-violet-600` | Dashboard tones / charts |

### Published status icons (hard-coded SVG fills)

| State | Fill |
| --- | --- |
| Published (check) | `#22C55E` (green-500) |
| Not published (cross) | `#EF4444` (red-500) |

### Chart / data visualization palette

From `DashboardCharts.tsx`:

| Name | Hex |
| --- | --- |
| Brand | `#E31E24` |
| Emerald | `#059669` |
| Sky | `#0284C7` |
| Amber | `#D97706` |
| Violet | `#7C3AED` |
| Slate | `#64748B` |

Category series order: Brand → Emerald → Sky → Amber → Violet.

### Stat / analysis “tone” system

`StatTone = "brand" | "slate" | "emerald" | "amber" | "violet" | "sky"`

| Tone | Badge | Icon / bar |
| --- | --- | --- |
| brand | `bg-brand-soft` + `text-brand` | `bg-brand` |
| slate | `bg-slate-100` + `text-slate-600` | `bg-slate-500` |
| emerald | `bg-emerald-50` + `text-emerald-700` | `bg-emerald-600` |
| amber | `bg-amber-50` + `text-amber-700` | `bg-amber-500` |
| violet | `bg-violet-50` + `text-violet-700` | `bg-violet-600` |
| sky | `bg-sky-50` + `text-sky-700` | `bg-sky-600` |

---

## 4. Typography

### Fonts

Loaded in root layout via `next/font/google`:

- **Sans (UI):** Geist → CSS var `--font-geist-sans`
- **Mono:** Geist Mono → `--font-geist-mono` (available; rarely used in UI)

Body:

```txt
font-family: var(--font-geist-sans), system-ui, sans-serif
```

HTML: `antialiased`, body: `font-sans`.

### Type scale & patterns

| Element | Classes |
| --- | --- |
| Page title (header) | `text-lg font-semibold text-slate-900` |
| Section title | `text-xl font-semibold tracking-tight text-slate-900` |
| Card / subsection title | `text-sm font-semibold text-slate-900` or `text-lg font-semibold` |
| Eyebrow / section label | `text-xs font-medium uppercase tracking-[0.14em] text-brand` |
| Uppercase section heading (alt) | `text-xs font-semibold uppercase tracking-[0.16em] text-slate-900` |
| Form field label | `text-sm font-medium text-slate-700` |
| Uppercase field label | `text-xs font-medium uppercase tracking-wide text-slate-600` |
| Helper / description | `text-sm text-slate-500` or `text-xs text-slate-500` |
| Table header | `text-xs font-semibold uppercase tracking-wide text-slate-500` |
| Table / body | `text-sm` |
| Badge / chip micro | `text-[10px]` or `text-[11px] font-semibold uppercase tracking-wide` |
| Stat number | `text-[1.65rem] font-semibold leading-none tracking-tight text-slate-900` |

---

## 5. Spacing, radius, elevation

### Radius

| Use | Class |
| --- | --- |
| Inputs, buttons, small controls | `rounded-lg` |
| Nav items, chips, icon buttons | `rounded-lg` or `rounded-md` |
| Inner panels / list items | `rounded-xl` |
| Cards, modals, major sections | `rounded-2xl` |
| Avatars, toggles, scroll thumbs | `rounded-full` |

### Elevation / shadows

Primary card shadow (used everywhere):

```txt
shadow-[0_8px_24px_rgba(15,23,42,0.04)]
```

Hover (stat cards):

```txt
hover:shadow-[0_10px_28px_rgba(15,23,42,0.06)]
```

Auth card:

```txt
shadow-[0_12px_40px_rgba(15,23,42,0.08)]
```

Modals:

```txt
shadow-2xl
```

Chart tooltips: `0 8px 24px rgba(15,23,42,0.08)`, border `#e2e8f0`, radius `12`.

### Borders

Default card:

```txt
border border-slate-200/80
```

Controls:

```txt
border border-slate-200
```

Dashed empty / upload zones:

```txt
border border-dashed border-slate-200
border border-dashed border-slate-300
border border-dashed border-brand/30
```

---

## 6. Layout shell

### App shell structure

```
┌────────────┬─────────────────────────────┐
│ Sidebar    │ Header (h-16, white)        │
│ w-64       ├─────────────────────────────┤
│ slate-950  │ Main (scroll or full-height)│
│            │ padding responsive          │
└────────────┴─────────────────────────────┘
```

**Outer:** `flex h-screen overflow-hidden bg-slate-50`

**Sidebar (desktop):** `hidden md:flex`, `w-64`, `bg-slate-950`, `text-slate-200`

**Sidebar (mobile):** off-canvas drawer, overlay `bg-slate-950/50`, width `min(18rem, 85vw)`, slide transition `duration-300`

**Header:** `h-16`, `border-b border-slate-200`, `bg-white`, `px-4 sm:px-6`

**Main padding:**

- Default list/dashboard pages: `p-4 sm:p-6 lg:p-8` + vertical scroll
- Full-height forms: tighter (`p-3 sm:p-4` or `p-2 sm:p-3`), `overflow-hidden`, flex column

### Sidebar nav

| State | Classes |
| --- | --- |
| Inactive link | `text-slate-300 hover:bg-white/5 hover:text-white` |
| Active link | `bg-brand font-medium text-white` |
| Active group header | `bg-white/10 font-medium text-white` |
| Item shape | `rounded-lg px-3 py-2.5 text-sm` |
| Group children rail | `border-l border-white/10` |
| Brand row | `h-16`, `border-b border-white/10`, logo 32px, title white, subtitle `text-[11px] text-slate-400` |

### Header chrome

- Desktop title: page name
- Mobile: brand wordmark “Carts” + hamburger
- User block: name `text-sm font-medium text-slate-800`, email `text-xs text-slate-500`
- Avatar: `h-8 w-8 rounded-full bg-brand text-xs font-semibold text-white`
- Sign out: outline button (see Secondary button)

---

## 7. Component recipes (copy these class strings)

### Page header block (list / form pages)

```txt
Eyebrow:  text-xs font-medium uppercase tracking-[0.14em] text-brand
Title:    text-xl font-semibold tracking-tight text-slate-900
Subtitle: mt-1 text-sm text-slate-500
```

Often wrapped in:

```txt
rounded-2xl border border-slate-200/80 bg-white px-5 py-5 shadow-[0_8px_24px_rgba(15,23,42,0.04)] sm:px-6
```

Or a simple flex row with title left + primary CTA right (`space-y-5` page stack).

### Card / panel

```txt
overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.04)]
```

Card header strip:

```txt
border-b border-slate-100 px-4 py-3 sm:px-5
```

### Primary button

```txt
inline-flex items-center justify-center gap-1.5 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-60
```

Larger CTA variant: `px-5 py-2.5`.

Small CTA: `px-3 py-1.5 text-xs`.

### Secondary / outline button

```txt
inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50
```

Reset-style: `border-slate-300`, `font-medium`.

### Soft brand button (secondary emphasis)

```txt
rounded-lg border border-brand/20 bg-brand-soft px-3 py-2 text-sm font-semibold text-brand transition hover:bg-[#f8dede]
```

or

```txt
rounded-lg border border-brand/20 bg-brand/5 px-3 py-1.5 text-xs font-semibold text-brand transition hover:bg-brand/10
```

### Danger / delete button

```txt
inline-flex items-center justify-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-100
```

Icon-only:

```txt
flex h-9 w-9 items-center justify-center rounded-lg bg-red-50 text-red-600 transition hover:bg-red-100
```

### Success action button

```txt
bg-emerald-600 text-white hover:bg-emerald-700
```

### Warning / edit action

```txt
bg-amber-500 text-white hover:bg-amber-600
```

### Soft icon action buttons

```txt
# Emerald
inline-flex h-8 w-8 items-center justify-center rounded-md border border-emerald-200 bg-emerald-50 text-emerald-700 transition hover:bg-emerald-100

# Sky
inline-flex h-8 w-8 items-center justify-center rounded-md border border-sky-200 bg-sky-50 text-sky-700 transition hover:bg-sky-100
```

### Text input / select / textarea

Canonical class (reuse everywhere):

```txt
w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-brand focus:ring-2 focus:ring-brand/20 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400
```

Label above field: `mb-1.5 block font-medium text-slate-700` (inside `text-sm` wrapper) or `space-y-1.5` with `text-sm font-medium text-slate-700`.

### Checkbox

```txt
h-4 w-4 rounded border-slate-300 text-brand focus:ring-brand/30
```

### Toggle switch

Track: `h-6 w-11 rounded-full` → on `bg-brand`, off `bg-slate-300`  
Thumb: `h-5 w-5 rounded-full bg-white shadow` sliding left/right.

### Segmented tabs

Container:

```txt
inline-flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm
```

Active tab: `bg-brand text-white shadow-sm` (or solid brand fill)  
Inactive: `text-slate-700 hover:bg-slate-50`

### Status pills / badges

```txt
# Success
rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700

# Warning
rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700

# Brand soft
rounded-full bg-brand/10 px-2 py-0.5 text-[10px] font-bold text-brand

# Neutral
rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500
```

With status dot (published / draft):

```txt
inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold
# + colored dot: h-1.5 w-1.5 rounded-full bg-emerald-500 | bg-amber-500
```

### Alerts / banners

```txt
# Error
rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700
# or compact:
rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700
# or ring style:
rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-red-100

# Success
rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700
# or:
rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700 ring-1 ring-emerald-100

# Warning banner strip
border-b border-amber-100 bg-amber-50 px-4 py-2 text-xs font-medium text-amber-800
```

### Empty state

```txt
rounded-2xl border border-slate-200/80 bg-white px-5 py-16 text-center text-sm text-slate-500 shadow-[0_8px_24px_rgba(15,23,42,0.04)]
```

Dashed placeholder:

```txt
rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center shadow-[0_8px_24px_rgba(15,23,42,0.04)]
```

### Loading

Full-screen:

```txt
flex min-h-screen items-center justify-center bg-[#f7f7f8]
# spinner:
h-9 w-9 animate-spin rounded-full border-2 border-brand border-t-transparent
# caption: text-sm text-slate-500
```

Skeleton blocks: `animate-pulse rounded-2xl border border-slate-200 bg-white` or row `h-16 animate-pulse rounded-lg bg-slate-100`.

### Tables

Wrapper: card with `overflow-hidden rounded-2xl …`

Header row:

```txt
border-b border-slate-200 bg-slate-50/80 text-xs font-semibold uppercase tracking-wide text-slate-500
# cells: px-4 py-3.5
```

Body:

```txt
tbody divide-y divide-slate-100
# cells: text-sm, px-4 py-3 / py-3.5
# empty: px-4 py-10 text-center text-slate-500
```

Responsive: desktop table (`hidden xl:block`), mobile card grid (`grid gap-3 p-4 xl:hidden`).

### Pagination bar

Attached to bottom of table card (`rounded-b-2xl`):

```txt
flex flex-col gap-3 rounded-b-2xl bg-slate-900 px-4 py-3 text-white sm:flex-row sm:items-center sm:justify-between sm:px-5
```

Current page: `bg-white/15 font-semibold text-white`  
Other pages: `text-slate-300 hover:bg-white/10`  
Disabled chevrons: `opacity-40`

### Modal dialog

Overlay: typically `fixed inset-0` with dark translucent backdrop  
Panel:

```txt
relative w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl
# or max-w-md
```

### Selected list item

```txt
bg-brand/5 ring-1 ring-brand/15
# or solid selected in side lists:
bg-brand text-white shadow-sm
```

### Upload / drop zone

```txt
rounded-lg border border-dashed border-slate-300 bg-slate-50 … hover:border-brand/40 hover:bg-brand-soft/10
```

Dashed brand CTA:

```txt
rounded-xl border border-dashed border-brand/30 bg-brand-soft/50 px-4 py-3 text-sm font-semibold text-brand transition hover:bg-brand-soft
```

### Stat card

```txt
rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.04)] transition hover:border-slate-300 hover:shadow-[0_10px_28px_rgba(15,23,42,0.06)]
# icon badge: h-10 w-10 rounded-xl + tone badge/icon colors
```

### Analysis / report link tile

```txt
group relative overflow-hidden rounded-xl border border-slate-200 bg-slate-50/60 p-4 transition hover:border-slate-300 hover:bg-white hover:shadow-sm
# left accent bar: absolute inset-y-0 left-0 w-1 + tone bar color
```

---

## 8. Auth screens

Background: `#f7f7f8`  
Top accent bar: `absolute inset-x-0 top-0 h-1 bg-brand`  
Soft brand blobs: `rounded-full bg-brand/5`  
Centered card max width `420px`  
Logo ~72px, product name below  
Card shadow: `shadow-[0_12px_40px_rgba(15,23,42,0.08)]`, padding `p-7`  
Links: `text-xs font-medium text-brand hover:text-brand-hover`

---

## 9. Scrollbars & utility classes

Custom thin brand scrollbars (global `*`):

- Size: `6px`
- Track: brand-soft
- Thumb: brand / hover brand-hover
- Pill shape (`border-radius: 999px`)

Utility classes:

| Class | Behavior |
| --- | --- |
| `.form-scroll` | vertical scroll, hide overflow-x, stable gutter |
| `.light-scroll` | stable scrollbar gutter |
| `.scrollbar-hide` / `.chip-scroll` | hide scrollbar (sidebar nav, horizontal chips) |

---

## 10. Interaction & motion

- Prefer `transition` / `transition-colors` on buttons and nav
- Sidebar drawer: `duration-300` transform
- Accordion groups: `transition-[grid-template-rows] duration-200 ease-out`
- Progress bars: `transition-all duration-300`
- Hover states are subtle (bg-slate-50, slight border darken) — not dramatic scale transforms
- Disabled: `disabled:opacity-60` or `50`, `disabled:cursor-not-allowed`

---

## 11. Responsive breakpoints (as used)

| Breakpoint | Common usage |
| --- | --- |
| default | Mobile-first |
| `sm:` | Padding bumps, horizontal flex for headers |
| `md:` | Show desktop sidebar; hide mobile menu button |
| `lg:` | Wider main padding; multi-column form sidebars |
| `xl:` | Tables vs mobile cards; denser grids |

---

## 12. Vendor panel implementation checklist

When prompting an agent for the Vendor Panel, require:

1. **Same CSS variables** (`--brand`, `--brand-hover`, `--brand-soft`, `--background`, `--foreground`) and Tailwind v4 `@theme inline` wiring so `bg-brand` / `text-brand` work.
2. **Fonts:** Geist + Geist Mono (or identical fallbacks).
3. **Shell:** dark `slate-950` sidebar + white header + `slate-50` / `#f7f7f8` content.
4. **Cards:** `rounded-2xl` + `border-slate-200/80` + soft slate shadow.
5. **Primary actions:** solid brand red; secondary: white + slate border; danger: red-50 family; success messaging: emerald-50 family.
6. **Forms:** shared input class with brand focus ring (`focus:ring-brand/20`).
7. **Eyebrows:** uppercase brand-colored tracking labels above page titles.
8. **Tables:** slate header row + dark pagination footer.
9. **No purple marketing theme**; keep red brand + slate neutrals + emerald/amber status accents.
10. **Logo:** `/logo.png` (or shared brand asset) in sidebar and auth.

### Minimal `globals.css` to copy

```css
@import "tailwindcss";

:root {
  --background: #f7f7f8;
  --foreground: #0f172a;
  --brand: #e31e24;
  --brand-hover: #c4181e;
  --brand-soft: #fdecec;
  --scrollbar-size: 6px;
  --scrollbar-track: var(--brand-soft);
  --scrollbar-thumb: var(--brand);
  --scrollbar-thumb-hover: var(--brand-hover);
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-brand: var(--brand);
  --color-brand-hover: var(--brand-hover);
  --color-brand-soft: var(--brand-soft);
  --font-sans: var(--font-geist-sans);
  --font-mono: var(--font-geist-mono);
}

body {
  background: var(--background);
  color: var(--foreground);
  font-family: var(--font-geist-sans), system-ui, sans-serif;
}

/* Optional: copy scrollbar rules from Admin globals.css for brand scrollbars */
```

### Quick reference hex swatches

```
Brand          #E31E24
Brand Hover    #C4181E
Brand Soft     #FDECEC
Background     #F7F7F8
Foreground     #0F172A
Border         #E2E8F0
Sidebar        #020617
Success        #059669 / soft #ECFDF5
Warning        #D97706 / soft #FFFBEB
Danger         #EF4444 / soft #FEF2F2
Info           #0284C7 / soft #F0F9FF
```

---

## 13. Source files in Admin (for deeper reference)

| Area | Path |
| --- | --- |
| Tokens / scrollbars | `src/app/globals.css` |
| Fonts / root | `src/app/layout.tsx` |
| App shell | `src/components/layout/AdminShell.tsx` |
| Header | `src/components/layout/Header.tsx` |
| Sidebar | `src/components/layout/Sidebar.tsx` |
| Auth layout | `src/components/auth/AuthLayout.tsx` |
| Login form | `src/components/auth/LoginForm.tsx` |
| Stat cards | `src/components/dashboard/StatCard.tsx` |
| Charts colors | `src/components/dashboard/DashboardCharts.tsx` |
| Pagination | `src/components/ui/PaginationBar.tsx` |
| Published icons | `src/components/ui/PublishedStatus.tsx` |
| Loading | `src/components/ui/LoadingScreen.tsx` |
| Logo | `src/components/brand/Logo.tsx` → `/public/logo.png` |

---

**Instruction to agent:** Match this theme exactly. Prefer the class recipes above over inventing new colors, radii, or shadows. When in doubt, use white cards on slate-50, brand red for primary actions, slate for chrome, and emerald/amber/red only for status semantics.
