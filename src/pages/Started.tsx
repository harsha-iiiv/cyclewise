import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ChevronRight, Heart, Bell } from 'lucide-react';
import { useStore } from '@/store';
import { Card, Button } from '@/components/ui';

export default function Started() {
  const navigate = useNavigate();
  const store = useStore();
  const [step, setStep] = useState(0);
  const [flow, setFlow] = useState('');
  const [hasProduct, setHasProduct] = useState<boolean | null>(null);
  const [wantReminder, setWantReminder] = useState(false);

  const handleFinish = () => {
    if (flow) {
      const today = new Date().toISOString();
      store.addCycle({ id: crypto.randomUUID(), startDate: today, source: 'logged' });
      store.addLog({
        id: crypto.randomUUID(),
        date: today,
        flow: flow as any,
        bleedingType: 'period',
        products: [],
        pain: { locations: [], severity: 0 },
        symptoms: [],
        mood: [],
        medications: [],
        remedies: [],
      });
    }
    if (wantReminder) {
      store.addConsent('notifications', 'given');
      store.setNotificationsEnabled(true);
    }
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-bg px-4 py-6">
      <AnimatePresence mode="wait">
        {step === 0 && (
          <motion.div key="0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center pt-8">
            <Heart size={32} className="text-primary mx-auto mb-4" />
            <h1 className="font-serif text-2xl text-ink mb-3">You're okay.</h1>
            <p className="text-ink-2 mb-8">Let's sort this in 30 seconds.</p>
            <Button onClick={() => setStep(1)} size="lg" className="w-full">Let's go</Button>
          </motion.div>
        )}

        {step === 1 && (
          <motion.div key="1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <h1 className="font-serif text-xl text-ink mb-4">What's the flow like right now?</h1>
            <div className="space-y-2">
              {['light', 'moderate', 'heavy', 'very-heavy'].map((f) => (
                <button
                  key={f}
                  onClick={() => { setFlow(f); setStep(2); }}
                  className={`w-full px-4 py-4 rounded-xl border text-left text-lg ${flow === f ? 'border-primary bg-primary-soft text-primary' : 'border-line bg-surface text-ink'}`}
                  style={{ minHeight: '48px' }}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1).replace('-', ' ')}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div key="2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <h1 className="font-serif text-xl text-ink mb-4">Do you have a product with you?</h1>
            <div className="space-y-3">
              <button onClick={() => { setHasProduct(true); setStep(4); }} className="w-full px-4 py-4 rounded-xl bg-primary text-white text-lg" style={{ minHeight: '48px' }}>
                Yes
              </button>
              <button onClick={() => { setHasProduct(false); setStep(3); }} className="w-full px-4 py-4 rounded-xl bg-surface-2 text-ink text-lg border border-line" style={{ minHeight: '48px' }}>
                No
              </button>
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div key="3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <h1 className="font-serif text-xl text-ink mb-4">Here's what to do</h1>
            <Card>
              <div className="space-y-3 text-sm text-ink-2">
                <div className="flex items-start gap-2">
                  <Check size={16} className="text-sage flex-shrink-0 mt-0.5" />
                  <p>Ask a friend, colleague, or classmate for a pad or tissue</p>
                </div>
                <div className="flex items-start gap-2">
                  <Check size={16} className="text-sage flex-shrink-0 mt-0.5" />
                  <p>At school: go to the nurse or reception — they have supplies</p>
                </div>
                <div className="flex items-start gap-2">
                  <Check size={16} className="text-sage flex-shrink-0 mt-0.5" />
                  <p>At work: try the nearest shop or vending machine</p>
                </div>
                <div className="flex items-start gap-2">
                  <Check size={16} className="text-sage flex-shrink-0 mt-0.5" />
                  <p>Folded tissue works as a bridge until you get a pad</p>
                </div>
              </div>
            </Card>
            <p className="text-xs text-ink-2 mt-3 italic">For next time: keep a small kit in your bag — Cyclewise helps you build one.</p>
            <Button onClick={() => setStep(4)} className="w-full mt-4">Continue</Button>
          </motion.div>
        )}

        {step === 4 && (
          <motion.div key="4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <h1 className="font-serif text-xl text-ink mb-4">Want a reminder to change in ~3 hours?</h1>
            <div className="space-y-3">
              <button onClick={() => { setWantReminder(true); setStep(5); }} className="w-full px-4 py-4 rounded-xl bg-primary text-white text-lg flex items-center justify-center gap-2" style={{ minHeight: '48px' }}>
                <Bell size={20} /> Yes, remind me
              </button>
              <button onClick={() => { setWantReminder(false); setStep(5); }} className="w-full px-4 py-4 rounded-xl bg-surface-2 text-ink text-lg border border-line" style={{ minHeight: '48px' }}>
                No thanks
              </button>
            </div>
          </motion.div>
        )}

        {step === 5 && (
          <motion.div key="5" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center pt-8">
            <Check size={32} className="text-sage mx-auto mb-4" />
            <h1 className="font-serif text-2xl text-ink mb-3">Done</h1>
            <p className="text-ink-2 mb-8">You're set. Take care of yourself today.</p>
            <Button onClick={handleFinish} size="lg" className="w-full">Back to Today</Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}