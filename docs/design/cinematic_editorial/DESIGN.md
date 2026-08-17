---
name: Cinematic Editorial
colors:
  surface: '#fff8f7'
  surface-dim: '#ebd5d2'
  surface-bright: '#fff8f7'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#fff0ee'
  surface-container: '#ffe9e6'
  surface-container-high: '#f9e3e0'
  surface-container-highest: '#f3dedb'
  on-surface: '#241917'
  on-surface-variant: '#57423f'
  inverse-surface: '#3a2d2c'
  inverse-on-surface: '#ffedea'
  outline: '#8b716e'
  outline-variant: '#dec0bc'
  surface-tint: '#a63930'
  primary: '#410002'
  on-primary: '#ffffff'
  primary-container: '#660708'
  on-primary-container: '#f27064'
  inverse-primary: '#ffb4ab'
  secondary: '#5b5f62'
  on-secondary: '#ffffff'
  secondary-container: '#e0e3e7'
  on-secondary-container: '#616568'
  tertiary: '#00174a'
  on-tertiary: '#ffffff'
  tertiary-container: '#002a77'
  on-tertiary-container: '#7a95e7'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdad6'
  primary-fixed-dim: '#ffb4ab'
  on-primary-fixed: '#410002'
  on-primary-fixed-variant: '#86211c'
  secondary-fixed: '#e0e3e7'
  secondary-fixed-dim: '#c4c7cb'
  on-secondary-fixed: '#181c1f'
  on-secondary-fixed-variant: '#43474b'
  tertiary-fixed: '#dbe1ff'
  tertiary-fixed-dim: '#b4c5ff'
  on-tertiary-fixed: '#00174a'
  on-tertiary-fixed-variant: '#23428e'
  background: '#fff8f7'
  on-background: '#241917'
  surface-variant: '#f3dedb'
  support-alert: '#BA181B'
  surface-bg: '#F5F3F4'
  success-valid: '#2D6A4F'
  neutral-gray: '#D3D3D3'
typography:
  display-lg:
    fontFamily: Roboto
    fontSize: 48px
    fontWeight: '800'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Roboto
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Roboto
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
  headline-md:
    fontFamily: Roboto
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Roboto
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Roboto
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-md:
    fontFamily: Roboto
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.05em
  label-sm:
    fontFamily: Roboto
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 4px
  xs: 8px
  sm: 16px
  md: 24px
  lg: 40px
  xl: 64px
  gutter: 20px
  margin-mobile: 16px
  margin-desktop: auto
  max-width: 1200px
---

## Brand & Style

This design system establishes a contemporary, editorial aesthetic for a cinema ticketing platform. The brand personality is utilitarian, direct, and high-contrast, focusing on the cinematic experience through structural clarity rather than illustrative fluff. 

The style blends **Minimalism** with **Corporate Modern** sensibilities. It prioritizes information density and transactional efficiency, utilizing heavy whitespace against a stark, light background. Visual interest is generated through precise typography and a deep, monochromatic red palette that echoes the classic theater experience without falling into nostalgia. The interface remains invisible to allow movie posters and event details to command the user's attention.

## Colors

The color palette is high-contrast and authoritative. The primary brand color (#660708) is reserved for high-priority actions and active states, such as selected seats and primary "Purchase" buttons. 

The background uses a subtle off-white (#F5F3F4) to reduce eye strain while maintaining a clean, paper-like editorial feel. Text and structural elements use a near-black (#161A1D) to ensure maximum legibility and a premium "ink-on-paper" look. A distinct forest green (#2D6A4F) is introduced specifically for "Válido" (Valid) states and successful confirmations, providing a clear functional departure from the red-heavy brand palette.

## Typography

This design system uses **Roboto** (weights 400, 500, 700). Headlines and body share the same family; hierarchy comes from weight and size.

- **High Contrast:** Use heavy weights (700-800) for headlines against light backgrounds to create a strong visual anchor.
- **Micro-Typography:** Labels and metadata (gate info, seat numbers, time slots) should use the `label-md` style with increased letter spacing and uppercase transforms to differentiate them from body copy.
- **Readability:** Body text is kept at a generous 16px minimum to ensure clarity during fast-paced checkout flows.

## Layout & Spacing

The layout follows a **Fixed Grid** philosophy for desktop to maintain editorial control, and a **Fluid Grid** for mobile devices. 

- **Grid:** Use a 12-column grid for desktop (max-width: 1200px) with 20px gutters. On mobile, transition to a 4-column grid with 16px side margins.
- **Density:** Maintain "utilitarian density." Information should be tightly grouped within logical sections (e.g., event details) while keeping significant whitespace (40px+) between major sections to prevent visual clutter.
- **Rhythm:** All spacing must be multiples of the 4px base unit to ensure vertical rhythm and alignment across the seat map and checkout forms.

## Elevation & Depth

To maintain a clean and direct aesthetic, this design system avoids heavy shadows and complex layering. 

- **Tonal Layers:** Depth is primarily conveyed through subtle background shifts. The main canvas is #F5F3F4, while cards and surface containers use #FFFFFF.
- **Low-Contrast Outlines:** Instead of shadows, use 1px borders in #D3D3D3 for cards and input fields. 
- **Active Elevation:** Only the primary "Purchase" or "Action" buttons may use a very soft, low-opacity ambient shadow (Color: #161A1D, Opacity: 8%, Blur: 4px) to indicate interactability.
- **Seat Map:** Use flat color blocks to represent state (Available: White/Bordered; Occupied: Dark Gray; Selected: Primary Red).

## Shapes

The shape language is **Soft** but disciplined. 

- **Containers:** Apply a 0.25rem (4px) radius to buttons, input fields, and small cards. This keeps the interface feeling modern without losing the "editorial" sharpness.
- **Event Posters:** May use the same 4px radius to maintain consistency.
- **Large Components:** Hero sections or large modal containers may use `rounded-lg` (8px) to soften the visual impact on larger screen real estate.
- **Seat Map:** Seats should be perfect squares with a very slight 2px radius to maximize the grid's utilitarian look.

## Components

- **Buttons:** Primary buttons use the Brand Red (#660708) with white text. Secondary buttons use a transparent background with a 1px Dark Text (#161A1D) border. Use `label-md` for button text.
- **Event Cards:** White background, 1px neutral-gray border. The typography should be the focus—Event Title in `headline-md`, followed by Date/Time in `label-md` using the Brand Red for emphasis.
- **Seat Map Grid:** A strict geometric grid. Available seats: White fill + Gray border. Occupied: #161A1D fill. Selected: #660708 fill. Legend must be high-contrast and placed clearly above the grid.
- **Checkout Forms:** High-density, short fields. Use `label-sm` for field labels placed above the input. Input borders turn Primary Red on focus.
- **Gate Status Indicators:** High-contrast tags. "Válido" uses Success Green (#2D6A4F) background with white text. "Inválido" or "Erro" uses Alert Red (#BA181B).
- **Navigation:** Simple, text-based links in `label-md`. The logo from the provided image should be left-aligned, serving as the "Home" anchor.