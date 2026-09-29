import { createContext, useCallback, useContext, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

/**
 * Lightweight toast notifications (no external toast dependency).
 * Variants: success | error | info
 */
const ToastContext = createContext(null);
let nextId = 1;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef({});

  const dismiss = useCallback((id) => {
    setToasts((list) => list.filter((t) => t.id !== id));
    clearTimeout(timers.current[id]);
    delete timers.current[id];
  }, []);

  const toast = useCallback((message, variant = 'success', duration = 3500) => {
    const id = nextId++;
    setToasts((list) => [...list.slice(-3), { id, message, variant }]);
    timers.current[id] = setTimeout(() => dismiss(id), duration);
  }, [dismiss]);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="pointer-events-none fixed bottom-5 right-5 z-[80] grid gap-2 w-[min(22rem,calc(100vw-2.5rem))]">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 12, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              className={`pointer-events-auto flex items-start gap-2.5 rounded-xl border px-4 py-3 text-sm shadow-lift bg-white ${
                t.variant === 'error' ? 'border-red-200' : t.variant === 'info' ? 'border-stone-200' : 'border-teal-200'
              }`}
              role="status"
            >
              <span aria-hidden className={`mt-0.5 ${t.variant === 'error' ? 'text-red-500' : t.variant === 'info' ? 'text-stone-400' : 'text-teal-600'}`}>
                {t.variant === 'error' ? '✕' : t.variant === 'info' ? 'ℹ' : '✓'}
              </span>
              <p className="text-stone-700 leading-snug">{t.message}</p>
              <button
                onClick={() => dismiss(t.id)}
                aria-label="Dismiss notification"
                className="ml-auto text-stone-400 hover:text-stone-600"
              >
                ×
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
