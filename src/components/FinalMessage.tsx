import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Sparkles } from 'lucide-react';

interface FinalMessageProps {
  isOpen: boolean;
  isSuccess: boolean;
  onRevealSolution?: () => void;
}

export function FinalMessage({ isOpen, isSuccess, onRevealSolution }: FinalMessageProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
          />
          
          {/* Message Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', duration: 0.5, bounce: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div className="w-full max-w-[428px] pointer-events-auto">
              {isSuccess ? (
                /* Success Message */
                <div className="bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl p-6 sm:p-8 border border-white/50">
                  <div className="text-center">
                    {/* Icon */}
                    <motion.div
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: 'spring', delay: 0.2, bounce: 0.5 }}
                      className="mx-auto mb-4 w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-lg"
                    >
                      <Trophy className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                    </motion.div>

                    {/* Title */}
                    <motion.h2
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3"
                    >
                      You did it! 🎉
                    </motion.h2>

                    {/* Message */}
                    <motion.p
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                      className="text-base sm:text-lg text-gray-600 mb-6 leading-relaxed px-2"
                    >
                      You successfully sorted all the items! Great job sticking with it and seeing it through. 🎊
                    </motion.p>

                    {/* Decorative sparkles */}
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.5 }}
                      className="flex justify-center gap-2 mb-4"
                    >
                      {[0, 1, 2].map((i) => (
                        <motion.div
                          key={i}
                          animate={{
                            y: [0, -10, 0],
                            rotate: [0, 10, -10, 0],
                          }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            delay: i * 0.2,
                            ease: 'easeInOut',
                          }}
                        >
                          <Sparkles className="w-5 h-5 text-yellow-400" />
                        </motion.div>
                      ))}
                    </motion.div>
                  </div>
                </div>
              ) : (
                /* Failure Message */
                <div className="bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl p-6 sm:p-8 border border-white/50">
                  <div className="text-center">
                    {/* Icon */}
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', delay: 0.2, bounce: 0.5 }}
                      className="mx-auto mb-4 w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-amber-400 to-orange-400 flex items-center justify-center shadow-lg"
                    >
                      <Sparkles className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                    </motion.div>

                    {/* Title */}
                    <motion.h2
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3"
                    >
                      Nice try! 💪
                    </motion.h2>

                    {/* Message */}
                    <motion.p
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                      className="text-base sm:text-lg text-gray-600 mb-6 leading-relaxed px-2"
                    >
                      You gave it your best shot! Learning comes from trying. Would you like to see the solution to learn how it works?
                    </motion.p>

                    {/* Button */}
                    {onRevealSolution && (
                      <motion.button
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.5 }}
                        onClick={onRevealSolution}
                        className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]"
                      >
                        Show Me the Solution
                      </motion.button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

