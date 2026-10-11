---
name: Walaa Neo-Pass
colors:
  surface: "#f9f9ff"
  surface-dim: "#ccdaf8"
  surface-bright: "#f9f9ff"
  surface-container-lowest: "#ffffff"
  surface-container-low: "#f0f3ff"
  surface-container: "#e8eeff"
  surface-container-high: "#dfe8ff"
  surface-container-highest: "#d6e3ff"
  on-surface: "#0d1c32"
  on-surface-variant: "#434655"
  inverse-surface: "#233148"
  inverse-on-surface: "#ecf0ff"
  outline: "#737686"
  outline-variant: "#c3c6d7"
  surface-tint: "#0053db"
  primary: "#004ac6"
  on-primary: "#ffffff"
  primary-container: "#2563eb"
  on-primary-container: "#eeefff"
  inverse-primary: "#b4c5ff"
  secondary: "#4c5d89"
  on-secondary: "#ffffff"
  secondary-container: "#bacbfd"
  on-secondary-container: "#445580"
  tertiary: "#005b7c"
  on-tertiary: "#ffffff"
  tertiary-container: "#00759f"
  on-tertiary-container: "#e1f2ff"
  error: "#ba1a1a"
  on-error: "#ffffff"
  error-container: "#ffdad6"
  on-error-container: "#93000a"
  primary-fixed: "#dbe1ff"
  primary-fixed-dim: "#b4c5ff"
  on-primary-fixed: "#00174b"
  on-primary-fixed-variant: "#003ea8"
  secondary-fixed: "#d9e2ff"
  secondary-fixed-dim: "#b4c6f7"
  on-secondary-fixed: "#041942"
  on-secondary-fixed-variant: "#34466f"
  tertiary-fixed: "#c4e7ff"
  tertiary-fixed-dim: "#7bd0ff"
  on-tertiary-fixed: "#001e2c"
  on-tertiary-fixed-variant: "#004c69"
  background: "#f9f9ff"
  on-background: "#0d1c32"
  surface-variant: "#d6e3ff"
typography:
  headline-xl:
    fontFamily: Plus Jakarta Sans
    fontSize: 56px
    fontWeight: "800"
    lineHeight: 64px
    letterSpacing: -0.03em
  headline-xl-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 36px
    fontWeight: "800"
    lineHeight: 44px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 40px
    fontWeight: "700"
    lineHeight: 48px
    letterSpacing: -0.025em
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 28px
    fontWeight: "700"
    lineHeight: 36px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 28px
    fontWeight: "700"
    lineHeight: 36px
    letterSpacing: -0.02em
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: "600"
    lineHeight: 28px
    letterSpacing: -0.015em
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: "400"
    lineHeight: 28px
    letterSpacing: -0.01em
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: "400"
    lineHeight: 24px
    letterSpacing: -0.005em
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: "400"
    lineHeight: 20px
  label-lg:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: "600"
    lineHeight: 20px
    letterSpacing: 0.01em
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: "600"
    lineHeight: 16px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: "700"
    lineHeight: 14px
    letterSpacing: 0.04em
rounded:
  sm: 0.5rem
  DEFAULT: 1rem
  md: 1.5rem
  lg: 2rem
  xl: 3rem
  full: 9999px
spacing:
  gutter: 1.5rem
  gutter-mobile: 1rem
  margin: 3rem
  margin-mobile: 1.25rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
---

## Brand & Style

This design system establishes a high-performance visual language tailored for modern B2B SaaS in digital customer retention and native smartphone wallets (Apple Wallet & Google Wallet). The brand personality balances institutional trust and cutting-edge fintech sophistication: confident, frictionless, hyper-crisp, and conversion-focused.

The visual style synthesizes **Precision Corporate SaaS** with **Tactile Glassmorphism**:

- **Contrast Choreography:** A deliberate interplay of deep midnight navy tones and clean alabaster/slate panels creates an architectural rhythm across marketing landers and dense SaaS web app dashboards.
- **Wallet-Native Physics:** Surface elements mirror the sleek, physical-meets-digital aesthetic of native mobile passes—featuring subtle translucent overlays, fine hairline borders, and glowing interactive feedback.
- **Conversion Energy:** High-visibility electric blue drives decisive calls to action, paired with vibrant cyan and amber accents for real-time customer lifecycle alerts, metric spikes, and pass issuance milestones.

## Colors

The palette leverages high-contrast tonal layering across light operational surfaces and deep nocturnal hero/showcase sections.

### Palette Architecture

- **Primary (`#2563EB` - Electric Royal Blue):** Anchors primary conversions, key interactive trigger states, active wallet status tags, and focal links.
- **Secondary (`#0D2149` - Midnight Steel):** Surfaces secondary button structures, high-contrast subheadings in light mode, and dark card containers.
- **Tertiary (`#38BDF8` - Neon Cyan / Ice Blue):** Used for micro-glows, technical highlights, pass installation indicators, and badge text within dark viewports.
- **Neutral Core (`#0A192F` - Deep Obsidian Navy):** Acts as the foundational dark canvas for high-impact hero sections, code integration panels, and primary text in light mode.

### System Supporting Tones

- **Canvas Light Base:** `#F8FAFC` (Canvas background) transitioning into `#F1F5F9` (Subtle panel backdrops).
- **Surface Elevation Light:** `#FFFFFF` (Solid cards, wallet previews, input wells).
- **Deep Section Backdrop:** `#0B132B` to `#0A192F` with gradient edge illumination.
- **Accents & Alerts:** `#F59E0B` (Amber rewards tier badge), `#F43F5E` (Pass expiry / churn alert), `#10B981` (Wallet install confirmed).

### Alternating Section Rhythm

Marketing and onboarding layouts switch between Deep Navy panels (`#0B132B`) and crisp light canvases (`#F8FAFC`). Wave transitions must use clean SVG path contours filled with the destination section’s background tone, preventing hard split edges while sustaining visual energy.

## Typography

The typographic hierarchy pairs **Plus Jakarta Sans** for expressive, forward-driving headlines with **Inter** for dense, neutral data displays and interface components.

- **Headlines:** Tightly tracked with negative letter-spacing to deliver punchy, confident product marketing statements. Heavy weights (700/800) maintain visual authority across deep navy sections.
- **Body & Data:** Inter provides hyper-legible rendering across complex dashboard tables, pass analytics, and mobile viewports.
- **Numbers & Metrics:** Large metrics (e.g., "$142K Retention ROI", "98.4% Install Rate") utilize Plus Jakarta Sans SemiBold/Bold with tabular figures enabled for vertical data alignment.
- **Localization Notice:** Both typefaces provide robust glyph compatibility and harmonize seamlessly when paired with Arabic fonts for native regional localization.

## Layout & Spacing

The design system implements a 12-column responsive grid system based on an 8pt base grid for dashboard views and spacious marketing sections:

- **Desktop (1280px+):** 12-column fluid grid, max-width `1360px`, `1.5rem` gutters, `3rem` outer margins.
- **Tablet (768px - 1279px):** 8-column layout, `1.25rem` gutters, `2rem` outer margins.
- **Mobile (<768px):** 4-column layout, `1rem` gutters, `1.25rem` margins.

### Sectional Architecture

Sections alternate between crisp light backdrops (`#F8FAFC`) and deep navy panels (`#0B132B`). Vertical padding on standard marketing sections scales between `5rem` (mobile) and `7.5rem` (desktop). Wave dividers must occupy a dedicated wrapper with `overflow: hidden` to ensure pixel-perfect rendering without horizontal scroll shifts.

## Elevation & Depth

Visual hierarchy uses multi-stage ambient shadows combined with translucent glass borders to simulate realistic physical wallet passes floating above dynamic backdrops.

### Elevation Levels

- **Level 1 (Subtle Metric Tiles & Data Rows):** `box-shadow: 0 1px 3px rgba(10, 25, 47, 0.05), 0 1px 2px rgba(10, 25, 47, 0.03);` Border: `1px solid #E2E8F0`
- **Level 2 (Standard Interactive Cards):** `box-shadow: 0 10px 25px -5px rgba(10, 25, 47, 0.08), 0 8px 10px -6px rgba(10, 25, 47, 0.04);` Hover elevation introduces a `transform: translateY(-2px)` transition with primary color glow: `box-shadow: 0 14px 28px -4px rgba(37, 99, 235, 0.12), 0 10px 10px -5px rgba(10, 25, 47, 0.04);`
- **Level 3 (Digital Wallet Pass Preview):** Multi-layered realistic drop shadow reflecting a physical pass: `box-shadow: 0 25px 50px -12px rgba(10, 25, 47, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.1);`
- **Glassmorphic Floating HUD & Badges:** Applied over dark containers: `background: rgba(13, 33, 73, 0.65);` `backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);` `border: 1px solid rgba(56, 189, 248, 0.2);` `box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);`

## Shapes

The system relies on a high-roundedness (pill-forward) shape language that establishes a friendly, modern tech touchpoint:

- **Buttons & Chips:** Full pill contour (`9999px` border radius) conveying frictionless action and tap responsiveness.
- **Wallet Pass Mockups:** Standard Apple/Google Pass corner radius (`1.25rem` to `1.5rem`) to ensure true-to-device realism.
- **Metric Cards & Content Blocks:** `1.25rem` (20px) roundedness for modern, soft containment without appearing childlike.
- **Form Inputs & Search Fields:** Balanced pill shape (`9999px`) for quick search and filters; `0.75rem` (12px) for complex administrative input fields within dense settings dashboards.

## Components

### Buttons

- **Primary CTA:** High-contrast pill button. Background `#2563EB`, text `#FFFFFF`, typography `label-lg`. Padding: `0.75rem 1.75rem`. Hover state transitions to `#1D4ED8` with `box-shadow: 0 8px 20px rgba(37, 99, 235, 0.35)`.
- **Secondary (Dark Surface):** Translucent glass pill. Background `rgba(255, 255, 255, 0.08)`, border `1px solid rgba(255, 255, 255, 0.2)`, text `#FFFFFF`. Hover: `rgba(255, 255, 255, 0.16)`.
- **Secondary (Light Surface):** Solid white surface with `#0D2149` text and `#E2E8F0` border. Hover: `#F8FAFC`.

### Badges & Chips

- **Glass Status Pill:** Backdrop blur `12px`, `background: rgba(56, 189, 248, 0.1)`, `border: 1px solid rgba(56, 189, 248, 0.3)`, text `#38BDF8`. Features a pulsating 6px green/cyan dot indicating live wallet sync.
- **Conversion / Promo Badge:** Coral/Amber tint (`background: #FEF3C7; border: 1px solid #FCD34D; color: #B45309`).

### Metric Cards

- Background: `#FFFFFF` on light sections, `rgba(13, 33, 73, 0.5)` with `1px solid rgba(255, 255, 255, 0.08)` on dark sections.
- Interior layout: Micro-label at top in `label-md` uppercase, large bold metric in Plus Jakarta Sans (`32px`), followed by a badge indicating percentage lift over previous period (e.g., `+34.2% installs`).

### Digital Wallet Pass Emulator Card

- A specialized component mirroring standard mobile wallet card proportions (approx 3:2 ratio on mobile, vertically oriented pass on desktop).
- Features dual-tone dynamic gradients matching the client brand, real-time QR/Barcode generation preview, localized tier label, and Apple Wallet / Google Wallet platform toggle tabs.

### Input Fields

- Height `48px`, border `1px solid #CBD5E1`, background `#FFFFFF`, text `#0A192F`. Focus state introduces a crisp ring: `border-color: #2563EB; box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15)`.

### Form Controls (Checkboxes & Radios)

- Checkboxes: `20px` square, `0.375rem` radius. Inactive: `#FFFFFF` with `#CBD5E1` border. Checked: `#2563EB` fill with sharp white check glyph.
- Radio buttons: `20px` circle, matching focus glow state with centered white dot when selected.
