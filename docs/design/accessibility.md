# SAAR Accessibility (a11y) Architecture

## 1. Compliance Standard

SAAR targets strict compliance with **WCAG 2.1 Level AA** across all web and mobile surfaces.

---

## 2. Core Accessibility Pillars

### 2.1 Contrast & Color Independence
- Text to background contrast ratio is maintained at **>= 4.5:1** for standard body text and **>= 3.0:1** for large headings and active UI components.
- Domain signals (Gaps, Status, Trends) never communicate solely through color: icons, textual labels, and shapes always accompany color indicators.

### 2.2 Keyboard Navigation
- All interactive controls (`Button`, `TaskRow`, `Input`, `Dialog`) are focusable and triggerable via `Tab`, `Enter`, and `Space`.
- Modals, Drawers, and BottomSheets employ focus trapping (`focus-trap-react` or native ARIA modal handling) and dismiss upon pressing `Escape`.
- Clear visible focus indicator: `outline: 2px solid #226949; outline-offset: 2px;` in light mode, `#4ADE80` in dark mode.

### 2.3 Screen Reader Semantics
- Semantic HTML tags (`<nav>`, `<main>`, `<article>`, `<header>`, `<aside>`, `<button>`) are used exclusively.
- All non-text triggers (`IconButton`, `CompanionPulse`) require an explicit `aria-label`.
- Dynamic status changes (e.g., task completion, daily growth transitions) are announced via `aria-live="polite"` regions.

### 2.4 Touch Target Sizing (Mobile & Web)
- All interactive touch targets conform to a minimum clickable/tappable area of **44x44px** (iOS HIG) and **48x48dp** (Android Material).

### 2.5 Behavioral Alarm Accessibility Exception
- The SAAR Behavioral Alarm feature requires an accessible bypass alternative (e.g. single long-press, emergency skip) for users with motor or cognitive limitations.
