# SAAR Color System

## 1. Palette Architecture

The SAAR color system is deliberately restrained. It trades neon gradients and hyper-saturated primaries for organic warmth, architectural depth, and meaningful semantic accents.

---

## 2. Foundations: Warm Ivory & Deep Ink

### Warm Ivory (Light Mode Canvas)
* `ivory[50]` (`#FDFCFB`): Card highlights, pristine focus areas
* `ivory[100]` (`#FAF8F5`): Primary canvas background
* `ivory[200]` (`#F5F2EB`): Secondary background, subtle card surface
* `ivory[300]` (`#EFECE4`): Subtle borders, divider lines

### Deep Ink (Dark Mode Canvas & Light Mode Text)
* `ink[950]` (`#0A0C0F`): Deepest background for OLED screens
* `ink[900]` (`#0F1115`): Primary dark mode canvas & primary light mode text
* `ink[850]` (`#16191F`): Elevated dark card surface
* `ink[800]` (`#1D2129`): Inset dark inputs, secondary dark surfaces

---

## 3. Restrained Semantic Accents

Accents are never decorative wallpaper; they communicate actionable domain state:

| Semantic Token | Light Mode Value | Dark Mode Value | Domain Meaning |
| :--- | :--- | :--- | :--- |
| **Growth** | `#226949` (Forest) | `#4ADE80` (Mint) | Progress, positive habit trends, completed milestones |
| **Energy** | `#B45309` (Amber) | `#FBBF24` (Gold) | Active capacity, workout sessions, high-vitality blocks |
| **Reflection** | `#4D5091` (Indigo) | `#818CF8` (Iris) | Daily Growth review, journal prompts, Companion dialogue |
| **Attention** | `#9B2C2C` (Crimson) | `#F87171` (Coral) | Overload trade-offs, missed routine alerts, behavioral alarms |
| **Recovery** | `#0F766E` (Teal) | `#2DD4BF` (Cyan) | Rest intervals, sleep logs, scheduled decompression |

---

## 4. 7 Life Area Colors

Each life area is assigned a stable color anchor:
- **Mind**: `#6366F1` (Indigo)
- **Health**: `#10B981` (Emerald)
- **Career**: `#0284C7` (Sky)
- **Relationships**: `#EC4899` (Rose)
- **Personal**: `#F59E0B` (Amber)
- **Finance**: `#14B8A6` (Teal)
- **Purpose**: `#8B5CF6` (Violet)

---

## 5. Deliberate Dark Mode

Dark mode is not an inverted calculation (`100% - Light`). In dark mode:
- Canvas shifts to Deep Ink (`#0F1115`).
- Surfaces become Charcoal (`#16191F`).
- Borders soften to semi-transparent white (`rgba(255, 255, 255, 0.08)`).
- Accent saturation is adjusted to prevent eye strain and maintain WCAG 2.1 AA 4.5:1 contrast against dark backgrounds.
