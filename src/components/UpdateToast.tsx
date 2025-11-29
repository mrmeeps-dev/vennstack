import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw } from 'lucide-react';

interface UpdateToastProps {
  isOpen: boolean;
  onRefresh: () => void;
}

export function UpdateToast({ isOpen, onRefresh }: UpdateToastProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="fixed bottom-0 left-0 right-0 z-50 p-4 pointer-events-none"
          style={{ paddingBottom: `max(1rem, env(safe-area-inset-bottom, 1rem))` }}
        >
          <div className="max-w-[428px] mx-auto pointer-events-auto">
            <div className="bg-slate-800 text-white rounded-xl shadow-2xl px-4 py-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-1">
                <RefreshCw size={18} className="flex-shrink-0" />
                <span className="text-sm font-medium">New version available</span>
              </div>
              <button
                onClick={onRefresh}
                className="px-4 py-1.5 bg-white text-slate-800 rounded-lg text-sm font-semibold hover:bg-slate-100 transition-colors flex-shrink-0"
              >
                Refresh
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

