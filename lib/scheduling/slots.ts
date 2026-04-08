// Slot availability calculation engine
// São Paulo is UTC-3 with no DST since 2019
const BRAZIL_OFFSET_MIN = 3 * 60; // 180 minutes

export interface BusinessHoursEntry {
  day_of_week: number; // 0=Sunday, 6=Saturday
  is_open: boolean;
  open_time: string;  // "HH:MM"
  close_time: string; // "HH:MM"
}

export interface ExistingAppointment {
  start_at: string; // ISO timestamp
  end_at: string;   // ISO timestamp
  professional_id: string;
}

export interface BlockedSlotEntry {
  start_at: string; // ISO timestamp
  end_at: string;   // ISO timestamp
  professional_id: string | null; // null = blocked for all
}

export interface GetAvailableSlotsParams {
  date: string;             // "YYYY-MM-DD"
  businessHours: BusinessHoursEntry[];
  appointments: ExistingAppointment[];
  blockedSlots: BlockedSlotEntry[];
  slotDuration: number;     // minutes
  professionalId?: string;  // optional filter by professional
}

/**
 * Converts "HH:MM" string to total minutes since midnight
 */
function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

/**
 * Converts total minutes since midnight to "HH:MM" string
 */
function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/**
 * Converts ISO timestamp (UTC) to "HH:MM" in São Paulo local time (UTC-3)
 */
function isoToLocalTime(isoString: string, date: string): string | null {
  const dt = new Date(isoString);

  // Shift to Brazil local time to compare dates and get local hours
  const localMs = dt.getTime() - BRAZIL_OFFSET_MIN * 60_000;
  const localDt = new Date(localMs);
  const targetDate = new Date(date + "T00:00:00Z");

  const sameDay =
    localDt.getUTCFullYear() === targetDate.getUTCFullYear() &&
    localDt.getUTCMonth() === targetDate.getUTCMonth() &&
    localDt.getUTCDate() === targetDate.getUTCDate();

  if (!sameDay) return null;

  return minutesToTime(localDt.getUTCHours() * 60 + localDt.getUTCMinutes());
}

/**
 * Extracts minutes range [start, end] from ISO timestamps for a given date,
 * expressed in São Paulo local time (UTC-3) to match business hours strings.
 */
function isoRangeToMinutes(
  start_at: string,
  end_at: string,
  date: string
): { start: number; end: number } | null {
  const startDt = new Date(start_at);
  const endDt = new Date(end_at);

  // Shift UTC timestamps to Brazil local time for date comparison and minutes
  const startLocalMs = startDt.getTime() - BRAZIL_OFFSET_MIN * 60_000;
  const startLocalDt = new Date(startLocalMs);
  const targetDate = new Date(date + "T00:00:00Z");

  const sameDay =
    startLocalDt.getUTCFullYear() === targetDate.getUTCFullYear() &&
    startLocalDt.getUTCMonth() === targetDate.getUTCMonth() &&
    startLocalDt.getUTCDate() === targetDate.getUTCDate();

  if (!sameDay) return null;

  const endLocalDt = new Date(endDt.getTime() - BRAZIL_OFFSET_MIN * 60_000);

  return {
    start: startLocalDt.getUTCHours() * 60 + startLocalDt.getUTCMinutes(),
    end: endLocalDt.getUTCHours() * 60 + endLocalDt.getUTCMinutes(),
  };
}

/**
 * Returns array of available time slots as "HH:MM" strings
 *
 * Logic:
 * 1. Determine business hours for the given day of week
 * 2. Generate all candidate slots within open hours
 * 3. Remove slots overlapping existing appointments (filtered by professional)
 * 4. Remove slots overlapping blocked ranges (per professional or all)
 * 5. Remove slots in the past (if date is today)
 */
export function getAvailableSlots(params: GetAvailableSlotsParams): string[] {
  const {
    date,
    businessHours,
    appointments,
    blockedSlots,
    slotDuration,
    professionalId,
  } = params;

  const dateObj = new Date(date + "T12:00:00"); // noon to avoid DST edge cases
  const dayOfWeek = dateObj.getDay(); // 0=Sunday

  // Find business hours for this day
  const hoursEntry = businessHours.find((h) => h.day_of_week === dayOfWeek);

  if (!hoursEntry || !hoursEntry.is_open) {
    return [];
  }

  const openMinutes = timeToMinutes(hoursEntry.open_time);
  const closeMinutes = timeToMinutes(hoursEntry.close_time);

  // Generate all candidate slots
  const candidates: number[] = [];
  for (let t = openMinutes; t + slotDuration <= closeMinutes; t += slotDuration) {
    candidates.push(t);
  }

  // Build list of blocked ranges (in minutes) from appointments
  const appointmentRanges = appointments
    .filter(
      (apt) =>
        !professionalId || apt.professional_id === professionalId
    )
    .map((apt) => isoRangeToMinutes(apt.start_at, apt.end_at, date))
    .filter((r): r is { start: number; end: number } => r !== null);

  // Build list of blocked ranges from blocked_slots
  const blockedRanges = blockedSlots
    .filter(
      (slot) =>
        slot.professional_id === null || // applies to all
        !professionalId ||
        slot.professional_id === professionalId
    )
    .map((slot) => isoRangeToMinutes(slot.start_at, slot.end_at, date))
    .filter((r): r is { start: number; end: number } => r !== null);

  const allBlockedRanges = [...appointmentRanges, ...blockedRanges];

  // Determine "now" in minutes if filtering for today
  const today = new Date();
  const isToday =
    today.getFullYear() === dateObj.getFullYear() &&
    today.getMonth() === dateObj.getMonth() &&
    today.getDate() === dateObj.getDate();

  // Convert current UTC time to Brazil local minutes for comparison with slot times
  const nowMinutes = isToday
    ? today.getUTCHours() * 60 + today.getUTCMinutes() - BRAZIL_OFFSET_MIN
    : 0;

  // Filter out unavailable slots
  const available = candidates.filter((slotStart) => {
    const slotEnd = slotStart + slotDuration;

    // Skip past slots
    if (isToday && slotStart <= nowMinutes) {
      return false;
    }

    // Check for overlap with any blocked range
    const overlaps = allBlockedRanges.some(
      ({ start, end }) => slotStart < end && slotEnd > start
    );

    return !overlaps;
  });

  return available.map(minutesToTime);
}
