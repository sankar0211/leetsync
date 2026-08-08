/**
 * Streak Calculator — computes current and longest streaks.
 *
 * A "streak" is consecutive days where the user scored > 0
 * (completed at least one problem).
 */

import { getToday } from "./rotation";

interface DayScore {
  date: Date;
  score: number;
}

/**
 * Calculate current and longest streaks from daily scores.
 *
 * @param dayScores - Array of { date, score } objects, can be in any order
 * @returns { current: number, longest: number }
 */
export function calculateStreaks(
  dayScores: DayScore[]
): { current: number; longest: number } {
  if (dayScores.length === 0) return { current: 0, longest: 0 };

  // Normalize dates and sort ascending
  const sorted = dayScores
    .map((d) => {
      const dateObj = new Date(d.date);
      return {
        date: new Date(
          Date.UTC(
            dateObj.getUTCFullYear(),
            dateObj.getUTCMonth(),
            dateObj.getUTCDate()
          )
        ),
        score: d.score,
      };
    })
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  let longest = 0;
  let currentStreak = 0;

  for (let i = 0; i < sorted.length; i++) {
    if (sorted[i].score > 0) {
      if (i === 0) {
        currentStreak = 1;
      } else {
        const prevDate = sorted[i - 1].date;
        const currDate = sorted[i].date;
        const diffDays = Math.round(
          (currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (diffDays === 1 && sorted[i - 1].score > 0) {
          currentStreak++;
        } else {
          currentStreak = 1;
        }
      }
      longest = Math.max(longest, currentStreak);
    } else {
      currentStreak = 0;
    }
  }

  // Now calculate actual current streak (must include today or yesterday)
  const today = getToday();
  const yesterday = new Date(today);
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);

  let current = 0;

  // Walk backwards from the most recent entry
  for (let i = sorted.length - 1; i >= 0; i--) {
    if (sorted[i].score === 0) break;

    if (i === sorted.length - 1) {
      // Most recent entry must be today or yesterday to count as "current"
      const entryDate = sorted[i].date;
      if (
        entryDate.getTime() !== today.getTime() &&
        entryDate.getTime() !== yesterday.getTime()
      ) {
        break;
      }
      current = 1;
    } else {
      const nextDate = sorted[i + 1].date;
      const currDate = sorted[i].date;
      const diffDays = Math.round(
        (nextDate.getTime() - currDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (diffDays === 1) {
        current++;
      } else {
        break;
      }
    }
  }

  return { current, longest };
}
