import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { useStore } from '@/store';
import { Card, Button } from '@/components/ui';
import { useToast } from '@/components/Toast';

export default function LeakLog() {
  const navigate = useNavigate();
  const store = useStore();
  const { showToast } = useToast();
  const [activity, setActivity] = useState('');
  const [hoursWorn, setHoursWorn] = useState('');
  const [productId, setProductId] = useState('');

  const activities = ['sitting', 'standing', 'exercise', 'sleep', 'other'];

  const handleSave = () => {
    const cycleDay = store.cycles.length > 0
      ? Math.round((Date.now() - new Date(store.cycles[store.cycles.length - 1].startDate).getTime()) / 86400000) + 1
      : 1;
    store.addLeak({
      id: crypto.randomUUID(),
      datetime: new Date().toISOString(),
      productId: productId || undefined,
      hoursWorn: hoursWorn ? Number(hoursWorn) : undefined,
      activity: activity || 'unknown',
      flow: store.logs.find((l) => l.date.slice(0, 10) === new Date().toISOString().slice(0, 10))?.flow ?? 'moderate',
      cycleDay,
    });
    showToast('Leak logged — this helps improve your leak risk forecast');
    navigate(-1);
  };

  return (
    <div className="min-h-screen">
      <div className="flex items-center justify-between px-4 pt-6 pb-4">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-ink-2 hover:text-ink">
          <ChevronLeft size={20} /> Back
        </button>
        <h1 className="font-serif text-xl text-ink">Log a leak</h1>
        <div className="w-20" />
      </div>

      <div className="px-4 space-y-4">
        <Card>
          <p className="text-sm font-medium text-ink mb-3">What were you doing?</p>
          <div className="flex flex-wrap gap-2">
            {activities.map((a) => (
              <button
                key={a}
                onClick={() => setActivity(a)}
                className={`px-3 py-2 rounded-full text-sm border capitalize ${activity === a ? 'border-primary bg-primary-soft text-primary' : 'border-line text-ink-2'}`}
              >
                {a}
              </button>
            ))}
          </div>
        </Card>

        <Card>
          <p className="text-sm font-medium text-ink mb-3">How long had the product been in?</p>
          <input
            type="number" placeholder="Hours" value={hoursWorn}
            onChange={(e) => setHoursWorn(e.target.value)}
            className="w-full px-3 py-3 rounded-xl border border-line bg-surface text-ink text-sm"
          />
        </Card>

        <Card>
          <p className="text-sm font-medium text-ink mb-3">Which product?</p>
          <select
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
            className="w-full px-3 py-3 rounded-xl border border-line bg-surface text-ink text-sm"
          >
            <option value="">Not sure</option>
            {store.products.map((p) => (
              <option key={p.id} value={p.id}>{p.absorbency} {p.type}</option>
            ))}
          </select>
        </Card>

        <Button onClick={handleSave} className="w-full">Save</Button>
      </div>
    </div>
  );
}