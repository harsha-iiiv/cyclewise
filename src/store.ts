import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { get as idbGet, set as idbSet, del as idbDel } from 'idb-keyval';
import type {
  AppState,
  User,
  LifeStage,
  LifeStageHistory,
  Cycle,
  DailyLog,
  Product,
  LeakEvent,
  Prediction,
  ConsentEntry,
  Kit,
  PlanEvent,
  PSSTResult,
  DailyRating,
  StageSuggestion,
  Purchase,
  ReminderPref,
} from '@/types';
import { generateDemoData } from '@/data/demoSeed';

interface Store extends AppState {
  initDemo: () => void;
  clearDemo: () => void;
  startFresh: () => void;
  setUser: (user: User) => void;
  updateUser: (patch: Partial<User>) => void;
  setStage: (stage: LifeStage, source: LifeStageHistory['source']) => void;
  addConsent: (scope: string, decision: ConsentEntry['decision']) => void;
  addLog: (log: DailyLog) => void;
  updateLog: (id: string, patch: Partial<DailyLog>) => void;
  addCycle: (cycle: Cycle) => void;
  updateCycle: (id: string, patch: Partial<Cycle>) => void;
  addProduct: (product: Product) => void;
  updateProduct: (id: string, patch: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  addLeak: (leak: LeakEvent) => void;
  addPrediction: (prediction: Prediction) => void;
  addKit: (kit: Kit) => void;
  updateKit: (id: string, patch: Partial<Kit>) => void;
  addPlanEvent: (event: PlanEvent) => void;
  deletePlanEvent: (id: string) => void;
  addPSST: (result: PSSTResult) => void;
  addDailyRating: (rating: DailyRating) => void;
  addStageSuggestion: (suggestion: StageSuggestion) => void;
  updateStageSuggestion: (id: string, patch: Partial<StageSuggestion>) => void;
  addPurchase: (purchase: Purchase) => void;
  updateReminder: (type: string, patch: Partial<ReminderPref>) => void;
  setPainDayMode: (on: boolean) => void;
  setLossSensitive: (on: boolean) => void;
  setAppLock: (enabled: boolean, pin?: string) => void;
  setNotificationsEnabled: (on: boolean) => void;
  markLearnCardShown: (cardId: string) => void;
  deleteEverything: () => void;
  _hasHydrated: boolean;
  _setHydrated: (v: boolean) => void;
}

const emptyState: AppState = {
  user: null,
  lifeStageHistory: [],
  currentStage: 'reproductive',
  cycles: [],
  logs: [],
  products: [],
  leaks: [],
  predictions: [],
  consents: [],
  kits: [],
  planEvents: [],
  psstResults: [],
  dailyRatings: [],
  stageSuggestions: [],
  purchases: [],
  reminders: [],
  painDayMode: false,
  lossSensitive: false,
  appLockEnabled: false,
  appLockPin: null,
  notificationsEnabled: false,
  learnCardsShown: [],
};

const idbStorage = {
  getItem: async (name: string) => {
    const value = await idbGet(name);
    return value ?? null;
  },
  setItem: async (name: string, value: string) => {
    await idbSet(name, value);
  },
  removeItem: async (name: string) => {
    await idbDel(name);
  },
};

export const useStore = create<Store>()(
  persist(
    (set, get) => ({
      ...emptyState,
      _hasHydrated: false,
      _setHydrated: (v) => set({ _hasHydrated: v }),

      initDemo: () => {
        const demo = generateDemoData();
        set({ ...demo, _hasHydrated: true });
      },

      clearDemo: () => {
        set({ ...emptyState, _hasHydrated: true });
      },

      startFresh: () => {
        set({ ...emptyState, _hasHydrated: true });
      },

      setUser: (user) => set({ user }),

      updateUser: (patch) =>
        set((state) => ({ user: state.user ? { ...state.user, ...patch } : null })),

      setStage: (stage, source) =>
        set((state) => {
          const history = [...state.lifeStageHistory];
          const last = history[history.length - 1];
          if (last && !last.endedAt) {
            history[history.length - 1] = { ...last, endedAt: new Date().toISOString() };
          }
          history.push({
            id: crypto.randomUUID(),
            stage,
            startedAt: new Date().toISOString(),
            source,
          });
          return { lifeStageHistory: history, currentStage: stage };
        }),

      addConsent: (scope, decision) =>
        set((state) => ({
          consents: [
            ...state.consents,
            {
              id: crypto.randomUUID(),
              scope,
              decision,
              at: new Date().toISOString(),
              policyVersion: 'v1',
            },
          ],
        })),

      addLog: (log) => set((state) => ({ logs: [...state.logs, log] })),

      updateLog: (id, patch) =>
        set((state) => ({
          logs: state.logs.map((l) => (l.id === id ? { ...l, ...patch } : l)),
        })),

      addCycle: (cycle) => set((state) => ({ cycles: [...state.cycles, cycle] })),

      updateCycle: (id, patch) =>
        set((state) => ({
          cycles: state.cycles.map((c) => (c.id === id ? { ...c, ...patch } : c)),
        })),

      addProduct: (product) => set((state) => ({ products: [...state.products, product] })),

      updateProduct: (id, patch) =>
        set((state) => ({
          products: state.products.map((p) => (p.id === id ? { ...p, ...patch } : p)),
        })),

      deleteProduct: (id) =>
        set((state) => ({ products: state.products.filter((p) => p.id !== id) })),

      addLeak: (leak) => set((state) => ({ leaks: [...state.leaks, leak] })),

      addPrediction: (prediction) =>
        set((state) => ({ predictions: [...state.predictions, prediction] })),

      addKit: (kit) => set((state) => ({ kits: [...state.kits, kit] })),

      updateKit: (id, patch) =>
        set((state) => ({
          kits: state.kits.map((k) => (k.id === id ? { ...k, ...patch } : k)),
        })),

      addPlanEvent: (event) => set((state) => ({ planEvents: [...state.planEvents, event] })),

      deletePlanEvent: (id) =>
        set((state) => ({ planEvents: state.planEvents.filter((e) => e.id !== id) })),

      addPSST: (result) => set((state) => ({ psstResults: [...state.psstResults, result] })),

      addDailyRating: (rating) =>
        set((state) => ({ dailyRatings: [...state.dailyRatings, rating] })),

      addStageSuggestion: (suggestion) =>
        set((state) => ({ stageSuggestions: [...state.stageSuggestions, suggestion] })),

      updateStageSuggestion: (id, patch) =>
        set((state) => ({
          stageSuggestions: state.stageSuggestions.map((s) =>
            s.id === id ? { ...s, ...patch } : s
          ),
        })),

      addPurchase: (purchase) => set((state) => ({ purchases: [...state.purchases, purchase] })),

      updateReminder: (type, patch) =>
        set((state) => {
          const existing = state.reminders.find((r) => r.type === type);
          if (existing) {
            return {
              reminders: state.reminders.map((r) =>
                r.type === type ? { ...r, ...patch } : r
              ),
            };
          }
          return {
            reminders: [...state.reminders, { type, enabled: true, dismissals: 0, ...patch }],
          };
        }),

      setPainDayMode: (on) => set({ painDayMode: on }),

      setLossSensitive: (on) => set({ lossSensitive: on }),

      setAppLock: (enabled, pin) =>
        set({ appLockEnabled: enabled, appLockPin: pin ?? null }),

      setNotificationsEnabled: (on) => set({ notificationsEnabled: on }),

      markLearnCardShown: (cardId) =>
        set((state) => ({
          learnCardsShown: [
            ...state.learnCardsShown,
            { cardId, shownAt: new Date().toISOString() },
          ],
        })),

      deleteEverything: () => set({ ...emptyState, _hasHydrated: true }),
    }),
    {
      name: 'cyclewise-store',
      storage: createJSONStorage(() => idbStorage),
      onRehydrateStorage: () => (state) => {
        state?._setHydrated(true);
      },
    }
  )
);