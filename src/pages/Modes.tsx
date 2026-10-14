import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Check, Moon, Heart, Baby, Pause, TrendingDown, Clock } from 'lucide-react';
import { useStore } from '@/store';
import { Card, Button, Badge } from '@/components/ui';
import type { LifeStage } from '@/types';

const STAGES: { stage: LifeStage; label: string; desc: string; icon: any }[] = [
  { stage: 'reproductive', label: 'Reproductive Years', desc: 'The full toolkit for managing your period', icon: Heart },
  { stage: 'teen', label: 'Teen Mode', desc: 'Education-first, no fertility content, school-day tools', icon: Moon },
  { stage: 'contraception-transition', label: 'Contraception Transition', desc: '6-month view of bleeding changes for your method', icon: Clock },
  { stage: 'postpartum', label: 'Postpartum Return', desc: 'Lochia tracking, cycle return forecasting, mood check-in', icon: Baby },
  { stage: 'pause', label: 'Active Pause', desc: 'Record kept warm, no late alarms, gentle check-ins', icon: Pause },
  { stage: 'perimenopause', label: 'Perimenopause', desc: 'Bleeding change + symptom overlay over months', icon: TrendingDown },
  { stage: 'menopause-plus', label: 'Menopause+', desc: 'Symptom persistence, HRT ledger, lifetime record', icon: TrendingDown },
];

export default function Modes() {
  const navigate = useNavigate();
  const store = useStore();
  const { currentStage, lifeStageHistory } = store;

  return (
    <div className="min-h-screen">
      <div className="flex items-center justify-between px-4 pt-6 pb-4">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-ink-2 hover:text-ink">
          <ChevronLeft size={20} /> Back
        </button>
        <h1 className="font-serif text-xl text-ink">Modes</h1>
        <div className="w-20" />
      </div>

      <div className="px-4 space-y-4">
        <p className="text-sm text-ink-2">
          Switching modes re-ranks your home screen and foregrounds different tools. It never deletes, hides, or separates your history — your record is one continuous timeline.
        </p>

        {/* Current mode */}
        <Card padding="lg" className="bg-primary-soft/30 border-primary/20">
          <Badge color="primary">Current mode</Badge>
          <h2 className="font-serif text-xl text-ink mt-2 mb-1">
            {STAGES.find((s) => s.stage === currentStage)?.label}
          </h2>
          <p className="text-sm text-ink-2">{STAGES.find((s) => s.stage === currentStage)?.desc}</p>
        </Card>

        {/* Other modes */}
        <div className="space-y-2">
          {STAGES.filter((s) => s.stage !== currentStage).map((s) => (
            <Card key={s.stage} padding="md">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <s.icon size={20} className="text-ink-2 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-ink">{s.label}</p>
                    <p className="text-xs text-ink-2 mt-1">{s.desc}</p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    store.setStage(s.stage, 'user-chosen');
                    navigate('/');
                  }}
                >
                  Switch
                </Button>
              </div>
            </Card>
          ))}
        </div>

        {/* Timeline */}
        {lifeStageHistory.length > 0 && (
          <div>
            <h3 className="font-serif text-lg text-ink mb-3">Your timeline</h3>
            <div className="space-y-2">
              {lifeStageHistory.map((h) => (
                <div key={h.id} className="flex items-center gap-3 bg-surface-2 rounded-xl px-3 py-2">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  <div>
                    <p className="text-sm text-ink">{STAGES.find((s) => s.stage === h.stage)?.label ?? h.stage}</p>
                    <p className="text-xs text-ink-2">
                      {new Date(h.startedAt).toLocaleDateString()}
                      {h.endedAt && ` → ${new Date(h.endedAt).toLocaleDateString()}`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Loss sensitivity */}
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-ink">Loss sensitivity</p>
              <p className="text-xs text-ink-2 mt-1">Adjusts language throughout the app to be loss-sensitive</p>
            </div>
            <button
              onClick={() => store.setLossSensitive(!store.lossSensitive)}
              className={`w-12 h-7 rounded-full transition-colors ${store.lossSensitive ? 'bg-sage' : 'bg-line'}`}
            >
              <div className={`w-5 h-5 bg-white rounded-full transition-transform mx-1 ${store.lossSensitive ? 'translate-x-5' : ''}`} />
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
}