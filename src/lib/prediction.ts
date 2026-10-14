import { addDays, differenceInCalendarDays, format, parseISO } from 'date-fns';
import type { Cycle, Prediction, DailyLog, FlowLevel } from '@/types';

export interface PredictionResult {
  centreDate: string;
  lowDate: string;
  highDate: string;
  confidence: 'low' | 'moderate' | 'high';
  basis: string;
  cycleLengthMedian: number;
  halfWidth: number;
}

export function getCompletedCycleLengths(cycles: Cycle[]): number[] {
  const sorted = [...cycles].sort(
    (a, b) => parseISO(a.startDate).getTime() - parseISO(b.startDate).getTime()
  );
  const lengths: number[] = [];
  for (let i = 1; i < sorted.length; i++) {
    const len = differenceInCalendarDays(parseISO(sorted[i].startDate), parseISO(sorted[i - 1].startDate));
    if (len > 0) lengths.push(len);
  }
  return lengths;
}

export function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? Math.round((sorted[mid - 1] + sorted[mid]) / 2)
    : sorted[mid];
}

export function standardDeviation(values: number[]): number {
  if (values.length < 2) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
  return Math.sqrt(variance);
}

export function getLastPeriodStart(cycles: Cycle[]): Date | null {
  const sorted = [...cycles].sort(
    (a, b) => parseISO(b.startDate).getTime() - parseISO(a.startDate).getTime()
  );
  return sorted[0] ? parseISO(sorted[0].startDate) : null;
}

export function predictNextPeriod(
  cycles: Cycle[],
  usualCycleLength?: number,
  teenMode = false
): PredictionResult | null {
  const lengths = getCompletedCycleLengths(cycles);
  const lastStart = getLastPeriodStart(cycles);
  if (!lastStart) return null;

  if (lengths.length === 0) {
    const centre = usualCycleLength ?? 28;
    let halfWidth = 5;
    if (teenMode) halfWidth = Math.max(halfWidth, 5);
    const centreDate = addDays(lastStart, centre);
    return {
      centreDate: centreDate.toISOString(),
      lowDate: addDays(centreDate, -halfWidth).toISOString(),
      highDate: addDays(centreDate, halfWidth).toISOString(),
      confidence: 'low',
      basis: 'Based on averages, not you yet. Log your first cycle to get personal predictions.',
      cycleLengthMedian: centre,
      halfWidth,
    };
  }

  const recent = lengths.slice(-6);
  const med = median(recent);
  let sd = Math.round(standardDeviation(recent));
  let halfWidth = Math.max(2, sd);
  const range = Math.max(...recent) - Math.min(...recent);
  if (range > 7) halfWidth += 2;

  if (teenMode) halfWidth = Math.max(halfWidth, 5);

  let confidence: 'low' | 'moderate' | 'high';
  if (sd <= 2 && recent.length >= 4) confidence = 'high';
  else if (sd <= 4) confidence = 'moderate';
  else confidence = 'low';

  const centreDate = addDays(lastStart, med);
  const basis = `Based on your last ${recent.length} cycle${recent.length > 1 ? 's' : ''}: ${recent.join(', ')} days.`;

  return {
    centreDate: centreDate.toISOString(),
    lowDate: addDays(centreDate, -halfWidth).toISOString(),
    highDate: addDays(centreDate, halfWidth).toISOString(),
    confidence,
    basis,
    cycleLengthMedian: med,
    halfWidth,
  };
}

export function predictNextThreeCycles(
  cycles: Cycle[],
  usualCycleLength?: number,
  teenMode = false
): PredictionResult[] {
  const results: PredictionResult[] = [];
  const base = predictNextPeriod(cycles, usualCycleLength, teenMode);
  if (!base) return results;

  results.push(base);
  for (let i = 1; i <= 2; i++) {
    const prevCentre = parseISO(results[i - 1].centreDate);
    const extraWidth = base.halfWidth + i;
    const centreDate = addDays(prevCentre, base.cycleLengthMedian);
    results.push({
      ...base,
      centreDate: centreDate.toISOString(),
      lowDate: addDays(centreDate, -extraWidth).toISOString(),
      highDate: addDays(centreDate, extraWidth).toISOString(),
      halfWidth: extraWidth,
    });
  }
  return results;
}

export function predictPeriodLength(cycles: Cycle[], logs: DailyLog[]): {
  median: number;
  confidence: 'low' | 'moderate' | 'high';
} {
  const lengths: number[] = [];
  const sorted = [...cycles].sort(
    (a, b) => parseISO(a.startDate).getTime() - parseISO(b.startDate).getTime()
  );
  for (const cycle of sorted) {
    if (!cycle.endDate) continue;
    const len = differenceInCalendarDays(parseISO(cycle.endDate), parseISO(cycle.startDate)) + 1;
    if (len > 0) lengths.push(len);
  }
  if (lengths.length === 0) return { median: 5, confidence: 'low' };
  const med = median(lengths);
  const conf = lengths.length >= 3 ? 'moderate' : 'low';
  return { median: med, confidence: conf };
}

export function getFlowByDayProfile(logs: DailyLog[]): Map<number, FlowLevel> {
  const profile = new Map<number, FlowLevel>();
  const cycleDayFlows: Map<number, FlowLevel[]> = new Map();

  const periodLogs = logs.filter((l) => l.flow && l.flow !== 'none' && l.bleedingType === 'period');
  for (const log of periodLogs) {
    // We need cycle day info — approximate by order within a period cluster
  }
  // Simplified: collect flows in order and assign day 1, 2, 3...
  const sortedLogs = periodLogs.sort((a, b) => parseISO(a.date).getTime() - parseISO(b.date).getTime());
  let currentDay = 0;
  let prevDate: Date | null = null;
  for (const log of sortedLogs) {
    const logDate = parseISO(log.date);
    if (prevDate && differenceInCalendarDays(logDate, prevDate) > 1) {
      currentDay = 0;
    }
    currentDay++;
    if (log.flow) {
      const arr = cycleDayFlows.get(currentDay) ?? [];
      arr.push(log.flow);
      cycleDayFlows.set(currentDay, arr);
    }
    prevDate = logDate;
  }

  const flowOrder: FlowLevel[] = ['spotting', 'light', 'moderate', 'heavy', 'very-heavy'];
  for (const [day, flows] of cycleDayFlows) {
    // Take median flow
    const indices = flows.map((f) => flowOrder.indexOf(f));
    const medIdx = median(indices);
    profile.set(day, flowOrder[medIdx] ?? 'light');
  }
  return profile;
}

export function forecastFlowForDay(
  dayOfCycle: number,
  logs: DailyLog[]
): { flow: FlowLevel; isGeneric: boolean } {
  const profile = getFlowByDayProfile(logs);
  const known = profile.get(dayOfCycle);
  if (known) return { flow: known, isGeneric: false };

  // Generic shape: Light -> Heavy -> Heavy -> Moderate -> Light
  const generic: FlowLevel[] = ['light', 'heavy', 'heavy', 'moderate', 'light'];
  const idx = Math.min(dayOfCycle - 1, generic.length - 1);
  return { flow: generic[Math.max(0, idx)], isGeneric: true };
}

export function confidenceLabel(conf: 'low' | 'moderate' | 'high'): string {
  switch (conf) {
    case 'high':
      return "we're confident";
    case 'moderate':
      return "we're moderately sure";
    case 'low':
      return "this is a rough estimate";
  }
}

export function formatPredictionRange(pred: PredictionResult): string {
  const low = format(parseISO(pred.lowDate), 'EEE');
  const high = format(parseISO(pred.highDate), 'EEE');
  const centre = format(parseISO(pred.centreDate), 'EEE');
  return `${low}–${high} · most likely ${centre} · ${confidenceLabel(pred.confidence)}`;
}

export function getCycleDay(cycles: Cycle[], today = new Date()): number | null {
  const lastStart = getLastPeriodStart(cycles);
  if (!lastStart) return null;
  return differenceInCalendarDays(today, lastStart) + 1;
}

export function getPhase(
  cycleDay: number | null,
  cycleLength: number,
  fertilityContent: boolean
): string {
  if (!cycleDay) return 'Unknown';
  if (cycleDay <= 5) return 'Menstrual';
  if (cycleDay <= 13) return 'Follicular';
  if (fertilityContent && cycleDay > 13 && cycleDay <= 16) return 'Around ovulation';
  if (!fertilityContent && cycleDay > 13 && cycleDay <= Math.floor(cycleLength / 2)) return 'Mid-cycle';
  return 'Luteal';
}