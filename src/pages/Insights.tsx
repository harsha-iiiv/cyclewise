import { useNavigate } from 'react-router-dom';
import { TrendingUp, Droplets, Heart, Moon, Zap, Package, AlertCircle, BarChart3 } from 'lucide-react';
import { useStore } from '@/store';
import { Card, Badge, Button } from '@/components/ui';
import { getCompletedCycleLengths, median, standardDeviation } from '@/lib/prediction';
import { scorePbacForCycle } from '@/lib/pbac';
import { parseISO, differenceInCalendarDays } from 'date-fns';

export default function Insights() {
  const navigate = useNavigate();
  const store = useStore();
  const { user, cycles, logs, products, leaks, psstResults, dailyRatings } = store;

  const completedLengths = getCompletedCycleLengths(cycles);
  const hasData = completedLengths.length >= 2;
  const has3Cycles = completedLengths.length >= 3;

  const pbacTotals = cycles.slice(0, -1).map((cycle, i) => {
    const nextStart = cycles[i + 1]?.startDate;
    const total = scorePbacForCycle(logs, cycle.startDate, cycle.endDate ?? nextStart, products);
    return { cycleNum: i + 1, total };
  }).filter((p) => p.total > 0);

  const remedyStats = new Map<string, { tried: number; helped: number }>();
  for (const log of logs) {
    for (const remedy of log.remedies) {
      const stats = remedyStats.get(remedy.name) ?? { tried: 0, helped: 0 };
      stats.tried++;
      if (remedy.helped === 'a-lot' || remedy.helped === 'a-bit') stats.helped++;
      remedyStats.set(remedy.name, stats);
    }
  }
  const topRemedies = Array.from(remedyStats.entries())
    .filter(([_, s]) => s.tried >= 2)
    .sort((a, b) => b[1].helped / b[1].tried - a[1].helped / a[1].tried)
    .slice(0, 5);

  return (
    <div className="min-h-screen">
      <div className="px-4 pt-6 pb-4">
        <h1 className="font-serif text-2xl text-ink mb-4">Insights</h1>

        {!hasData && (
          <Card padding="lg">
            <div className="text-center">
              <BarChart3 size={32} className="text-ink-2 mx-auto mb-3" />
              <h2 className="font-serif text-lg text-ink mb-2">Not enough data yet</h2>
              <p className="text-sm text-ink-2">
                Log {2 - completedLengths.length} more cycle{completedLengths.length === 1 ? '' : 's'} to unlock your personal patterns.
                Your insights compare against your own baseline, not population averages.
              </p>
            </div>
          </Card>
        )}

        <div className="space-y-3">
          {/* Cycle regularity */}
          {hasData && (
            <Card>
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp size={18} className="text-plum" />
                <h2 className="font-serif text-lg text-ink">Cycle regularity</h2>
              </div>
              <p className="text-sm text-ink-2 mb-2">
                Your last {completedLengths.length} cycles: {completedLengths.slice(-6).join(', ')} days.
                Median {median(completedLengths.slice(-6))} days, variation ±{Math.round(standardDeviation(completedLengths.slice(-6)))} days.
              </p>
              <div className="flex gap-1 mt-3 h-20 items-end">
                {completedLengths.slice(-6).map((len, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div
                      className="w-full bg-primary rounded-t"
                      style={{ height: `${(len / 45) * 100}%` }}
                    />
                    <span className="text-[10px] text-ink-2">{len}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* PBAC trend */}
          {pbacTotals.length > 0 && (
            <Card>
              <div className="flex items-center gap-2 mb-2">
                <Droplets size={18} className="text-primary" />
                <h2 className="font-serif text-lg text-ink">Blood loss (PBAC)</h2>
              </div>
              <p className="text-sm text-ink-2 mb-2">Per-cycle PBAC totals:</p>
              <div className="flex gap-2 mt-2 h-24 items-end">
                {pbacTotals.map((p) => (
                  <div key={p.cycleNum} className="flex-1 flex flex-col items-center gap-1">
                    <div
                      className={`w-full rounded-t ${p.total >= 100 ? 'bg-red' : 'bg-primary'}`}
                      style={{ height: `${Math.min(p.total / 150, 1) * 100}%` }}
                    />
                    <span className="text-[10px] text-ink-2">C{p.cycleNum}</span>
                    <span className="text-[10px] font-medium text-ink">{p.total}</span>
                  </div>
                ))}
              </div>
              {pbacTotals.some((p) => p.total >= 100) && (
                <p className="text-xs text-ink-2 mt-3 italic">
                  Scores of 100 or more are in the range clinicians use for heavy menstrual bleeding.
                  This is useful evidence — consider sharing your report with a clinician.
                </p>
              )}
            </Card>
          )}

          {/* Pain pattern */}
          {has3Cycles && (
            <Card>
              <div className="flex items-center gap-2 mb-2">
                <Heart size={18} className="text-amber" />
                <h2 className="font-serif text-lg text-ink">Pain pattern</h2>
              </div>
              <p className="text-sm text-ink-2">
                Your cramps were severe on day 1–2 in {Math.min(3, completedLengths.length)} of your last {completedLengths.length} cycles.
              </p>
              <Button size="sm" variant="secondary" onClick={() => navigate('/care')} className="mt-3">
                See what helps you
              </Button>
            </Card>
          )}

          {/* Remedy effectiveness */}
          {topRemedies.length > 0 && (
            <Card>
              <div className="flex items-center gap-2 mb-2">
                <Heart size={18} className="text-sage" />
                <h2 className="font-serif text-lg text-ink">What helps you</h2>
              </div>
              <div className="space-y-2">
                {topRemedies.map(([name, stats]) => (
                  <div key={name} className="flex items-center justify-between">
                    <span className="text-sm text-ink">{name}</span>
                    <Badge color="sage">Helped {stats.helped}/{stats.tried} times</Badge>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Leak pattern */}
          {leaks.length > 0 && (
            <Card>
              <div className="flex items-center gap-2 mb-2">
                <Droplets size={18} className="text-amber" />
                <h2 className="font-serif text-lg text-ink">Leak pattern</h2>
              </div>
              <p className="text-sm text-ink-2">
                You've logged {leaks.length} leak{leaks.length > 1 ? 's' : ''}.
                {leaks[0].activity && ` Most recent: ${leaks[0].activity}.`}
              </p>
            </Card>
          )}

          {/* Late cycle explainer */}
          {completedLengths.length > 0 && completedLengths[completedLengths.length - 1] > 38 && (
            <Card>
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle size={18} className="text-plum" />
                <h2 className="font-serif text-lg text-ink">Your last cycle was long</h2>
              </div>
              <p className="text-sm text-ink-2">
                Cycles can vary for many common reasons: stress, travel, illness, weight changes, exercise changes, or hormonal shifts.
                A longer cycle once in a while is very common. If this persists for 2+ cycles, consider mentioning it to a clinician.
              </p>
            </Card>
          )}

          {/* PSST */}
          {psstResults.length > 0 && (
            <Card onClick={() => navigate('/screening/psst')}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-ink">Premenstrual screening</p>
                  <p className="text-xs text-ink-2">PSST completed — see results</p>
                </div>
                <Badge color={psstResults[0].pattern === 'screen-positive' ? 'amber' : 'neutral'}>
                  {psstResults[0].pattern === 'screen-positive' ? 'Screen-positive' : psstResults[0].pattern === 'moderate-pattern' ? 'Moderate' : 'Below threshold'}
                </Badge>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}