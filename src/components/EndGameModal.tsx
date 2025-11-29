import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, XCircle } from 'lucide-react';

interface EndGameModalProps {
  isOpen: boolean;
  gameState: 'success' | 'failed' | null;
  attemptsUsed: number;
  maxAttempts: number;
  correctCount: number;
  totalItems: number;
  incorrectCount: number;
  onClose?: () => void;
}

export function EndGameModal({
  isOpen,
  gameState,
  attemptsUsed,
  maxAttempts,
  correctCount,
  totalItems,
  incorrectCount,
  onClose,
}: EndGameModalProps) {
  if (!isOpen || !gameState) {
    return null;
  }

  const isSuccess = gameState === 'success';

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50"
            onClick={onClose}
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', duration: 0.5 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 relative overflow-hidden">
              {/* Decorative background elements */}
              {isSuccess && (
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#86EFAC]/20 rounded-full -mr-16 -mt-16" />
              )}
              {!isSuccess && (
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#FFB3BA]/20 rounded-full -mr-16 -mt-16" />
              )}

              <div className="relative z-10">
                {/* Icon */}
                <div className="flex justify-center mb-6">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', delay: 0.2 }}
                    className={`w-20 h-20 rounded-full flex items-center justify-center ${
                      isSuccess
                        ? 'bg-[#86EFAC] text-green-700'
                        : 'bg-[#FFB3BA] text-red-700'
                    }`}
                  >
                    {isSuccess ? (
                      <Trophy size={40} />
                    ) : (
                      <XCircle size={40} />
                    )}
                  </motion.div>
                </div>

                {/* Title */}
                <motion.h2
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-3xl font-bold text-center mb-4 text-[#333333]"
                >
                  {isSuccess ? 'Congratulations!' : 'Solution Revealed'}
                </motion.h2>

                {/* Message */}
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-center text-slate-600 mb-6"
                >
                  {isSuccess
                    ? `You successfully sorted all ${totalItems} items!`
                    : `Here's the solution:`}
                </motion.p>

                {/* Stats */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="bg-slate-50 rounded-2xl p-4 mb-6 space-y-2"
                >
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Attempts:</span>
                    <span className="font-semibold text-[#333333]">
                      {attemptsUsed} / {maxAttempts}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Correct Items:</span>
                    <span className="font-semibold text-green-600">
                      {correctCount} / {totalItems}
                    </span>
                  </div>
                  {!isSuccess && incorrectCount > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600">Items to Fix:</span>
                      <span className="font-semibold text-red-600">
                        {incorrectCount}
                      </span>
                    </div>
                  )}
                </motion.div>

                {/* Close button */}
                {onClose && (
                  <motion.button
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    onClick={onClose}
                    className={`w-full py-3 rounded-full font-semibold transition-colors ${
                      isSuccess
                        ? 'bg-[#B2EBF2] hover:bg-[#80DEEA] text-slate-800'
                        : 'bg-slate-600 hover:bg-slate-700 text-white'
                    }`}
                  >
                    {isSuccess ? 'Done for Today' : 'View Solution'}
                  </motion.button>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

