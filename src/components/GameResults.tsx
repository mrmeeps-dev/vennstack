import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, AlertCircle, X, Eye } from 'lucide-react';
import { Zone, Item } from '../types/game';

interface GameResultsProps {
  isOpen: boolean;
  gameState: 'success' | 'failed' | null;
  categories: {
    left: string;
    right: string;
  };
  userState: Map<string, Zone>;
  correctState: Item[];
  totalItems: number;
  attemptsUsed: number;
  onClose: () => void;
  onBackToMenu: () => void;
  onReviewBoard: () => void;
}

export function GameResults({
  isOpen,
  gameState,
  categories,
  userState,
  correctState,
  totalItems,
  attemptsUsed,
  onClose,
  onBackToMenu,
  onReviewBoard,
}: GameResultsProps) {
  if (!isOpen || !gameState) {
    return null;
  }

  const isWin = gameState === 'success';

  // Organize correct items by zone
  const leftItems = correctState.filter(item => item.zone === 'left');
  const rightItems = correctState.filter(item => item.zone === 'right');
  const bothItems = correctState.filter(item => item.zone === 'both');
  const outsideItems = correctState.filter(item => item.zone === 'outside');

  // Find errors: items that were placed incorrectly
  // Check all items - if user placed it in a different zone than correct, it's an error
  const errors: Array<{
    item: Item;
    userZone: Zone;
    correctZone: Zone;
  }> = [];

  if (!isWin) {
    correctState.forEach(item => {
      const userZone = userState.get(item.id);
      // Error if: user placed it somewhere, but it's in the wrong zone
      if (userZone && userZone !== item.zone) {
        errors.push({
          item,
          userZone,
          correctZone: item.zone,
        });
      }
    });
  }

  const getZoneName = (zone: Zone): string => {
    switch (zone) {
      case 'left':
        return categories.left;
      case 'right':
        return categories.right;
      case 'both':
        return 'Both';
      case 'outside':
        return 'Neither';
      default:
        return zone;
    }
  };

  const getZoneColor = (zone: Zone): string => {
    switch (zone) {
      case 'left':
        return 'bg-[#14B8A6] text-white';
      case 'right':
        return 'bg-[#A855F7] text-white';
      case 'both':
        return 'bg-[#60A5FA] text-white';
      case 'outside':
        return 'bg-[#94A3B8] text-white';
      default:
        return 'bg-slate-500 text-white';
    }
  };

  const getZoneBorderColor = (zone: Zone): string => {
    switch (zone) {
      case 'left':
        return 'border-[#14B8A6] text-[#14B8A6]';
      case 'right':
        return 'border-[#A855F7] text-[#A855F7]';
      case 'both':
        return 'border-[#60A5FA] text-[#60A5FA]';
      case 'outside':
        return 'border-[#94A3B8] text-[#94A3B8]';
      default:
        return 'border-slate-500 text-slate-500';
    }
  };

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={onClose}
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', duration: 0.5, delay: 0.1 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[85vh] overflow-hidden pointer-events-auto flex flex-col">
              {/* Fixed Header */}
              <div
                className={`px-4 sm:px-6 py-4 sm:py-5 border-b flex-shrink-0 ${
                  isWin
                      ? 'bg-[#B2EBF2]'
                    : 'bg-gradient-to-r from-orange-400 to-slate-500'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                    <motion.div
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: 'spring', delay: 0.3, duration: 0.5 }}
                      className="flex-shrink-0"
                    >
                      {isWin ? (
                        <Trophy className={`w-6 h-6 sm:w-8 sm:h-8 ${isWin ? 'text-slate-800' : 'text-white'}`} />
                      ) : (
                        <AlertCircle className={`w-6 h-6 sm:w-8 sm:h-8 ${isWin ? 'text-slate-800' : 'text-white'}`} />
                      )}
                    </motion.div>
                    <div className="min-w-0 flex-1">
                      <motion.h2
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 }}
                        className={`text-xl sm:text-2xl font-bold truncate ${isWin ? 'text-slate-800' : 'text-white'}`}
                      >
                        {isWin ? 'Puzzle Solved!' : 'Not Quite...'}
                      </motion.h2>
                      <motion.p
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5 }}
                        className={`text-xs sm:text-sm mt-0.5 ${isWin ? 'text-slate-700' : 'text-white/90'}`}
                      >
                        Here is the correct classification.
                      </motion.p>
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    className="p-2 rounded-lg hover:bg-white/20 transition-colors text-white flex-shrink-0 ml-2"
                    aria-label="Close"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              {/* Scrollable Body */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                {/* Solution Matrix */}
                <div className="mb-6">
                  <h3 className="text-base sm:text-lg font-semibold text-slate-800 mb-4">
                    Correct Solution
                  </h3>
                  
                  {/* Desktop: 3 Column Grid */}
                  <div className="hidden md:grid grid-cols-3 gap-4">
                    {/* Category A Column */}
                    <div className="space-y-3">
                      <div
                        className={`${getZoneColor('left')} px-3 py-2 rounded-lg text-center text-sm font-semibold`}
                      >
                        {categories.left}
                      </div>
                      <div className="space-y-2">
                        {leftItems.length > 0 ? (
                          leftItems.map((item) => (
                            <motion.div
                              key={item.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.6 + leftItems.indexOf(item) * 0.05 }}
                              className="bg-white border-2 border-[#14B8A6] rounded-lg px-3 py-2 text-sm font-medium text-[#14B8A6] text-center"
                            >
                              {item.text}
                            </motion.div>
                          ))
                        ) : (
                          <div className="text-xs text-slate-400 text-center py-4">
                            (None)
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Both Column */}
                    <div className="space-y-3">
                      <div
                        className={`${getZoneColor('both')} px-3 py-2 rounded-lg text-center text-sm font-semibold`}
                      >
                        Both
                      </div>
                      <div className="space-y-2">
                        {bothItems.length > 0 ? (
                          bothItems.map((item) => (
                            <motion.div
                              key={item.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.6 + bothItems.indexOf(item) * 0.05 }}
                              className="bg-white border-2 border-[#60A5FA] rounded-lg px-3 py-2 text-sm font-medium text-[#60A5FA] text-center"
                            >
                              {item.text}
                            </motion.div>
                          ))
                        ) : (
                          <div className="text-xs text-slate-400 text-center py-4">
                            (None)
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Category B Column */}
                    <div className="space-y-3">
                      <div
                        className={`${getZoneColor('right')} px-3 py-2 rounded-lg text-center text-sm font-semibold`}
                      >
                        {categories.right}
                      </div>
                      <div className="space-y-2">
                        {rightItems.length > 0 ? (
                          rightItems.map((item) => (
                            <motion.div
                              key={item.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.6 + rightItems.indexOf(item) * 0.05 }}
                              className="bg-white border-2 border-[#A855F7] rounded-lg px-3 py-2 text-sm font-medium text-[#A855F7] text-center"
                            >
                              {item.text}
                            </motion.div>
                          ))
                        ) : (
                          <div className="text-xs text-slate-400 text-center py-4">
                            (None)
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Mobile: Vertical Stack with Compact List View */}
                  <div className="flex flex-col gap-6 md:hidden">
                    {/* Category A */}
                    <div className="space-y-2">
                      <div
                        className={`${getZoneColor('left')} px-3 py-2 rounded-lg text-center text-xs font-semibold`}
                      >
                        {categories.left}
                      </div>
                      <div className="space-y-1.5">
                        {leftItems.length > 0 ? (
                          leftItems.map((item) => (
                            <motion.div
                              key={item.id}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.6 + leftItems.indexOf(item) * 0.05 }}
                              className={`bg-white border-l-4 ${getZoneBorderColor('left')} rounded px-3 py-2 text-sm font-medium`}
                            >
                              {item.text}
                            </motion.div>
                          ))
                        ) : (
                          <div className="text-xs text-slate-400 px-3 py-2">
                            (None)
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Both */}
                    <div className="space-y-2">
                      <div
                        className={`${getZoneColor('both')} px-3 py-2 rounded-lg text-center text-xs font-semibold`}
                      >
                        Both
                      </div>
                      <div className="space-y-1.5">
                        {bothItems.length > 0 ? (
                          bothItems.map((item) => (
                            <motion.div
                              key={item.id}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.6 + bothItems.indexOf(item) * 0.05 }}
                              className={`bg-white border-l-4 ${getZoneBorderColor('both')} rounded px-3 py-2 text-sm font-medium`}
                            >
                              {item.text}
                            </motion.div>
                          ))
                        ) : (
                          <div className="text-xs text-slate-400 px-3 py-2">
                            (None)
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Category B */}
                    <div className="space-y-2">
                      <div
                        className={`${getZoneColor('right')} px-3 py-2 rounded-lg text-center text-xs font-semibold`}
                      >
                        {categories.right}
                      </div>
                      <div className="space-y-1.5">
                        {rightItems.length > 0 ? (
                          rightItems.map((item) => (
                            <motion.div
                              key={item.id}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.6 + rightItems.indexOf(item) * 0.05 }}
                              className={`bg-white border-l-4 ${getZoneBorderColor('right')} rounded px-3 py-2 text-sm font-medium`}
                            >
                              {item.text}
                            </motion.div>
                          ))
                        ) : (
                          <div className="text-xs text-slate-400 px-3 py-2">
                            (None)
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Outside/Neither items - Both Desktop and Mobile */}
                  {outsideItems.length > 0 && (
                    <div className="mt-4 md:mt-6">
                      <div
                        className={`${getZoneColor('outside')} px-3 py-2 rounded-lg text-center text-xs sm:text-sm font-semibold mb-2`}
                      >
                        Neither
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {outsideItems.map((item) => (
                          <motion.div
                            key={item.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.6 + outsideItems.indexOf(item) * 0.05 }}
                            className="bg-white border-2 border-[#94A3B8] rounded-lg px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-[#94A3B8]"
                          >
                            {item.text}
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Error Report - Only show if not perfect score */}
                {!isWin && errors.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                    className="bg-red-50 border border-red-100 rounded-lg p-4"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                      <h3 className="text-base sm:text-lg font-semibold text-red-800">
                        Corrections
                      </h3>
                    </div>
                    <div className="space-y-2">
                      {errors.map((error, index) => (
                        <motion.div
                          key={error.item.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.9 + index * 0.05 }}
                          className="text-sm text-red-700 bg-white rounded px-3 py-2 border border-red-200"
                        >
                          You placed <span className="font-semibold">'{error.item.text}'</span> in{' '}
                          <span className="font-semibold">{getZoneName(error.userZone)}</span>, but it belongs in{' '}
                          <span className="font-semibold">{getZoneName(error.correctZone)}</span>.
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Fixed Footer */}
              <div className="px-4 sm:px-6 py-4 border-t bg-slate-50 flex flex-col sm:flex-row gap-3 flex-shrink-0">
                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1 }}
                  onClick={onReviewBoard}
                  className="w-full sm:flex-1 px-4 py-2.5 rounded-lg border-2 border-slate-300 text-slate-700 font-semibold hover:bg-slate-100 transition-colors flex items-center justify-center gap-2"
                >
                  <Eye size={18} />
                  Review Board
                </motion.button>
                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.1 }}
                  onClick={onBackToMenu}
                  className={`w-full sm:flex-1 px-4 py-2.5 rounded-lg font-semibold transition-colors ${
                    isWin
                      ? 'bg-[#B2EBF2] hover:bg-[#80DEEA] text-slate-800'
                      : 'bg-slate-600 hover:bg-slate-700 text-white'
                  }`}
                >
                  {isWin ? 'Back to Menu' : 'Back to Menu'}
                </motion.button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
}
