import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Package, ShoppingBag, Wallet, Droplet, Plus, Minus, Check } from 'lucide-react';
import { useStore } from '@/store';
import { Card, Button, Badge } from '@/components/ui';
import { useToast } from '@/components/Toast';
import { checkRestock, costPerCycle, paybackCalculator, getUsagePerCycle } from '@/lib/inventory';
import { predictNextPeriod } from '@/lib/prediction';

export default function Prepare() {
  const navigate = useNavigate();
  const store = useStore();
  const { showToast } = useToast();
  const { products, logs, purchases, cycles, kits } = store;

  const prediction = predictNextPeriod(cycles);
  const restockAlerts = checkRestock(products, logs, prediction?.centreDate ?? null);
  const perCycle = costPerCycle(purchases, cycles);
  const cupProduct = products.find((p) => p.type === 'Menstrual cup');
  const payback = cupProduct ? paybackCalculator(cupProduct.unitCost ?? 30, perCycle) : null;

  const [showAddProduct, setShowAddProduct] = useState(false);
  const [newProduct, setNewProduct] = useState({ type: 'Pads', absorbency: 'regular', stock: 0, maxWearHours: 6, unitCost: 0 });

  const handleStockChange = (id: string, delta: number) => {
    const product = products.find((p) => p.id === id);
    if (!product) return;
    store.updateProduct(id, { stock: Math.max(0, product.stock + delta) });
  };

  const handleAddProduct = () => {
    store.addProduct({
      id: crypto.randomUUID(),
      type: newProduct.type,
      absorbency: newProduct.absorbency,
      stock: newProduct.stock,
      lowStockAt: 5,
      maxWearHours: newProduct.maxWearHours,
      unitCost: newProduct.unitCost,
      reusable: newProduct.type === 'Menstrual cup' || newProduct.type === 'Period underwear',
    });
    setShowAddProduct(false);
    setNewProduct({ type: 'Pads', absorbency: 'regular', stock: 0, maxWearHours: 6, unitCost: 0 });
    showToast('Product added');
  };

  const productTypes = ['Pads', 'Tampons', 'Menstrual cup', 'Disc', 'Period underwear', 'Custom'];

  return (
    <div className="min-h-screen">
      <div className="flex items-center justify-between px-4 pt-6 pb-4">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-ink-2 hover:text-ink">
          <ChevronLeft size={20} /> Back
        </button>
        <h1 className="font-serif text-xl text-ink">Prepare</h1>
        <div className="w-20" />
      </div>

      <div className="px-4 space-y-4">
        {/* Restock alerts */}
        {restockAlerts.length > 0 && (
          <Card className="border-amber/30 bg-amber-soft/30">
            <div className="flex items-center gap-2 mb-2">
              <ShoppingBag size={18} className="text-amber" />
              <h2 className="font-serif text-lg text-ink">Shopping list</h2>
            </div>
            <div className="space-y-2">
              {restockAlerts.map((alert) => (
                <div key={alert.productId} className="flex items-start justify-between bg-surface rounded-xl p-3 border border-line">
                  <div>
                    <p className="text-sm font-medium text-ink">{alert.productName}</p>
                    <p className="text-xs text-ink-2 mt-1">{alert.message}</p>
                  </div>
                  {alert.urgent && <Badge color="red">Out of stock</Badge>}
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Products */}
        <Card>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Package size={18} className="text-ink-2" />
              <h2 className="font-serif text-lg text-ink">My products</h2>
            </div>
            <Button size="sm" variant="secondary" onClick={() => setShowAddProduct(!showAddProduct)}>
              <Plus size={14} className="inline" /> Add
            </Button>
          </div>

          {showAddProduct && (
            <div className="bg-surface-2 rounded-xl p-3 mb-3 space-y-3">
              <select
                value={newProduct.type}
                onChange={(e) => setNewProduct({ ...newProduct, type: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-line bg-surface text-ink text-sm"
              >
                {productTypes.map((t) => <option key={t}>{t}</option>)}
              </select>
              <div className="flex gap-2">
                <input
                  type="text" placeholder="Absorbency/size"
                  value={newProduct.absorbency}
                  onChange={(e) => setNewProduct({ ...newProduct, absorbency: e.target.value })}
                  className="flex-1 px-3 py-2 rounded-lg border border-line bg-surface text-ink text-sm"
                />
                <input
                  type="number" placeholder="Stock"
                  value={newProduct.stock}
                  onChange={(e) => setNewProduct({ ...newProduct, stock: Number(e.target.value) })}
                  className="w-24 px-3 py-2 rounded-lg border border-line bg-surface text-ink text-sm"
                />
              </div>
              <div className="flex gap-2">
                <input
                  type="number" placeholder="Cost per unit"
                  value={newProduct.unitCost}
                  onChange={(e) => setNewProduct({ ...newProduct, unitCost: Number(e.target.value) })}
                  className="flex-1 px-3 py-2 rounded-lg border border-line bg-surface text-ink text-sm"
                />
                <input
                  type="number" placeholder="Max wear (h)"
                  value={newProduct.maxWearHours}
                  onChange={(e) => setNewProduct({ ...newProduct, maxWearHours: Number(e.target.value) })}
                  className="w-24 px-3 py-2 rounded-lg border border-line bg-surface text-ink text-sm"
                />
              </div>
              <Button size="sm" onClick={handleAddProduct} className="w-full">Add product</Button>
            </div>
          )}

          {products.length === 0 ? (
            <p className="text-sm text-ink-2">Add products you use to track inventory, get restock alerts, and see your cost per cycle.</p>
          ) : (
            <div className="space-y-2">
              {products.map((product) => {
                const usage = getUsagePerCycle(logs, product.id);
                return (
                  <div key={product.id} className="bg-surface-2 rounded-xl px-3 py-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-ink">
                        {product.absorbency} {product.type}
                        {product.brand && ` · ${product.brand}`}
                      </span>
                      {product.reusable && <Badge color="plum">Reusable</Badge>}
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-ink-2">Stock:</span>
                        <div className="flex items-center gap-1">
                          <button onClick={() => handleStockChange(product.id, -1)} className="w-7 h-7 rounded-full bg-surface border border-line flex items-center justify-center">
                            <Minus size={12} />
                          </button>
                          <span className="text-sm font-medium text-ink w-8 text-center">{product.stock}</span>
                          <button onClick={() => handleStockChange(product.id, 1)} className="w-7 h-7 rounded-full bg-surface border border-line flex items-center justify-center">
                            <Plus size={12} />
                          </button>
                        </div>
                      </div>
                      {usage > 0 && <span className="text-xs text-ink-2">~{usage}/cycle</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Kits */}
        <Card>
          <div className="flex items-center gap-2 mb-3">
            <Package size={18} className="text-ink-2" />
            <h2 className="font-serif text-lg text-ink">My kits</h2>
          </div>
          {kits.length === 0 ? (
            <p className="text-sm text-ink-2">Build kits for different bags — everyday, travel, gym.</p>
          ) : (
            <div className="space-y-2">
              {kits.map((kit) => {
                const totalItems = kit.items.length;
                const packed = kit.items.filter((i) => i.packed).length;
                const completeness = totalItems > 0 ? Math.round((packed / totalItems) * 100) : 0;
                return (
                  <div key={kit.id} className="bg-surface-2 rounded-xl px-3 py-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-ink">{kit.name}</span>
                      <Badge color={completeness === 100 ? 'sage' : 'amber'}>{completeness}% packed</Badge>
                    </div>
                    <p className="text-xs text-ink-2">{totalItems} items · {packed} packed</p>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Cost */}
        <Card>
          <div className="flex items-center gap-2 mb-3">
            <Wallet size={18} className="text-ink-2" />
            <h2 className="font-serif text-lg text-ink">Cost</h2>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className="bg-surface-2 rounded-xl p-3 text-center">
              <p className="text-xs text-ink-2">Per cycle</p>
              <p className="text-xl font-serif text-ink">${perCycle.toFixed(2)}</p>
            </div>
            <div className="bg-surface-2 rounded-xl p-3 text-center">
              <p className="text-xs text-ink-2">Per year (est.)</p>
              <p className="text-xl font-serif text-ink">${(perCycle * 13).toFixed(2)}</p>
            </div>
          </div>
          {payback && (
            <div className="bg-plum-soft/30 rounded-xl p-3 border border-plum/20">
              <p className="text-sm text-ink font-medium mb-1">Reusable payback calculator</p>
              <p className="text-xs text-ink-2">{payback.message}</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}