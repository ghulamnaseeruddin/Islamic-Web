/** Number of days in a row (ending today or yesterday) that have a reading log. */
export function computeStreak(days: string[]): number {
  const set = new Set(days);
  const fmt = (d: Date) => d.toLocaleDateString("en-CA");
  const d = new Date();
  if (!set.has(fmt(d))) d.setDate(d.getDate() - 1);
  let n = 0;
  while (set.has(fmt(d))) {
    n++;
    d.setDate(d.getDate() - 1);
  }
  return n;
}
