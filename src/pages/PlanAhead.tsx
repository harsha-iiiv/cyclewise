import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Plus, MapPin, Trash2, Package } from 'lucide-react';
import { useStore } from '@/store';
import { Card, Button, Badge } from '@/components/ui';
import { useToast } from '@/components/Toast';
import { predictNextThreeCycles, formatPredictionRange } from '@/lib/prediction';
import { format, parseISO, differenceInCalendarDays } from 'date-fns';

export default function PlanAhead() {
  const navigate = useNavigate();
  const store = useStore();
  const { showToast } = useToast();
  const { cycles, planEvents, currentStage } = store;
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState('trip');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const predictions = predictNextThreeCycles(cycles, undefined, currentStage === 'teen');

  const handleAdd = () => {
    if (!name || !startDate) return;
    store.addPlanEvent({
      id: crypto.randomUUID(),
      name,
      type,
      startDate: new Date(startDate).toISOString(),
      endDate: new Date(endDate || startDate).toISOString(),
    });
    setShowAdd(false);
    setName(''); setStartDate(''); setEndDate('');
    showToast('Event added — checking overlap');
  };

  const checkOverlap = (eventStart: string, eventEnd: string) => {
    const start = parseISO(eventStart);
    const end = parseISO(eventEnd);
    for (const pred of predictions) {
      const low = parseISO(pred.lowDate);
      const high = parseISO(pred.highDate);
      if (start <= high && end >= low) {
        const likely = parseISO(pred.centreDate);
        const dayOfCycle = differenceInCalendarDays(likely, parseISO(cycles[cycles.length - 1].startDate)) + 1;
        return {
          overlap: true,
          prediction: pred,
          likelyDate: likely,
          dayOfCycle,
        };
      }
    }
    return { overlap: false };
  };

  return (
    <div className="min-h-screen">
      <div className="flex items-center justify-between px-4 pt-6 pb-4">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-ink-2 hover:text-ink">
          <ChevronLeft size={20} /> Back
        </button>
        <h1 className="font-serif text-xl text-ink">Plan Ahead</h1>
        <div className="w-20" />
      </div>

      <div className="px-4 space-y-4">
        {/* Next 3 predicted cycles */}
        {predictions.length > 0 && (
          <Card>
            <h2 className="font-serif text-lg text-ink mb-3">Next 3 predicted cycles</h2>
            <div className="space-y-2">
              {predictions.map((pred, i) => (
                <div key={i} className="flex items-center justify-between bg-surface-2 rounded-xl px-3 py-2">
                  <span className="text-sm text-ink">Cycle {cycles.length + i}</span>
                  <div className="text-right">
                    <p className="text-sm text-ink font-medium">
                      {format(parseISO(pred.lowDate), 'd MMM')} – {format(parseISO(pred.highDate), 'd MMM')}
                    </p>
                    <p className="text-xs text-ink-2">±{pred.halfWidth}d · {pred.confidence}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Add event */}
        {!showAdd ? (
          <Button onClick={() => setShowAdd(true)} className="w-full">
            <Plus size={16} className="inline mr-1" /> Add an event
          </Button>
        ) : (
          <Card>
            <h2 className="font-serif text-lg text-ink mb-3">Add event</h2>
            <div className="space-y-3">
              <input
                type="text" placeholder="Event name (e.g. Work trip)"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-3 rounded-xl border border-line bg-surface text-ink text-sm"
              />
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full px-3 py-3 rounded-xl border border-line bg-surface text-ink text-sm"
              >
                {['trip', 'exam', 'wedding', 'work', 'sport', 'other'].map((t) => (
                  <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                ))}
              </select>
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="text-xs text-ink-2 block mb-1">Start date</label>
                  <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-3 rounded-xl border border-line bg-surface text-ink text-sm" />
                </div>
                <div className="flex-1">
                  <label className="text-xs text-ink-2 block mb-1">End date</label>
                  <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-3 rounded-xl border border-line bg-surface text-ink text-sm" />
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleAdd} disabled={!name || !startDate} className="flex-1">Add event</Button>
                <Button variant="secondary" onClick={() => setShowAdd(false)} className="flex-1">Cancel</Button>
              </div>
            </div>
          </Card>
        )}

        {/* Events */}
        {planEvents.map((event) => {
          const overlap = checkOverlap(event.startDate, event.endDate);
          return (
            <Card key={event.id}>
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="flex items-center gap-2">
                    <MapPin size={16} className="text-plum" />
                    <p className="text-sm font-medium text-ink">{event.name}</p>
                  </div>
                  <p className="text-xs text-ink-2 mt-1">
                    {format(parseISO(event.startDate), 'd MMM')}
                    {event.endDate !== event.startDate && ` – ${format(parseISO(event.endDate), 'd MMM')}`}
                  </p>
                </div>
                <button onClick={() => { store.deletePlanEvent(event.id); showToast('Event removed'); }}>
                  <Trash2 size={16} className="text-ink-2 hover:text-red" />
                </button>
              </div>
              {overlap.overlap ? (
                <div className="bg-primary-soft/30 rounded-xl p-3 mt-2">
                  <p className="text-sm text-primary font-medium">
                    Bleeding likely during this event
                  </p>
                  <p className="text-xs text-ink-2 mt-1">
                    Most likely {format(overlap.likelyDate, 'EEEE d MMM')} (day {overlap.dayOfCycle} of cycle) · {formatPredictionRange(overlap.prediction)}
                  </p>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => navigate('/prepare')}
                    className="mt-2"
                  >
                    <Package size={14} className="inline mr-1" /> Build kit for this
                  </Button>
                </div>
              ) : (
                <Badge color="sage" className="mt-2">No overlap predicted</Badge>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}