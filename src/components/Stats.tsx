import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Target, TrendingUp, Award, Trophy, Flame, BarChart3, CheckCircle2 } from 'lucide-react';
import { useStats } from '../hooks/useStats';

interface StatsProps {
  isOpen: boolean;
  onBack: () => void;
}

export function Stats({
  isOpen,
  onBack,
}: StatsProps) {
  const { stats } = useStats();

  const handleBackdropClick = () => {
    onBack();
  };

  const completionRate = stats.totalPuzzlesPlayed > 0
    ? Math.round((stats.totalPuzzlesCompleted / stats.totalPuzzlesPlayed) * 100)
    : 0;
  
  const averageAttempts = stats.totalPuzzlesCompleted > 0
    ? (stats.averageAttemptsPerPuzzle).toFixed(1)
    : '0.0';

  const StatCard = ({ icon, label, value, subtitle }: { icon: React.ReactNode; label: string; value: string | number; subtitle?: string }) => (
    <div className="bg-white rounded-lg border border-slate-200 p-3 flex items-center gap-2.5">
      <div className="flex-shrink-0 p-1.5 bg-slate-100 rounded-md text-slate-700">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[10px] text-slate-500 mb-0.5 leading-tight">{label}</div>
        <div className="text-lg font-bold text-slate-900 leading-tight">{value}</div>
        {subtitle && (
          <div className="text-[10px] text-slate-400 mt-0.5 leading-tight line-clamp-1">{subtitle}</div>
        )}
      </div>
    </div>
  );

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
        
        {/* Stats Overlay */}
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
          <h2 className="text-base font-semibold text-slate-900 flex-1">Your Stats</h2>
          <div className="w-7"></div> {/* Spacer for balance */}
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Overall Performance */}
          <div>
            <h3 className="text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wide">Overall Performance</h3>
            <div className="grid grid-cols-2 gap-2">
              <StatCard
                icon={<Trophy size={16} />}
                label="Completed"
                value={stats.totalPuzzlesCompleted}
                subtitle={`${stats.totalPuzzlesPlayed} played`}
              />
              <StatCard
                icon={<BarChart3 size={16} />}
                label="Completion Rate"
                value={`${completionRate}%`}
                subtitle={stats.totalPuzzlesPlayed > 0 
                  ? `${stats.totalPuzzlesCompleted}/${stats.totalPuzzlesPlayed}`
                  : 'Start playing'
                }
              />
            </div>
            {/* Completion Rate Bar */}
            {stats.totalPuzzlesPlayed > 0 && (
              <div className="mt-2">
                <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${completionRate}%` }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                    className="h-full bg-gradient-to-r from-[#06B6D4] to-[#0891B2] rounded-full"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Streaks */}
          <div>
            <h3 className="text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wide">Streaks</h3>
            <div className="grid grid-cols-2 gap-2">
              <StatCard
                icon={<Flame size={16} />}
                label="Current"
                value={stats.currentStreak}
                subtitle={stats.currentStreak > 0 ? "Keep going!" : "Start one"}
              />
              <StatCard
                icon={<Award size={16} />}
                label="Longest"
                value={stats.longestStreak}
                subtitle="Best run"
              />
            </div>
          </div>

          {/* Game Statistics */}
          <div>
            <h3 className="text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wide">Statistics</h3>
            <div className="grid grid-cols-2 gap-2">
              <StatCard
                icon={<TrendingUp size={16} />}
                label="Avg Attempts"
                value={averageAttempts}
                subtitle={`${stats.totalAttemptsUsed} total`}
              />
              <StatCard
                icon={<Target size={16} />}
                label="Items Locked"
                value={stats.totalItemsLocked}
                subtitle={`${stats.totalItemsPlaced} placed`}
              />
            </div>
          </div>

          {/* Today's Progress */}
          {stats.puzzlesCompletedToday > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wide">Today</h3>
              <div className="bg-gradient-to-r from-[#06B6D4] to-[#0891B2] rounded-lg p-3 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[10px] font-medium opacity-90 mb-0.5">Completed Today</div>
                    <div className="text-2xl font-bold leading-tight">{stats.puzzlesCompletedToday}</div>
                  </div>
                  <CheckCircle2 size={24} className="opacity-80" />
                </div>
              </div>
            </div>
          )}
        </div>
          </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

