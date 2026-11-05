---
name: Campus Event Discovery
colors:
  surface: '#f9f9ff'
  surface-dim: '#d3daef'
  surface-bright: '#f9f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f1f3ff'
  surface-container: '#e9edff'
  surface-container-high: '#e1e8fd'
  surface-container-highest: '#dce2f7'
  on-surface: '#141b2b'
  on-surface-variant: '#474555'
  inverse-surface: '#293040'
  inverse-on-surface: '#edf0ff'
  outline: '#787586'
  outline-variant: '#c8c4d8'
  surface-tint: '#5543df'
  primary: '#5442de'
  on-primary: '#ffffff'
  primary-container: '#6d5ef8'
  on-primary-container: '#ffffff'
  inverse-primary: '#c5c0ff'
  secondary: '#006c49'
  on-secondary: '#ffffff'
  secondary-container: '#6cf8bb'
  on-secondary-container: '#00714d'
  tertiary: '#a63628'
  on-tertiary: '#ffffff'
  tertiary-container: '#c74e3e'
  on-tertiary-container: '#fffeff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e4dfff'
  primary-fixed-dim: '#c5c0ff'
  on-primary-fixed: '#140067'
  on-primary-fixed-variant: '#3c22c7'
  secondary-fixed: '#6ffbbe'
  secondary-fixed-dim: '#4edea3'
  on-secondary-fixed: '#002113'
  on-secondary-fixed-variant: '#005236'
  tertiary-fixed: '#ffdad4'
  tertiary-fixed-dim: '#ffb4a8'
  on-tertiary-fixed: '#410000'
  on-tertiary-fixed-variant: '#872015'
  background: '#f9f9ff'
  on-background: '#141b2b'
  surface-variant: '#dce2f7'
typography:
  headline-xl:
    fontFamily: Plus Jakarta Sans
    fontSize: 40px
    fontWeight: '800'
    lineHeight: 48px
  headline-xl-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 30px
    fontWeight: '800'
    lineHeight: 38px
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 22px
    fontWeight: '700'
    lineHeight: 28px
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
  label-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
  label-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
  label-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 11px
    fontWeight: '700'
    lineHeight: 14px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1.5rem
  gutter-mobile: 1rem
  margin: 2rem
  margin-mobile: 1rem
  space-xs: 0.5rem
  space-sm: 1rem
  space-md: 1.5rem
  space-lg: 2rem
  space-xl: 3rem
---

## Brand & Style

The design system establishes an energetic, reliable, and approachable digital ecosystem tailored for university students, faculty, and student organizations. The interface balances high-tempo campus vibrancy with structural clarity, preventing information overload during peak discovery cycles like orientation weeks, symposiums, and athletic tailgates.

The design movement blends **Modern Crisp UI** with **Soft Layered Tactility**:
- Crisp, legible sans-serif typography establishes clarity across dense event schedules.
- Fresh violet tones infuse dynamic youthfulness without compromising institutional trust.
- Subtle containment lines and layered surfaces replace excessive ornamentation, ensuring event media and essential scheduling data remain central.
- Interactions feel responsive, immediate, and tactile, encouraging effortless browsing and single-tap registrations.

## Colors

The palette leverages a focused hierarchical structure optimized for light environments, ensuring high contrast and immediate status recognition across rapid scanning.

### Palette Architecture
- **Primary Brand (`#6D5EF8`)**: Used for focal actions, interactive states, active tab indicators, and featured highlight rings. Transitions to deep violet (`#5B4CE0`) on hover/pressed states. Light violet tint (`#EDE9FE`) provides subtle container backdrops for active filters, dates, and selected chips.
- **Secondary / Success (`#10B981`)**: Dedicated to confirmed registration states, live statuses, and affirmative indicators. Paired with light emerald tint (`#D1FAE5`) for status badge containers.
- **Tertiary / Warning & Danger (`#F97360`)**: Deployed for capacity alerts ("Only 3 seats left"), cancellation notices, and urgent time-sensitive warnings. Paired with light coral tint (`#FEE2E2`).
- **Neutrals & Surfaces**:
  - Main Canvas: Light Slate (`#F8FAFC`) gives clear contrast beneath white containers.
  - Surface White (`#FFFFFF`): Applied across elevated event cards, bottom sheets, navigation bars, and modals.
  - Border Subdued (`#E2E8F0`): Provides crisp boundaries for cards, dividers, and input strokes.
  - Primary Text / Dark Navy (`#111827`): Highest-contrast text token for headlines, titles, and active inputs.
  - Secondary Text / Slate (`#475569`): Used for timestamps, venues, organizer attributions, and body copy.
  - Muted Text (`#94A3B8`): Used for placeholder copy, disabled states, and inactive tab icons.

## Typography

The typography scale utilizes **Plus Jakarta Sans** uniformly to merge structural geometry with approachable, rounded terminals.

### Hierarchy & Pairing Rules
- **Headlines**: Set in Dark Navy (`#111827`) with `700` or `800` weights. Letter spacing is kept tight (`-0.02em` on `headline-xl` and `headline-lg`) to maintain visual punch in promotional event headers.
- **Body Content**: Set in Slate (`#475569`) at `body-md` (14px) and `body-lg` (16px) for event descriptions and organizer notes. Line heights remain generous to aid readability on handheld devices.
- **Labels & Badges**: Set in `label-sm` and `label-md` with `600` or `700` weights. When used inside pill badges, text applies uppercase tracking (`+0.04em`) to establish visual distinction against body paragraphs.

## Layout & Spacing

The layout is built upon an 8px base rhythm (`0.5rem`, `1rem`, `1.5rem`, `2rem`, `3rem`). 

### Grid & Breakpoints
- **Desktop (≥1024px)**: 12-column fluid grid, maximum content constraint of `1280px`, `gutter` of `1.5rem` (24px), outer margins of `2rem` (32px). Event discovery matrices render in 3-column configurations; filter panels occupy a dedicated 3-column sticky sidebar.
- **Tablet (768px – 1023px)**: 8-column layout, `gutter` of `1rem` (16px), outer margins of `1.5rem` (24px). Event cards reflow to a 2-column grid. Secondary filters collapse into a horizontal scrollable rail.
- **Mobile (<768px)**: 4-column layout, `gutter-mobile` of `1rem` (16px), outer margins of `1rem` (16px). Event feed converts to a stacked single-column flow with persistent bottom navigation.

### Density Guidelines
- Component internal padding strictly uses `space-xs` (8px) for chips and small inputs, `space-sm` (16px) for standard cards and form rows, and `space-md` (24px) for expansive card sections.
- Visual rhythm separates distinct calendar sections using `space-lg` (32px) and major page stages using `space-xl` (48px).

## Elevation & Depth

Visual depth is achieved through an ambient, multi-layered approach that preserves a clean and light aesthetic over aggressive drop shadows.

### Surface Elevation System
- **Level 0 (Canvas Base)**: Light Slate background (`#F8FAFC`). Flat, un-elevated anchor for high-contrast content modules.
- **Level 1 (Card & Content Blocks)**: Surface White (`#FFFFFF`) with a 1px border stroke (`#E2E8F0`) and an ambient shadow: `0px 1px 3px rgba(17, 24, 39, 0.05), 0px 1px 2px rgba(17, 24, 39, 0.03)`.
- **Level 2 (Hovered Cards & Dropdowns)**: Surface White (`#FFFFFF`) with border stroke (`#CBD5E1`) and an elevated ambient drop: `0px 8px 16px -2px rgba(109, 94, 248, 0.08), 0px 4px 6px -2px rgba(17, 24, 39, 0.04)`.
- **Level 3 (Modals, Registration Sheets, Sticky Bars)**: Surface White (`#FFFFFF`) overlay with `0px 20px 25px -5px rgba(17, 24, 39, 0.1), 0px 10px 10px -5px rgba(17, 24, 39, 0.04)`. Accompanied by a 24% dark navy overlay backdrop blur (`backdrop-filter: blur(4px)`).

## Shapes

The design system incorporates geometric hierarchy to communicate interactivity and structure:

- **Cards and Containers**: Uniform `12px` border radius (`rounded-lg` equivalent in scale 2) provides a contemporary, friendly frame while keeping corner curves tight enough to maximize image area within card headers.
- **Buttons, Form Inputs, and Select Boxes**: Exact `8px` border radius (`rounded` equivalent) conveys clickable intent, maintaining crisp alignment alongside form field margins.
- **Badges, Filter Chips, and Avatars**: Completely pill-shaped (`9999px`) to immediately distinguish contextual metadata and categorizations from rectangular actionable panels.

## Components

### Buttons
- **Primary Action**: Solid Violet (`#6D5EF8`) fill, text in `#FFFFFF` (`label-lg`), height 44px, horizontal padding 20px, radius 8px. Hover state shifts to `#5B4CE0`. Active state applies a scale transformation (`0.98`).
- **Secondary Action**: Background `#EDE9FE`, text `#6D5EF8` (`label-lg`), radius 8px. Hover shifts to `#DDD6FE`.
- **Outline / Ghost**: 1px solid `#E2E8F0` on white, text `#111827`. Hover applies `#F1F5F9`.

### Filter Chips
- **Inactive**: Pill-shaped (`9999px`), background `#FFFFFF`, border 1px solid `#E2E8F0`, text `#475569` (`label-md`), padding 6px 14px.
- **Active / Selected**: Background `#EDE9FE`, border 1px solid `#6D5EF8`, text `#6D5EF8` (`label-md`), accompanied by a leading checkmark icon or trailing count indicator.

### Status Badges
- **Live / Verified / Registered**: Pill container with `#D1FAE5` background, text `#065F46` (`label-sm`), with an integrated 6px circular dot indicator in `#10B981`.
- **Filling Fast / Urgent**: Pill container with `#FEE2E2` background, text `#991B1B` (`label-sm`), with an integrated 6px circular dot indicator in `#F97360`.
- **Category Badge**: Pill container with `#F1F5F9` background, text `#334155` (`label-sm`).

### Event Cards
- Built with a vertical hierarchy inside a `12px` rounded white container with 1px border (`#E2E8F0`).
- **Media Header**: Aspect ratio 16:9 with upper corners clipped to 12px. Overlaid with category pill badge (top-left) and bookmark/save toggle (top-right, circular white 36px icon button).
- **Body**: Internal padding 16px. Top line features an uppercase date lockup (e.g., "THU, OCT 24 · 7:00 PM") in Violet (`#6D5EF8`, `label-sm`), followed by the event title in Navy (`#111827`, `headline-sm`, 2-line clamp).
- **Metadata Footer**: 16px padding, separated by top border `#F1F5F9`. Venue location and attendee count rendered in Slate (`#475569`, `body-sm`) with a 36px primary registration trigger button.

### Form Inputs & Search Fields
- Height 44px, radius 8px, background `#FFFFFF`, border 1px solid `#CBD5E1`, text `#111827` (`body-md`), placeholder text `#94A3B8`.
- Focus state activates an outline ring: `0 0 0 3px rgba(109, 94, 248, 0.25)` and changes border stroke to `#6D5EF8`.
- Error state replaces border with `#F97360` and displays error caption in coral (`#F97360`, `body-sm`).

### Checkboxes & Radio Buttons
- Checkboxes: 18x18px square with 4px border radius. Unselected uses 1.5px border `#94A3B8`. Selected fills with `#6D5EF8` with a white checkmark.
- Radio Buttons: 18x18px circular with matching fill and inner dot indicator. Focus outlines mirror the input focus system.

### Navigation Bar
- Top-anchored desktop bar (height 72px) and persistent mobile bottom bar (height 64px) constructed with `#FFFFFF` background, a 1px border stroke (`#E2E8F0`), and Level 1 elevation.
- Active route items display `#6D5EF8` icon and typography, while inactive states rest at `#475569`.