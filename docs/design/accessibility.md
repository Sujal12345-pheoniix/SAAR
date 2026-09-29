# SAAR — Accessibility & WCAG 2.1 AA Specification

## 1. Core Commitment

SAAR is designed to be accessible to every person regardless of physical, visual, motor, or cognitive ability. It targets **WCAG 2.1 Level AA** compliance across all web and mobile surfaces.

---

## 2. Visual Contrast & Color Independence

* **Text Contrast**:
  - Primary text (`#0F1115`) on Warm Ivory (`#FAF8F5`) achieves a contrast ratio of **14.8:1** (far exceeding the 4.5:1 requirement).
  - Secondary text (`#495057`) achieves **7.4:1**.
  - Forest Sage buttons (`#226949`) with pure white text achieve **5.8:1**.
* **Color Independence**:
  - Color is never used as the sole indicator of state.
  - Life areas are represented by distinct, recognizable SVG silhouettes alongside labels and percentages.
  - Overload warnings combine muted crimson borders with clear explanatory text and explicit icon badges (`ShieldAlert`).

---

## 3. Keyboard Navigation & Focus Ring Standards

* **Tab Order**: All interactive triggers, links, inputs, and modal dismissals follow a natural, predictable DOM sequence.
* **Focus Rings**:
  - Never suppressed (`outline: none` without replacement is strictly forbidden).
  - High-visibility focus indicators: `outline: 2px solid #226949; outline-offset: 2px;`.
* **Modal Focus Trap**:
  - When dialogs or check-in modals open, focus is automatically moved to the first interactive element.
  - Tabbing is constrained within the modal until dismissed via the Escape key or dismiss button.

---

## 4. Touch Targets & Gestures

* **Touch Sizing**: All touch targets on mobile and responsive tablet viewports meet or exceed **44 × 44 CSS pixels**.
* **Non-Gesture Alternatives**: Every swipable or draggable element has an accessible click/tap alternative.

---

## 5. Screen Reader Semantics & Live Regions

* **ARIA Roles**:
  - Dialogs have `role="dialog"` and `aria-modal="true"`.
  - Buttons have explicit `aria-label` where text is truncated or icon-only.
  - Mobile hamburger toggle explicitly announces `aria-expanded="true|false"`.
* **Streaming Responses**:
  - Real-time Companion responses stream into containers equipped with `aria-live="polite"` so screen readers announce completions without interrupting the user.

---

## 6. Behavioral Alarm Emergency Bypass

* In traditional alarm apps, dismissals can lock users into coercive loops or cognitive puzzles.
* In SAAR, the Behavioral Alarm encourages a physical or cognitive awakening action, but **explicitly provides an emergency bypass link ("I need to wake up normally")** to prevent anxiety or entrapment.
