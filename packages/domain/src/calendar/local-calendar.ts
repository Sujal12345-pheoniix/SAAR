/**
 * Timezone-aware local calendar calculations for SAAR.
 * Zero external dependencies. Uses standard Intl.DateTimeFormat.
 */

export interface LocalDayWindow {
  localDate: string; // YYYY-MM-DD
  startUtc: Date;
  endUtc: Date;
}

/**
 * Returns formatted YYYY-MM-DD string for a given instant in user's timezone.
 */
export function getLocalDateString(date: Date, timezone: string = 'UTC'): string {
  try {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    return formatter.format(date);
  } catch {
    // Fallback to UTC if timezone is invalid
    return date.toISOString().slice(0, 10);
  }
}

/**
 * Returns an array of YYYY-MM-DD strings for the last N local days up to reference date.
 */
export function getRecentLocalDates(days: number, referenceDate: Date = new Date(), timezone: string = 'UTC'): string[] {
  const dates: string[] = [];
  const refMs = referenceDate.getTime();
  const dayMs = 86_400_000;

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(refMs - i * dayMs);
    dates.push(getLocalDateString(d, timezone));
  }

  // De-duplicate in case of DST clock adjustments
  return Array.from(new Set(dates));
}

/**
 * Calculates continuous streak across chronological local day strings.
 * Allows 1-day grace period where documented.
 */
export function calculateStreak(activeDates: string[], referenceDateString: string, graceDays: number = 1): number {
  if (activeDates.length === 0) return 0;

  const dateSet = new Set(activeDates);
  let streak = 0;
  let missesAllowed = graceDays;

  // Walk backwards from reference day
  const ref = new Date(`${referenceDateString}T12:00:00.000Z`);

  for (let i = 0; i < 365; i++) {
    const d = new Date(ref.getTime() - i * 86_400_000);
    const dateStr = d.toISOString().slice(0, 10);

    if (dateSet.has(dateStr)) {
      streak++;
    } else {
      if (missesAllowed > 0 && streak > 0) {
        missesAllowed--;
      } else {
        break;
      }
    }
  }

  return streak;
}
