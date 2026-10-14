import type { LifeStage, User, Cycle, DailyLog, StageSuggestion } from '@/types';
import { differenceInCalendarDays, parseISO } from 'date-fns';

export function suggestStage(
  user: User | null,
  cycles: Cycle[],
  logs: DailyLog[],
  currentStage: LifeStage,
  dismissedSuggestions: StageSuggestion[]
): { stage: LifeStage; evidence: string; rule: string } | null {
  if (!user) return null;

  const ageBand = user.ageBand;
  const lastSuggestion = dismissedSuggestions
    .filter((s) => s.decision === 'dismissed' || s.decision === 'snoozed')
    .sort((a, b) => parseISO(b.offeredAt).getTime() - parseISO(a.offeredAt).getTime())[0];

  // Check snooze (90 days)
  if (lastSuggestion?.snoozeUntil) {
    const snoozeUntil = parseISO(lastSuggestion.snoozeUntil);
    if (new Date() < snoozeUntil) return null;
  }

  // Rule 1: Age band 13-17 → Teen Mode
  if ((ageBand === '13-17') && currentStage !== 'teen') {
    return {
      stage: 'teen',
      evidence: "You're in the 13–17 age band",
      rule: 'age-teen',
    };
  }

  // Rule 2: 60+ days no period AND age 46-55 → Perimenopause
  if (ageBand === '46-55' || user.healthNote === 'periods-changed') {
    const lastPeriod = cycles
      .map((c) => parseISO(c.startDate))
      .sort((a, b) => b.getTime() - a.getTime())[0];
    if (lastPeriod) {
      const daysSince = differenceInCalendarDays(new Date(), lastPeriod);
      if (daysSince >= 60 && currentStage !== 'perimenopause') {
        return {
          stage: 'perimenopause',
          evidence: `${daysSince} days without a logged period, and you're in the ${ageBand} age band`,
          rule: 'peri-60days',
        };
      }
    }
  }

  // Rule 3: 12 months no period → Menopause+
  const lastPeriod = cycles
    .map((c) => parseISO(c.startDate))
    .sort((a, b) => b.getTime() - a.getTime())[0];
  if (lastPeriod) {
    const daysSince = differenceInCalendarDays(new Date(), lastPeriod);
    if (daysSince >= 365 && currentStage !== 'menopause-plus') {
      return {
        stage: 'menopause-plus',
        evidence: '12 months without a logged period',
        rule: 'meno-12months',
      };
    }
  } else if (user.ageBand === '55+' && currentStage !== 'menopause-plus') {
    return {
      stage: 'menopause-plus',
      evidence: "You're in the 55+ age band",
      rule: 'meno-age',
    };
  }

  return null;
}

export function snoozeDuration(): string {
  const d = new Date();
  d.setDate(d.getDate() + 90);
  return d.toISOString();
}