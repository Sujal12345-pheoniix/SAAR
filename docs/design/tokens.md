# SAAR Design Tokens Reference

All design decisions in SAAR are governed by centralized tokens located in `@saar/ui` (`packages/ui/src/tokens/`). Arbitrary values in individual components are strictly forbidden.

---

## 1. Token Taxonomy

```text
packages/ui/src/tokens/
├── colors.ts       # Foundation palette, semantic accents, light/dark themes
├── typography.ts   # Font stacks, size scale, line heights, letter spacing
├── spacing.ts      # 4px modular spacing scale (0 to 96px)
├── radius.ts       # Controlled corner rounding (none, 4px, 8px, 12px, 16px, full)
├── shadows.ts      # Ambient ink elevation and dark-mode depth
├── motion.ts       # Duration curves, physics spring configs, easing functions
└── breakpoints.ts  # Responsive viewports (sm, md, lg, xl, 2xl) and z-index layers
```

---

## 2. Spacing Scale

Based on a strict 4px grid:

| Token | Value | Target Usage |
| :--- | :--- | :--- |
| `spacing[1]` | 4px | Micro padding, icon-text gap |
| `spacing[2]` | 8px | Button internal padding, compact card gap |
| `spacing[3]` | 12px | Form field vertical padding, tag gap |
| `spacing[4]` | 16px | Standard card padding, standard column gutters |
| `spacing[6]` | 24px | Section header separation, desktop card padding |
| `spacing[8]` | 32px | Major layout block separation |
| `spacing[12]` | 48px | Page header whitespace, hero margins |
| `spacing[16]` | 64px | Editorial desktop rhythm |

---

## 3. Corner Radius Scale

| Token | Value | Applied To |
| :--- | :--- | :--- |
| `radius.none` | 0px | Full-bleed dividers, raw borders |
| `radius.sm` | 4px | Badges, tags, micro-buttons |
| `radius.md` | 8px | Text inputs, dropdown menus, standard buttons |
| `radius.lg` | 12px | Cards, modal sheets, planner blocks |
| `radius.xl` | 16px | Large focus panels, companion container |
| `radius.full`| 9999px | Avatars, pills, circular progress rings |

---

## 4. Elevation & Shadows

Elevation utilizes soft ink attenuation rather than harsh black blurs:

* **Elevation 1**: `0 1px 2px 0 rgba(15, 17, 21, 0.04)` (Hovered rows, subtle cards)
* **Elevation 2**: `0 2px 6px -1px rgba(15, 17, 21, 0.06), 0 1px 3px -1px rgba(15, 17, 21, 0.04)` (Floating buttons, dropdowns)
* **Elevation 3**: `0 6px 16px -2px rgba(15, 17, 21, 0.08), 0 2px 6px -2px rgba(15, 17, 21, 0.04)` (Modals, bottom sheets)
* **Elevation 4**: `0 12px 28px -4px rgba(15, 17, 21, 0.12), 0 4px 10px -3px rgba(15, 17, 21, 0.06)` (Contextual drawers)

---

## 5. Z-Index Layering

```text
base: 0
card: 1
sticky: 10
dropdown: 20
drawer: 30
modalBackdrop: 40
modal: 50
popover: 60
toast: 70
tooltip: 80
```
