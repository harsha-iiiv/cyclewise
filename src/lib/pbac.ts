import type { ProductUse, DailyLog } from '@/types';

export interface PbacScore {
  daily: number;
  items: { label: string; score: number }[];
}

export function scorePbacForProductUse(pu: ProductUse, productType: string): PbacScore {
  const items: { label: string; score: number }[] = [];
  let daily = 0;

  if (!pu.pbac) return { daily: 0, items };

  for (const entry of pu.pbac) {
    let saturationScore = 0;
    const isPad = productType.toLowerCase().includes('pad');
    const isTampon = productType.toLowerCase().includes('tampon');

    if (entry.saturation === 'light') saturationScore = 1;
    else if (entry.saturation === 'moderate') saturationScore = isPad ? 5 : isTampon ? 5 : 3;
    else if (entry.saturation === 'full') saturationScore = isPad ? 20 : isTampon ? 10 : 5;

    daily += saturationScore;
    items.push({
      label: `${productType} ${entry.saturation}`,
      score: saturationScore,
    });

    if (entry.clotsSmall > 0) {
      const clotScore = entry.clotsSmall * 1;
      daily += clotScore;
      items.push({ label: `Small clots ×${entry.clotsSmall}`, score: clotScore });
    }
    if (entry.clotsLarge > 0) {
      const clotScore = entry.clotsLarge * 5;
      daily += clotScore;
      items.push({ label: `Large clots ×${entry.clotsLarge}`, score: clotScore });
    }
    if (entry.flooding > 0) {
      const floodScore = entry.flooding * 5;
      daily += floodScore;
      items.push({ label: `Flooding ×${entry.flooding}`, score: floodScore });
    }
  }

  return { daily, items };
}

export function scorePbacForDay(log: DailyLog, products: { id: string; type: string }[]): number {
  let total = 0;
  for (const pu of log.products) {
    const product = products.find((p) => p.id === pu.productId);
    if (!product) continue;
    total += scorePbacForProductUse(pu, product.type).daily;
  }
  return total;
}

export function scorePbacForCycle(
  logs: DailyLog[],
  cycleStart: string,
  cycleEnd: string | undefined,
  products: { id: string; type: string }[]
): number {
  const start = new Date(cycleStart);
  const end = cycleEnd ? new Date(cycleEnd) : new Date();
  let total = 0;
  for (const log of logs) {
    const logDate = new Date(log.date);
    if (logDate >= start && logDate <= end) {
      total += scorePbacForDay(log, products);
    }
  }
  return total;
}

export const PBAC_HEAVY_THRESHOLD = 100;

export function pbacWording(score: number, bleedingTerm: string): string {
  if (score >= PBAC_HEAVY_THRESHOLD) {
    return `Your PBAC score this cycle is ${score}. Scores of 100 or more are in the range clinicians use for heavy menstrual bleeding. This score is useful evidence — consider sharing your report with a clinician, especially if this is usual for you.`;
  }
  return `Your PBAC score this cycle is ${score}.`;
}