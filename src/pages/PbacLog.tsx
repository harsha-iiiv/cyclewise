import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Plus, Minus } from 'lucide-react';
import { useStore } from '@/store';
import { Card, Button } from '@/components/ui';
import { useToast } from '@/components/Toast';
import { scorePbacForProductUse, PBAC_HEAVY_THRESHOLD } from '@/lib/pbac';
import type { ProductUse } from '@/types';

export default function PbacLog() {
  const navigate = useNavigate();
  const store = useStore();
  const { showToast } = useToast();
  const { products, logs } = store;

  const today = new Date();
  const todayLog = logs.find((l) => l.date.slice(0, 10) === today.toISOString().slice(0, 10));

  const [selectedProduct, setSelectedProduct] = useState('');
  const [entries, setEntries] = useState<{
    saturation: 'light' | 'moderate' | 'full';
    clotsSmall: number;
    clotsLarge: number;
    flooding: number;
  }[]>([]);

  const addEntry = () => {
    setEntries([...entries, { saturation: 'moderate', clotsSmall: 0, clotsLarge: 0, flooding: 0 }]);
  };

  const updateEntry = (i: number, patch: Partial<typeof entries[0]>) => {
    setEntries(entries.map((e, j) => j === i ? { ...e, ...patch } : e));
  };

  const handleSave = () => {
    if (!selectedProduct || entries.length === 0 || !todayLog) return;
    const product = products.find((p) => p.id === selectedProduct);
    if (!product) return;

    const existingProducts = [...todayLog.products];
    const idx = existingProducts.findIndex((p) => p.productId === selectedProduct);
    const pbacData = entries.map((e) => ({ ...e }));

    if (idx >= 0) {
      existingProducts[idx] = {
        ...existingProducts[idx],
        pbac: [...(existingProducts[idx].pbac ?? []), ...pbacData],
      };
    } else {
      existingProducts.push({ productId: selectedProduct, changes: 1, pbac: pbacData });
    }

    store.updateLog(todayLog.id, { products: existingProducts });
    showToast('PBAC scored — real evidence for your clinician');
    navigate('/log');
  };

  // Calculate running score
  const product = products.find((p) => p.id === selectedProduct);
  const testPU: ProductUse = { productId: selectedProduct, changes: entries.length, pbac: entries };
  const runningScore = product ? scorePbacForProductUse(testPU, product.type).daily : 0;

  return (
    <div className="min-h-screen">
      <div className="flex items-center justify-between px-4 pt-6 pb-4">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-ink-2 hover:text-ink">
          <ChevronLeft size={20} /> Back
        </button>
        <h1 className="font-serif text-xl text-ink">PBAC scoring</h1>
        <div className="w-20" />
      </div>

      <div className="px-4 space-y-4">
        <Card>
          <p className="text-sm text-ink-2 mb-3">Score each product change by how soaked it was. This takes about 20 seconds and gives you real evidence to show a clinician.</p>
          <p className="text-sm font-medium text-ink mb-2">Select product</p>
          <select
            value={selectedProduct}
            onChange={(e) => setSelectedProduct(e.target.value)}
            className="w-full px-3 py-3 rounded-xl border border-line bg-surface text-ink text-sm"
          >
            <option value="">Choose a product...</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>{p.absorbency} {p.type}</option>
            ))}
          </select>
        </Card>

        {selectedProduct && (
          <>
            {entries.map((entry, i) => (
              <Card key={i}>
                <p className="text-sm font-medium text-ink mb-3">Change {i + 1}</p>
                <p className="text-xs text-ink-2 mb-2">Saturation:</p>
                <div className="flex gap-2 mb-3">
                  {(['light', 'moderate', 'full'] as const).map((sat) => (
                    <button
                      key={sat}
                      onClick={() => updateEntry(i, { saturation: sat })}
                      className={`flex-1 py-3 rounded-xl text-sm border capitalize ${entry.saturation === sat ? 'border-primary bg-primary-soft text-primary' : 'border-line text-ink-2'}`}
                    >
                      {sat === 'light' ? 'Lightly soaked' : sat === 'moderate' ? 'Moderately' : 'Fully soaked'}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <p className="text-xs text-ink-2 mb-1">Small clots</p>
                    <div className="flex items-center gap-1">
                      <button onClick={() => updateEntry(i, { clotsSmall: Math.max(0, entry.clotsSmall - 1) })} className="w-8 h-8 rounded-full bg-surface-2 border border-line flex items-center justify-center">
                        <Minus size={12} />
                      </button>
                      <span className="text-sm w-6 text-center">{entry.clotsSmall}</span>
                      <button onClick={() => updateEntry(i, { clotsSmall: entry.clotsSmall + 1 })} className="w-8 h-8 rounded-full bg-surface-2 border border-line flex items-center justify-center">
                        <Plus size={12} />
                      </button>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-ink-2 mb-1">Large clots</p>
                    <div className="flex items-center gap-1">
                      <button onClick={() => updateEntry(i, { clotsLarge: Math.max(0, entry.clotsLarge - 1) })} className="w-8 h-8 rounded-full bg-surface-2 border border-line flex items-center justify-center">
                        <Minus size={12} />
                      </button>
                      <span className="text-sm w-6 text-center">{entry.clotsLarge}</span>
                      <button onClick={() => updateEntry(i, { clotsLarge: entry.clotsLarge + 1 })} className="w-8 h-8 rounded-full bg-surface-2 border border-line flex items-center justify-center">
                        <Plus size={12} />
                      </button>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-ink-2 mb-1">Flooding</p>
                    <div className="flex items-center gap-1">
                      <button onClick={() => updateEntry(i, { flooding: Math.max(0, entry.flooding - 1) })} className="w-8 h-8 rounded-full bg-surface-2 border border-line flex items-center justify-center">
                        <Minus size={12} />
                      </button>
                      <span className="text-sm w-6 text-center">{entry.flooding}</span>
                      <button onClick={() => updateEntry(i, { flooding: entry.flooding + 1 })} className="w-8 h-8 rounded-full bg-surface-2 border border-line flex items-center justify-center">
                        <Plus size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}

            <Button variant="secondary" onClick={addEntry} className="w-full">
              <Plus size={16} className="inline mr-1" /> Add another change
            </Button>

            {entries.length > 0 && (
              <Card className="bg-primary-soft/30">
                <p className="text-sm text-ink-2">Today's score so far</p>
                <p className="text-3xl font-serif text-primary">{runningScore}</p>
                {runningScore >= PBAC_HEAVY_THRESHOLD && (
                  <p className="text-xs text-ink-2 mt-2">
                    Scores of 100 or more are in the range clinicians use for heavy menstrual bleeding. This is useful evidence — consider sharing your report with a clinician.
                  </p>
                )}
              </Card>
            )}

            <Button onClick={handleSave} className="w-full" disabled={entries.length === 0}>
              Save PBAC scores
            </Button>
          </>
        )}
      </div>
    </div>
  );
}