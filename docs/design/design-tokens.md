# SAAR — Design Tokens Specification

## 1. Color Palette System

The color palette is built on Warm Ivory and Deep Ink, supplemented by desaturated semantic mineral accents.

### Foundation Surfaces & Ink
```css
/* Light Foundation */
--bg:               #FAF8F5; /* Warm Ivory — Calming, physical, editorial */
--surface:          #FFFFFF; /* Pure Card Surface */
--surface-2:        #F5F2EB; /* Soft Stone / Bone — Secondary group backdrop */
--surface-subtle:   #F9F7F2; /* Subtle alternating background */

/* Text Hierarchy */
--text-primary:     #0F1115; /* Deep Ink — High-contrast legibility */
--text-secondary:   #495057; /* Graphite — Narrative and explanatory body */
--text-tertiary:    #868E96; /* Muted Slate — Metadata and labels */
--text-muted:       #A0AAB4; /* Disabled and subtle guides */

/* Hairline Borders */
--border:           rgba(15, 17, 21, 0.08);
--border-strong:    rgba(15, 17, 21, 0.16);
```

### Dark Mode Tokens (Intentional Night Environment)
```css
[data-theme='dark'] {
  --bg:               #0F1115; /* Warm Black / Ink */
  --surface:          #16191F; /* Deep Charcoal */
  --surface-2:        #1E222B; /* Raised Charcoal */
  --surface-subtle:   #14171D;

  --text-primary:     #FAF8F5; /* Warm Ivory Text */
  --text-secondary:   #C5CCD3;
  --text-tertiary:    #868E96;

  --border:           rgba(255, 255, 255, 0.08);
  --border-strong:    rgba(255, 255, 255, 0.16);
}
```

### Semantic Mineral Accents
```css
--saar-growth:      #226949; /* Forest Sage — Health, forward momentum, progress */
--saar-energy:      #B45309; /* Warm Amber — Career, craft, alertness, cognitive load */
--saar-reflection:  #4D5091; /* Slate Indigo — Mind, introspection, twilight */
--saar-attention:   #9B2C2C; /* Muted Crimson — Friction, capacity warnings, boundaries */
--saar-recovery:    #0F766E; /* Deep Teal — Finance, sleep, reserves, balance */
--saar-purpose:     #8C6D3B; /* Quiet Bronze — Philosophy, life vector, core values */
```

---

## 2. Typography Pairings

SAAR enforces a strict 2-family pairing:
1. **Editorial Display Serif**: `Cormorant Garamond` (fallback: `Playfair Display`, `Georgia`, serif)
   - Used for display titles, section headings, identity statements, and quotes.
   - Characterized by dignity, classical proportion, and literary poise.
2. **Interface Sans-Serif**: `Inter` (fallback: system UI sans-serif)
   - Used for body text, inputs, buttons, navigation, and labels.
   - Characterized by extreme legibility at small sizes and robust optical kerning.
3. **Tabular Monospace**: `JetBrains Mono` / `SF Mono`
   - Mandatory for all timers, countdowns, durations, percentages, and metrics (`font-variant-numeric: tabular-nums`).

---

## 3. Spatial System & Radius

### Elevation Shadows
```css
--shadow-sm:   0 1px 2px rgba(15, 17, 21, 0.04);
--shadow-md:   0 4px 12px rgba(15, 17, 21, 0.06);
--shadow-lg:   0 12px 28px rgba(15, 17, 21, 0.08);
--shadow-card: 0 1px 3px rgba(15, 17, 21, 0.04);
```

### Curvature Radius
```css
--radius-sm:   4px;  /* Micro tags, inner indicators */
--radius-md:   8px;  /* Form inputs, small buttons */
--radius-lg:   12px; /* Standard buttons, task rows */
--radius-xl:   16px; /* Cards, interactive selectors */
--radius-2xl:  24px; /* Major container shells, dialogs */
--radius-full: 9999px; /* Status pills, progress dots */
```
