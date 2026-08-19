/**
 * Rotation Engine — Pure function, no cron job needed.
 *
 * Determines today's Problem Setter by computing:
 *   rotationOrder[daysSinceTeamCreation % memberCount]
 *
 * This is computed on every read (dashboard load), never stored.
 */

export interface RotationMember {
  userId: string;
  rotationPosition: number;
}

/**
 * Get today's date as a Date with time zeroed out.
 * Uses the configured timezone (defaults to Asia/Kolkata for IST).
 */
export function getToday(): Date {
  const now = new Date();
  const tz = process.env.TIMEZONE || "Asia/Kolkata";
  
  // Format the date in the target timezone
  const tzString = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);

  // tzString is "MM/DD/YYYY"
  const [month, day, year] = tzString.split("/");
  // We create a UTC Date representing the start of that calendar day.
  // This ensures the database lookup (which is UTC) uses the correct day index.
  return new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
}

/**
 * Get tomorrow's date as a Date with time zeroed out.
 */
export function getTomorrow(): Date {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tz = process.env.TIMEZONE || "Asia/Kolkata";
  
  const tzString = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(tomorrow);

  const [month, day, year] = tzString.split("/");
  return new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
}

/**
 * Calculate the number of days between two dates (ignoring time).
 * Uses UTC methods to avoid daylight saving time or server locale issues.
 */
function daysBetween(startDate: Date, endDate: Date): number {
  const start = Date.UTC(
    startDate.getUTCFullYear(),
    startDate.getUTCMonth(),
    startDate.getUTCDate()
  );
  const end = Date.UTC(
    endDate.getUTCFullYear(),
    endDate.getUTCMonth(),
    endDate.getUTCDate()
  );
  return Math.floor((end - start) / (1000 * 60 * 60 * 24));
}

/**
 * Determine today's Problem Setter for a team.
 *
 * @param teamCreatedAt - When the team was created
 * @param members - Array of team members with their rotation positions
 * @returns The userId of today's setter, or null if no members
 */
export function getTodaysSetter(
  teamCreatedAt: Date,
  members: RotationMember[]
): string | null {
  if (members.length === 0) return null;

  const today = getToday();
  const daysSinceCreation = daysBetween(teamCreatedAt, today);

  // Sort by rotationPosition to ensure deterministic order
  const sortedMembers = [...members].sort(
    (a, b) => a.rotationPosition - b.rotationPosition
  );

  const setterIndex =
    ((daysSinceCreation % sortedMembers.length) + sortedMembers.length) %
    sortedMembers.length;

  return sortedMembers[setterIndex].userId;
}

/**
 * Determine tomorrow's Problem Setter for a team.
 */
export function getTomorrowsSetter(
  teamCreatedAt: Date,
  members: RotationMember[]
): string | null {
  if (members.length === 0) return null;

  const tomorrow = getTomorrow();
  const daysSinceCreation = daysBetween(teamCreatedAt, tomorrow);

  const sortedMembers = [...members].sort(
    (a, b) => a.rotationPosition - b.rotationPosition
  );

  const setterIndex =
    ((daysSinceCreation % sortedMembers.length) + sortedMembers.length) %
    sortedMembers.length;

  return sortedMembers[setterIndex].userId;
}

/**
 * Get the setter for a specific date (used in history views).
 */
export function getSetterForDate(
  teamCreatedAt: Date,
  members: RotationMember[],
  date: Date
): string | null {
  if (members.length === 0) return null;

  const daysSinceCreation = daysBetween(teamCreatedAt, date);

  const sortedMembers = [...members].sort(
    (a, b) => a.rotationPosition - b.rotationPosition
  );

  const setterIndex =
    ((daysSinceCreation % sortedMembers.length) + sortedMembers.length) %
    sortedMembers.length;

  return sortedMembers[setterIndex].userId;
}

/**
 * Recompute rotation positions to be contiguous 0..N-1
 * after a member is removed. Preserves relative order.
 */
export function recomputePositions(
  members: RotationMember[]
): RotationMember[] {
  return [...members]
    .sort((a, b) => a.rotationPosition - b.rotationPosition)
    .map((m, index) => ({ ...m, rotationPosition: index }));
}
