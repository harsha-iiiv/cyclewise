import type { Product, Purchase, DailyLog, Cycle } from '@/types';
import { differenceInCalendarDays, parseISO } from 'date-fns';

export interface RestockAlert {
  productId: string;
  productName: string;
  currentStock: number;
  projectedNeed: number;
  message: string;
  urgent: boolean;
}

export function getUsagePerCycle(logs: DailyLog[], productId: string): number {
  // Count total changes for this product across all period logs
  let total = 0;
  for (const log of logs) {
    for (const pu of log.products) {
      if (pu.productId === productId) {
        total += pu.changes;
      }
    }
  }
  // Divide by number of cycles represented
  const periodLogs = logs.filter((l) =>
    l.products.some((p) => p.productId === productId)
  );
  if (periodLogs.length === 0) return 0;

  // Estimate cycles by grouping consecutive days
  const dates = periodLogs
    .map((l) => parseISO(l.date))
    .sort((a, b) => a.getTime() - b.getTime());
  let cycles = 1;
  for (let i = 1; i < dates.length; i++) {
    if (differenceInCalendarDays(dates[i], dates[i - 1]) > 2) cycles++;
  }
  return Math.round(total / cycles);
}

export function checkRestock(
  products: Product[],
  logs: DailyLog[],
  nextPeriodDate: string | null
): RestockAlert[] {
  const alerts: RestockAlert[] = [];

  for (const product of products) {
    if (product.reusable) continue;
    const usage = getUsagePerCycle(logs, product.id);
    if (usage === 0) continue;

    const need = usage;
    const stock = product.stock;
    const name = `${product.absorbency ?? ''} ${product.type}`.trim();

    if (stock < need) {
      const diff = need - stock;
      const message = `You use ~${usage} ${product.type.toLowerCase()} per cycle. You have ${stock}. ${
        nextPeriodDate
          ? 'Next period likely starts soon.'
          : ''
      } Add ${diff}+ to your next shop.`;
      alerts.push({
        productId: product.id,
        productName: name,
        currentStock: stock,
        projectedNeed: need,
        message,
        urgent: stock === 0,
      });
    } else if (stock <= product.lowStockAt) {
      alerts.push({
        productId: product.id,
        productName: name,
        currentStock: stock,
        projectedNeed: need,
        message: `Running low — ${stock} left, you typically use ~${usage} per cycle.`,
        urgent: false,
      });
    }
  }

  return alerts;
}

export function costPerCycle(purchases: Purchase[], cycles: Cycle[]): number {
  if (cycles.length === 0) return 0;
  // Sum all disposable purchases, divide by number of cycles
  const totalSpend = purchases.reduce((sum, p) => sum + p.totalCost, 0);
  const completedCycles = cycles.filter((c) => c.endDate).length;
  if (completedCycles === 0) return totalSpend / cycles.length;
  return totalSpend / completedCycles;
}

export function paybackCalculator(
  reusablePrice: number,
  perCycleDisposableSpend: number
): { breakEvenCycles: number; message: string } {
  if (perCycleDisposableSpend <= 0) {
    return { breakEvenCycles: 0, message: 'Add your disposable product spend to see the payback estimate.' };
  }
  const breakEven = Math.ceil(reusablePrice / perCycleDisposableSpend);
  return {
    breakEvenCycles: breakEven,
    message: `At your spend of ~$${perCycleDisposableSpend.toFixed(2)}/cycle, a reusable product at $${reusablePrice} pays for itself in ~${breakEven} cycles.`,
  };
}