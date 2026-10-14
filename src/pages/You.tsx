import { useNavigate } from 'react-router-dom';
import { Settings, Shield, BookOpen, FileText, Moon, Heart, User as UserIcon, ChevronRight, Bell } from 'lucide-react';
import { useStore } from '@/store';
import { Card } from '@/components/ui';

export default function You() {
  const navigate = useNavigate();
  const store = useStore();
  const { user, currentStage, learnCardsShown } = store;

  const menuItems = [
    { icon: Shield, label: 'Privacy Centre', path: '/privacy', desc: 'Data Map, Consent Ledger, App Lock' },
    { icon: FileText, label: 'Clinician Report', path: '/report', desc: 'One-page PDF, free export' },
    { icon: Moon, label: 'Modes & Life Stages', path: '/modes', desc: 'Current: ' + stageLabel(currentStage) },
    { icon: Heart, label: 'Care & Playbook', path: '/care', desc: 'Check-in, red flags, what helps' },
    { icon: Bell, label: 'Reminders', path: '/reminders', desc: 'Change alerts, briefing, quiet hours' },
    { icon: BookOpen, label: 'Learn Library', path: '/learn/tss-safety', desc: `${learnCardsShown.length} cards seen` },
    { icon: Settings, label: 'Settings', path: '/settings', desc: 'Terminology, theme, defaults' },
  ];

  return (
    <div className="min-h-screen">
      <div className="px-4 pt-6 pb-4">
        <h1 className="font-serif text-2xl text-ink mb-4">You</h1>

        {/* Profile card */}
        <Card padding="lg" className="mb-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-full bg-primary-soft flex items-center justify-center">
              <UserIcon size={24} className="text-primary" />
            </div>
            <div>
              <p className="font-serif text-lg text-ink">{user?.name || 'Your record'}</p>
              <p className="text-xs text-ink-2">{user?.ageBand} · {stageLabel(currentStage)}</p>
            </div>
          </div>
          {user?.demoData && (
            <p className="text-xs text-plum bg-plum-soft/50 rounded-lg px-3 py-2">
              You're exploring with demo data. Clear it in Settings to start your own record.
            </p>
          )}
        </Card>

        {/* Menu */}
        <div className="space-y-2">
          {menuItems.map((item) => (
            <Card key={item.path} onClick={() => navigate(item.path)} padding="md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <item.icon size={20} className="text-ink-2" />
                  <div>
                    <p className="text-sm font-medium text-ink">{item.label}</p>
                    <p className="text-xs text-ink-2">{item.desc}</p>
                  </div>
                </div>
                <ChevronRight size={18} className="text-ink-2" />
              </div>
            </Card>
          ))}
        </div>

        <div className="mt-6 text-center">
          <p className="font-serif text-sm text-ink-2 italic">Manage your period. Own your record.</p>
          <p className="text-xs text-ink-2 mt-2">Cyclewise v1.0 — not a medical device</p>
        </div>
      </div>
    </div>
  );
}

function stageLabel(stage: string): string {
  const labels: Record<string, string> = {
    'teen': 'Teen Mode',
    'reproductive': 'Reproductive Years',
    'contraception-transition': 'Transition Mode',
    'postpartum': 'Postpartum Return',
    'pause': 'Active Pause',
    'perimenopause': 'Perimenopause',
    'menopause-plus': 'Menopause+',
  };
  return labels[stage] ?? stage;
}