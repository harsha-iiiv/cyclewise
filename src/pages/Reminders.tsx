import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Bell, Clock, Moon, ShoppingBag } from 'lucide-react';
import { useStore } from '@/store';
import { Card, Badge } from '@/components/ui';

export default function Reminders() {
  const navigate = useNavigate();
  const store = useStore();

  const reminderTypes = [
    { type: 'change', label: 'Change reminders', desc: 'When to change your product', icon: Clock },
    { type: 'restock', label: 'Restock alerts', desc: 'Before you run out', icon: ShoppingBag },
    { type: 'tomorrow-briefing', label: 'Tomorrow briefing', desc: 'Evening summary of tomorrow', icon: Moon },
  ];

  return (
    <div className="min-h-screen">
      <div className="flex items-center justify-between px-4 pt-6 pb-4">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-ink-2 hover:text-ink">
          <ChevronLeft size={20} /> Back
        </button>
        <h1 className="font-serif text-xl text-ink">Reminders</h1>
        <div className="w-20" />
      </div>

      <div className="px-4 space-y-4">
        <Card>
          <div className="flex items-center gap-2 mb-2">
            <Bell size={18} className="text-ink-2" />
            <p className="text-sm text-ink-2">
              Cyclewise automatically eases off if you dismiss reminders often. No streaks, no guilt — just useful nudges that learn when you need them.
            </p>
          </div>
        </Card>

        {reminderTypes.map((rt) => {
          const reminder = store.reminders.find((r) => r.type === rt.type);
          const dismissals = reminder?.dismissals ?? 0;
          const paused = dismissals >= 5;

          return (
            <Card key={rt.type}>
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <rt.icon size={20} className="text-ink-2 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-ink">{rt.label}</p>
                    <p className="text-xs text-ink-2 mt-1">{rt.desc}</p>
                    {dismissals >= 3 && dismissals < 5 && (
                      <p className="text-xs text-amber mt-2">We've eased off — you've dismissed this a few times.</p>
                    )}
                    {paused && (
                      <p className="text-xs text-ink-2 mt-2">Paused for this cycle. Turn it back up anytime.</p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => store.updateReminder(rt.type, { enabled: !reminder?.enabled, dismissals: 0 })}
                  className={`w-12 h-7 rounded-full transition-colors ${reminder?.enabled !== false ? 'bg-sage' : 'bg-line'}`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full transition-transform mx-1 ${reminder?.enabled !== false ? 'translate-x-5' : ''}`} />
                </button>
              </div>
            </Card>
          );
        })}

        <Card>
          <p className="text-sm font-medium text-ink mb-3">Quiet hours</p>
          <p className="text-xs text-ink-2">Reminders won't fire during quiet hours. Set in a future version — for now, reminders use sensible defaults.</p>
        </Card>
      </div>
    </div>
  );
}