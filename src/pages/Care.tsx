import { useNavigate } from 'react-router-dom';
import { ChevronLeft, AlertTriangle, Droplet, Phone } from 'lucide-react';
import { useStore } from '@/store';
import { Card, Button, Badge } from '@/components/ui';
import { checkRedFlags } from '@/lib/redFlags';

const TRIAGE_OPTIONS = [
  { id: 'irritation', label: 'Irritation or itching' },
  { id: 'discharge', label: 'Unusual discharge or odour' },
  { id: 'pain-different', label: 'Pain that feels different' },
  { id: 'between-bleeding', label: 'Bleeding between periods' },
  { id: 'very-heavy', label: 'Very heavy bleeding' },
  { id: 'something-else', label: 'Something else' },
];

export default function Care() {
  const navigate = useNavigate();
  const store = useStore();
  const { user, cycles, logs, currentStage, products, psstResults } = store;

  const redFlags = checkRedFlags(cycles, logs, currentStage, { ageBand: user?.ageBand ?? '', healthNote: user?.healthNote }, products, psstResults);

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
    .sort((a, b) => b[1].helped / b[1].tried - a[1].helped / a[1].tried)
    .slice(0, 5);

  return (
    <div className="min-h-screen">
      <div className="flex items-center justify-between px-4 pt-6 pb-4">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-ink-2 hover:text-ink">
          <ChevronLeft size={20} /> Back
        </button>
        <h1 className="font-serif text-xl text-ink">Care</h1>
        <div className="w-20" />
      </div>

      <div className="px-4 space-y-4">
        {/* Red flags */}
        {redFlags.length > 0 ? (
          <Card className="border-amber/30 bg-amber-soft/30">
            <div className="flex items-start gap-3 mb-3">
              <AlertTriangle size={20} className="text-amber flex-shrink-0 mt-0.5" />
              <div>
                <h2 className="font-serif text-lg text-ink">Worth getting checked</h2>
                <p className="text-xs text-ink-2 mt-1">Something in your record caught our attention. This is not a diagnosis — it is a prompt to consider talking to a clinician.</p>
              </div>
            </div>
            <div className="space-y-3">
              {redFlags.map((flag) => (
                <div key={flag.id} className="bg-surface rounded-xl p-3 border border-line">
                  <p className="text-sm font-medium text-ink">{flag.whatWeNoticed}</p>
                  <p className="text-xs text-ink-2 mt-1">{flag.whyItMatters}</p>
                  <p className="text-xs text-amber mt-2 font-medium">{flag.nextStep}</p>
                  <div className="mt-2 bg-amber-soft/50 rounded-lg p-2">
                    <p className="text-xs text-ink-2"><span className="font-medium">What to tell your clinician:</span> "{flag.whatToTell}"</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        ) : (
          <Card padding="lg">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-sage-soft flex items-center justify-center mx-auto mb-3">
                <Droplet size={24} className="text-sage" />
              </div>
              <h2 className="font-serif text-lg text-ink mb-1">Nothing flagged right now</h2>
              <p className="text-sm text-ink-2">Even when nothing is flagged, if you don't feel right, getting checked is always reasonable.</p>
            </div>
          </Card>
        )}

        {/* Check-in */}
        <Card>
          <h2 className="font-serif text-lg text-ink mb-3">How are you, really?</h2>
          <p className="text-sm text-ink-2 mb-3">Pick what's going on. We'll give you reviewed guidance — no diagnoses, just next steps.</p>
          <div className="space-y-2">
            {TRIAGE_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                onClick={() => navigate('/care')}
                className="w-full text-left px-4 py-3 rounded-xl border border-line bg-surface text-ink hover:border-primary/30 text-sm"
              >
                {opt.label}
              </button>
            ))}
          </div>
          <div className="mt-4 bg-surface-2 rounded-xl p-3">
            <p className="text-xs text-ink-2 font-medium mb-2">Support resources:</p>
            <p className="text-xs text-ink-2">· Your clinician or GP</p>
            <p className="text-xs text-ink-2">· Local urgent care or A&E</p>
            <p className="text-xs text-ink-2">· If you're struggling with your mental health, contact your local crisis line or Samaritans (116 123, UK)</p>
          </div>
        </Card>

        {/* My Playbook */}
        <Card>
          <h2 className="font-serif text-lg text-ink mb-3">My Playbook — what helps me</h2>
          {topRemedies.length === 0 ? (
            <p className="text-sm text-ink-2">Log remedies in your daily log and rate whether they helped. Over time, your personal evidence builds here.</p>
          ) : (
            <div className="space-y-2">
              {topRemedies.map(([name, stats]) => (
                <div key={name} className="flex items-center justify-between bg-surface-2 rounded-xl px-3 py-2">
                  <span className="text-sm text-ink">{name}</span>
                  <div className="flex items-center gap-2">
                    <div className="flex gap-0.5">
                      {Array.from({ length: stats.tried }).map((_, i) => (
                        <div
                          key={i}
                          className={`w-2 h-2 rounded-full ${i < stats.helped ? 'bg-sage' : 'bg-line'}`}
                        />
                      ))}
                    </div>
                    <span className="text-xs text-ink-2">{stats.helped}/{stats.tried}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Pain-Day Mode */}
        <Card onClick={() => store.setPainDayMode(true)}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-ink">Pain-Day Mode</p>
              <p className="text-xs text-ink-2">Bigger targets, one-tap logging, your playbook first</p>
            </div>
            <ChevronRight size={18} className="text-ink-2" />
          </div>
        </Card>

        {/* PSST */}
        <Card onClick={() => navigate('/screening/psst')}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-ink">Premenstrual screening (PSST)</p>
              <p className="text-xs text-ink-2">19-question screening tool — not a diagnosis</p>
            </div>
            <ChevronRight size={18} className="text-ink-2" />
          </div>
        </Card>
      </div>
    </div>
  );
}