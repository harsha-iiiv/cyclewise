import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Check, Plus, Minus, MessageSquare, ListChecks, Zap } from 'lucide-react';
import { useStore } from '@/store';
import { Card, Button, Badge } from '@/components/ui';
import { useToast } from '@/components/Toast';
import { parseNaturalLog, hasParsedAnything } from '@/lib/nlParser';
import type { DailyLog, FlowLevel } from '@/types';
import { format, parseISO } from 'date-fns';

const FLOW_LEVELS: FlowLevel[] = ['none', 'spotting', 'light', 'moderate', 'heavy', 'very-heavy'];
const PAIN_LOCATIONS = ['cramps', 'back', 'head', 'breasts', 'other'];
const SYMPTOMS = ['Cramps', 'Back pain', 'Headache', 'Migraine', 'Breast tenderness', 'Bloating', 'Fatigue', 'Nausea', 'Dizziness', 'Acne', 'Spotting', 'Discharge change', 'Irritation/itching', 'Odour change', 'Bowel change', 'Urinary urgency', 'Joint/muscle aches', 'Sleep disturbance'];
const MOODS = ['Calm', 'Happy', 'Sensitive', 'Irritable', 'Anxious', 'Low', 'Emotional/tearful', 'Focused', 'Unmotivated'];
const REMEDIES = ['Heat', 'Ibuprofen', 'Paracetamol/acetaminophen', 'Rest/nap', 'Gentle walk', 'Stretching/yoga', 'Hot shower/bath', 'Herbal tea', 'Magnesium', 'Dark chocolate', 'Less caffeine', 'Early night'];

export default function Log() {
  const [searchParams] = useSearchParams();
  const editDate = searchParams.get('date');
  const [tab, setTab] = useState<'quick' | 'full' | 'nl'>('quick');
  const navigate = useNavigate();
  const store = useStore();
  const { showToast } = useToast();
  const { user, logs, products } = store;

  const today = new Date();
  const targetDate = editDate ?? today.toISOString();
  const targetDateStr = targetDate.slice(0, 10);

  const existing = logs.find((l) => l.date.slice(0, 10) === targetDateStr);
  const [log, setLog] = useState<DailyLog>(
    existing ?? {
      id: crypto.randomUUID(),
      date: targetDate,
      products: [],
      pain: { locations: [], severity: 0 },
      symptoms: [],
      mood: [],
      medications: [],
      remedies: [],
    }
  );

  const [nlText, setNlText] = useState('');
  const [nlParsed, setNlParsed] = useState<ReturnType<typeof parseNaturalLog> | null>(null);

  const save = (updated: DailyLog) => {
    if (existing) {
      store.updateLog(existing.id, updated);
    } else {
      store.addLog(updated);
    }
    setLog(updated);
    showToast('Saved on this device');
  };

  const updateField = (patch: Partial<DailyLog>) => {
    const updated = { ...log, ...patch };
    save(updated);
  };

  const toggleArray = <T,>(arr: T[], item: T): T[] =>
    arr.includes(item) ? arr.filter((x) => x !== item) : [...arr, item];

  const handleNLParse = () => {
    const parsed = parseNaturalLog(nlText);
    setNlParsed(parsed);
  };

  const handleNLConfirm = () => {
    if (!nlParsed || !hasParsedAnything(nlParsed)) return;
    const updated: DailyLog = {
      ...log,
      nlRaw: nlText,
    };
    if (nlParsed.flow) updated.flow = nlParsed.flow;
    if (nlParsed.pain) updated.pain = nlParsed.pain;
    if (nlParsed.symptoms) updated.symptoms = nlParsed.symptoms;
    if (nlParsed.mood) updated.mood = nlParsed.mood;
    if (nlParsed.remedies) updated.remedies = nlParsed.remedies;
    if (nlParsed.sleep) updated.sleep = { hours: nlParsed.sleep.hours, quality: 'okay' };
    if (nlParsed.leak) {
      store.addLeak({
        id: crypto.randomUUID(),
        datetime: new Date().toISOString(),
        activity: 'unknown',
        flow: log.flow ?? 'moderate',
        cycleDay: 1,
      });
    }
    updated.notes = nlText;
    save(updated);
    setNlParsed(null);
    setNlText('');
    navigate('/');
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-6 pb-4">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-ink-2 hover:text-ink">
          <ChevronLeft size={20} /> Back
        </button>
        <h1 className="font-serif text-xl text-ink">
          {editDate ? format(parseISO(targetDate), 'd MMM') : 'Log'}
        </h1>
        <div className="w-20" />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 px-4 mb-4">
        {[
          { key: 'quick', label: 'Quick', icon: Zap },
          { key: 'full', label: 'Full', icon: ListChecks },
          { key: 'nl', label: 'Type it', icon: MessageSquare },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key as any)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
              tab === t.key ? 'bg-primary text-white' : 'bg-surface text-ink-2 border border-line'
            }`}
          >
            <t.icon size={16} />
            {t.label}
          </button>
        ))}
      </div>

      <div className="px-4 pb-4">
        <AnimatePresence mode="wait">
          {tab === 'quick' && (
            <motion.div key="quick" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
              {/* Flow */}
              <Card>
                <p className="text-sm font-medium text-ink mb-3">Flow</p>
                <div className="flex flex-wrap gap-2">
                  {FLOW_LEVELS.map((flow) => (
                    <button
                      key={flow}
                      onClick={() => updateField({ flow })}
                      className={`px-3 py-2 rounded-full text-sm border transition-all ${
                        log.flow === flow ? 'border-primary bg-primary-soft text-primary' : 'border-line text-ink-2 hover:border-primary/30'
                      }`}
                    >
                      {flow === 'none' ? 'None' : flow.charAt(0).toUpperCase() + flow.slice(1).replace('-', ' ')}
                    </button>
                  ))}
                </div>
              </Card>

              {/* Pain */}
              <Card>
                <p className="text-sm font-medium text-ink mb-3">Pain</p>
                <div className="flex flex-wrap gap-2 mb-3">
                  {PAIN_LOCATIONS.map((loc) => (
                    <button
                      key={loc}
                      onClick={() => updateField({
                        pain: { ...log.pain, locations: toggleArray(log.pain.locations, loc) },
                      })}
                      className={`px-3 py-2 rounded-full text-sm border capitalize transition-all ${
                        log.pain.locations.includes(loc) ? 'border-primary bg-primary-soft text-primary' : 'border-line text-ink-2 hover:border-primary/30'
                      }`}
                    >
                      {loc}
                    </button>
                  ))}
                </div>
                {log.pain.locations.length > 0 && (
                  <div>
                    <p className="text-xs text-ink-2 mb-1">Severity: {log.pain.severity}/10</p>
                    <input
                      type="range" min={0} max={10} value={log.pain.severity}
                      onChange={(e) => updateField({ pain: { ...log.pain, severity: Number(e.target.value) } })}
                      className="w-full accent-primary"
                    />
                  </div>
                )}
              </Card>

              {/* Mood */}
              <Card>
                <p className="text-sm font-medium text-ink mb-3">Mood (pick up to 2)</p>
                <div className="flex flex-wrap gap-2">
                  {MOODS.map((mood) => (
                    <button
                      key={mood}
                      onClick={() => {
                        if (log.mood.includes(mood)) {
                          updateField({ mood: log.mood.filter((m) => m !== mood) });
                        } else if (log.mood.length < 2) {
                          updateField({ mood: [...log.mood, mood] });
                        }
                      }}
                      className={`px-3 py-2 rounded-full text-sm border transition-all ${
                        log.mood.includes(mood) ? 'border-plum bg-plum-soft text-plum' : 'border-line text-ink-2 hover:border-primary/30'
                      }`}
                    >
                      {mood}
                    </button>
                  ))}
                </div>
              </Card>

              {/* Energy */}
              <Card>
                <p className="text-sm font-medium text-ink mb-3">Energy</p>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((e) => (
                    <button
                      key={e}
                      onClick={() => updateField({ energy: e as any })}
                      className={`flex-1 py-3 rounded-xl text-sm border transition-all ${
                        log.energy === e ? 'border-primary bg-primary-soft text-primary font-medium' : 'border-line text-ink-2'
                      }`}
                    >
                      {e}
                    </button>
                  ))}
                </div>
              </Card>

              {/* Products */}
              <Card>
                <p className="text-sm font-medium text-ink mb-3">Products used today</p>
                {products.length === 0 ? (
                  <p className="text-sm text-ink-2">Add products in Prepare to track changes.</p>
                ) : (
                  <div className="space-y-2">
                    {products.map((product) => {
                      const used = log.products.find((p) => p.productId === product.id);
                      return (
                        <div key={product.id} className="flex items-center justify-between bg-surface-2 rounded-xl px-3 py-2">
                          <span className="text-sm text-ink">{product.absorbency} {product.type}</span>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                const products = used
                                  ? log.products.map((p) => p.productId === product.id
                                    ? { ...p, changes: Math.max(0, p.changes - 1) }
                                    : p)
                                  : [...log.products, { productId: product.id, changes: 0 }];
                                updateField({ products });
                              }}
                              className="w-8 h-8 rounded-full bg-surface border border-line flex items-center justify-center"
                            >
                              <Minus size={14} />
                            </button>
                            <span className="w-6 text-center text-sm font-medium">{used?.changes ?? 0}</span>
                            <button
                              onClick={() => {
                                const products = used
                                  ? log.products.map((p) => p.productId === product.id
                                    ? { ...p, changes: p.changes + 1, lastChangeAt: new Date().toISOString() }
                                    : p)
                                  : [...log.products, { productId: product.id, changes: 1, lastChangeAt: new Date().toISOString() }];
                                updateField({ products });
                              }}
                              className="w-8 h-8 rounded-full bg-surface border border-line flex items-center justify-center"
                            >
                              <Plus size={14} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </Card>

              {/* Notes */}
              <Card>
                <p className="text-sm font-medium text-ink mb-3">Notes</p>
                <textarea
                  value={log.notes ?? ''}
                  onChange={(e) => setLog({ ...log, notes: e.target.value })}
                  onBlur={() => save(log)}
                  placeholder="Anything else worth remembering..."
                  className="w-full p-3 rounded-xl border border-line bg-surface text-ink text-sm min-h-[80px] resize-none"
                />
              </Card>

              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => navigate('/log/leak')} className="flex-1">
                  Log a leak
                </Button>
                <Button variant="secondary" onClick={() => navigate('/log/pbac')} className="flex-1">
                  Score products (PBAC)
                </Button>
              </div>
            </motion.div>
          )}

          {tab === 'full' && (
            <motion.div key="full" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
              <Card>
                <p className="text-sm font-medium text-ink mb-3">Symptoms</p>
                <div className="flex flex-wrap gap-2">
                  {SYMPTOMS.map((symptom) => {
                    const existing = log.symptoms.find((s) => s.name === symptom);
                    return (
                      <button
                        key={symptom}
                        onClick={() => {
                          if (existing) {
                            updateField({ symptoms: log.symptoms.filter((s) => s.name !== symptom) });
                          } else {
                            updateField({ symptoms: [...log.symptoms, { name: symptom, severity: 2 }] });
                          }
                        }}
                        className={`px-3 py-2 rounded-full text-sm border transition-all ${
                          existing ? 'border-primary bg-primary-soft text-primary' : 'border-line text-ink-2 hover:border-primary/30'
                        }`}
                      >
                        {symptom}
                      </button>
                    );
                  })}
                </div>
              </Card>

              <Card>
                <p className="text-sm font-medium text-ink mb-3">Sleep</p>
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-sm text-ink-2">Hours:</span>
                  <input
                    type="number" min={0} max={12} value={log.sleep?.hours ?? 7}
                    onChange={(e) => updateField({ sleep: { hours: Number(e.target.value), quality: log.sleep?.quality ?? 'okay' } })}
                    className="w-20 px-3 py-2 rounded-xl border border-line bg-surface text-ink text-sm"
                  />
                </div>
                <div className="flex gap-2">
                  {(['poor', 'okay', 'good'] as const).map((q) => (
                    <button
                      key={q}
                      onClick={() => updateField({ sleep: { hours: log.sleep?.hours ?? 7, quality: q } })}
                      className={`px-3 py-2 rounded-full text-sm border capitalize transition-all ${
                        log.sleep?.quality === q ? 'border-primary bg-primary-soft text-primary' : 'border-line text-ink-2'
                      }`}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </Card>

              <Card>
                <p className="text-sm font-medium text-ink mb-3">Remedies tried</p>
                <div className="flex flex-wrap gap-2 mb-3">
                  {REMEDIES.map((remedy) => {
                    const existing = log.remedies.find((r) => r.name === remedy);
                    return (
                      <button
                        key={remedy}
                        onClick={() => {
                          if (existing) {
                            updateField({ remedies: log.remedies.filter((r) => r.name !== remedy) });
                          } else {
                            updateField({ remedies: [...log.remedies, { name: remedy }] });
                          }
                        }}
                        className={`px-3 py-2 rounded-full text-sm border transition-all ${
                          existing ? 'border-sage bg-sage-soft text-sage' : 'border-line text-ink-2 hover:border-primary/30'
                        }`}
                      >
                        {remedy}
                      </button>
                    );
                  })}
                </div>
                {log.remedies.length > 0 && (
                  <div className="space-y-2 mt-3">
                    {log.remedies.map((remedy, i) => (
                      <div key={i} className="flex items-center justify-between bg-surface-2 rounded-xl px-3 py-2">
                        <span className="text-sm text-ink">{remedy.name}</span>
                        <div className="flex gap-1">
                          {(['a-lot', 'a-bit', 'no'] as const).map((helped) => (
                            <button
                              key={helped}
                              onClick={() => {
                                const remedies = log.remedies.map((r, j) =>
                                  j === i ? { ...r, helped } : r
                                );
                                updateField({ remedies });
                              }}
                              className={`px-2.5 py-1 rounded-full text-xs border ${
                                remedy.helped === helped ? 'border-sage bg-sage text-white' : 'border-line text-ink-2'
                              }`}
                            >
                              {helped === 'a-lot' ? 'A lot' : helped === 'a-bit' ? 'A bit' : 'No'}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              <Card>
                <p className="text-sm font-medium text-ink mb-3">Medications</p>
                <input
                  type="text"
                  value={log.medications.join(', ')}
                  onChange={(e) => updateField({ medications: e.target.value.split(',').map((m) => m.trim()).filter(Boolean) })}
                  placeholder="e.g. ibuprofen, paracetamol"
                  className="w-full px-3 py-3 rounded-xl border border-line bg-surface text-ink text-sm"
                />
              </Card>

              <Card>
                <p className="text-sm font-medium text-ink mb-3">Diary</p>
                <textarea
                  value={log.notes ?? ''}
                  onChange={(e) => setLog({ ...log, notes: e.target.value })}
                  onBlur={() => save(log)}
                  placeholder="Write freely..."
                  className="w-full p-3 rounded-xl border border-line bg-surface text-ink text-sm min-h-[100px] resize-none"
                />
              </Card>
            </motion.div>
          )}

          {tab === 'nl' && (
            <motion.div key="nl" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
              <Card>
                <p className="text-sm font-medium text-ink mb-2">Type like you'd text a friend</p>
                <p className="text-xs text-ink-2 mb-3">e.g. "cramps bad today, leaked through a super tampon at work, took ibuprofen, it helped"</p>
                <textarea
                  value={nlText}
                  onChange={(e) => setNlText(e.target.value)}
                  placeholder="Type what happened..."
                  className="w-full p-3 rounded-xl border border-line bg-surface text-ink text-sm min-h-[120px] resize-none"
                />
                <Button onClick={handleNLParse} className="w-full mt-3" disabled={!nlText.trim()}>
                  See what I understood
                </Button>
              </Card>

              {nlParsed && (
                <Card>
                  <p className="text-sm font-medium text-ink mb-3">Here's what I got — tap to remove</p>
                  {!hasParsedAnything(nlParsed) ? (
                    <div>
                      <p className="text-sm text-ink-2 mb-3">I didn't catch that — want the pickers?</p>
                      <div className="flex gap-2">
                        <Button variant="secondary" onClick={() => setTab('quick')}>Use pickers instead</Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {nlParsed.flow && (
                        <div className="flex items-center gap-2">
                          <Badge color="primary">Flow: {nlParsed.flow.replace('-', ' ')}</Badge>
                          <button onClick={() => setNlParsed({ ...nlParsed, flow: undefined })} className="text-xs text-ink-2">remove</button>
                        </div>
                      )}
                      {nlParsed.pain && (
                        <div className="flex items-center gap-2">
                          <Badge color="amber">Pain: {nlParsed.pain.locations.join(', ')} ({nlParsed.pain.severity}/10)</Badge>
                          <button onClick={() => setNlParsed({ ...nlParsed, pain: undefined })} className="text-xs text-ink-2">remove</button>
                        </div>
                      )}
                      {nlParsed.leak && (
                        <div className="flex items-center gap-2">
                          <Badge color="red">Leak logged</Badge>
                          <button onClick={() => setNlParsed({ ...nlParsed, leak: false })} className="text-xs text-ink-2">remove</button>
                        </div>
                      )}
                      {nlParsed.mood?.map((m, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <Badge color="plum">Mood: {m}</Badge>
                        </div>
                      ))}
                      {nlParsed.remedies?.map((r, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <Badge color="sage">{r.name}{r.helped ? ` — ${r.helped === 'a-lot' ? 'helped a lot' : r.helped === 'a-bit' ? 'helped a bit' : "didn't help"}` : ''}</Badge>
                        </div>
                      ))}
                      {nlParsed.products?.map((p, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <Badge color="neutral">{p.mention}{p.count ? ` ×${p.count}` : ''}</Badge>
                        </div>
                      ))}
                      {nlParsed.sleep && (
                        <div className="flex items-center gap-2">
                          <Badge color="neutral">Sleep: {nlParsed.sleep.hours}h</Badge>
                        </div>
                      )}
                      <div className="mt-4 flex gap-2">
                        <Button onClick={handleNLConfirm}>Confirm & save</Button>
                        <Button variant="secondary" onClick={() => setTab('quick')}>Use pickers instead</Button>
                      </div>
                    </div>
                  )}
                </Card>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}