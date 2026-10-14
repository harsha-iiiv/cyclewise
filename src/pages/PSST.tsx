import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Check } from 'lucide-react';
import { useStore } from '@/store';
import { Card, Button, Badge } from '@/components/ui';
import { useToast } from '@/components/Toast';
import { PSST_QUESTIONS, scorePSST, psstResultWording } from '@/lib/psst';

export default function PSST() {
  const navigate = useNavigate();
  const store = useStore();
  const { showToast } = useToast();
  const [answers, setAnswers] = useState<number[]>(new Array(19).fill(0));
  const [submitted, setSubmitted] = useState(false);
  const [pattern, setPattern] = useState<'screen-positive' | 'moderate-pattern' | 'below-threshold'>('below-threshold');

  const handleAnswer = (i: number, val: number) => {
    setAnswers(answers.map((a, j) => j === i ? val : a));
  };

  const handleSubmit = () => {
    const result = scorePSST(answers);
    setPattern(result);
    setSubmitted(true);
    store.addPSST({
      id: crypto.randomUUID(),
      takenAt: new Date().toISOString(),
      answers,
      pattern: result,
    });
    showToast('PSST saved');
  };

  const labels = ['Not at all', 'Mild', 'Moderate', 'Severe'];
  const colors = ['text-ink-2', 'text-sage', 'text-amber', 'text-red'];

  return (
    <div className="min-h-screen">
      <div className="flex items-center justify-between px-4 pt-6 pb-4">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-ink-2 hover:text-ink">
          <ChevronLeft size={20} /> Back
        </button>
        <h1 className="font-serif text-xl text-ink">PSST Screening</h1>
        <div className="w-20" />
      </div>

      <div className="px-4 space-y-4">
        {!submitted ? (
          <>
            <Card>
              <p className="text-sm text-ink-2 mb-2">
                Rate each symptom for the week before your last period. This is a <strong>screening tool, not a diagnosis</strong> — it can over-identify. The reliable next step is tracking daily ratings for 2 cycles and taking that record to a clinician.
              </p>
            </Card>

            <div className="space-y-2">
              {PSST_QUESTIONS.map((q, i) => (
                <Card key={i} padding="sm">
                  <p className="text-sm text-ink mb-2">{i + 1}. {q}</p>
                  <div className="grid grid-cols-4 gap-1">
                    {labels.map((label, val) => (
                      <button
                        key={val}
                        onClick={() => handleAnswer(i, val)}
                        className={`py-2 rounded-lg text-xs border ${answers[i] === val ? 'border-primary bg-primary-soft text-primary font-medium' : 'border-line text-ink-2'}`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </Card>
              ))}
            </div>

            <Button onClick={handleSubmit} size="lg" className="w-full">See results</Button>
          </>
        ) : (
          <>
            <Card padding="lg">
              <div className="text-center mb-4">
                <Badge color={pattern === 'screen-positive' ? 'amber' : pattern === 'moderate-pattern' ? 'amber' : 'sage'}>
                  {pattern === 'screen-positive' ? 'Screen-positive' : pattern === 'moderate-pattern' ? 'Moderate pattern' : 'Below threshold'}
                </Badge>
              </div>
              <p className="text-sm text-ink-2 leading-relaxed">{psstResultWording(pattern)}</p>
            </Card>

            {pattern !== 'below-threshold' && (
              <Card>
                <h2 className="font-serif text-lg text-ink mb-3">Prospective tracking</h2>
                <p className="text-sm text-ink-2 mb-3">
                  The most reliable next step is tracking daily ratings for 2 cycles. Cyclewise can do this with you — a 20-second daily check during your cycle. After 2 cycles, your clinician report will include the premenstrual vs postmenstrual pattern.
                </p>
                <Button
                  variant="secondary"
                  onClick={() => {
                    store.addConsent('prospective-tracking', 'given');
                    showToast("Prospective tracking enabled — you'll see a daily rating on Today");
                    navigate('/');
                  }}
                  className="w-full"
                >
                  Start prospective tracking
                </Button>
              </Card>
            )}

            <Button onClick={() => navigate('/care')} variant="secondary" className="w-full">
              Back to Care
            </Button>
          </>
        )}
      </div>
    </div>
  );
}