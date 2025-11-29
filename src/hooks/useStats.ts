import { useState, useEffect, useCallback } from 'react';
import { Zone } from '../types/game';

export interface PuzzleStats {
  completed: boolean;
  attempts: number;
  completedAt?: string;
  firstAttemptedAt?: string;
  // Locked state when puzzle was completed
  lockedState?: {
    itemPlacements: Record<string, Zone>;
    zoneOrder: Record<Zone, string[]>;
    lockedItems: string[];
    revealedRules: { left: boolean; right: boolean };
  };
}

export interface GameStats {
  totalPuzzlesPlayed: number;
  totalPuzzlesCompleted: number;
  totalAttemptsUsed: number;
  totalItemsLocked: number;
  totalItemsPlaced: number;
  currentStreak: number;
  longestStreak: number;
  puzzlesCompletedToday: number;
  lastPlayedDate: string | null;
  averageAttemptsPerPuzzle: number;
  completionRate: number;
  puzzles: Record<string, PuzzleStats>; // Per-puzzle completion data
}

const STORAGE_KEY = 'vennstack_stats';

const defaultStats: GameStats = {
  totalPuzzlesPlayed: 0,
  totalPuzzlesCompleted: 0,
  totalAttemptsUsed: 0,
  totalItemsLocked: 0,
  totalItemsPlaced: 0,
  currentStreak: 0,
  longestStreak: 0,
  puzzlesCompletedToday: 0,
  lastPlayedDate: null,
  averageAttemptsPerPuzzle: 0,
  completionRate: 0,
  puzzles: {},
};

function loadStats(): GameStats {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Check if last played date is today
      const today = new Date().toDateString();
      if (parsed.lastPlayedDate !== today) {
        // Reset daily stats if it's a new day
        parsed.puzzlesCompletedToday = 0;
      }
      // Ensure puzzles field exists for backward compatibility
      if (!parsed.puzzles) {
        parsed.puzzles = {};
      }
      return { ...defaultStats, ...parsed };
    }
  } catch (error) {
    console.error('Error loading stats:', error);
  }
  return { ...defaultStats };
}

function saveStats(stats: GameStats): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
  } catch (error) {
    console.error('Error saving stats:', error);
  }
}

export function useStats() {
  const [stats, setStats] = useState<GameStats>(loadStats);

  useEffect(() => {
    // Load stats on mount
    setStats(loadStats());
  }, []);

  const recordPuzzleStart = useCallback((puzzleId?: string) => {
    setStats(prev => {
      const today = new Date().toDateString();
      const isNewDay = prev.lastPlayedDate !== today;
      
      // Track puzzle attempt
      const puzzles = { ...prev.puzzles };
      if (puzzleId) {
        if (!puzzles[puzzleId]) {
          puzzles[puzzleId] = {
            completed: false,
            attempts: 0,
            firstAttemptedAt: new Date().toISOString(),
          };
        }
      }
      
      const updated = {
        ...prev,
        totalPuzzlesPlayed: prev.totalPuzzlesPlayed + 1,
        lastPlayedDate: today,
        // Reset streak if it's a new day and no puzzle was completed yesterday
        currentStreak: isNewDay && prev.puzzlesCompletedToday === 0 ? 0 : prev.currentStreak,
        puzzlesCompletedToday: isNewDay ? 0 : prev.puzzlesCompletedToday,
        puzzles,
      };
      
      saveStats(updated);
      return updated;
    });
  }, []);

  const recordPuzzleCompletion = useCallback((
    attemptsUsed: number, 
    itemsLocked: number, 
    itemsPlaced: number, 
    puzzleId?: string,
    lockedState?: {
      itemPlacements: Map<string, Zone>;
      zoneOrder: Map<Zone, string[]>;
      lockedItems: Set<string>;
      revealedRules: { left: boolean; right: boolean };
    }
  ) => {
    setStats(prev => {
      const today = new Date().toDateString();
      const isNewDay = prev.lastPlayedDate !== today;
      
      // Track puzzle completion
      const puzzles = { ...prev.puzzles };
      if (puzzleId) {
        const puzzleStat = puzzles[puzzleId] || {
          completed: false,
          attempts: 0,
          firstAttemptedAt: new Date().toISOString(),
        };
        
        // Prevent duplicate completion
        if (puzzleStat.completed) {
          return prev; // Already completed, don't record again
        }
        
        // Convert Maps and Sets to plain objects for storage
        const storedState = lockedState ? {
          itemPlacements: Object.fromEntries(lockedState.itemPlacements),
          zoneOrder: Object.fromEntries(lockedState.zoneOrder),
          lockedItems: Array.from(lockedState.lockedItems),
          revealedRules: lockedState.revealedRules,
        } : undefined;
        
        puzzles[puzzleId] = {
          ...puzzleStat,
          completed: true,
          attempts: puzzleStat.attempts + attemptsUsed,
          completedAt: new Date().toISOString(),
          lockedState: storedState,
        };
      }
      
      // Calculate streak
      let newStreak = prev.currentStreak;
      if (isNewDay) {
        // If last played was yesterday and a puzzle was completed, increment streak
        // Otherwise, reset to 1 (completing today's first puzzle)
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        if (prev.lastPlayedDate === yesterday.toDateString() && prev.puzzlesCompletedToday > 0) {
          newStreak = prev.currentStreak + 1;
        } else {
          newStreak = 1;
        }
      } else {
        // Same day, keep current streak
        newStreak = prev.currentStreak;
      }
      
      const updated = {
        ...prev,
        totalPuzzlesCompleted: prev.totalPuzzlesCompleted + 1,
        totalAttemptsUsed: prev.totalAttemptsUsed + attemptsUsed,
        totalItemsLocked: prev.totalItemsLocked + itemsLocked,
        totalItemsPlaced: prev.totalItemsPlaced + itemsPlaced,
        currentStreak: newStreak,
        longestStreak: Math.max(prev.longestStreak, newStreak),
        puzzlesCompletedToday: isNewDay ? 1 : prev.puzzlesCompletedToday + 1,
        lastPlayedDate: today,
        averageAttemptsPerPuzzle: prev.totalPuzzlesCompleted > 0
          ? (prev.totalAttemptsUsed + attemptsUsed) / (prev.totalPuzzlesCompleted + 1)
          : attemptsUsed,
        completionRate: ((prev.totalPuzzlesCompleted + 1) / (prev.totalPuzzlesPlayed + 1)) * 100,
        puzzles,
      };
      
      saveStats(updated);
      return updated;
    });
  }, []);

  const recordAttempt = useCallback((puzzleId?: string) => {
    setStats(prev => {
      const puzzles = { ...prev.puzzles };
      if (puzzleId) {
        const puzzleStat = puzzles[puzzleId] || {
          completed: false,
          attempts: 0,
          firstAttemptedAt: new Date().toISOString(),
        };
        puzzles[puzzleId] = {
          ...puzzleStat,
          attempts: puzzleStat.attempts + 1,
        };
      }
      
      const updated = {
        ...prev,
        totalAttemptsUsed: prev.totalAttemptsUsed + 1,
        puzzles,
      };
      saveStats(updated);
      return updated;
    });
  }, []);

  const resetStats = useCallback(() => {
    const reset = { ...defaultStats };
    saveStats(reset);
    setStats(reset);
    // Clear all localStorage data related to the app
    // This ensures a complete reset of all user data, including first-time user flag
    try {
      localStorage.removeItem(STORAGE_KEY);
      // Clear any other potential storage keys (including first-time user flag)
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('vennstack_')) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
    } catch (error) {
      console.error('Error clearing localStorage:', error);
    }
  }, []);

  const isPuzzleCompleted = useCallback((puzzleId: string): boolean => {
    return stats.puzzles[puzzleId]?.completed === true;
  }, [stats.puzzles]);

  const getPuzzleLockedState = useCallback((puzzleId: string) => {
    return stats.puzzles[puzzleId]?.lockedState;
  }, [stats.puzzles]);

  return {
    stats,
    recordPuzzleStart,
    recordPuzzleCompletion,
    recordAttempt,
    resetStats,
    isPuzzleCompleted,
    getPuzzleLockedState,
  };
}

