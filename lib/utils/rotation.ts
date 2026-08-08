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
 * Get today's date as a Date with time zeroed out (local timezone).
 */
export function getToday(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

/**
 * Calculate the number of days between two dates (ignoring time).
 */
function daysBetween(startDate: Date, endDate: Date): number {
  const start = new Date(
    startDate.getFullYear(),
    startDate.getMonth(),
    startDate.getDate()
  );
  const end = new Date(
    endDate.getFullYear(),
    endDate.getMonth(),
    endDate.getDate()
  );
  return Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
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
