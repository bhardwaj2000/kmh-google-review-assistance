import { AnimatePresence, motion } from 'motion/react';
import { CheckCircle2, Info } from 'lucide-react';

export default function Toast({ toast }) {
  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          key={toast.id}
          initial={{ opacity: 0, y: 18, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.96 }}
          transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
          role="status"
          aria-live="polite"
          className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 w-[calc(100%-2rem)] max-w-sm pointer-events-none"
        >
          <div className="flex items-center gap-2.5 rounded-xl bg-[#111827] px-4 py-3 text-sm font-medium text-white shadow-xl shadow-slate-900/20">
            {toast.variant === 'info' ? (
              <Info className="h-4 w-4 shrink-0 text-sky-300" aria-hidden="true" />
            ) : (
              <CheckCircle2
                className="h-4 w-4 shrink-0 text-emerald-400"
                aria-hidden="true"
              />
            )}
            <span className="leading-snug">{toast.message}</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
