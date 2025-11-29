import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Move, CheckCircle2, Trophy } from 'lucide-react';

interface HowToPlayProps {
  isOpen: boolean;
  onBack: () => void;
}

export function HowToPlay({
  isOpen,
  onBack,
}: HowToPlayProps) {
  const handleBackdropClick = () => {
    onBack();
  };

  const steps = [
    {
      title: 'Drag & Drop',
      description: 'Drag items from the word pool into the correct zones.',
      icon: <Move size={20} />,
    },
    {
      title: 'Check Answer',
      description: 'Click "Check Answer" to see which items are correct.',
      icon: <CheckCircle2 size={20} />,
    },
    {
      title: 'Complete',
      description: 'Lock all items correctly to win!',
      icon: <Trophy size={20} />,
    },
  ];

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
          
          {/* How to Play Overlay */}
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
                <h2 className="text-base font-semibold text-slate-900 flex-1">How to Play</h2>
                <div className="w-7"></div> {/* Spacer for balance */}
              </div>

              {/* Content */}
              <div className="p-4 space-y-4">
                <p className="text-sm text-slate-700 leading-relaxed">
                  Figure out the two categories by sorting items into the correct zones. Items can belong to one category, both, or neither.
                </p>

                {/* Steps */}
                <div className="space-y-2">
                  {steps.map((step, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-3 p-2.5 rounded-lg border border-slate-200 bg-white"
                    >
                      <div className="flex-shrink-0 p-1.5 bg-slate-100 rounded-md text-slate-700">
                        {step.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-slate-900 mb-0.5">
                          {step.title}
                        </div>
                        <div className="text-xs text-slate-600">
                          {step.description}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

