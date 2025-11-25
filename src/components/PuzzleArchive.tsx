import { useMemo, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Check, X } from 'lucide-react';
import { useStats } from '../hooks/useStats';
import { PuzzleData } from '../types/game';

interface PuzzleArchiveProps {
  puzzles: PuzzleData[];
  currentMonth: Date;
  onMonthChange: (date: Date) => void;
  onPuzzleSelect: (puzzle: PuzzleData) => void;
  onClose: () => void;
  activePuzzle: PuzzleData | null;
}

export function PuzzleArchive({
  puzzles,
  currentMonth,
  onMonthChange,
  onPuzzleSelect,
  onClose,
  activePuzzle,
}: PuzzleArchiveProps) {
  const { stats } = useStats();
  const modalRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  // Lightweight focus trap: Focus on mount, restore on unmount
  useEffect(() => {
    triggerRef.current = document.activeElement as HTMLElement;

    const closeButton = modalRef.current?.querySelector('button:last-of-type');
    if (closeButton) {
      (closeButton as HTMLElement).focus();
    } else if (modalRef.current) {
      modalRef.current.focus();
    }

    return () => {
      if (triggerRef.current) {
        triggerRef.current.focus();
      }
    };
  }, []);

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  // Get first day of month and number of days
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay(); // 0 = Sunday, 1 = Monday, etc.

  // Map puzzles by date (YYYY-MM-DD format)
  const puzzleMapByDate = useMemo(() => {
    const map = new Map<string, PuzzleData>();
    puzzles.forEach((puzzle) => {
      // Puzzle IDs are in YYYY-MM-DD format
      if (puzzle.id && puzzle.id.includes('-')) {
        map.set(puzzle.id, puzzle);
      }
    });
    return map;
  }, [puzzles]);

  // Navigate months
  const goToPreviousMonth = () => {
    onMonthChange(new Date(year, month - 1, 1));
  };

  const goToNextMonth = () => {
    onMonthChange(new Date(year, month + 1, 1));
  };

  // Go to current month
  const goToCurrentMonth = () => {
    onMonthChange(new Date());
  };

  const monthName = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const isCurrentMonth = year === new Date().getFullYear() && month === new Date().getMonth();

  // Check if we can navigate to next month (prevent future months)
  const todayDate = new Date();
  const currentMonthDate = new Date(year, month, 1);
  const canNavigateNext = currentMonthDate < new Date(todayDate.getFullYear(), todayDate.getMonth() + 1, 1);

  // Helper functions for puzzle status
  const getPuzzleStats = (puzzleId: string) => {
    return stats.puzzles[puzzleId] || null;
  };

  const isPuzzleCompleted = (puzzleId: string): boolean => {
    const puzzleStats = getPuzzleStats(puzzleId);
    return puzzleStats?.completed === true;
  };

  const isPuzzleAttempted = (puzzleId: string): boolean => {
    const puzzleStats = getPuzzleStats(puzzleId);
    return puzzleStats !== null && puzzleStats.attempts > 0;
  };

  const getPuzzleAttempts = (puzzleId: string): number => {
    const puzzleStats = getPuzzleStats(puzzleId);
    return puzzleStats?.attempts || 0;
  };

  // Memoize calendar days generation for performance
  const calendarDays = useMemo(() => {
    const getPuzzleStatus = (day: number): { status: 'completed' | 'attempted' | 'none' | null } => {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const puzzle = puzzleMapByDate.get(dateStr);
      if (!puzzle) return { status: null };

      const puzzleId = puzzle.id;
      if (isPuzzleCompleted(puzzleId)) {
        return { status: 'completed' };
      }
      if (isPuzzleAttempted(puzzleId)) {
        return { status: 'attempted' };
      }
      return { status: 'none' };
    };

    const days: Array<{
      day: number | null;
      status: 'completed' | 'attempted' | 'none' | null;
      isFuture: boolean;
      attempts?: number;
    }> = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push({ day: null, status: null, isFuture: false });
    }

    // Add days of the month
    const today = new Date();
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const puzzle = puzzleMapByDate.get(dateStr);
      const puzzleDate = new Date(year, month, day);
      const isFuture = puzzleDate > today;
      const statusResult = getPuzzleStatus(day);

      const puzzleId = puzzle?.id || '';
      const attempts = getPuzzleAttempts(puzzleId);

      days.push({
        day,
        status: statusResult.status,
        isFuture,
        attempts: attempts > 0 ? attempts : undefined,
      });
    }

    return days;
  }, [year, month, daysInMonth, startingDayOfWeek, stats, puzzleMapByDate, activePuzzle]);

  const weekDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  return (
    <div
      className="fixed inset-0 flex items-center justify-center bg-black/40 px-4 z-50"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <motion.div
        ref={modalRef}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-zinc-900">Puzzle Archive</h2>
          <button onClick={onClose} className="text-sm text-zinc-500 hover:text-zinc-700">
            Close
          </button>
        </div>

        {/* Month Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={goToPreviousMonth}
            className="p-2 rounded-lg transition-colors hover:bg-zinc-100"
            aria-label="Previous month"
          >
            <ChevronLeft className="h-5 w-5 text-zinc-600" />
          </button>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-zinc-900">{monthName}</h3>
            {!isCurrentMonth && (
              <button
                onClick={goToCurrentMonth}
                className="text-xs text-zinc-500 hover:text-zinc-700 px-2 py-1 rounded hover:bg-zinc-100"
              >
                Today
              </button>
            )}
          </div>
          <button
            onClick={goToNextMonth}
            disabled={!canNavigateNext}
            className={`p-2 rounded-lg transition-colors ${
              canNavigateNext ? 'hover:bg-zinc-100' : 'opacity-30 cursor-not-allowed'
            }`}
            aria-label="Next month"
          >
            <ChevronRight className="h-5 w-5 text-zinc-600" />
          </button>
        </div>

        {/* Calendar Grid */}
        <div className="space-y-2">
          {/* Week day headers */}
          <div className="grid grid-cols-7 gap-1">
            {weekDays.map((day, index) => (
              <div key={index} className="text-center text-xs font-semibold text-zinc-500 py-1">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar days */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((item, index) => {
              if (item.day === null) {
                return <div key={index} className="aspect-square" />;
              }

              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(item.day).padStart(2, '0')}`;
              const puzzle = puzzleMapByDate.get(dateStr);
              const todayCheck = new Date();
              const isToday =
                item.day === todayCheck.getDate() &&
                year === todayCheck.getFullYear() &&
                month === todayCheck.getMonth();
              const isLastSelected = activePuzzle?.id === dateStr;
              const isFuture = item.isFuture;
              const isClickable = puzzle && !isFuture;

              return (
                <button
                  key={index}
                  onClick={() => {
                    if (isClickable) {
                      onPuzzleSelect(puzzle);
                    }
                  }}
                  disabled={!puzzle || isFuture}
                  className={`
                    aspect-square rounded-lg border-2 transition-all
                    ${isToday ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200' : 'border-zinc-200'}
                    ${isLastSelected && !isToday ? 'ring-1 ring-zinc-400' : ''}
                    ${isClickable ? 'hover:border-zinc-400 hover:bg-zinc-50 cursor-pointer' : 'cursor-not-allowed opacity-50'}
                    ${isFuture ? 'opacity-30' : ''}
                    ${!isToday && !isLastSelected && item.status === 'completed' ? 'bg-emerald-50 border-emerald-300' : ''}
                    ${!isToday && !isLastSelected && item.status === 'attempted' ? 'bg-rose-50 border-rose-300' : ''}
                    flex items-center justify-center relative
                  `}
                >
                  {/* Visual indicator for today */}
                  {isToday && (
                    <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-blue-500" title="Today" />
                  )}
                  <div className="flex flex-col items-center justify-center gap-0.5">
                    <span
                      className={`text-sm font-medium ${
                        isToday
                          ? 'text-blue-900 font-bold'
                          : item.status === 'completed'
                          ? 'text-emerald-700'
                          : item.status === 'attempted'
                          ? 'text-rose-700'
                          : 'text-zinc-600'
                      }`}
                    >
                      {item.day}
                    </span>
                    {item.status === 'completed' && (
                      <Check className="h-3 w-3 text-emerald-600" />
                    )}
                    {item.status === 'attempted' && (
                      <>
                        <X className="h-3 w-3 text-rose-600" />
                        {item.attempts && item.attempts > 0 && (
                          <span className="text-[10px] font-semibold text-rose-600 leading-none">
                            {item.attempts}
                          </span>
                        )}
                      </>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="pt-4 border-t border-zinc-200">
          <div className="flex items-center justify-center gap-4 text-xs text-zinc-600 flex-wrap">
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded border-2 border-blue-500 bg-blue-50 ring-1 ring-blue-200 relative">
                <div className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-blue-500" />
              </div>
              <span>Today</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded border-2 border-emerald-300 bg-emerald-50 flex items-center justify-center">
                <Check className="h-2.5 w-2.5 text-emerald-600" />
              </div>
              <span>Completed</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded border-2 border-rose-300 bg-rose-50 flex items-center justify-center">
                <X className="h-2.5 w-2.5 text-rose-600" />
              </div>
              <span>Attempted</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded border-2 border-zinc-200 bg-white" />
              <span>Not played</span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

