# SAAR — Motion System & Physical Dynamics

## 1. Motion Philosophy

Motion in SAAR must feel **quiet, organic, intentional, and slightly physical**.
It serves strictly cognitive purposes:
* Directing spatial focus.
* Clarifying parent-child relationships (e.g. selecting a life area expands related goals).
* Providing tactile feedback on state completion.

### Prohibited Motion (Anti-Patterns)
* ❌ Continuous spinning loops, floating orbs, or drifting particles.
* ❌ Giant bouncy rubber-band springs.
* ❌ Animation on every scroll frame that lags mobile hardware.
* ❌ Gratuitous parallax that causes vestibular disorientation.

---

## 2. Motion Curves & Durations

```css
/* Precise Cubic-Bezier Physics */
--ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1); /* Decelerating entry for modals, sheets */
--ease-spring:   cubic-bezier(0.34, 1.56, 0.64, 1); /* Micro tactile pop for checkboxes */
--ease-smooth:   cubic-bezier(0.4, 0, 0.2, 1);     /* Standard interface transitions */

/* Durations */
--duration-fast:  120ms; /* Button press, toggle switch, hover color */
--duration-base:  200ms; /* Accordion open, card hover, tab switch */
--duration-slow:  350ms; /* Modal presentation, large panel expansion */
--duration-xslow: 600ms; /* The Becoming Field trajectory morph */
```

---

## 3. The SAAR Pulse Dynamics

The SAAR Pulse is the living ambient symbol of the product:
* **Idle State**: Gentle 3000ms breathing opacity cycle ($0.4 \longleftrightarrow 0.85$), representing quiet presence.
* **Reflecting State**: Deliberate, smooth rotation symbolizing behavioral synthesis.
* **Speaking State**: Subtle vertical expansion as text streams into the grounded dialogue view.

---

## 4. Accessibility & Reduced Motion

SAAR treats vestibular safety as a non-negotiable requirement.
All animations must respect `prefers-reduced-motion: reduce`:

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

In reduced-motion mode:
* Transform translations ($\Delta x, \Delta y$) are zeroed out.
* Spring physics are replaced with immediate opacity transitions.
* Parallax effects are completely disabled.
