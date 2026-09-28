# SAAR Behavioral Feature Catalog (v1.0)

Features are versioned mathematical rollups over defined time windows ($W$).

---

## 1. Feature Definition Schema

Every feature contains:
- `name`: String identifier
- `version`: Algorithm version string (e.g. `v1`)
- `windowDays`: Window duration (e.g. 7, 14, 30)
- `value`: Number, ratio, or structured map
- `sampleSize`: Count of underlying observations / events
- `confidence`: Confidence Tier (`NO_DATA` | `INSUFFICIENT_DATA` | `EMERGING_SIGNAL` | `ESTABLISHED_SIGNAL`)
- `calculatedAt`: UTC computation timestamp

---

## 2. Core Execution Features

### `task_completion_rate` (v1)
- **Formula**: $\frac{\text{tasks\_completed}}{\text{tasks\_planned}} \times 100$
- **Windows**: 7d, 14d, 30d
- **Min Threshold**: $\ge 3$ tasks for `EMERGING_SIGNAL`, $\ge 7$ tasks for `ESTABLISHED_SIGNAL`.

### `task_reschedule_rate` (v1)
- **Formula**: $\frac{\text{tasks\_rescheduled}}{\text{total\_active\_tasks}} \times 100$
- **Interpretation**: Identifies planning optimism / scheduling friction.

### `task_skip_rate` (v1)
- **Formula**: $\frac{\text{tasks\_skipped}}{\text{tasks\_planned}} \times 100$

---

## 3. Consistency & Routine Features

### `current_streak_days` (v1)
- **Formula**: Consecutive local calendar days containing at least 1 completed task or routine occurrence. Allows 1-day grace period where documented.

### `routine_adherence_rate` (v1)
- **Formula**: $\frac{\text{occurrences\_completed}}{\text{occurrences\_expected}} \times 100$
- **Windows**: 7d, 14d, 30d

---

## 4. Subjective Well-being Features

*Self-reported scores are never treated as objective medical metrics.*

### `avg_mood` & `avg_energy` (v1)
- **Formula**: $\frac{\sum \text{score}}{N}$ over check-in days in window.
- **Range**: 1.0 to 5.0.

---

## 5. Life Area Balance Features

### `life_area_activity_distribution` (v1)
- **Formula**: Percentage of total completed tasks and routines mapped per life area.
- **Symmetry Index**: Gini coefficient or variance of allocation across active life areas.
