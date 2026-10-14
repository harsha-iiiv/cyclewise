import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, MapPin } from 'lucide-react';
import { useStore } from '@/store';
import { Card, Button, Badge } from '@/components/ui';
import { predictNextThreeCycles, getCycleDay, getCompletedCycleLengths } from '@/lib/prediction';
import { figoContext } from '@/lib/redFlags';
import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, isToday, differenceInCalendarDays } from 'date-fns';

export default function Calendar() {
  const navigate = useNavigate();
  const store = useStore();
  const { user, cycles, logs, currentStage, planEvents } = store;
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  const cycleDay = getCycleDay(cycles);
  const predictions = predictNextThreeCycles(cycles, undefined, currentStage === 'teen');
  const completedLengths = getCompletedCycleLengths(cycles);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const startOffset = (monthStart.getDay() + 6) % 7; // Monday-first

  const getDayStatus = (day: Date) => {
    const dayStr = format(day, 'yyyy-MM-dd');
    const log = logs.find((l) => l.date.slice(0, 10) === dayStr);
    const isBleeding = log?.flow && log.flow !== 'none';
    const isSpotting = log?.flow === 'spotting';
    const isPredicted = predictions.some((p) => {
      const low = parseISO(p.lowDate);
      const high = parseISO(p.highDate);
      return day >= low && day <= high;
    });
    const isEvent = planEvents.some((e) => {
      const start = parseISO(e.startDate);
      const end = parseISO(e.endDate);
      return day >= start && day <= end;
    });
    const hasPain = log?.pain?.severity && log.pain.severity >= 5;

    return { isBleeding, isSpotting, isPredicted, isEvent, hasPain, log };
  };

  const selectedLog = selectedDay
    ? logs.find((l) => l.date.slice(0, 10) === format(selectedDay, 'yyyy-MM-dd'))
    : null;

  return (
    <div className="min-h-screen">
      <div className="px-4 pt-6 pb-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="font-serif text-2xl text-ink">Calendar</h1>
          <Button size="sm" variant="secondary" onClick={() => navigate('/plan-ahead')}>
            <MapPin size={14} className="inline mr-1" /> Plan Ahead
          </Button>
        </div>

        {/* Month navigation */}
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-2">
            <ChevronLeft size={20} className="text-ink-2" />
          </button>
          <h2 className="font-serif text-lg text-ink">{format(currentMonth, 'MMMM yyyy')}</h2>
          <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-2">
            <ChevronRight size={20} className="text-ink-2" />
          </button>
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
            <div key={i} className="text-center text-xs text-ink-2 font-medium py-1">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: startOffset }).map((_, i) => (
            <div key={`empty-${i}`} />
          ))}
          {days.map((day) => {
            const status = getDayStatus(day);
            return (
              <button
                key={day.toISOString()}
                onClick={() => setSelectedDay(day)}
                className={`aspect-square rounded-lg flex flex-col items-center justify-center relative text-sm transition-all ${
                  isToday(day) ? 'ring-2 ring-primary ring-offset-1' : ''
                } ${selectedDay && isSameDay(selectedDay, day) ? 'bg-primary-soft' : 'hover:bg-surface-2'}`}
              >
                <span className={`text-xs ${status.isBleeding ? 'text-primary font-bold' : 'text-ink'}`}>
                  {format(day, 'd')}
                </span>
                <div className="flex gap-0.5 mt-0.5">
                  {status.isBleeding && <div className="w-1.5 h-1.5 rounded-full bg-primary" />}
                  {status.isSpotting && <div className="w-1 h-1 rounded-full bg-primary/40" />}
                  {status.isPredicted && <div className="w-1.5 h-1.5 rounded-full border border-primary border-dashed" />}
                  {status.hasPain && <div className="w-1.5 h-1.5 rounded-full bg-amber" />}
                  {status.isEvent && <div className="w-1.5 h-1.5 rounded-full bg-plum" />}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="px-4 mb-4 flex flex-wrap gap-3 text-xs text-ink-2">
        <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-primary" /> Bleeding</span>
        <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full border border-primary border-dashed" /> Predicted</span>
        <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-amber" /> Pain</span>
        <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-plum" /> Event</span>
      </div>

      {/* Selected day sheet */}
      {selectedDay && (
        <div className="px-4 mb-4">
          <Card>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-serif text-lg text-ink">{format(selectedDay, 'EEEE d MMMM')}</h3>
              <Button size="sm" variant="secondary" onClick={() => navigate(`/log?date=${format(selectedDay, 'yyyy-MM-dd')}`)}>
                Edit log
              </Button>
            </div>
            {selectedLog ? (
              <div className="space-y-1 text-sm text-ink-2">
                {selectedLog.flow && selectedLog.flow !== 'none' && <p>Flow: {selectedLog.flow.replace('-', ' ')}</p>}
                {selectedLog.pain.severity > 0 && <p>Pain: {selectedLog.pain.locations.join(', ')} ({selectedLog.pain.severity}/10)</p>}
                {selectedLog.mood.length > 0 && <p>Mood: {selectedLog.mood.join(', ')}</p>}
                {selectedLog.notes && <p className="italic">"{selectedLog.notes}"</p>}
              </div>
            ) : (
              <p className="text-sm text-ink-2">No log for this day.</p>
            )}
          </Card>
        </div>
      )}

      {/* Cycle history */}
      {completedLengths.length > 0 && (
        <div className="px-4 mb-4">
          <h3 className="font-serif text-lg text-ink mb-3">Cycle history</h3>
          {figoContext(completedLengths, user?.ageBand ?? '26-35') && (
            <p className="text-xs text-ink-2 mb-3 italic">{figoContext(completedLengths, user?.ageBand ?? '26-35')!.label}</p>
          )}
          <div className="space-y-2">
            {completedLengths.slice(-5).reverse().map((len, i) => {
              const cycleIdx = completedLengths.length - 1 - i;
              const cycle = cycles[cycleIdx + 1];
              return (
                <Card key={i} padding="sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-ink">Cycle {cycleIdx + 2}</p>
                      <p className="text-xs text-ink-2">{len} days</p>
                    </div>
                    <Badge color={len >= 24 && len <= 38 ? 'sage' : 'amber'}>
                      {len < 24 ? 'Short' : len > 38 ? 'Long' : 'Usual range'}
                    </Badge>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}