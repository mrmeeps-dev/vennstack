import { motion, AnimatePresence } from 'framer-motion';

interface LossSummarySheetProps {
  isOpen: boolean;
  totalItems: number;
  correctFound: number;
  attemptsUsed: number;
  maxAttempts: number;
  shareGrid: string;
  countdownText: string;
  onClose: () => void;
  onShare: () => void;
  onOpenArchive?: () => void;
}

export function LossSummarySheet({
  isOpen,
  totalItems,
  correctFound,
  attemptsUsed,
  maxAttempts,
  shareGrid,
  countdownText,
  onClose,
  onShare,
  onOpenArchive,
}: LossSummarySheetProps) {
  let headline = 'Better luck next time!';

  if (totalItems > 0) {
    if (correctFound === 0) {
      headline = 'Better luck next time!';
    } else if (correctFound === totalItems - 1) {
      // e.g. 9/10, 7/8 – truly one away
      headline = 'So close!';
    } else if (correctFound >= Math.ceil(totalItems / 2)) {
      headline = 'Nice try!';
    } else {
      headline = "I bet you'll get it tomorrow!";
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 260, damping: 30 }}
            className="fixed inset-x-0 bottom-0 z-50"
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.2}
            onDragEnd={(_, info) => {
              if (info.offset.y > 80) {
                onClose();
              }
            }}
          >
            <div className="mx-auto w-full max-w-[428px] rounded-t-3xl bg-white shadow-2xl border-t border-slate-200/80 px-4 pt-3 pb-5">
              {/* Drag handle */}
              <div className="flex justify-center mb-3">
                <div className="w-10 h-1 rounded-full bg-slate-300/80" />
              </div>

              {/* Verdict */}
              <div className="text-center mb-2.5">
                <h2 className="text-lg font-semibold text-slate-900 mb-1">
                  {headline}
                </h2>
              </div>

              {/* Results visualization – sits immediately under the verdict */}
              <div className="bg-slate-50 rounded-2xl px-4 py-3 mb-3">
                <div className="mb-2.5">
                  <span className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
                    Your Results ({attemptsUsed} out of {maxAttempts} attempts)
                  </span>
                </div>
                {/* Visual result indicators - green for correct, red for incorrect */}
                <div className="flex items-center justify-center gap-1.5 flex-wrap">
                  {Array.from({ length: totalItems }, (_, i) => {
                    const isCorrect = i < correctFound;
                    return (
                      <div
                        key={i}
                        className={`
                          flex-1 h-2 rounded-full transition-all duration-300 min-w-[8px]
                          ${isCorrect 
                            ? 'bg-[#22C55E]' 
                            : 'bg-[#EF4444]'
                          }
                        `}
                        aria-label={isCorrect ? `Item ${i + 1} correct` : `Item ${i + 1} incorrect`}
                      />
                    );
                  })}
                </div>
              </div>

              {/* Primary actions */}
              <div className="mb-3 space-y-2">
                {onOpenArchive && (
                  <button
                    type="button"
                    onClick={onOpenArchive}
                    className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-slate-300 text-slate-800 hover:bg-slate-50 transition-colors"
                  >
                    Play more in the archive
                  </button>
                )}
                <button
                  type="button"
                  onClick={onShare}
                  className="w-full text-xs font-semibold px-3 py-2 rounded-xl bg-[#B2EBF2] hover:bg-[#80DEEA] text-slate-800 transition-colors"
                >
                  Share Result
                </button>
              </div>

              {/* Countdown */}
              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span>Next level in</span>
                <span className="font-mono font-semibold text-slate-800">
                  {countdownText}
                </span>
              </div>
            </div>
          </motion.div>
      )}
    </AnimatePresence>
  );
}


