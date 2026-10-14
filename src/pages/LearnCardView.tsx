import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, BookOpen, Check } from 'lucide-react';
import { useStore } from '@/store';
import { Card, Button } from '@/components/ui';
import { learnCards } from '@/data/learnCards';

export default function LearnCardView() {
  const navigate = useNavigate();
  const { id } = useParams();
  const store = useStore();

  const card = learnCards.find((c) => c.id === id);

  if (!card) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-ink-2">Card not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="flex items-center justify-between px-4 pt-6 pb-4">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-ink-2 hover:text-ink">
          <ChevronLeft size={20} /> Back
        </button>
        <h1 className="font-serif text-xl text-ink">Learn</h1>
        <div className="w-20" />
      </div>

      <div className="px-4">
        <Card padding="lg">
          <div className="flex items-center gap-2 mb-4">
            <BookOpen size={20} className="text-plum" />
            <span className="text-xs text-ink-2">30-second read</span>
          </div>
          <h2 className="font-serif text-xl text-ink mb-3">{card.title}</h2>
          <p className="text-sm text-ink-2 leading-relaxed mb-4">{card.body}</p>
          <p className="text-xs text-plum italic mb-6">{card.evidenceLine}</p>
          <Button onClick={() => navigate(-1)} className="w-full">
            <Check size={16} className="inline mr-1" /> {card.action}
          </Button>
        </Card>
      </div>
    </div>
  );
}