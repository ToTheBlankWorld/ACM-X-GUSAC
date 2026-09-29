import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

/**
 * Accessible modal dialog: esc to close, backdrop click, aria-modal.
 */
export default function Modal({ open, onClose, title, children, footer }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && onClose?.();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-stone-900/45"
            onClick={onClose}
            aria-hidden
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title || 'Dialog'}
            initial={{ opacity: 0, scale: 0.96, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 6 }}
            transition={{ type: 'spring', stiffness: 340, damping: 28 }}
            className="relative w-full max-w-md rounded-2xl bg-white shadow-lift"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-stone-200">
              <h2 className="font-semibold text-stone-900">{title}</h2>
              <button onClick={onClose} aria-label="Close dialog"
                className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100">
                <svg viewBox="0 0 20 20" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                  <path d="m5 5 10 10M15 5 5 15" strokeLinecap="round" />
                </svg>
              </button>
            </div>
            <div className="px-5 py-4">{children}</div>
            {footer && <div className="px-5 py-4 border-t border-stone-200 bg-stone-50 rounded-b-2xl">{footer}</div>}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
