import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Trash2, Shield, Info } from 'lucide-react';
import { useStore } from '@/store';
import { Card, Button, Badge } from '@/components/ui';
import { useToast } from '@/components/Toast';

export default function Settings() {
  const navigate = useNavigate();
  const store = useStore();
  const { showToast } = useToast();
  const { user } = store;
  const [pin, setPin] = useState('');

  if (!user) return null;

  return (
    <div className="min-h-screen">
      <div className="flex items-center justify-between px-4 pt-6 pb-4">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-ink-2 hover:text-ink">
          <ChevronLeft size={20} /> Back
        </button>
        <h1 className="font-serif text-xl text-ink">Settings</h1>
        <div className="w-20" />
      </div>

      <div className="px-4 space-y-4">
        {/* Profile */}
        <Card>
          <h2 className="font-serif text-lg text-ink mb-3">Profile</h2>
          <label className="block text-sm text-ink-2 mb-1">Name (optional)</label>
          <input
            type="text"
            value={user.name ?? ''}
            onChange={(e) => store.updateUser({ name: e.target.value })}
            placeholder="Your name"
            className="w-full px-3 py-3 rounded-xl border border-line bg-surface text-ink text-sm mb-3"
          />

          <label className="block text-sm text-ink-2 mb-1">Call yourself</label>
          <div className="flex gap-2 mb-3">
            {['Woman', 'Person', ''].map((opt) => (
              <button
                key={opt}
                onClick={() => store.updateUser({ terminology: { ...user.terminology, self: opt } })}
                className={`px-3 py-2 rounded-full text-sm border ${user.terminology.self === opt ? 'border-primary bg-primary-soft text-primary' : 'border-line text-ink-2'}`}
              >
                {opt || 'No label'}
              </button>
            ))}
          </div>

          <label className="block text-sm text-ink-2 mb-1">Call bleeding</label>
          <div className="flex gap-2 mb-3">
            {['period', 'bleed'].map((opt) => (
              <button
                key={opt}
                onClick={() => store.updateUser({ terminology: { ...user.terminology, bleeding: opt } })}
                className={`px-3 py-2 rounded-full text-sm border capitalize ${user.terminology.bleeding === opt ? 'border-primary bg-primary-soft text-primary' : 'border-line text-ink-2'}`}
              >
                {opt}
              </button>
            ))}
          </div>

          <label className="block text-sm text-ink-2 mb-1">Anatomy terms</label>
          <div className="flex gap-2 mb-3">
            {(['medical', 'soft'] as const).map((opt) => (
              <button
                key={opt}
                onClick={() => store.updateUser({ terminology: { ...user.terminology, anatomy: opt } })}
                className={`px-3 py-2 rounded-full text-sm border ${user.terminology.anatomy === opt ? 'border-primary bg-primary-soft text-primary' : 'border-line text-ink-2'}`}
              >
                {opt === 'medical' ? 'Standard medical' : 'Softer wording'}
              </button>
            ))}
          </div>
        </Card>

        {/* Fertility content */}
        {user.ageBand !== '13-17' && user.ageBand !== 'Under 13' && (
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-ink">Fertility content</p>
                <p className="text-xs text-ink-2 mt-1">Show ovulation estimates in calendar (not for contraception)</p>
              </div>
              <button
                onClick={() => store.updateUser({ fertilityContent: !user.fertilityContent })}
                className={`w-12 h-7 rounded-full transition-colors ${user.fertilityContent ? 'bg-sage' : 'bg-line'}`}
              >
                <div className={`w-5 h-5 bg-white rounded-full transition-transform mx-1 ${user.fertilityContent ? 'translate-x-5' : ''}`} />
              </button>
            </div>
          </Card>
        )}

        {/* Theme */}
        <Card>
          <p className="text-sm font-medium text-ink mb-3">Theme</p>
          <div className="flex gap-2">
            {(['system', 'light', 'dark'] as const).map((opt) => (
              <button
                key={opt}
                onClick={() => store.updateUser({ theme: opt })}
                className={`flex-1 py-3 rounded-xl text-sm border capitalize ${user.theme === opt ? 'border-primary bg-primary-soft text-primary' : 'border-line text-ink-2'}`}
              >
                {opt}
              </button>
            ))}
          </div>
        </Card>

        {/* App Lock */}
        <Card>
          <p className="text-sm font-medium text-ink mb-2">App lock (PIN)</p>
          <p className="text-xs text-ink-2 mb-3">Set a 4–6 digit PIN to lock Cyclewise on launch.</p>
          <div className="flex gap-2">
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              placeholder="Enter PIN"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
              className="flex-1 px-3 py-3 rounded-xl border border-line bg-surface text-ink text-sm"
            />
            <Button
              size="sm"
              onClick={() => {
                if (pin.length >= 4) {
                  store.setAppLock(true, pin);
                  showToast('App lock enabled');
                  setPin('');
                }
              }}
              disabled={pin.length < 4}
            >
              Set
            </Button>
          </div>
          {store.appLockEnabled && (
            <Button size="sm" variant="danger" onClick={() => { store.setAppLock(false); showToast('App lock disabled'); }} className="w-full mt-2">
              Disable lock
            </Button>
          )}
        </Card>

        {/* Demo data */}
        {user.demoData && (
          <Card className="border-plum/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-ink">Demo data active</p>
                <p className="text-xs text-ink-2 mt-1">You're exploring Maya's demo record.</p>
              </div>
              <Button
                size="sm"
                variant="danger"
                onClick={() => {
                  store.clearDemo();
                  navigate('/');
                }}
              >
                Clear demo
              </Button>
            </div>
          </Card>
        )}

        {/* Data & Privacy */}
        <Card onClick={() => navigate('/privacy')}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield size={18} className="text-ink-2" />
              <span className="text-sm font-medium text-ink">Privacy & data</span>
            </div>
            <ChevronLeft size={18} className="text-ink-2 rotate-180" />
          </div>
        </Card>

        {/* About */}
        <Card>
          <div className="flex items-center gap-2 mb-3">
            <Info size={18} className="text-ink-2" />
            <h2 className="font-serif text-lg text-ink">About</h2>
          </div>
          <p className="text-sm text-ink-2 mb-2">
            Cyclewise helps you track and prepare. It is not a medical device, does not diagnose, and does not replace a clinician. If something worries you, getting checked is always the right call.
          </p>
          <p className="text-xs text-ink-2 mt-3">Instruments used: PBAC (validated blood loss assessment), PSST (premenstrual screening), FIGO (cycle parameter ranges), ACOG (red-flag guidance).</p>
          <p className="text-xs text-ink-2 mt-2">Version 1.0</p>
        </Card>
      </div>
    </div>
  );
}