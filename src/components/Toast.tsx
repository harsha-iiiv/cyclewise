import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Undo2 } from 'lucide-react';

interface Toast {
  id: string;
  message: string;
  undoAction?: () => void;
}

const ToastContext = createContext<{
  showToast: (message: string, undoAction?: () => void) => void;
} | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, undoAction?: () => void) => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { id, message, undoAction }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-24 left-0 right-0 z-50 flex flex-col items-center gap-2 px-4 pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.2 }}
              className="bg-ink text-bg rounded-xl px-4 py-3 flex items-center gap-3 pointer-events-auto shadow-lg"
            >
              <CheckCircle2 size={18} className="text-sage" />
              <span className="text-sm">{toast.message}</span>
              {toast.undoAction && (
                <button
                  onClick={() => {
                    toast.undoAction!();
                    setToasts((prev) => prev.filter((t) => t.id !== toast.id));
                  }}
                  className="text-primary-soft hover:text-white transition-colors flex items-center gap-1 text-sm font-medium"
                >
                  <Undo2 size={14} />
                  Undo
                </button>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}