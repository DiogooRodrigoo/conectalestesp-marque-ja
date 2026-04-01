// Slot availability calculation engine

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
 * Converts ISO timestamp to "HH:MM" in local time
 */
function isoToLocalTime(isoString: string, date: string): string | null {
  const dt = new Date(isoString);
  const targetDate = new Date(date + "T00:00:00");

  // Check if same day (comparing year/month/day)
  const sameDay =
    dt.getFullYear() === targetDate.getFullYear() &&
    dt.getMonth() === targetDate.getMonth() &&
    dt.getDate() === targetDate.getDate();

  if (!sameDay) return null;

  const h = dt.getHours();
  const m = dt.getMinutes();
  return minutesToTime(h * 60 + m);
}

/**
 * Extracts minutes range [start, end] from ISO timestamps for a given date
 */
function isoRangeToMinutes(
  start_at: string,
  end_at: string,
  date: string
): { start: number; end: number } | null {
  const startDt = new Date(start_at);
  const endDt = new Date(end_at);
  const targetDate = new Date(date);

  const startDay = startDt.toDateString();
  const targetDay = targetDate.toDateString();

  if (startDay !== targetDay) return null;

  return {
    start: startDt.getHours() * 60 + startDt.getMinutes(),
    end: endDt.getHours() * 60 + endDt.getMinutes(),
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

  const nowMinutes = isToday ? today.getHours() * 60 + today.getMinutes() : 0;

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
