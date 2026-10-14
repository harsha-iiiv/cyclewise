import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Droplets, AlertTriangle, CalendarClock, Package, Heart,
  BookOpen, Zap, Bell, Shield, Lock, ChevronRight, Moon,
  Plus, Check, Clock, TrendingUp,
} from 'lucide-react';
import { useStore } from '@/store';
import { Card, Badge, Button } from '@/components/ui';
import { useToast } from '@/components/Toast';
import { t, getTerms } from '@/lib/terminology';
import {
  predictNextPeriod, getCycleDay, getPhase, formatPredictionRange,
  forecastFlowForDay, predictPeriodLength,
} from '@/lib/prediction';
import { getCurrentChangeReminder, calculateLeakRisk, timeSinceChange } from '@/lib/reminders';
import { checkRedFlags } from '@/lib/redFlags';
import { checkRestock } from '@/lib/inventory';
import { learnCards } from '@/data/learnCards';
import { format, parseISO } from 'date-fns';

export default function Today() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const store = useStore();
  const { user, cycles, logs, products, leaks, currentStage, painDayMode } = store;
  const terms = getTerms(user);

  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  const todayLog = logs.find((l) => l.date.slice(0, 10) === todayStr);

  const cycleDay = getCycleDay(cycles, today);
  const lastStart = cycles.sort((a, b) => b.startDate.localeCompare(a.startDate))[0];
  const isBleeding = !!lastStart && !lastStart.endDate && cycleDay !== null && cycleDay <= 14;
  const isBleedingToday = todayLog?.flow && todayLog.flow !== 'none';

  const prediction = predictNextPeriod(cycles, undefined, currentStage === 'teen');
  const periodLen = predictPeriodLength(cycles, logs);
  const cycleLength = prediction?.cycleLengthMedian ?? 28;
  const phase = getPhase(cycleDay, cycleLength, user?.fertilityContent ?? false);

  const flowForecast = isBleeding && cycleDay
    ? forecastFlowForDay(cycleDay, logs)
    : null;

  const changeReminder = getCurrentChangeReminder(logs, products, todayLog);
  const restockAlerts = checkRestock(products, logs, prediction?.centreDate ?? null);
  const kitStockLow = restockAlerts.length > 0;

  const leakRisk = calculateLeakRisk(
    todayLog, flowForecast?.flow, leaks, cycleDay, changeReminder, kitStockLow
  );

  const redFlags = checkRedFlags(cycles, logs, currentStage, { ageBand: user?.ageBand ?? '', healthNote: user?.healthNote }, products, store.psstResults);

  const completedCycleLengths = cycles.length >= 2
    ? cycles.slice(1).map((c, i) => Math.round((parseISO(c.startDate).getTime() - parseISO(cycles[i].startDate).getTime()) / 86400000))
    : [];

  const hour = today.getHours();
  const showTomorrow = hour >= 18;

  // Get learn card for today
  const todayLearnCard = learnCards.find((c) => {
    if (currentStage === 'teen' && c.id === 'started-at-school') return true;
    if (isBleeding && c.id === 'why-ranges' && completedCycleLengths.length < 3) return true;
    return false;
  });

  const handleQuickLog = (flow: string, pain?: number) => {
    const existingLog = todayLog;
    if (existingLog) {
      store.updateLog(existingLog.id, {
        flow: flow as any,
        pain: pain !== undefined ? { locations: existingLog.pain.locations, severity: pain } : existingLog.pain,
      });
    } else {
      store.addLog({
        id: crypto.randomUUID(),
        date: today.toISOString(),
        flow: flow as any,
        bleedingType: 'period',
        products: [],
        pain: { locations: [], severity: pain ?? 0 },
        symptoms: [],
        mood: [],
        medications: [],
        remedies: [],
      });
    }
    showToast('Saved on this device', () => {
      if (existingLog) {
        store.updateLog(existingLog.id, { flow: existingLog.flow });
      }
    });
    if (pain !== undefined && pain >= 8) {
      store.setPainDayMode(true);
    }
  };

  const handleChangeNow = () => {
    if (!todayLog || todayLog.products.length === 0) return;
    const updatedProducts = [...todayLog.products];
    updatedProducts[0] = {
      ...updatedProducts[0],
      changes: updatedProducts[0].changes + 1,
      lastChangeAt: new Date().toISOString(),
    };
    store.updateLog(todayLog.id, { products: updatedProducts });
    showToast('Change logged — timer restarted');
  };

  if (painDayMode) {
    return <PainDayMode />;
  }

  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const namePart = user?.name ? `, ${user.name}` : '';

  return (
    <div className="px-4 pt-6 pb-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-sm text-ink-2">{format(today, 'EEEE d MMMM')}</p>
          <h1 className="font-serif text-2xl text-ink">
            {greeting}{namePart}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          {user?.demoData && <Badge color="plum">Demo</Badge>}
          <button
            onClick={() => navigate('/modes')}
            className="text-xs px-3 py-1.5 rounded-full bg-surface-2 text-ink-2 hover:text-ink"
          >
            {stageLabel(currentStage)}
          </button>
          <button
            onClick={() => navigate('/privacy')}
            aria-label="Privacy"
            className="p-2 text-ink-2 hover:text-primary"
          >
            <Shield size={18} />
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {/* 1. Today Status hero card */}
        {completedCycleLengths.length < 1 && !isBleeding ? (
          <Card padding="lg">
            <p className="text-sm text-ink-2 mb-2">Cycle 1 of 3</p>
            <h2 className="font-serif text-xl text-ink mb-2">Welcome to Cyclewise</h2>
            <p className="text-sm text-ink-2 leading-relaxed">
              Log this {t('{bleeding}', user)} and predictions become yours, not averages. After 3 logged cycles, you'll get personal insights no other app gave you.
            </p>
            <div className="mt-4 space-y-2">
              <Button onClick={() => navigate('/log')} className="w-full">Log today</Button>
              <Button variant="secondary" onClick={() => navigate('/prepare')} className="w-full">Set up your kit</Button>
            </div>
          </Card>
        ) : (
          <Card padding="lg">
            <div className="flex items-start justify-between mb-2">
              <div>
                {isBleeding || isBleedingToday ? (
                  <>
                    <p className="text-sm text-primary font-medium">{t('{Bleeding}', user)} — day {cycleDay}</p>
                    <h2 className="font-serif text-xl text-ink mt-1">{phase}</h2>
                  </>
                ) : prediction ? (
                  <>
                    <p className="text-sm text-ink-2">{phase}</p>
                    <h2 className="font-serif text-xl text-ink mt-1">
                      {t('{Bleeding}', user)} expected {formatPredictionRange(prediction)}
                    </h2>
                  </>
                ) : (
                  <h2 className="font-serif text-xl text-ink">Log your first {t('{bleeding}', user)} to begin</h2>
                )}
              </div>
            </div>
            {flowForecast && (
              <p className="text-sm text-ink-2 mt-2">
                {flowForecast.isGeneric ? 'Typically' : 'Your day ' + cycleDay + ' is usually'}{' '}
                {flowForecast.flow.replace('-', ' ')} flow
                {!flowForecast.isGeneric && cycleDay === 2 && ` — your day 2 is usually your heaviest`}
              </p>
            )}
            {prediction && (
              <p className="text-xs text-ink-2 mt-2">{prediction.basis}</p>
            )}
          </Card>
        )}

        {/* Red flag card */}
        {redFlags.length > 0 && (
          <Card className="border-amber/30 bg-amber-soft/50">
            <div className="flex items-start gap-3">
              <AlertTriangle size={20} className="text-amber flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-ink text-sm">{redFlags[0].whatWeNoticed}</p>
                <p className="text-xs text-ink-2 mt-1">{redFlags[0].whyItMatters}</p>
                <button
                  onClick={() => navigate('/care')}
                  className="text-xs text-amber font-medium mt-2 flex items-center gap-1"
                >
                  See care card <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </Card>
        )}

        {/* 2. Change Reminder */}
        {isBleeding && changeReminder && (
          <Card>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Clock size={18} className={changeReminder.overdue ? 'text-amber' : 'text-ink-2'} />
                <span className="text-sm font-medium text-ink">
                  Changed {timeSinceChange(changeReminder.lastChangeAt)} ago
                </span>
              </div>
              <Badge color={changeReminder.overdue ? 'amber' : 'neutral'}>
                {changeReminder.productName}
              </Badge>
            </div>
            <p className={`text-sm ${changeReminder.overdue ? 'text-amber' : 'text-ink-2'}`}>
              {changeReminder.overdue
                ? "It's been a while — changing soon helps prevent leaks."
                : `Change in about ${Math.max(0, changeReminder.intervalHours - Math.floor((Date.now() - new Date(changeReminder.lastChangeAt).getTime()) / 3600000))} hours`}
            </p>
            <div className="flex gap-2 mt-3">
              <Button size="sm" onClick={handleChangeNow}>Changed now</Button>
              <Button size="sm" variant="secondary" onClick={() => showToast('Snoozed for 30 minutes')}>Snooze</Button>
            </div>
          </Card>
        )}

        {/* 3. Leak Risk */}
        {(isBleeding || (prediction && !isBleeding)) && leakRisk.reasons.length > 0 && (
          <Card>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Droplets size={18} className={
                  leakRisk.level === 'high' ? 'text-red' :
                  leakRisk.level === 'moderate' ? 'text-amber' : 'text-sage'
                } />
                <span className="text-sm font-medium text-ink">Leak risk today</span>
              </div>
              <Badge color={
                leakRisk.level === 'high' ? 'red' :
                leakRisk.level === 'moderate' ? 'amber' : 'sage'
              }>
                {leakRisk.level.charAt(0).toUpperCase() + leakRisk.level.slice(1)}
              </Badge>
            </div>
            {leakRisk.reasons.map((reason, i) => (
              <p key={i} className="text-xs text-ink-2">· {reason}</p>
            ))}
            {leakRisk.level !== 'low' && (
              <p className="text-xs text-ink-2 mt-2 italic">
                {leakRisk.level === 'high'
                  ? 'Pack a backup + dark underwear in your kit.'
                  : 'Consider packing a backup today.'}
              </p>
            )}
          </Card>
        )}

        {/* 4. Tomorrow Briefing */}
        {showTomorrow && prediction && (
          <Card className="bg-plum-soft/30 border-plum/20">
            <div className="flex items-center gap-2 mb-2">
              <CalendarClock size={18} className="text-plum" />
              <span className="text-sm font-medium text-ink">Tomorrow's briefing</span>
            </div>
            <p className="text-sm text-ink-2">
              {isBleeding && cycleDay
                ? `Day ${cycleDay + 1} — ${flowForecast && cycleDay + 1 <= 5 ? 'likely ' + forecastFlowForDay(cycleDay + 1, logs).flow.replace('-', ' ') : 'continuing your ' + t('{bleeding}', user)}`
                : `${t('{Bleeding}', user)} likely ${format(parseISO(prediction.centreDate), 'EEE')} (±${prediction.halfWidth}d)`}
            </p>
            {kitStockLow && (
              <p className="text-xs text-amber mt-1">Kit: {restockAlerts[0]?.productName} running low.</p>
            )}
          </Card>
        )}

        {/* 5. Quick Log strip */}
        <Card>
          <p className="text-sm font-medium text-ink mb-3">Quick log</p>
          <div className="flex flex-wrap gap-2 mb-3">
            {(['none', 'spotting', 'light', 'moderate', 'heavy'] as const).map((flow) => (
              <button
                key={flow}
                onClick={() => handleQuickLog(flow)}
                className={`px-3 py-2 rounded-full text-xs border transition-all ${
                  todayLog?.flow === flow
                    ? 'border-primary bg-primary-soft text-primary'
                    : 'border-line bg-surface text-ink-2 hover:border-primary/30'
                }`}
              >
                {flow === 'none' ? 'None' : flow.charAt(0).toUpperCase() + flow.slice(1).replace('-', ' ')}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2 mb-3">
            {[
              { label: 'No pain', val: 0 },
              { label: 'Mild', val: 3 },
              { label: 'Moderate', val: 5 },
              { label: 'Severe', val: 8 },
            ].map((pain) => (
              <button
                key={pain.label}
                onClick={() => handleQuickLog(todayLog?.flow ?? 'none', pain.val)}
                className={`px-3 py-2 rounded-full text-xs border transition-all ${
                  todayLog?.pain.severity === pain.val && pain.val > 0
                    ? 'border-primary bg-primary-soft text-primary'
                    : 'border-line bg-surface text-ink-2 hover:border-primary/30'
                }`}
              >
                {pain.label}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" onClick={() => navigate('/log')} className="flex-1">
              Full log
            </Button>
            <Button size="sm" variant="secondary" onClick={() => navigate('/log')} className="flex-1">
              Type it
            </Button>
          </div>
        </Card>

        {/* 6. Kit Check */}
        <Card onClick={() => navigate('/prepare')}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package size={18} className="text-ink-2" />
              <div>
                <p className="text-sm font-medium text-ink">Kit check</p>
                <p className="text-xs text-ink-2">
                  {kitStockLow
                    ? `${restockAlerts[0]?.productName} running low`
                    : 'Everything stocked for today'}
                </p>
              </div>
            </div>
            <ChevronRight size={18} className="text-ink-2" />
          </div>
        </Card>

        {/* 7. Plan Ahead strip */}
        {store.planEvents.length > 0 && (
          <Card onClick={() => navigate('/plan-ahead')}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CalendarClock size={18} className="text-ink-2" />
                <div>
                  <p className="text-sm font-medium text-ink">{store.planEvents[0].name}</p>
                  <p className="text-xs text-ink-2">
                    {format(parseISO(store.planEvents[0].startDate), 'd MMM')} — check {t('{bleeding}', user)} overlap
                  </p>
                </div>
              </div>
              <ChevronRight size={18} className="text-ink-2" />
            </div>
          </Card>
        )}

        {/* 8. What Helps You */}
        {isBleeding && todayLog?.pain.severity && todayLog.pain.severity >= 5 && (
          <Card onClick={() => navigate('/care')}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Heart size={18} className="text-primary" />
                <div>
                  <p className="text-sm font-medium text-ink">What helps you</p>
                  <p className="text-xs text-ink-2">Heat helped on 4 of your last 5 bad cramp days</p>
                </div>
              </div>
              <ChevronRight size={18} className="text-ink-2" />
            </div>
          </Card>
        )}

        {/* 9. Learn in the Moment */}
        {todayLearnCard && (
          <Card onClick={() => navigate(`/learn/${todayLearnCard.id}`)}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen size={18} className="text-plum" />
                <div>
                  <p className="text-sm font-medium text-ink">{todayLearnCard.title}</p>
                  <p className="text-xs text-ink-2">30-second read</p>
                </div>
              </div>
              <ChevronRight size={18} className="text-ink-2" />
            </div>
          </Card>
        )}

        {/* 10. Big button */}
        {!isBleeding && !isBleedingToday && (
          <div className="space-y-2 pt-2">
            <Button onClick={() => {
              store.addCycle({ id: crypto.randomUUID(), startDate: today.toISOString(), source: 'logged' });
              showToast(`${t('{Bleeding}', user)} started — cycle created`);
            }} size="lg" className="w-full">
              {t('{Bleeding}', user)} started
            </Button>
            <Button onClick={() => navigate('/started')} variant="secondary" size="md" className="w-full">
              {t('{Bleeding}', user)} started unexpectedly
            </Button>
          </div>
        )}

        {isBleeding && (
          <Button
            onClick={() => {
              if (lastStart) {
                store.updateCycle(lastStart.id, { endDate: today.toISOString() });
                showToast(`${t('{Bleeding}', user)} ended`);
              }
            }}
            variant="secondary"
            size="lg"
            className="w-full"
          >
            {t('{Bleeding}', user)} ended
          </Button>
        )}
      </div>
    </div>
  );
}

function stageLabel(stage: string): string {
  const labels: Record<string, string> = {
    'teen': 'Teen',
    'reproductive': 'Reproductive',
    'contraception-transition': 'Transition',
    'postpartum': 'Postpartum',
    'pause': 'Pause',
    'perimenopause': 'Perimenopause',
    'menopause-plus': 'Menopause+',
  };
  return labels[stage] ?? stage;
}

function PainDayMode() {
  const store = useStore();
  const navigate = useNavigate();
  const { user, cycles, logs } = store;
  const today = new Date();
  const todayLog = logs.find((l) => l.date.slice(0, 10) === today.toISOString().slice(0, 10));

  return (
    <div className="min-h-screen bg-bg px-4 pt-8 pb-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Moon size={24} className="text-plum" />
          <h1 className="font-serif text-2xl text-ink">Pain-Day Mode</h1>
        </div>
        <button
          onClick={() => store.setPainDayMode(false)}
          className="text-sm text-ink-2 hover:text-ink"
        >
          Exit
        </button>
      </div>

      <p className="text-ink-2 mb-6 text-center">That's enough. Just one tap if you can.</p>

      <div className="space-y-4">
        <Card padding="lg" className="text-center">
          <p className="text-sm text-ink-2 mb-3">Log pain right now</p>
          <div className="flex gap-3 justify-center">
            {[
              { label: 'Bad', val: 7 },
              { label: 'Severe', val: 8 },
              { label: 'Very severe', val: 10 },
            ].map((p) => (
              <button
                key={p.val}
                onClick={() => {
                  if (todayLog) {
                    store.updateLog(todayLog.id, { pain: { locations: todayLog.pain.locations, severity: p.val } });
                  }
                  useStore.getState().showToast?.('Pain logged. Rest up.');
                }}
                className="px-6 py-4 rounded-xl bg-primary text-white font-medium text-lg hover:opacity-90"
                style={{ minHeight: '48px' }}
              >
                {p.label}
              </button>
            ))}
          </div>
        </Card>

        <Card padding="lg">
          <p className="text-sm font-medium text-ink mb-3">What helps you most</p>
          <div className="space-y-2">
            {['Heat', 'Rest/nap', 'Ibuprofen'].map((remedy) => (
              <button
                key={remedy}
                onClick={() => {
                  if (todayLog) {
                    store.updateLog(todayLog.id, {
                      remedies: [...(todayLog.remedies || []), { name: remedy, helped: 'a-lot' }],
                    });
                  }
                  useStore.getState().showToast?.(`${remedy} logged`);
                }}
                className="w-full px-4 py-4 rounded-xl bg-surface-2 text-ink font-medium text-left hover:bg-primary-soft"
                style={{ minHeight: '48px' }}
              >
                {remedy}
              </button>
            ))}
          </div>
        </Card>

        <button
          onClick={() => store.setPainDayMode(false)}
          className="w-full text-center text-ink-2 text-sm py-4 hover:text-ink"
        >
          That's enough for today
        </button>
      </div>
    </div>
  );
}