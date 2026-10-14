import { differenceInHours, parseISO } from 'date-fns';
import type { DailyLog, LeakEvent, Product, FlowLevel } from '@/types';

export interface ChangeReminder {
  productName: string;
  productId: string;
  lastChangeAt: string;
  intervalHours: number;
  dueAt: string;
  overdue: boolean;
  overdueBy: number; // minutes
  maxWearHours: number;
}

export function getPersonalInterval(
  logs: DailyLog[],
  productId: string,
  flow: FlowLevel | undefined,
  maxWearHours: number
): number {
  // Collect all change intervals for this product
  const intervals: number[] = [];
  for (const log of logs) {
    for (const pu of log.products) {
      if (pu.productId === productId && pu.lastChangeAt) {
        const logDate = parseISO(log.date);
        const changeTime = parseISO(pu.lastChangeAt);
        const elapsed = differenceInHours(changeTime, logDate);
        if (elapsed > 0 && elapsed <= maxWearHours) {
          intervals.push(elapsed);
        }
      }
    }
  }
  if (intervals.length === 0) return maxWearHours;
  // Median
  const sorted = [...intervals].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const med = sorted.length % 2 === 0 ? Math.round((sorted[mid - 1] + sorted[mid]) / 2) : sorted[mid];
  return Math.min(med, maxWearHours);
}

export function getCurrentChangeReminder(
  logs: DailyLog[],
  products: Product[],
  todayLog: DailyLog | undefined
): ChangeReminder | null {
  if (!todayLog || todayLog.products.length === 0) return null;

  const pu = todayLog.products[0];
  if (!pu.lastChangeAt) return null;

  const product = products.find((p) => p.id === pu.productId);
  if (!product) return null;

  const interval = getPersonalInterval(logs, pu.productId, todayLog.flow, product.maxWearHours);
  const lastChange = parseISO(pu.lastChangeAt);
  const dueAt = new Date(lastChange.getTime() + interval * 60 * 60 * 1000);
  const now = new Date();
  const overdueMs = now.getTime() - dueAt.getTime();
  const overdue = overdueMs > 0;
  const overdueBy = Math.round(overdueMs / 60000);

  return {
    productName: `${product.absorbency ?? ''} ${product.type}`.trim(),
    productId: pu.productId,
    lastChangeAt: pu.lastChangeAt,
    intervalHours: interval,
    dueAt: dueAt.toISOString(),
    overdue,
    overdueBy,
    maxWearHours: product.maxWearHours,
  };
}

export function timeSinceChange(lastChangeAt: string): string {
  const elapsed = Date.now() - parseISO(lastChangeAt).getTime();
  const hours = Math.floor(elapsed / 3600000);
  const minutes = Math.floor((elapsed % 3600000) / 60000);
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

export interface LeakRiskResult {
  score: number;
  level: 'low' | 'moderate' | 'high';
  reasons: string[];
}

export function calculateLeakRisk(
  todayLog: DailyLog | undefined,
  predictedFlow: FlowLevel | undefined,
  leaks: LeakEvent[],
  cycleDay: number | null,
  changeReminder: ChangeReminder | null,
  kitStockLow: boolean
): LeakRiskResult {
  let score = 0;
  const reasons: string[] = [];

  const flow = todayLog?.flow ?? predictedFlow;
  if (flow === 'heavy') {
    score += 30;
    reasons.push('Heavy flow day');
  } else if (flow === 'very-heavy') {
    score += 45;
    reasons.push('Very heavy flow day');
  }

  if (changeReminder) {
    const lastChange = parseISO(changeReminder.lastChangeAt);
    const elapsedHours = (Date.now() - lastChange.getTime()) / 3600000;
    if (elapsedHours > changeReminder.intervalHours) {
      score += 20;
      reasons.push(`Product in use longer than your usual ${changeReminder.intervalHours}h interval`);
    }
  }

  // Previous leak on same cycle day or flow level
  if (cycleDay && leaks.some((l) => l.cycleDay === cycleDay)) {
    score += 25;
    reasons.push(`You've had a leak on day ${cycleDay} before`);
  } else if (flow && leaks.some((l) => l.flow === flow)) {
    score += 25;
    reasons.push(`You've leaked on a ${flow} flow day before`);
  }

  if (kitStockLow) {
    score += 10;
    reasons.push('Low kit stock today');
  }

  const level: 'low' | 'moderate' | 'high' =
    score > 65 ? 'high' : score >= 35 ? 'moderate' : 'low';

  return { score, level, reasons: reasons.slice(0, 2) };
}