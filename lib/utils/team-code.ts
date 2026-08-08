/**
 * Team Code Generator — creates short, unique alphanumeric codes for teams.
 */

const CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Excludes I, O, 0, 1 to avoid confusion

/**
 * Generate a random alphanumeric code of the given length.
 * Default length is 6 characters.
 */
export function generateTeamCode(length: number = 6): string {
  let code = "";
  for (let i = 0; i < length; i++) {
    code += CHARS[Math.floor(Math.random() * CHARS.length)];
  }
  return code;
}
