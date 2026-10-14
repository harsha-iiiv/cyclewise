import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Shield, Database, Lock, Download, Trash2, FileJson, FileText } from 'lucide-react';
import { useStore } from '@/store';
import { Card, Button, Badge } from '@/components/ui';
import { useToast } from '@/components/Toast';

export default function Privacy() {
  const navigate = useNavigate();
  const store = useStore();
  const { showToast } = useToast();
  const { user, cycles, logs, products, consents, leaks, purchases, kits, planEvents, psstResults } = store;

  const dataMap = [
    { type: 'Cycles', count: cycles.length, location: 'On this device only', retention: 'Until you delete it', feature: 'Predictions, calendar, insights' },
    { type: 'Daily logs', count: logs.length, location: 'On this device only', retention: 'Until you delete it', feature: 'Today, log, insights, report' },
    { type: 'Products & inventory', count: products.length, location: 'On this device only', retention: 'Until you delete it', feature: 'Prepare, kit check, cost' },
    { type: 'Leak events', count: leaks.length, location: 'On this device only', retention: 'Until you delete it', feature: 'Leak risk forecast' },
    { type: 'Consents', count: consents.length, location: 'On this device only', retention: 'Until you delete it', feature: 'Consent Ledger' },
    { type: 'Kits', count: kits.length, location: 'On this device only', retention: 'Until you delete it', feature: 'Prepare' },
    { type: 'Plan Ahead events', count: planEvents.length, location: 'On this device only', retention: 'Until you delete it', feature: 'Calendar, Plan Ahead' },
    { type: 'PSST results', count: psstResults.length, location: 'On this device only', retention: 'Until you delete it', feature: 'Care, report' },
    { type: 'Purchases', count: purchases.length, location: 'On this device only', retention: 'Until you delete it', feature: 'Cost tracking' },
  ];

  const handleExportJSON = () => {
    const data = {
      user, cycles, logs, products, leaks, consents, kits, planEvents, psstResults, purchases,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'cyclewise-export.json';
    a.click();
    URL.revokeObjectURL(url);
    showToast('Data exported');
  };

  const handleExportCSV = () => {
    const headers = ['date', 'flow', 'pain_locations', 'pain_severity', 'mood', 'energy', 'sleep_hours', 'notes'];
    const rows = logs.map((l) => [
      l.date.slice(0, 10),
      l.flow ?? '',
      l.pain.locations.join(';'),
      l.pain.severity,
      l.mood.join(';'),
      l.energy ?? '',
      l.sleep?.hours ?? '',
      (l.notes ?? '').replace(/,/g, ';'),
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'cyclewise-logs.csv';
    a.click();
    URL.revokeObjectURL(url);
    showToast('Logs exported as CSV');
  };

  const [confirmDelete, setConfirmDelete] = useState(false);
  const handleDelete = () => {
    store.deleteEverything();
    showToast('All data deleted');
    navigate('/');
  };

  return (
    <div className="min-h-screen">
      <div className="flex items-center justify-between px-4 pt-6 pb-4">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-ink-2 hover:text-ink">
          <ChevronLeft size={20} /> Back
        </button>
        <h1 className="font-serif text-xl text-ink">Privacy Centre</h1>
        <div className="w-20" />
      </div>

      <div className="px-4 space-y-4">
        {/* Honesty box */}
        <Card className="bg-sage-soft/30 border-sage/20">
          <div className="flex items-start gap-2">
            <Shield size={18} className="text-sage flex-shrink-0 mt-0.5" />
            <p className="text-sm text-ink-2 leading-relaxed">
              Cyclewise is built so there is less to take, leak, or ask for: your record lives on this device, we run no ads and no third-party trackers, and we never sell data. No app can protect a phone that someone else has unlocked — use the app lock, and your phone's lock too.
            </p>
          </div>
        </Card>

        {/* Data Map */}
        <Card>
          <div className="flex items-center gap-2 mb-3">
            <Database size={18} className="text-ink-2" />
            <h2 className="font-serif text-lg text-ink">Data Map</h2>
          </div>
          <div className="space-y-2">
            {dataMap.map((item) => (
              <div key={item.type} className="bg-surface-2 rounded-xl p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-ink">{item.type}</span>
                  <Badge color="neutral">{item.count} {item.count === 1 ? 'entry' : 'entries'}</Badge>
                </div>
                <p className="text-xs text-ink-2">{item.location} · {item.retention}</p>
                <p className="text-xs text-ink-2 italic">Used by: {item.feature}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* Consent Ledger */}
        <Card>
          <h2 className="font-serif text-lg text-ink mb-3">Consent Ledger</h2>
          <div className="space-y-2">
            {consents.length === 0 ? (
              <p className="text-sm text-ink-2">No consents recorded yet.</p>
            ) : (
              consents.slice().reverse().map((c) => (
                <div key={c.id} className="bg-surface-2 rounded-xl p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-ink">{c.scope}</span>
                    <Badge color={c.decision === 'given' ? 'sage' : c.decision === 'withdrawn' ? 'amber' : 'neutral'}>
                      {c.decision}
                    </Badge>
                  </div>
                  <p className="text-xs text-ink-2 mt-1">{new Date(c.at).toLocaleString()} · Policy {c.policyVersion}</p>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* App Lock */}
        <Card>
          <div className="flex items-center gap-2 mb-3">
            <Lock size={18} className="text-ink-2" />
            <h2 className="font-serif text-lg text-ink">App Lock</h2>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-ink-2">{store.appLockEnabled ? 'PIN lock enabled' : 'No lock set'}</span>
            <Button
              size="sm"
              variant={store.appLockEnabled ? 'danger' : 'secondary'}
              onClick={() => {
                if (store.appLockEnabled) {
                  store.setAppLock(false);
                  showToast('App lock disabled');
                } else {
                  navigate('/settings');
                }
              }}
            >
              {store.appLockEnabled ? 'Disable' : 'Set up'}
            </Button>
          </div>
        </Card>

        {/* Export */}
        <Card>
          <div className="flex items-center gap-2 mb-3">
            <Download size={18} className="text-ink-2" />
            <h2 className="font-serif text-lg text-ink">Export your data</h2>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={handleExportJSON} className="flex-1">
              <FileJson size={16} className="inline mr-1" /> JSON
            </Button>
            <Button variant="secondary" onClick={handleExportCSV} className="flex-1">
              <FileText size={16} className="inline mr-1" /> CSV
            </Button>
          </div>
        </Card>

        {/* Delete */}
        <Card className="border-red/20">
          <div className="flex items-center gap-2 mb-3">
            <Trash2 size={18} className="text-red" />
            <h2 className="font-serif text-lg text-ink">Delete everything</h2>
          </div>
          {!confirmDelete ? (
            <Button variant="danger" onClick={() => setConfirmDelete(true)} className="w-full">
              Delete all data
            </Button>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-ink-2">
                This deletes all Cyclewise data on this device. There is no server copy to delete — because there never was one.
              </p>
              <div className="flex gap-2">
                <Button variant="danger" onClick={handleDelete} className="flex-1">Yes, delete everything</Button>
                <Button variant="secondary" onClick={() => setConfirmDelete(false)} className="flex-1">Cancel</Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}