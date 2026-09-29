# SAAR — UX Architecture & Narrative Hierarchy

## 1. The Human-Centric Hierarchy

The information architecture of SAAR is organized around 5 human questions rather than software entities:

```text
01 — WHO AM I BECOMING? (Identity, Future Self vector, Desired States)
02 — WHAT IS HAPPENING IN MY LIFE? (Life Areas Ecosystem, Reciprocal Connections)
03 — WHAT DOES SAAR NOTICE? (Behavioral Patterns, Real Evidence, Gentle Experiments)
04 — WHAT SHOULD I DO NEXT? (Capacity-Aware Planning, Sustainable Trade-offs)
05 — WHAT CHANGED? (Your Story of Change, Monthly Editorial Retrospective)
```

---

## 2. Journey Mapping

### Step 1: Identity Awakening (Future Self)
* The user does not start with a blank to-do list.
* They define their Future Self identity statement (e.g. "A calm, patient builder with sustainable vital energy") and associate desired states across the 6 core life areas.

### Step 2: Living Life Mapping
* Daily behaviors are mapped across the 6 interconnected life areas: Health, Mind, Career, Relationships, Purpose, Finance.
* The system emphasizes reciprocal relationships: pulling late hours in Craft steals directly from Health and next-day Mind clarity.

### Step 3: Pattern Discovery & Evidence
* As tasks, routines, and check-ins are logged, SAAR aggregates timestamped events into behavioral features.
* When patterns emerge (e.g. evening workout abandonment after long days), SAAR surfaces the finding with full discoverable evidence.

### Step 4: Deliberate Action & Trade-off Resolution
* The Planner protects a calibrated 450-minute (7h 30m) daily capacity limit.
* When overloaded, interactive trade-off mechanisms allow users to move, condense, or postpone secondary tasks to preserve recovery buffers.

### Step 5: Monthly Integration (Story of Change)
* At the close of each cycle, the user reviews an editorial personal report detailing what changed in practice, what became easier, what still creates friction, and what single experiment to test next.

---

## 3. Surface Responsibilities: Mobile vs Desktop

| Dimension | Mobile (`apps/mobile`) | Desktop Web (`apps/web`) |
| :--- | :--- | :--- |
| **Primary Role** | Action, immediate check-in, alarm, quick capture. | Deep planning, reflection, goal architecture, companion split view. |
| **Interaction Mode** | Fast, vertical, touch-first, glanceable. | Expansive, horizontal split-view, relational maps, evidence inspection. |
| **Today Screen** | Spatial focus: Next Action → Checklist → Evening Reflection. | Complete day canvas with velocity ring, capacity meter, and live signals. |
| **Companion** | Drawer-based audio/text prompt with action confirm. | Persistent grounded split workspace with active telemetry context. |
