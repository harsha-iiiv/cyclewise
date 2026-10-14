export type LifeStage =
  | 'teen'
  | 'reproductive'
  | 'contraception-transition'
  | 'postpartum'
  | 'pause'
  | 'perimenopause'
  | 'menopause-plus';

export interface User {
  id: string;
  name?: string;
  ageBand: string;
  terminology: {
    self: string;
    bleeding: string;
    anatomy: 'medical' | 'soft';
  };
  priorities: string[];
  fertilityContent: boolean;
  createdAt: string;
  demoData: boolean;
  onboarded: boolean;
  weekStart: 'monday' | 'sunday';
  theme: 'system' | 'light' | 'dark';
  healthNote?: string;
}

export interface LifeStageHistory {
  id: string;
  stage: LifeStage;
  startedAt: string;
  endedAt?: string;
  source: 'onboarding' | 'suggested-accepted' | 'user-chosen';
}

export interface Cycle {
  id: string;
  startDate: string;
  endDate?: string;
  source: 'logged' | 'inferred';
}

export type FlowLevel = 'none' | 'spotting' | 'light' | 'moderate' | 'heavy' | 'very-heavy';

export interface ProductUse {
  productId: string;
  changes: number;
  lastChangeAt?: string;
  pbac?: {
    saturation: 'light' | 'moderate' | 'full';
    clotsSmall: number;
    clotsLarge: number;
    flooding: number;
  }[];
}

export interface DailyLog {
  id: string;
  date: string;
  flow?: FlowLevel;
  bleedingType?: 'period' | 'spotting' | 'lochia' | 'loss' | 'pause-note';
  products: ProductUse[];
  pain: { locations: string[]; severity: number };
  symptoms: { name: string; severity: 1 | 2 | 3 }[];
  mood: string[];
  energy?: 1 | 2 | 3 | 4 | 5;
  sleep?: { hours: number; quality: 'poor' | 'okay' | 'good' };
  discharge?: string;
  medications: string[];
  remedies: { name: string; helped?: 'a-lot' | 'a-bit' | 'no' }[];
  sexualActivity?: boolean;
  notes?: string;
  nlRaw?: string;
}

export interface Product {
  id: string;
  type: string;
  absorbency?: string;
  brand?: string;
  unitCost?: number;
  reusable: boolean;
  stock: number;
  lowStockAt: number;
  maxWearHours: number;
}

export interface LeakEvent {
  id: string;
  datetime: string;
  productId?: string;
  hoursWorn?: number;
  activity: string;
  flow: string;
  cycleDay: number;
}

export interface Prediction {
  id: string;
  createdAt: string;
  target: 'next-period';
  centreDate: string;
  lowDate: string;
  highDate: string;
  confidence: 'low' | 'moderate' | 'high';
  basis: string;
  modelVersion: string;
}

export interface ConsentEntry {
  id: string;
  scope: string;
  decision: 'given' | 'withdrawn' | 'declined';
  at: string;
  policyVersion: string;
}

export interface Kit {
  id: string;
  name: string;
  items: { productId: string; qty: number; packed: boolean }[];
}

export interface PlanEvent {
  id: string;
  name: string;
  type: string;
  startDate: string;
  endDate: string;
  importance?: 'low' | 'medium' | 'high';
}

export interface PSSTResult {
  id: string;
  takenAt: string;
  answers: number[];
  pattern: 'screen-positive' | 'moderate-pattern' | 'below-threshold';
}

export interface DailyRating {
  id: string;
  date: string;
  scores: number[];
  interference: number;
}

export interface StageSuggestion {
  id: string;
  rule: string;
  evidence: string;
  offeredAt: string;
  decision: 'accepted' | 'dismissed' | 'snoozed';
  snoozeUntil?: string;
}

export interface Purchase {
  id: string;
  date: string;
  productId: string;
  qty: number;
  totalCost: number;
}

export interface ReminderPref {
  type: string;
  enabled: boolean;
  leadTime?: number;
  dismissals: number;
  pausedUntil?: string;
}

export interface AppState {
  user: User | null;
  lifeStageHistory: LifeStageHistory[];
  currentStage: LifeStage;
  cycles: Cycle[];
  logs: DailyLog[];
  products: Product[];
  leaks: LeakEvent[];
  predictions: Prediction[];
  consents: ConsentEntry[];
  kits: Kit[];
  planEvents: PlanEvent[];
  psstResults: PSSTResult[];
  dailyRatings: DailyRating[];
  stageSuggestions: StageSuggestion[];
  purchases: Purchase[];
  reminders: ReminderPref[];
  painDayMode: boolean;
  lossSensitive: boolean;
  appLockEnabled: boolean;
  appLockPin: string | null;
  notificationsEnabled: boolean;
  learnCardsShown: { cardId: string; shownAt: string }[];
}