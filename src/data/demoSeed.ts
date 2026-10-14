import { format, subDays, subMonths } from 'date-fns';
import type { AppState } from '@/types';

function dateNDaysAgo(n: number): string {
  return subDays(new Date(), n).toISOString();
}

function dateStr(d: Date): string {
  return d.toISOString();
}

export function generateDemoData(): AppState {
  const now = new Date();
  const createdAt = subMonths(now, 5).toISOString();

  // 4 completed cycles: lengths 27, 31, 29, 26
  // Current cycle: day 2 today
  // Cycle 4 ended ~2 days ago, cycle 5 started today - 1 day (day 2 today means start was yesterday)

  const cycle5Start = subDays(now, 1);
  const cycle4Start = subDays(cycle5Start, 26);
  const cycle4End = subDays(cycle5Start, 1);
  const cycle3Start = subDays(cycle4Start, 29);
  const cycle3End = subDays(cycle4Start, 1);
  const cycle2Start = subDays(cycle3Start, 31);
  const cycle2End = subDays(cycle3Start, 1);
  const cycle1Start = subDays(cycle2Start, 27);
  const cycle1End = subDays(cycle2Start, 1);

  const cycles = [
    { id: 'c1', startDate: dateStr(cycle1Start), endDate: dateStr(cycle1End), source: 'logged' as const },
    { id: 'c2', startDate: dateStr(cycle2Start), endDate: dateStr(cycle2End), source: 'logged' as const },
    { id: 'c3', startDate: dateStr(cycle3Start), endDate: dateStr(cycle3End), source: 'logged' as const },
    { id: 'c4', startDate: dateStr(cycle4Start), endDate: dateStr(cycle4End), source: 'logged' as const },
    { id: 'c5', startDate: dateStr(cycle5Start), source: 'logged' as const },
  ];

  // Daily logs for last cycle (cycle 4) + current cycle day 1 and 2
  const logs: AppState['logs'] = [];

  // Cycle 4 logs: flow Light, Heavy, Heavy, Moderate, Light
  const cycle4Flows = ['light', 'heavy', 'heavy', 'moderate', 'light'] as const;
  const cycle4Pain = [
    { locations: ['cramps'], severity: 8 },
    { locations: ['cramps', 'back'], severity: 8 },
    { locations: ['cramps', 'back'], severity: 5 },
    { locations: ['head'], severity: 4 },
    { locations: [], severity: 0 },
  ];
  const cycle4Mood = [
    ['irritable'],
    ['low', 'irritable'],
    ['irritable'],
    ['sensitive'],
    ['calm'],
  ];
  const cycle4Energy = [2, 1, 2, 3, 4] as const;
  const cycle4Sleep = [
    { hours: 5, quality: 'poor' as const },
    { hours: 4, quality: 'poor' as const },
    { hours: 6, quality: 'okay' as const },
    { hours: 7, quality: 'okay' as const },
    { hours: 8, quality: 'good' as const },
  ];

  for (let i = 0; i < 5; i++) {
    const logDate = addDays(cycle4Start, i);
    const isDay2 = i === 1;
    const isDay1 = i === 0;
    logs.push({
      id: `log-c4-${i}`,
      date: dateStr(logDate),
      flow: cycle4Flows[i],
      bleedingType: 'period',
      products: isDay2 || isDay1
        ? [{ productId: 'p-super-pad', changes: 3, lastChangeAt: dateStr(addHours(logDate, 5)) }]
        : i >= 2
        ? [{ productId: 'p-reg-pad', changes: 2 }]
        : [],
      pain: cycle4Pain[i],
      symptoms: i < 2 ? [{ name: 'Cramps', severity: 3 }] : i === 3 ? [{ name: 'Headache', severity: 2 }] : [],
      mood: cycle4Mood[i],
      energy: cycle4Energy[i],
      sleep: cycle4Sleep[i],
      medications: i < 2 ? ['ibuprofen'] : [],
      remedies: i < 2
        ? [{ name: 'Heat', helped: 'a-lot' }, { name: 'Ibuprofen', helped: 'a-lot' }]
        : i === 2
        ? [{ name: 'Ibuprofen', helped: 'a-bit' }]
        : i === 3
        ? [{ name: 'Gentle walk', helped: 'a-bit' }]
        : [],
      notes: i === 1 ? 'Tough day, cramps were intense' : undefined,
    });
  }

  // Current cycle (cycle 5) day 1 and 2
  logs.push({
    id: 'log-c5-0',
    date: dateStr(cycle5Start),
    flow: 'light',
    bleedingType: 'period',
    products: [{ productId: 'p-super-pad', changes: 2, lastChangeAt: dateStr(addHours(cycle5Start, 4)) }],
    pain: { locations: ['cramps'], severity: 8 },
    symptoms: [{ name: 'Cramps', severity: 3 }],
    mood: ['irritable'],
    energy: 2,
    sleep: { hours: 5, quality: 'poor' },
    medications: ['ibuprofen'],
    remedies: [{ name: 'Heat', helped: 'a-lot' }],
  });

  logs.push({
    id: 'log-c5-1',
    date: dateStr(now),
    flow: 'heavy',
    bleedingType: 'period',
    products: [{ productId: 'p-super-pad', changes: 1, lastChangeAt: dateStr(addHours(now, -3)) }],
    pain: { locations: ['cramps', 'back'], severity: 7 },
    symptoms: [{ name: 'Cramps', severity: 3 }],
    mood: ['low'],
    energy: 1,
    sleep: { hours: 4, quality: 'poor' },
    medications: ['ibuprofen'],
    remedies: [],
  });

  // Products
  const products: AppState['products'] = [
    { id: 'p-super-pad', type: 'Pads', absorbency: 'super', brand: 'Bodyform', unitCost: 0.25, reusable: false, stock: 9, lowStockAt: 10, maxWearHours: 6 },
    { id: 'p-reg-pad', type: 'Pads', absorbency: 'regular', brand: 'Bodyform', unitCost: 0.2, reusable: false, stock: 6, lowStockAt: 8, maxWearHours: 6 },
    { id: 'p-liner', type: 'Pads', absorbency: 'liner', brand: 'Bodyform', unitCost: 0.12, reusable: false, stock: 12, lowStockAt: 6, maxWearHours: 4 },
    { id: 'p-reg-tampon', type: 'Tampons', absorbency: 'regular', brand: 'Tampax', unitCost: 0.25, reusable: false, stock: 0, lowStockAt: 8, maxWearHours: 8 },
    { id: 'p-cup', type: 'Menstrual cup', absorbency: 'standard', brand: 'Mooncup', unitCost: 30, reusable: true, stock: 1, lowStockAt: 0, maxWearHours: 12 },
  ];

  // Leak event: last cycle day 2, at work, super pad at 5h, long meeting
  const leaks: AppState['leaks'] = [
    {
      id: 'leak1',
      datetime: dateStr(addDays(cycle4Start, 1)),
      productId: 'p-super-pad',
      hoursWorn: 5,
      activity: 'sitting (long meeting)',
      flow: 'heavy',
      cycleDay: 2,
    },
  ];

  // PBAC scored cycle (cycle 3, total 118)
  // We'll add PBAC data to cycle 3 logs
  const cycle3Start_logs = cycle3Start;
  for (let i = 0; i < 5; i++) {
    const logDate = addDays(cycle3Start_logs, i);
    const saturations = ['moderate', 'full', 'full', 'moderate', 'light'] as const;
    logs.push({
      id: `log-c3-${i}`,
      date: dateStr(logDate),
      flow: ['light', 'heavy', 'heavy', 'moderate', 'light'][i] as any,
      bleedingType: 'period',
      products: [{
        productId: i < 3 ? 'p-super-pad' : 'p-reg-pad',
        changes: i < 3 ? 3 : 2,
        pbac: Array.from({ length: i < 3 ? 3 : 2 }, (_, j) => ({
          saturation: saturations[i],
          clotsSmall: i === 1 || i === 2 ? 2 : 0,
          clotsLarge: i === 2 ? 1 : 0,
          flooding: i === 2 ? 1 : 0,
        })),
      }],
      pain: { locations: ['cramps'], severity: i < 2 ? 8 : 4 },
      symptoms: i < 2 ? [{ name: 'Cramps', severity: 3 }] : [],
      mood: ['irritable'],
      energy: 2 as any,
      sleep: { hours: 5, quality: 'poor' },
      medications: i < 2 ? ['ibuprofen'] : [],
      remedies: i < 2 ? [{ name: 'Heat', helped: 'a-lot' }] : [],
    });
  }

  // Consents
  const consents: AppState['consents'] = [
    { id: 'con1', scope: 'onboarding-choices', decision: 'given', at: createdAt, policyVersion: 'v1' },
    { id: 'con2', scope: 'data-on-device-only', decision: 'given', at: createdAt, policyVersion: 'v1' },
    { id: 'con3', scope: 'notifications', decision: 'declined', at: createdAt, policyVersion: 'v1' },
  ];

  // Kits
  const kits: AppState['kits'] = [
    {
      id: 'kit-everyday',
      name: 'Everyday bag',
      items: [
        { productId: 'p-super-pad', qty: 2, packed: true },
        { productId: 'p-reg-pad', qty: 2, packed: true },
        { productId: 'p-liner', qty: 1, packed: true },
      ],
    },
    {
      id: 'kit-travel',
      name: 'Travel',
      items: [
        { productId: 'p-super-pad', qty: 6, packed: false },
        { productId: 'p-reg-pad', qty: 4, packed: false },
      ],
    },
  ];

  // Plan Ahead event: Work trip starting 2 days after next predicted period
  const nextPeriodCentre = addDays(cycle5Start, 29);
  const tripStart = addDays(nextPeriodCentre, 2);
  const planEvents: AppState['planEvents'] = [
    {
      id: 'plan1',
      name: 'Work trip',
      type: 'trip',
      startDate: dateStr(tripStart),
      endDate: dateStr(addDays(tripStart, 3)),
      importance: 'high',
    },
  ];

  // PSST: screen-positive
  // Items 1-14 symptoms, 15-19 impairment
  // Core mood: irritability/anger (item 2) = 3 (severe)
  // Need >=4 other items (among 1-14, excluding item 2) rated 2-3
  // Need >=1 impairment item (15-19) rated 3
  const psstAnswers = [3, 3, 2, 2, 2, 2, 2, 1, 2, 1, 1, 0, 2, 1, 3, 2, 1, 2, 3];
  const psstResults: AppState['psstResults'] = [
    {
      id: 'psst1',
      takenAt: dateStr(subDays(now, 10)),
      answers: psstAnswers,
      pattern: 'screen-positive',
    },
  ];

  // Stage suggestions (empty for demo since mode is already set)
  const stageSuggestions: AppState['stageSuggestions'] = [];

  // Purchases
  const purchases: AppState['purchases'] = [
    { id: 'pur1', date: dateStr(subDays(now, 30)), productId: 'p-super-pad', qty: 14, totalCost: 3.5 },
    { id: 'pur2', date: dateStr(subDays(now, 60)), productId: 'p-reg-pad', qty: 10, totalCost: 2.0 },
    { id: 'pur3', date: dateStr(subDays(now, 90)), productId: 'p-reg-tampon', qty: 16, totalCost: 4.0 },
    { id: 'pur4', date: dateStr(subDays(now, 120)), productId: 'p-cup', qty: 1, totalCost: 30 },
  ];

  const user: AppState['user'] = {
    id: 'maya',
    name: 'Maya',
    ageBand: '26-35',
    terminology: { self: 'Woman', bleeding: 'period', anatomy: 'medical' },
    priorities: ['never-leak', 'track-pain', 'prepare-trips'],
    fertilityContent: false,
    createdAt,
    demoData: true,
    onboarded: true,
    weekStart: 'monday',
    theme: 'system',
  };

  const lifeStageHistory: AppState['lifeStageHistory'] = [
    {
      id: 'lsh1',
      stage: 'reproductive',
      startedAt: createdAt,
      source: 'onboarding',
    },
  ];

  return {
    user,
    lifeStageHistory,
    currentStage: 'reproductive',
    cycles,
    logs,
    products,
    leaks,
    predictions: [],
    consents,
    kits,
    planEvents,
    psstResults,
    dailyRatings: [],
    stageSuggestions,
    purchases,
    reminders: [
      { type: 'change', enabled: true, dismissals: 0 },
      { type: 'restock', enabled: true, dismissals: 0 },
      { type: 'tomorrow-briefing', enabled: true, dismissals: 0 },
    ],
    painDayMode: false,
    lossSensitive: false,
    appLockEnabled: false,
    appLockPin: null,
    notificationsEnabled: false,
    learnCardsShown: [],
  };
}

// Helper functions for date math
function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function addHours(date: Date, hours: number): Date {
  const d = new Date(date);
  d.setHours(d.getHours() + hours);
  return d;
}