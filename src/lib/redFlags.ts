import type { Cycle, DailyLog, LifeStage, PSSTResult } from '@/types';
import { differenceInCalendarDays, parseISO, differenceInHours } from 'date-fns';
import { getCompletedCycleLengths, getLastPeriodStart } from './prediction';
import { scorePbacForDay } from './pbac';

export interface RedFlag {
  id: string;
  rule: string;
  whatWeNoticed: string;
  whyItMatters: string;
  nextStep: string;
  whatToTell: string;
}

export function checkRedFlags(
  cycles: Cycle[],
  logs: DailyLog[],
  currentStage: LifeStage,
  user: { ageBand: string; healthNote?: string },
  products: { id: string; type: string }[],
  psstResults: PSSTResult[]
): RedFlag[] {
  const flags: RedFlag[] = [];

  const lengths = getCompletedCycleLengths(cycles);
  const lastStart = getLastPeriodStart(cycles);

  // Flag 1: No period by age 15 (can't fully check without menarche data, skip for now)

  // Flag 2: Cycles more frequent than 21 or less frequent than 45 (persistent: 2+ cycles)
  if (lengths.length >= 2) {
    const recent = lengths.slice(-2);
    if (recent.every((l) => l < 21)) {
      flags.push({
        id: 'rf-frequent',
        rule: 'frequent-cycles',
        whatWeNoticed: `Your last 2 cycles were ${recent.join(' and ')} days apart`,
        whyItMatters: 'Cycles closer together than 21 days are something clinicians pay attention to',
        nextStep: 'Consider getting checked soon',
        whatToTell: 'My last two cycles were less than 21 days apart',
      });
    }
    if (recent.every((l) => l > 45)) {
      flags.push({
        id: 'rf-infrequent',
        rule: 'infrequent-cycles',
        whatWeNoticed: `Your last 2 cycles were ${recent.join(' and ')} days apart`,
        whyItMatters: 'Cycles further apart than 45 days are something clinicians pay attention to',
        nextStep: 'Consider getting checked soon',
        whatToTell: 'My last two cycles were more than 45 days apart',
      });
    }
  }

  // Flag 3: Gap of 90+ days with no period (not in Pause/Postpartum)
  if (lastStart && currentStage !== 'pause' && currentStage !== 'postpartum') {
    const daysSince = differenceInCalendarDays(new Date(), lastStart);
    if (daysSince >= 90) {
      flags.push({
        id: 'rf-gap90',
        rule: 'gap-90-days',
        whatWeNoticed: `It's been ${daysSince} days since your last logged period`,
        whyItMatters: 'A gap of 90 days or more without a period is something clinicians pay attention to',
        nextStep: 'Consider getting checked soon',
        whatToTell: `It's been ${daysSince} days since my last period`,
      });
    }
  }

  // Flag 4: Period lasting more than 7 days
  if (lastStart) {
    const today = new Date();
    const periodDays = differenceInCalendarDays(today, lastStart) + 1;
    if (periodDays > 7 && currentStage === 'reproductive') {
      // Check if still bleeding
      const todayLog = logs.find((l) => l.date.slice(0, 10) === today.toISOString().slice(0, 10));
      if (todayLog?.flow && todayLog.flow !== 'none') {
        flags.push({
          id: 'rf-long-period',
          rule: 'period-7-plus-days',
          whatWeNoticed: `Your current period has been going for ${periodDays} days`,
          whyItMatters: 'Periods lasting more than 7 days are something clinicians pay attention to',
          nextStep: 'Consider getting checked soon',
          whatToTell: `My period has lasted ${periodDays} days so far`,
        });
      }
    }
  }

  // Flag 5: Soaking through 1+ pad/tampon every 1-2 hours
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayLogs = logs.filter((l) => l.date.slice(0, 10) === todayStr);
  for (const log of todayLogs) {
    for (const pu of log.products) {
      if (pu.changes >= 2 && pu.lastChangeAt) {
        const changeTime = parseISO(pu.lastChangeAt);
        const startOfDay = new Date(todayStr);
        if (differenceInHours(changeTime, startOfDay) <= 2) {
          flags.push({
            id: 'rf-soaking',
            rule: 'soaking-fast',
            whatWeNoticed: 'You logged 2 or more product changes within 2 hours today',
            whyItMatters: 'Soaking through products every 1-2 hours is something clinicians pay attention to',
            nextStep: 'Consider getting checked soon',
            whatToTell: 'I soaked through 2+ products in 2 hours',
          });
          break;
        }
      }
    }
  }

  // Flag 6: Heavy bleeding + easy bruising history
  if (user.healthNote === 'easy-bruising') {
    const recentPbac = logs
      .filter((l) => l.pbac || l.products.some((p) => p.pbac))
      .slice(-5);
    if (recentPbac.length > 0) {
      flags.push({
        id: 'rf-bruising',
        rule: 'heavy-bruising',
        whatWeNoticed: 'You have heavy bleeding and a noted history of easy bruising',
        whyItMatters: 'Heavy bleeding combined with easy bruising is something clinicians pay attention to',
        nextStep: 'Consider getting checked soon',
        whatToTell: 'I have heavy periods and a history of easy bruising',
      });
    }
  }

  // Flag 7: Any bleeding in Menopause+ mode
  if (currentStage === 'menopause-plus') {
    const bleedingLogs = logs.filter(
      (l) => l.flow && l.flow !== 'none' && l.bleedingType !== 'pause-note'
    );
    if (bleedingLogs.length > 0) {
      const latest = bleedingLogs.sort((a, b) => b.date.localeCompare(a.date))[0];
      flags.push({
        id: 'rf-meno-bleeding',
        rule: 'meno-bleeding',
        whatWeNoticed: `You logged bleeding on ${latest.date.slice(0, 10)}`,
        whyItMatters: 'Any bleeding after menopause is something clinicians always want to check',
        nextStep: 'Consider getting checked soon',
        whatToTell: 'I had bleeding after not having a period for over a year',
      });
    }
  }

  // Flag 8: PSST screen-positive with severe impairment
  const screenPositive = psstResults.find(
    (r) => r.pattern === 'screen-positive' && r.answers.slice(14).some((a) => a === 3)
  );
  if (screenPositive) {
    flags.push({
      id: 'rf-psst-severe',
      rule: 'psst-severe-impairment',
      whatWeNoticed: 'Your PSST screening showed significant premenstrual symptoms with severe impact on daily life',
      whyItMatters: 'Premenstrual symptoms that severely affect daily life are worth discussing with a clinician',
      nextStep: 'Consider getting checked soon',
      whatToTell: 'My premenstrual symptoms are severely affecting my work, relationships, or daily activities',
    });
  }

  return flags;
}

// FIGO context
export function figoContext(
  lengths: number[],
  ageBand: string
): { label: string; isNormal: boolean } | null {
  if (lengths.length < 2) return null;
  const recent = lengths.slice(-3);
  const med = recent.sort((a, b) => a - b)[Math.floor(recent.length / 2)];
  const range = `Your last ${recent.length} cycles: ${recent.join(', ')} days`;

  if (med < 24) {
    return { label: `${range} — more frequent than the usual 24–38 day range`, isNormal: false };
  }
  if (med > 38) {
    return { label: `${range} — less frequent than the usual 24–38 day range`, isNormal: false };
  }
  const variation = Math.max(...recent) - Math.min(...recent);
  const maxVar = ageBand === '18-25' || ageBand === '42-45' ? 9 : 7;
  if (variation > maxVar) {
    return {
      label: `${range} — variation of ${variation} days is more than the usual ${maxVar}-day range for your age`,
      isNormal: false,
    };
  }
  return { label: `${range} — within the usual 24–38 day range`, isNormal: true };
}