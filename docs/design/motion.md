# SAAR Motion & Physics System

## 1. Motion Philosophy

Motion in SAAR is functional, not decorative. It communicates:
1. **Spatial Continuity**: Where did this element emerge from, and where did it go?
2. **State & Progress**: Clarifying transitions (e.g., from planning to execution).
3. **Calm Feedback**: Providing subtle confirmation without dopamine-spiking gamification.

---

## 2. Motion Curves & Durations

| Token | Duration | Curve / Physics | Applied To |
| :--- | :--- | :--- | :--- |
| `motion.instant` | 100ms | Linear / Ease-out | Checkbox fill, toggle switch flip |
| `motion.quick` | 200ms | `cubic-bezier(0.0, 0.0, 0.2, 1)` | Dropdown open, hover lifts, tooltip fade |
| `motion.deliberate` | 350ms | `cubic-bezier(0.25, 1, 0.5, 1)` | Drawer slide-in, modal scale-in, page crossfade |
| `motion.meditative` | 600ms | Physics Spring (stiffness: 120, damping: 18) | Daily Growth step transition, Companion Pulse respiration |

---

## 3. Strict Reduced Motion Safety

Every animation in SAAR must respect the user's operating system preferences (`prefers-reduced-motion: reduce`).

When reduced motion is active:
- Transform animations (slide, scale, bounce) are disabled.
- Opacity crossfades are reduced to immediate 100ms transitions.
- Continuous ambient animations (e.g., Companion Pulse breathing) are replaced with static, calm resting state indicators.
