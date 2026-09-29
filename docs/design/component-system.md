# SAAR — Component System Specification

## 1. Component Architecture & Principles

All components in SAAR are built with the following standards:
1. **Composability**: Built from primitive atoms up to complex domain orchestrators.
2. **Deterministic Typing**: Strict TypeScript interfaces with zero `any` declarations.
3. **State Completeness**: Every interactive component handles initial, loading, empty, active, hover, focus, disabled, error, and success states.
4. **Accessible Semantics**: Native buttons, explicit ARIA roles, high-contrast outlines, and screen-reader accessibility labels.

---

## 2. Core UI Primitives (`apps/web/components/ui/`)

### A. Button (`Button.tsx`)
* **Variants**: `primary` (Forest Sage), `secondary` (Ivory border), `ghost` (Quiet slate), `danger` (Muted crimson).
* **Sizes**: `sm` (32px), `md` (40px), `lg` (48px).
* **Physics**: Micro scale compression on press (`scale: 0.98`), smooth hover elevation.
* **Loading**: Inline accessible spinner with `aria-busy="true"` and non-shifting label layout.

### B. Card (`Card.tsx`)
* **Variants**: `default` (Warm Ivory / White surface), `subtle` (Bone surface), `elevated` (Floating shadow), `dark` (Warm Black / Deep Ink).
* **Borders**: 1px subtle hairline `rgba(15, 17, 21, 0.08)`.

### C. Badge (`Badge.tsx`)
* **Variants**: `growth`, `energy`, `reflection`, `attention`, `recovery`, `neutral`.
* **Typography**: Tabular figures, tight tracking, pill radius.

### D. Modal & ConfirmDialog (`Modal.tsx`, `ConfirmDialog.tsx`)
* **Behavior**: Trapped keyboard focus, Escape key listener, scroll-locked body, accessible `role="dialog"`.

### E. EmptyState & ErrorState (`EmptyState.tsx`, `ErrorState.tsx`)
* **Philosophy**: Empty states are invitations, not dead ends.
* **Actionable**: Always provide a clear, inviting primary action (e.g. "What is one thing you want your future self to be able to do?").
* **Error Resilience**: Human, respectful copy with a retry hook and confirmation that progress is safe.

---

## 3. Domain Components (`apps/web/components/domain/`)

### A. `BecomingField`
The signature interaction mapping the relationship between daily schedule load, routine friction, alignment percentage, and the Future Self.

### B. `LifeAreaIndicator` & `LifeAreaIcon`
SVG-based visual language replacing all emoji representations across the 7 life areas (Mind, Health, Career, Relationships, Personal, Finance, Purpose).

### C. `TradeoffCard`
Visualizes competing life priorities (Craft ↕ Recovery, Speed ↕ Sustainability) when schedules approach capacity.

### D. `CompanionPulse`
The non-avatar organic visual identity of the SAAR intelligence layer, reflecting states of listening, reflecting, and speaking.

### E. `TaskRow`
Tactile daily task item supporting completion, duration badges, and contextual reschedule triggers.
