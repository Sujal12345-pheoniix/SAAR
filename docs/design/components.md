# SAAR Component System & Architecture

## 1. Principles of Component Design

1. **Strict Separation of Concerns**: UI primitives render pure markup, styling, and accessibility hooks. Domain and state management reside in custom hooks and context providers.
2. **Predictable API Contracts**: All components expose strongly typed props, `testId`, and forward standard ref attributes.
3. **Composability**: Complex composite screens (e.g., Today, Planner) are constructed from cohesive, reusable primitives rather than giant bespoke templates.

---

## 2. Reusable Core Primitives

| Component | Responsibility | Key Props |
| :--- | :--- | :--- |
| `Button` | Accessible interactive trigger | `variant` (primary, secondary, outline, ghost, danger, growth), `size`, `isLoading` |
| `IconButton` | Icon-only trigger with mandatory `aria-label` | `icon`, `size`, `variant` |
| `TextField` | Labeled single-line text input with error state | `label`, `error`, `helperText`, `value`, `onChange` |
| `Textarea` | Multi-line reflective or note input | `rows`, `maxLength`, `placeholder`, `error` |
| `Badge` | Semantic status tag | `variant` (growth, energy, reflection, attention, recovery) |
| `Modal` / `Drawer` | Accessible dialog with focus trap & ESC handling | `isOpen`, `onClose`, `title`, `children` |
| `Skeleton` | Content loading placeholder | `width`, `height`, `variant` (text, circular, rectangular) |
| `EmptyState` | Contextual empty guidance with action button | `title`, `description`, `actionLabel`, `onAction`, `icon` |
| `ErrorState` | Human, non-technical error view with retry | `title`, `message`, `retryLabel`, `onRetry` |

---

## 3. SAAR-Specific Domain Components

| Component | Domain Purpose | Visual Representation |
| :--- | :--- | :--- |
| `GrowthRing` | Circular progress for daily/routine execution | SVG arc with tabular percentage center and restrained accent stroke |
| `LifeAreaIndicator` | Life Area categorization tag with color anchor | Pill with dot indicator and localized title |
| `GoalProgress` | Goal status, target, trend, and destination | Progress bar, delta metric, why statement accordion |
| `GapIndicator` | Visual tension between desired vs observed behavior | Evidence card highlighting gap type, severity, and exploration trigger |
| `SignalIndicator` | Deterministic Consistency / Momentum / Balance | Metric badge with direction arrow and rolling period summary |
| `TaskRow` | Actionable task with completion/skip/reschedule | Checkbox, title, estimated time, priority tag, swipe/menu triggers |
| `RoutineRow` | Habit occurrence with frequency and streak | Completion trigger, streak count, frequency label |
| `DailyGrowthStep` | Step in guided evening review | Breadcrumb step with title, description, and action controls |
| `TradeoffCard` | Visual warning for planner capacity overload | Capacity meter, overload delta, and recommended adjustments |
| `CompanionPulse` | Living visual presence for SAAR Companion | Breathing radial SVG with state transitions (idle, listening, reflecting) |
| `FutureSelfCard` | Aspirational anchor connecting identity to behavior | Identity statement, life area targets, current evidence summary |
