import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, ChevronRight, ChevronLeft, Check } from 'lucide-react';
import { useStore } from '@/store';
import { Button } from '@/components/ui';
import type { User, LifeStage } from '@/types';

const AGE_BANDS = ['Under 13', '13-17', '18-25', '26-35', '36-45', '46-55', '55+'];
const PRIORITIES = [
  { id: 'never-leak', label: 'Never be caught leaking' },
  { id: 'know-change', label: 'Know when to change' },
  { id: 'track-pain', label: 'Track pain & symptoms' },
  { id: 'understand-patterns', label: 'Understand my patterns' },
  { id: 'heavy-flow', label: 'Heavy-flow help' },
  { id: 'prepare-trips', label: 'Prepare for trips & big days' },
  { id: 'doctor-record', label: 'Keep a record for my doctor' },
  { id: 'privacy-first', label: 'Privacy above everything' },
];
const CONTEXT_OPTIONS = [
  'Nothing', 'Pill', 'Hormonal IUD', 'Copper IUD', 'Implant', 'Injection',
  'Patch', 'Ring', 'Barrier', 'Recently stopped contraception',
  'Planning to start or change soon', 'Gave birth in the last year',
  'Breastfeeding', 'Periods have changed noticeably in the last year',
  'Periods stopped for 3+ months', 'None of these',
];

export default function Onboarding() {
  const navigate = useNavigate();
  const store = useStore();
  const [step, setStep] = useState(0);
  const [ageBand, setAgeBand] = useState('');
  const [self, setSelf] = useState('');
  const [bleeding, setBleeding] = useState('period');
  const [anatomy, setAnatomy] = useState<'medical' | 'soft'>('medical');
  const [lastPeriod, setLastPeriod] = useState('');
  const [lastPeriodApprox, setLastPeriodApprox] = useState('');
  const [usualCycle, setUsualCycle] = useState(28);
  const [cycleVaries, setCycleVaries] = useState(false);
  const [cycleUnknown, setCycleUnknown] = useState(false);
  const [usualPeriod, setUsualPeriod] = useState(5);
  const [usualFlow, setUsualFlow] = useState('');
  const [context, setContext] = useState<string[]>([]);
  const [priorities, setPriorities] = useState<string[]>([]);
  const [remindersOn, setRemindersOn] = useState(false);
  const [appLockPin, setAppLockPin] = useState('');

  const canProceed = () => {
    if (step === 1) return ageBand !== '';
    return true;
  };

  const handleExploreDemo = () => {
    store.initDemo();
    navigate('/');
  };

  const handleFinish = () => {
    const user: User = {
      id: crypto.randomUUID(),
      ageBand,
      terminology: { self, bleeding, anatomy },
      priorities,
      fertilityContent: false,
      createdAt: new Date().toISOString(),
      demoData: false,
      onboarded: true,
      weekStart: 'monday',
      theme: 'system',
    };
    store.setUser(user);
    store.setStage('reproductive', 'onboarding');
    store.addConsent('onboarding-choices', 'given');
    store.addConsent('data-on-device-only', 'given');
    if (remindersOn) {
      store.addConsent('notifications', 'given');
      store.setNotificationsEnabled(true);
    } else {
      store.addConsent('notifications', 'declined');
    }
    if (appLockPin) {
      store.setAppLock(true, appLockPin);
    }
    navigate('/');
  };

  const handleStartFresh = () => {
    store.startFresh();
    setStep(1);
  };

  const togglePriority = (id: string) => {
    setPriorities((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : prev.length < 3 ? [...prev, id] : prev
    );
  };

  const toggleContext = (opt: string) => {
    setContext((prev) =>
      prev.includes(opt) ? prev.filter((c) => c !== opt) : [...prev, opt]
    );
  };

  const suggestedMode = (): { stage: LifeStage; reason: string } => {
    if (ageBand === '13-17' || ageBand === 'Under 13') {
      return { stage: 'teen', reason: 'Teen Mode fits best — education-first, no fertility content, school-day tools.' };
    }
    if (context.includes('Gave birth in the last year')) {
      return { stage: 'postpartum', reason: 'Postpartum Return View fits best — tracks bleeding after birth separately and forecasts your cycle return.' };
    }
    if (context.includes('Recently stopped contraception') || context.includes('Planning to start or change soon') ||
        ['Pill', 'Hormonal IUD', 'Copper IUD', 'Implant', 'Injection', 'Patch', 'Ring'].some((m) => context.includes(m))) {
      return { stage: 'contraception-transition', reason: 'Contraception Transition Mode fits best — tracks bleeding changes and helps you know what is expected for your method.' };
    }
    return { stage: 'reproductive', reason: 'Reproductive Years mode fits best — the full toolkit for managing your period.' };
  };

  if (step === 0) {
    return (
      <div className="min-h-screen bg-bg flex flex-col items-center justify-center px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center mx-auto mb-6">
            <span className="font-serif text-3xl text-white">C</span>
          </div>
          <h1 className="font-serif text-3xl text-ink mb-3">Cyclewise</h1>
          <p className="text-lg text-ink-2 mb-2 leading-relaxed">
            Cyclewise manages your period — it doesn't just predict it.
          </p>
          <p className="text-sm text-ink-2 mb-8">
            Your data stays on this device. No account. No ads. Ever.
          </p>
          <div className="space-y-3">
            <Button onClick={handleExploreDemo} size="lg" className="w-full">
              Explore with demo data
            </Button>
            <Button onClick={handleStartFresh} variant="secondary" size="lg" className="w-full">
              Start fresh
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  const steps = [
    // Step 1: Age band
    <StepWrapper key="1" step={step} total={7} onBack={() => setStep(step - 1)}>
      <StepTitle>How old are you?</StepTitle>
      <StepWhy>Normal cycle patterns are different at different ages — this stops us flagging what's normal for you.</StepWhy>
      <div className="space-y-2">
        {AGE_BANDS.map((band) => (
          <button
            key={band}
            onClick={() => setAgeBand(band)}
            className={`w-full text-left px-4 py-3 rounded-xl border transition-all ${
              ageBand === band ? 'border-primary bg-primary-soft text-primary' : 'border-line bg-surface text-ink hover:border-primary/30'
            }`}
          >
            {band}
            {ageBand === band && <Check className="inline ml-2" size={18} />}
          </button>
        ))}
      </div>
    </StepWrapper>,

    // Step 2: Terminology
    <StepWrapper key="2" step={step} total={7} onBack={() => setStep(step - 1)}>
      <StepTitle>Words that feel right</StepTitle>
      <StepWhy>These words appear everywhere — on your home screen, in reminders, and in your clinician report.</StepWhy>
      <label className="block text-sm text-ink-2 mb-2">Call yourself (optional)</label>
      <div className="flex gap-2 mb-4">
        {['Woman', 'Person', ''].map((opt) => (
          <Chip key={opt} selected={self === opt} onClick={() => setSelf(opt)}>
            {opt || 'No label'}
          </Chip>
        ))}
      </div>
      <label className="block text-sm text-ink-2 mb-2">Call bleeding</label>
      <div className="flex gap-2 mb-4">
        {['period', 'bleed'].map((opt) => (
          <Chip key={opt} selected={bleeding === opt} onClick={() => setBleeding(opt)}>
            {opt.charAt(0).toUpperCase() + opt.slice(1)}
          </Chip>
        ))}
      </div>
      <label className="block text-sm text-ink-2 mb-2">Anatomy terms</label>
      <div className="flex gap-2">
        <Chip selected={anatomy === 'medical'} onClick={() => setAnatomy('medical')}>Standard medical</Chip>
        <Chip selected={anatomy === 'soft'} onClick={() => setAnatomy('soft')}>Softer wording</Chip>
      </div>
    </StepWrapper>,

    // Step 3: Last period & cycle pattern
    <StepWrapper key="3" step={step} total={7} onBack={() => setStep(step - 1)}>
      <StepTitle>Your starting point</StepTitle>
      <StepWhy>This is your starting point. Cyclewise replaces guesses with your real pattern within 2–3 cycles — and tells you honestly how sure it is until then.</StepWhy>
      <label className="block text-sm text-ink-2 mb-2">First day of your last {bleeding}</label>
      <input
        type="date"
        value={lastPeriod}
        onChange={(e) => setLastPeriod(e.target.value)}
        className="w-full px-4 py-3 rounded-xl border border-line bg-surface text-ink mb-2"
      />
      {!lastPeriod && (
        <div className="flex flex-wrap gap-2 mb-4">
          {['Within the last week', '2–4 weeks ago', 'Over a month ago', "Haven't had one for 3+ months"].map((opt) => (
            <Chip key={opt} selected={lastPeriodApprox === opt} onClick={() => setLastPeriodApprox(opt)}>
              {opt}
            </Chip>
          ))}
        </div>
      )}
      <label className="block text-sm text-ink-2 mb-2 mt-4">Usual cycle length</label>
      {cycleUnknown ? (
        <p className="text-ink-2 text-sm">No problem — we'll learn your pattern from your logs.</p>
      ) : (
        <div className="flex items-center gap-3 mb-2">
          <input
            type="range" min={20} max={45} value={usualCycle}
            onChange={(e) => setUsualCycle(Number(e.target.value))}
            className="flex-1 accent-primary"
          />
          <span className="text-ink font-medium w-16 text-right">{usualCycle} days</span>
        </div>
      )}
      <div className="flex gap-2 mb-4">
        <Chip selected={cycleVaries} onClick={() => { setCycleVaries(!cycleVaries); setCycleUnknown(false); }}>It varies a lot</Chip>
        <Chip selected={cycleUnknown} onClick={() => { setCycleUnknown(!cycleUnknown); setCycleVaries(false); }}>I don't know yet</Chip>
      </div>
      <label className="block text-sm text-ink-2 mb-2">Usual {bleeding} length: {usualPeriod} days</label>
      <input
        type="range" min={2} max={10} value={usualPeriod}
        onChange={(e) => setUsualPeriod(Number(e.target.value))}
        className="w-full accent-primary mb-4"
      />
      <label className="block text-sm text-ink-2 mb-2">Flow usually</label>
      <div className="flex flex-wrap gap-2">
        {['Light', 'Moderate', 'Heavy', 'Very heavy', 'Varies'].map((opt) => (
          <Chip key={opt} selected={usualFlow === opt} onClick={() => setUsualFlow(opt)}>{opt}</Chip>
        ))}
      </div>
    </StepWrapper>,

    // Step 4: Context
    <StepWrapper key="4" step={step} total={7} onBack={() => setStep(step - 1)}>
      <StepTitle>What's going on right now?</StepTitle>
      <StepWhy>This helps us suggest the right tools. All optional — skip what doesn't apply.</StepWhy>
      <div className="flex flex-wrap gap-2">
        {CONTEXT_OPTIONS.map((opt) => (
          <Chip key={opt} selected={context.includes(opt)} onClick={() => toggleContext(opt)}>
            {opt}
          </Chip>
        ))}
      </div>
    </StepWrapper>,

    // Step 5: Priorities
    <StepWrapper key="5" step={step} total={7} onBack={() => setStep(step - 1)}>
      <StepTitle>What matters most to you?</StepTitle>
      <StepWhy>Pick up to 3. Your home screen is arranged around these.</StepWhy>
      <div className="space-y-2">
        {PRIORITIES.map((p) => (
          <button
            key={p.id}
            onClick={() => togglePriority(p.id)}
            className={`w-full text-left px-4 py-3 rounded-xl border transition-all flex items-center justify-between ${
              priorities.includes(p.id) ? 'border-primary bg-primary-soft text-primary' : 'border-line bg-surface text-ink hover:border-primary/30'
            }`}
          >
            {p.label}
            {priorities.includes(p.id) && <Check size={18} />}
          </button>
        ))}
      </div>
      <p className="text-xs text-ink-2 mt-3">{priorities.length}/3 selected</p>
    </StepWrapper>,

    // Step 6: Suggested mode
    <StepWrapper key="6" step={step} total={7} onBack={() => setStep(step - 1)}>
      <StepTitle>Your suggested mode</StepTitle>
      <StepWhy>Based on what you shared, here's what fits. You can change this anytime.</StepWhy>
      <div className="bg-primary-soft rounded-card p-4 border border-primary/20">
        <p className="text-ink mb-2">
          <span className="font-serif text-lg">
            {suggestedMode().stage === 'teen' ? 'Teen Mode' :
             suggestedMode().stage === 'postpartum' ? 'Postpartum Return View' :
             suggestedMode().stage === 'contraception-transition' ? 'Contraception Transition Mode' :
             'Reproductive Years'}
          </span>
        </p>
        <p className="text-sm text-ink-2">{suggestedMode().reason}</p>
      </div>
      <div className="space-y-3 mt-4">
        <Button onClick={() => { store.setStage(suggestedMode().stage, 'suggested-accepted'); setStep(7); }} className="w-full">
          Use this mode
        </Button>
        <Button variant="secondary" onClick={() => navigate('/modes')} className="w-full">
          See other modes
        </Button>
      </div>
    </StepWrapper>,

    // Step 7: Privacy
    <StepWrapper key="7" step={step} total={7} onBack={() => setStep(step - 1)}>
      <StepTitle>Privacy, in plain sight</StepTitle>
      <StepWhy>You control everything. These are set to the most private choice by default.</StepWhy>
      <div className="space-y-4">
        <div className="bg-sage-soft rounded-xl p-4 border border-sage/20">
          <div className="flex items-center gap-2 mb-1">
            <Shield size={18} className="text-sage" />
            <span className="font-medium text-ink">Data stays on this device only</span>
          </div>
          <p className="text-sm text-ink-2">This version stores everything on this device. There is no Cyclewise server with your data.</p>
          <span className="inline-block mt-2 text-xs text-sage font-medium">ON — locked as the only option</span>
        </div>

        <div className="bg-surface rounded-xl p-4 border border-line">
          <div className="flex items-center justify-between">
            <span className="font-medium text-ink">Reminders on this device</span>
            <Toggle on={remindersOn} onClick={() => setRemindersOn(!remindersOn)} />
          </div>
          <p className="text-sm text-ink-2 mt-1">Get change reminders and briefings. If on, we'll ask for notification permission.</p>
        </div>

        <div className="bg-surface rounded-xl p-4 border border-line">
          <span className="font-medium text-ink">App lock (PIN)</span>
          <p className="text-sm text-ink-2 mt-1">Set a 4–6 digit PIN to unlock Cyclewise. Optional.</p>
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            placeholder="Set PIN (optional)"
            value={appLockPin}
            onChange={(e) => setAppLockPin(e.target.value.replace(/\D/g, ''))}
            className="w-full mt-2 px-4 py-3 rounded-xl border border-line bg-surface text-ink"
          />
        </div>
      </div>
      <Button onClick={handleFinish} size="lg" className="w-full mt-6">
        Finish
      </Button>
    </StepWrapper>,
  ];

  return (
    <div className="min-h-screen bg-bg max-w-app mx-auto px-4 py-6">
      <AnimatePresence mode="wait">
        {steps[Math.min(step, steps.length - 1)]}
      </AnimatePresence>
      {step > 0 && step < 6 && (
        <div className="flex justify-between mt-6">
          <Button variant="ghost" onClick={() => setStep(step - 1)}>
            <ChevronLeft className="inline mr-1" size={18} /> Back
          </Button>
          {step < 5 && (
            <Button variant="ghost" onClick={() => setStep(step + 1)} disabled={!canProceed()}>
              Skip <ChevronRight className="inline ml-1" size={18} />
            </Button>
          )}
          {step === 5 && (
            <Button onClick={() => setStep(step + 1)} disabled={priorities.length === 0 && true}>
              Continue <ChevronRight className="inline ml-1" size={18} />
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

function StepWrapper({ children, step, total, onBack }: { children: React.ReactNode; step: number; total: number; onBack: () => void }) {
  return (
    <motion.div
      key={step}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex items-center gap-2 mb-6">
        <div className="flex-1 h-1 bg-line rounded-full">
          <div
            className="h-1 bg-primary rounded-full transition-all"
            style={{ width: `${(step / total) * 100}%` }}
          />
        </div>
        <span className="text-xs text-ink-2">{step}/{total}</span>
      </div>
      {children}
    </motion.div>
  );
}

function StepTitle({ children }: { children: React.ReactNode }) {
  return <h1 className="font-serif text-2xl text-ink mb-2">{children}</h1>;
}

function StepWhy({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-ink-2 mb-6 leading-relaxed italic">{children}</p>;
}

function Chip({ children, selected, onClick }: { children: React.ReactNode; selected: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-2 rounded-full text-sm border transition-all ${
        selected ? 'border-primary bg-primary-soft text-primary' : 'border-line bg-surface text-ink hover:border-primary/30'
      }`}
    >
      {children}
    </button>
  );
}

function Toggle({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`w-12 h-7 rounded-full transition-colors ${on ? 'bg-sage' : 'bg-line'}`}
      aria-label="Toggle"
    >
      <div className={`w-5 h-5 bg-white rounded-full transition-transform mx-1 ${on ? 'translate-x-5' : ''}`} />
    </button>
  );
}