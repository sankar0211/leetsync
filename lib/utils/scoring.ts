/**
 * Scoring Engine — Pure functions for the 10/5/0 scoring system.
 *
 * dailyScore:
 *   10 if both problems completed
 *    5 if exactly one completed
 *    0 if none completed
 *
 * No difficulty weighting. Total = sum of daily scores.
 * Completion timestamps are NEVER used in scoring — only for tiebreaks.
 */

export interface CompletionData {
  completed: boolean;
  completedAt: Date | null;
  usedLeetAI: boolean;
}

/**
 * Calculate the daily score for a user based on their completions.
 * 5 points per completed problem.
 */
export function dailyScore(completions: { completed: boolean }[]): number {
  const completedCount = completions.filter((c) => c.completed).length;
  return completedCount * 5;
}

/**
 * Calculate total score across multiple days.
 * Each day is an array of completions (should be 2 items: problem 1 & 2).
 */
export function totalScore(
  dailyCompletions: { completed: boolean }[][]
): number {
  return dailyCompletions.reduce((sum, day) => sum + dailyScore(day), 0);
}

/**
 * Calculate the AI usage percentage for a set of completion records.
 */
export function aiUsagePercentage(
  completions: { usedLeetAI: boolean; completed: boolean }[]
): number {
  const completedRecords = completions.filter((c) => c.completed);
  if (completedRecords.length === 0) return 0;
  const aiCount = completedRecords.filter((c) => c.usedLeetAI).length;
  return Math.round((aiCount / completedRecords.length) * 100);
}
