# SAAR Typography System

## 1. Typographic Philosophy

Typography in SAAR is treated as an editorial voice. It balances warmth with precision. We pair an elegant display serif (`Playfair Display` / classic editorial serif) for contemplative headers and future-self visioning with a razor-sharp, neutral sans-serif (`Inter`) for task execution, data tables, and schedule planning.

---

## 2. Type Roles & Hierarchy

| Role | Font Family | Size / Line Height | Tracking | Weight | Target Use Case |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Display** | Display Serif | 40px / 48px (2.5rem) | -0.025em | 600 | Future Self hero, Daily Growth title, editorial milestones |
| **Heading** | Sans / Display | 30px / 36px (1.875rem) | -0.02em | 600 | Page titles, major section headers |
| **Subheading**| Sans | 20px / 28px (1.25rem) | -0.01em | 500 | Card titles, daily question prompts |
| **Body Large**| Sans | 18px / 28px (1.125rem) | -0.005em | 400 | Companion reflection text, deep reading passages |
| **Body** | Sans | 16px / 24px (1.0rem) | 0.000em | 400 | Tasks, routines, standard interface text |
| **Caption** | Sans | 14px / 20px (0.875rem) | +0.005em | 400 | Form helper text, timestamp annotations |
| **Metadata**| Sans / Mono | 12px / 16px (0.75rem) | +0.04em | 500 | Upper-case tags, category indicators, telemetry labels |
| **Numeric Large** | Numeric Sans | 36px / 40px (2.25rem) | -0.03em | 600 | Tabular metrics, score differentials |
| **Numeric Medium**| Numeric Sans | 24px / 32px (1.5rem) | -0.02em | 600 | Routine streaks, capacity hours |

---

## 3. Numeric Formatting

All numbers representing counts, timers, percentages, or minutes must use tabular figures (`font-variant-numeric: tabular-nums`). This prevents jitter during count-ups, schedule adjustments, or live timer increments.

---

## 4. Responsive Scaling

Typography scales down gracefully on mobile screens:
- Desktop Display (40px) scales to 32px on mobile (`< 640px`).
- Desktop Heading (30px) scales to 24px on mobile.
- Body sizes remain strictly at 16px to prevent automatic browser zoom on mobile iOS/Android form inputs.
