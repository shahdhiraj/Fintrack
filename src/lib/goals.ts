/**
 * Savings goal maths. Pure functions (no React or Firebase).
 * A goal tracks money set aside towards a target; contributions can be negative (withdrawals).
 */
import { differenceInCalendarDays, differenceInCalendarMonths, startOfDay } from 'date-fns';

export type GoalLike = { targetAmount: number; targetDate?: Date | null; createdAt?: Date | null };
export type ContributionLike = { amount: number; date: Date };

export type GoalStatus = 'done' | 'on-track' | 'behind' | 'overdue' | 'no-date' | 'not-started';

export type GoalProgress = {
  saved: number;
  remaining: number;
  /** 0..1, capped at 1. */
  ratio: number;
  /** Whole months left until the target date (at least 1 while the date is in the future). */
  monthsLeft: number | null;
  daysLeft: number | null;
  /** What has to go in each month from now to reach the target on time. */
  monthlyNeeded: number | null;
  /** Average put in per month so far (since the first contribution). */
  monthlyPace: number | null;
  /** At the current pace, the month the goal is reached. */
  projectedDate: Date | null;
  status: GoalStatus;
};

const round2 = (n: number) => Math.round(n * 100) / 100;

export function goalProgress(goal: GoalLike, contributions: ContributionLike[], today = new Date()): GoalProgress {
  const saved = round2(contributions.reduce((s, c) => s + c.amount, 0));
  const target = Math.max(0, goal.targetAmount);
  const remaining = round2(Math.max(0, target - saved));
  const ratio = target > 0 ? Math.min(1, Math.max(0, saved / target)) : 0;
  const now = startOfDay(today);

  let daysLeft: number | null = null;
  let monthsLeft: number | null = null;
  let monthlyNeeded: number | null = null;
  if (goal.targetDate) {
    daysLeft = differenceInCalendarDays(startOfDay(goal.targetDate), now);
    monthsLeft = daysLeft > 0 ? Math.max(1, differenceInCalendarMonths(goal.targetDate, now)) : 0;
    monthlyNeeded = remaining > 0 && monthsLeft > 0 ? round2(remaining / monthsLeft) : remaining > 0 ? remaining : 0;
  }

  // Pace: total saved divided by months since the first contribution (counting the current month).
  let monthlyPace: number | null = null;
  let projectedDate: Date | null = null;
  const dated = contributions.filter((c) => c.amount !== 0).sort((a, b) => a.date.getTime() - b.date.getTime());
  if (dated.length && saved > 0) {
    const months = Math.max(1, differenceInCalendarMonths(now, dated[0].date) + 1);
    monthlyPace = round2(saved / months);
    if (remaining > 0 && monthlyPace > 0) {
      const monthsToGo = Math.ceil(remaining / monthlyPace);
      projectedDate = new Date(now.getFullYear(), now.getMonth() + monthsToGo, 1);
    }
  }

  let status: GoalStatus;
  if (target > 0 && saved >= target) status = 'done';
  else if (saved <= 0) status = goal.targetDate && daysLeft !== null && daysLeft < 0 ? 'overdue' : 'not-started';
  else if (!goal.targetDate) status = 'no-date';
  else if (daysLeft !== null && daysLeft < 0) status = 'overdue';
  else if (monthlyPace !== null && monthlyNeeded !== null && monthlyPace >= monthlyNeeded) status = 'on-track';
  else status = 'behind';

  return { saved, remaining, ratio, monthsLeft, daysLeft, monthlyNeeded, monthlyPace, projectedDate, status };
}
