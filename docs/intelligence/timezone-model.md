# SAAR Timezone & Calendar Aggregation Model (v1.0)

All behavioral analytics must be timezone-aware. Server UTC should **never** be used blindly as the calendar boundary for a user living in a different timezone.

---

## 1. Principles

1. **User Timezone Authority**:
   - The user's configured IANA timezone (e.g. `America/New_York`, `Asia/Kolkata`, `Europe/London`) governs day boundaries.
2. **Local Day Boundary**:
   - A user's local day begins at `00:00:00.000` in their timezone and ends at `23:59:59.999`.
3. **Database Storage**:
   - Timestamps (`occurredAt`, `createdAt`) are always stored in standard UTC.
   - Date-only fields (`localDate`) are stored as `Date` (e.g. `YYYY-MM-DD`).
4. **DST Safety**:
   - Daylight Saving Time shifts (e.g. EST/EDT, GMT/BST) are handled via standard `Intl.DateTimeFormat` with IANA timezone strings, avoiding naive 24-hour arithmetic when crossing daylight boundaries.
