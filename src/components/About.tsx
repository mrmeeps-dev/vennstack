import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';

interface AboutProps {
  isOpen: boolean;
  onBack: () => void;
}

export function About({
  isOpen,
  onBack,
}: AboutProps) {
  const handleBackdropClick = () => {
    onBack();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/20 z-40"
            onClick={handleBackdropClick}
          />
          
          {/* About Overlay */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="fixed inset-0 z-50 flex items-start justify-center pt-12 px-4 pointer-events-none"
          >
            <div
              className="bg-white rounded-2xl shadow-xl w-full max-w-sm pointer-events-auto max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center gap-2.5 px-4 py-3 border-b border-slate-100 sticky top-0 bg-white z-10">
                <button
                  onClick={onBack}
                  className="p-1 rounded-lg hover:bg-slate-100 transition-colors text-slate-600"
                  aria-label="Back to menu"
                >
                  <ArrowLeft size={18} />
                </button>
                <h2 className="text-base font-semibold text-slate-900 flex-1">About</h2>
                <div className="w-7"></div> {/* Spacer for balance */}
              </div>

              {/* Content */}
              <div className="p-4 space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 mb-2">VennStack</h3>
                  <p className="text-sm text-slate-700 leading-relaxed">
                    A daily puzzle game where you sort items into categories using Venn diagram logic. Each day brings a new challenge to solve.
                  </p>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-slate-900 mb-2">How It Works</h3>
                  <p className="text-sm text-slate-700 leading-relaxed">
                    Items belong to one category, both categories, or neither. Your goal is to figure out what the categories are by sorting everything correctly.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

