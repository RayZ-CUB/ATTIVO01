# Design

## Theme

Dark. Background is near-black (`#070906`), surfaces step up through `#0d1009` → `#111509` → `#161b0e`. The palette is tinted toward the brand's own green hue, not toward generic warm or cool neutrals. Lime green `#c8f135` is the single accent — used only on CTAs, active states, focus rings, and key data points. Gold `#f5c842` is a secondary accent for badges and highlights only.

## Colors

| Token | Value | Usage |
|---|---|---|
| `black` | `#070906` | App background |
| `dark` | `#0d1009` | Screen background |
| `panel` | `#111509` | Section panels, bottom nav |
| `card` | `#161b0e` | Card surfaces |
| `border` | `#1f2614` | Borders and dividers |
| `border-hi` | `#2d3a18` | Elevated borders |
| `muted` | `#485535` | Placeholder text, disabled labels, inactive nav |
| `text` | `#c8d9b4` | Body text |
| `white` | `#eaf4d8` | Headings, high-emphasis text |
| `lime` | `#c8f135` | Primary accent — CTAs, active states, focus rings |
| `gold` | `#f5c842` | Secondary accent — badges, highlights |
| `silver` | `#b0bec5` | Tertiary — disabled states |
| `error` | `#ff6b6b` | Error states |
| `success` | `#4caf50` | Success states |

Contrast ratios: `text` (#c8d9b4) on `card` (#161b0e) = 8.1:1 ✓. `white` (#eaf4d8) on `black` (#070906) = 14.2:1 ✓. `muted` (#485535) on `card` (#161b0e) = 3.1:1 — use only for non-essential labels, never for body copy.

## Typography

| Role | Family | Weight | Size range |
|---|---|---|---|
| Display / Headings | Bebas Neue | 400 | 24px–48px |
| Body | DM Sans | 400 | 13px–15px |
| Body medium | DM Sans | 500 | 13px–15px |
| Body semibold | DM Sans | 600 | 13px–15px |
| Labels / badges | DM Sans | 500 | 10px–12px, uppercase ≤4 words |

Letter spacing: Bebas Neue headings use 1–5px tracking. DM Sans body uses default tracking. No all-caps body copy. No Inter.

## Spacing

Scale: 4 / 8 / 12 / 16 / 24 / 32 / 48px. Cards use 16–18px internal padding. Section gaps use 20–24px horizontal padding. Vertical rhythm alternates between 12px and 24px gaps — never uniform.

## Border Radius

| Token | Value | Usage |
|---|---|---|
| `sm` | 4px | Badges, small chips |
| `md` | 8px | Buttons, inputs |
| `lg` | 12px | Cards |
| `xl` | 16px | Modals, bottom sheets |
| `full` | 9999px | Pills, avatar circles |

## Components

**Button** — Primary: `lime` background, `black` text, `md` radius, Bebas Neue label, 44pt min height. Ghost: transparent background, `text` color, `border` border. Disabled: `muted` background. Press feedback via opacity (0.8) — no scale bounce.

**Card** — `card` background, 1px `border` border, `lg` radius, `card` shadow with lime tint at 8% opacity. No nested cards. No side-stripe borders.

**Input** — `card` background, 1px `border-hi` border, `md` radius, `text` color, `muted` placeholder. Focus: `lime` border, 3px `lime` shadow at 8% opacity.

**Badge** — `sm` radius, uppercase label ≤4 words, DM Sans 500 10–11px. Role badges: Player = `lime` tint, Coach = `gold` tint. Verification: Pending = `muted`, Approved = `lime`, Rejected = `error`.

**Tab bar** — `panel` background, 1px `border` top border, Ionicons (filled = active `lime`, outline = inactive `muted`), Bebas Neue labels 9px.

**Avatar** — Circle, `panel` background, `white` initials in Bebas Neue. Image with fallback.

**Empty state** — Centered icon (Ionicons, `muted`), `white` title, `muted` subtitle. No decorative illustrations.

## Motion

Library: `react-native-reanimated` (already installed). Easing: `Easing.out(Easing.cubic)` — no bounce, no elastic, no spring overshoot. Duration: 200ms for micro-interactions (press, focus), 300ms for transitions (screen enter, modal open), 400ms for list stagger.

Patterns:
- Card entrance: `FadeInDown` with 300ms, stagger 60ms per item
- Modal/bottom sheet: `SlideInDown` 350ms ease-out
- Press feedback: opacity 1.0 → 0.8, 150ms
- Tab switch: `FadeIn` 200ms
- Error banner: `FadeInUp` 250ms

Reduced motion: all animations collapse to instant opacity crossfade (`duration: 0` when `AccessibilityInfo.isReduceMotionEnabled`).

## Anti-patterns (banned)

- Side-stripe `border-left` accent on cards
- Gradient text (`background-clip: text`)
- Glassmorphism cards
- Identical icon + heading + text card grids
- Tracked uppercase eyebrows on every section
- Numbered section markers (01 / 02 / 03) as scaffolding
- Cream/sand/warm-neutral backgrounds
- Purple gradients
- `lime` used as a background fill on large surfaces (accent only)
