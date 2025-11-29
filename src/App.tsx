import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu as MenuIcon, HelpCircle, ChevronUp } from 'lucide-react';
import { Board } from './components/Board';
import { WordPool } from './components/WordPool';
import { AttemptProgressBar } from './components/AttemptProgressBar';
import { Menu } from './components/Menu';
import { Stats } from './components/Stats';
import { PuzzleArchive } from './components/PuzzleArchive';
import { HowToPlay } from './components/HowToPlay';
import { About } from './components/About';
import { LossSummarySheet } from './components/LossSummarySheet';
import { SuccessSummarySheet } from './components/SuccessSummarySheet';
import { GameStart } from './components/GameStart';
import { Confetti } from './components/Confetti';
import { DndProvider } from './components/DndProvider';
import { useVennEngine } from './hooks/useVennEngine';
import { useStats } from './hooks/useStats';
import samplePuzzle from './data/samplePuzzle.json';
import { PuzzleData } from './types/game';
import { playSuccessSound, playHintSound } from './utils/audio';
import { loadTodaysPuzzle, getAllPuzzlesArray } from './utils/puzzleLoader';

function App() {
  const [puzzleData, setPuzzleData] = useState<PuzzleData>(samplePuzzle as PuzzleData);
  const [allPuzzles, setAllPuzzles] = useState<PuzzleData[]>([samplePuzzle as PuzzleData]);
  const [earliestPuzzleDate, setEarliestPuzzleDate] = useState<string | null>(null);
  const stats = useStats();
  const { recordPuzzleStart, recordPuzzleCompletion, recordAttempt, isPuzzleCompleted: checkIsPuzzleCompleted, getPuzzleLockedState } = stats;
  
  // Check if current puzzle is completed and get locked state
  // Use useMemo to recalculate when puzzleData.id or the completion check function changes
  const isPuzzleCompleted = useMemo(() => {
    return puzzleData.id ? checkIsPuzzleCompleted(puzzleData.id) : false;
  }, [puzzleData.id, checkIsPuzzleCompleted]);
  
  const lockedState = useMemo(() => {
    return puzzleData.id ? getPuzzleLockedState(puzzleData.id) : undefined;
  }, [puzzleData.id, getPuzzleLockedState]);
  
  const game = useVennEngine(puzzleData, isPuzzleCompleted, lockedState);
  const [incorrectItemIds, setIncorrectItemIds] = useState<Set<string>>(new Set());
  const [checkAttempts, setCheckAttempts] = useState(0);
  
  // @dnd-kit state
  const [activeCardId, setActiveCardId] = useState<string | null>(null);
  
  const [hasStartedGame, setHasStartedGame] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentView, setCurrentView] = useState<'menu' | 'stats' | 'archive' | 'how-to-play' | 'about' | null>(null);
  const [showHowToPlayOnStart, setShowHowToPlayOnStart] = useState(false); // Track if we should show How to Play when starting
  const [canCheckPuzzle, setCanCheckPuzzle] = useState(true);
  const [hasRecordedPuzzleStart, setHasRecordedPuzzleStart] = useState(false);
  const [archiveMonth, setArchiveMonth] = useState(() => {
    const puzzleDate = puzzleData.id && puzzleData.id.includes('-') 
      ? new Date(puzzleData.id) 
      : new Date();
    return new Date(puzzleDate.getFullYear(), puzzleDate.getMonth(), 1);
  });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [buttonWidth, setButtonWidth] = useState<number | null>(null);
  const MAX_CHECK_ATTEMPTS = 5;
  const MAX_HINTS = 3;
  const [isGameOver, setIsGameOver] = useState(false);
  
  // Check if user is first-time on mount
  useEffect(() => {
    const FIRST_TIME_KEY = 'vennstack_has_played';
    const hasPlayedBefore = localStorage.getItem(FIRST_TIME_KEY) === 'true';
    if (!hasPlayedBefore) {
      setShowHowToPlayOnStart(true);
    }
  }, []);

  // Load today's puzzle and all puzzles on mount
  useEffect(() => {
    async function loadPuzzles() {
      try {
        // Load today's puzzle
        const todaysPuzzle = await loadTodaysPuzzle();
        setPuzzleData(todaysPuzzle);
        
        // Load all puzzles for archive
        const puzzles = await getAllPuzzlesArray();
        setAllPuzzles(puzzles);
        
        // Find the earliest puzzle date (first puzzle = #1)
        // Exclude samplePuzzle from the calculation - only use actual puzzle files
        const validPuzzleDates = puzzles
          .map(p => p.id)
          .filter(id => id && id.includes('-') && id !== samplePuzzle.id) // Exclude sample puzzle
          .sort();
        
        if (validPuzzleDates.length > 0) {
          setEarliestPuzzleDate(validPuzzleDates[0]);
        } else {
          // If no actual puzzles found, use the first puzzle date from the files
          // This shouldn't happen in production, but handle gracefully
          const allDates = puzzles
            .map(p => p.id)
            .filter(id => id && id.includes('-'))
            .sort();
          if (allDates.length > 0) {
            setEarliestPuzzleDate(allDates[0]);
          }
        }
      } catch (error) {
        console.error('Error loading puzzles:', error);
        // Fallback to sample puzzle
        setPuzzleData(samplePuzzle as PuzzleData);
        setAllPuzzles([samplePuzzle as PuzzleData]);
        if (samplePuzzle.id && samplePuzzle.id.includes('-')) {
          setEarliestPuzzleDate(samplePuzzle.id);
        }
      }
    }
    
    loadPuzzles();
  }, []);

  // Calculate puzzle number based on the loaded puzzle's date
  // Use the earliest puzzle date as puzzle #1
  const puzzleNumber = useMemo(() => {
    // Use the earliest puzzle date as the reference (puzzle #1)
    const referenceDate = earliestPuzzleDate || (samplePuzzle.id && samplePuzzle.id.includes('-') ? samplePuzzle.id : null);
    
    if (!referenceDate) {
      // Fallback: if no reference date, return 1
      return 1;
    }
    
    // Always use the puzzle's date from its ID (YYYY-MM-DD format)
    if (puzzleData.id && puzzleData.id.includes('-')) {
      const parts = puzzleData.id.split('-');
      if (parts.length === 3) {
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10);
        const day = parseInt(parts[2], 10);
        
        // Validate the date components
        if (!isNaN(year) && !isNaN(month) && !isNaN(day) && year > 0 && month > 0 && month <= 12 && day > 0 && day <= 31) {
          const puzzleDate = new Date(year, month - 1, day);
          // Verify the date is valid
          if (puzzleDate.getFullYear() === year && puzzleDate.getMonth() === month - 1 && puzzleDate.getDate() === day) {
            // Parse reference date
            const refParts = referenceDate.split('-');
            if (refParts.length === 3) {
              const refYear = parseInt(refParts[0], 10);
              const refMonth = parseInt(refParts[1], 10);
              const refDay = parseInt(refParts[2], 10);
              const refDate = new Date(refYear, refMonth - 1, refDay);
              
              const diffTime = puzzleDate.getTime() - refDate.getTime();
              const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
              return diffDays + 1; // Puzzle numbers start at 1
            }
          }
        }
      }
    }
    // Fallback: return 1 if puzzle ID is invalid
    return 1;
  }, [puzzleData.id, earliestPuzzleDate]);

  // Format date and difficulty for display (Spectrum-style)
  const formatPuzzleDate = () => {
    // Always use the device's current local date/time
    const today = new Date();
    
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    const dayName = dayNames[today.getDay()];
    const month = monthNames[today.getMonth()];
    const day = today.getDate();
    
    return `${dayName}, ${month} ${day}`;
  };

  const getDifficultyLabel = () => {
    if (puzzleData.difficultyLabel) {
      return puzzleData.difficultyLabel;
    }
    
    // Fallback to calculating from date
    let dayOfWeek: number;
    if (puzzleData.date) {
      dayOfWeek = puzzleData.date.dayOfWeek;
    } else if (puzzleData.id && puzzleData.id.includes('-')) {
      const puzzleDate = new Date(puzzleData.id);
      dayOfWeek = puzzleDate.getDay();
    } else {
      return 'Medium';
    }

    // Map to difficulty labels
    if (dayOfWeek === 1) return 'Easy'; // Monday
    if (dayOfWeek === 2 || dayOfWeek === 3) return 'Medium'; // Tuesday, Wednesday
    if (dayOfWeek === 4 || dayOfWeek === 5 || dayOfWeek === 6) return 'Hard'; // Thursday, Friday, Saturday
    return 'Expert'; // Sunday
  };

  // CRITICAL FIX: Enable animations only after initial mount
  // This prevents the drop-in animation from playing on page load
  useEffect(() => {
    // Small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      document.body.classList.add('game-ready');
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const [justLockedIds, setJustLockedIds] = useState<Set<string>>(new Set());
  const [isCelebrating, setIsCelebrating] = useState(false);
  
  // Track mouse position during drag
  const [mousePosition, setMousePosition] = useState<{ x: number; y: number } | null>(null);
  const [showTryAgain, setShowTryAgain] = useState(false);
  const [isButtonShaking, setIsButtonShaking] = useState(false);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [isHintMenuOpen, setIsHintMenuOpen] = useState(false);
  const hintMenuTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showLossSheet, setShowLossSheet] = useState(false);
  const [showSuccessSheet, setShowSuccessSheet] = useState(false);
  const [hasSeenSummary, setHasSeenSummary] = useState(false);
  const prevPuzzleIdRef = useRef<string | undefined>(undefined); // Track previous puzzle ID
  const dismissedPuzzlesRef = useRef<Set<string>>(new Set()); // Track which puzzles have dismissed summaries
  const [solutionRevealed, setSolutionRevealed] = useState(false);
  // Removed attemptHistory - was set but never used
  const [countdownText, setCountdownText] = useState('');
  const [finalCorrectCount, setFinalCorrectCount] = useState<number | null>(null);
  
  const handleDragStart = (event: any) => {
    setActiveCardId(event.active.id as string);
    // As soon as the user starts adjusting the board again after a failed attempt,
    // snap the CTA back to the normal \"Check Answer\" state and ensure it is enabled.
    if (!isGameOver) {
      setShowTryAgain(false);
      setCanCheckPuzzle(true);
    }

    // Track mouse position during drag
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches[0]) {
        setMousePosition({ x: e.touches[0].clientX, y: e.touches[0].clientY });
      }
    };
    
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    
    // Store cleanup function
    (window as any).__dragCleanup = () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
      setMousePosition(null);
    };
  };
  
  const handleDragEnd = (event: any) => {
    // Clean up mouse tracking
    if ((window as any).__dragCleanup) {
      (window as any).__dragCleanup();
      delete (window as any).__dragCleanup;
    }
    
    // Process drop
    game.handleDrop(event, mousePosition);
    
    // CRITICAL FIX: Clear active state immediately
    // No setTimeout hack - React's state update will handle the handover
    // The key-changing strategy in Zone.tsx forces remount, triggering animation
    setActiveCardId(null);
    setMousePosition(null);
    
    // Clear error state when card is moved (user is trying to fix it)
    // The incorrect state will be re-evaluated on the next check
    setIncorrectItemIds(prev => {
      const next = new Set(prev);
      next.delete(event.active.id as string);
      return next;
    });
  };
  
  const handleDragCancel = () => {
    // Clean up mouse tracking
    if ((window as any).__dragCleanup) {
      (window as any).__dragCleanup();
      delete (window as any).__dragCleanup;
    }
    
    setActiveCardId(null);
    setMousePosition(null);
  };
  
  
  const renderOverlay = (cardId: string) => {
    const item = game.puzzle.items.find(i => i.id === cardId);
    if (!item) return null;
    
    return (
      <div className="bg-white border-2 border-gray-300 px-3 py-2 rounded-xl text-sm font-medium shadow-xl scale-105 cursor-grabbing">
        {item.text}
      </div>
    );
  };

  const handleReturnToPool = (itemId: string) => {
    game.removeItem(itemId);
    setIncorrectItemIds(prev => {
      const next = new Set(prev);
      next.delete(itemId);
      return next;
    });
  };

  // Record puzzle start on mount
  useEffect(() => {
    if (!hasRecordedPuzzleStart) {
      recordPuzzleStart(puzzleData.id);
      setHasRecordedPuzzleStart(true);
    }
  }, [hasRecordedPuzzleStart, recordPuzzleStart, puzzleData.id]);

  const handleCheckPuzzle = () => {
    if (isPuzzleComplete || isGameOver) {
      return;
    }

    setCanCheckPuzzle(false);
    const nextAttempts = checkAttempts + 1;
    setCheckAttempts(nextAttempts);
    recordAttempt(puzzleData.id);
    
    const prevLockedCount = game.lockedItems.size;
    const result = game.validatePuzzle();
    
    // Track newly locked items for animation
    const newlyLocked = new Set(
      result.correct.filter(id => !game.lockedItems.has(id))
    );
    setJustLockedIds(newlyLocked);
    setTimeout(() => setJustLockedIds(new Set()), 400);
    
    const correctLockedAfter = prevLockedCount + result.correct.length;
    const isCurrentlyComplete = correctLockedAfter === totalItems;

    // For normal checks, mark only actually incorrect placed items.
    // On game over, also treat unplaced items as "missed" so they don't show as green checks in the solution view.
    if (!isCurrentlyComplete && checkAttempts + 1 >= MAX_CHECK_ATTEMPTS) {
      const failedIds = new Set<string>(result.incorrect);
      puzzleData.items.forEach((item) => {
        const wasPreviouslyLocked = game.lockedItems.has(item.id);
        const wasCorrectThisCheck = result.correct.includes(item.id);
        if (!wasPreviouslyLocked && !wasCorrectThisCheck) {
          failedIds.add(item.id);
        }
      });
      setIncorrectItemIds(failedIds);
    } else {
      setIncorrectItemIds(new Set(result.incorrect));
    }

    // Attempt history removed - not currently used in share grid

    // Soft fail: incorrect items and not yet at hint threshold success
    if (result.incorrect.length > 0 && !isCurrentlyComplete && nextAttempts < 3) {
      setShowTryAgain(true);
      setIsButtonShaking(true);
      setTimeout(() => setIsButtonShaking(false), 600);
      setTimeout(() => setShowTryAgain(false), 2500);
    }
    
    // If we've reached max attempts and still not complete, trigger game over
    if (!isCurrentlyComplete && nextAttempts >= MAX_CHECK_ATTEMPTS) {
      // Freeze how many were actually correct at the moment of failure
      setFinalCorrectCount(correctLockedAfter);
      setIsGameOver(true);
      // Let the failure state sink in, then show the loss sheet
      setTimeout(() => {
        setShowLossSheet(true);
        setHasSeenSummary(true);
      }, 2000);
    } else {
      // Re-enable button after 0.5 second delay
      setTimeout(() => {
        setCanCheckPuzzle(true);
      }, 500);
    }
  };

  const handlePrimaryButtonClick = () => {
    // On a true daily-game win, the primary CTA becomes “Share Result”
    // instead of offering a replay.
    if (isPuzzleComplete && !isGameOver && !solutionRevealed) {
      handleShareResult();
      return;
    }
    if (isGameOver) {
      return;
    }
    handleCheckPuzzle();
  };


  // Measure button width and sync to progress bar
  useEffect(() => {
    const updateButtonWidth = () => {
      if (buttonRef.current) {
        setButtonWidth(buttonRef.current.offsetWidth);
      }
    };

    updateButtonWidth();
    window.addEventListener('resize', updateButtonWidth);
    return () => window.removeEventListener('resize', updateButtonWidth);
  }, []);

  // Calculate progress
  const placedCount = game.itemPlacements.size;
  const totalItems = game.puzzle.items.length;
  const hasPlacedItems = placedCount > 0;
  const lockedCount = game.lockedItems.size;
  // Puzzle is complete if all items are locked OR if it was previously completed
  const isPuzzleComplete = (lockedCount === totalItems && totalItems > 0) || isPuzzleCompleted;
  const resultCorrect = finalCorrectCount ?? lockedCount;
  // Can actually fire a hint (needs placed cards)
  const canUseHintAction = !isPuzzleComplete && !isGameOver && !isPuzzleCompleted && hintsUsed < MAX_HINTS && hasPlacedItems;
  // When to show the subtle nudge (based on attempts, regardless of exact availability)
  const [showHintNudge, setShowHintNudge] = useState(false);
  const shouldShowHintPrompt = !isPuzzleComplete && !isGameOver && !isPuzzleCompleted && checkAttempts >= 3;

  // Countdown to next puzzle (next local midnight)
  useEffect(() => {
    const getCountdown = () => {
      const now = new Date();
      const nextMidnight = new Date();
      nextMidnight.setHours(24, 0, 0, 0);
      const diff = nextMidnight.getTime() - now.getTime();
      if (diff <= 0) return '00:00:00';
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      const pad = (n: number) => n.toString().padStart(2, '0');
      return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
    };

    setCountdownText(getCountdown());
    const id = setInterval(() => {
      setCountdownText(getCountdown());
    }, 1000);

    return () => clearInterval(id);
  }, []);

  // Build compact Wordle-style share stamp and handler (two rows of five)
  // Example (9/10): 🟩🟩🟩🟩🟩 🟩🟩🟩🟩🟥
  const buildShareGrid = () => {
    if (totalItems === 0) return '';

    const maxItems = Math.min(totalItems, 10);
    const greens = Math.max(0, Math.min(maxItems, resultCorrect));
    const reds = Math.max(0, maxItems - greens);

    const symbols: string[] = [
      ...Array(greens).fill('🟩'),
      ...Array(reds).fill('🟥'),
    ];

    if (symbols.length <= 5) {
      return symbols.join('');
    }

    const row1 = symbols.slice(0, 5).join('');
    const row2 = symbols.slice(5, 10).join('');
    return row2 ? `${row1} ${row2}` : row1;
  };

  const shareGrid = buildShareGrid();

  const handleShareResult = async () => {
    const header = 'VennStack – Daily Puzzle';
    const summary = `Result: ${resultCorrect}/${totalItems} items\nAttempts: ${checkAttempts}/${MAX_CHECK_ATTEMPTS}`;
    const text = `${header}\n${summary}\n${shareGrid}\nNext level in ${countdownText}`;
    try {
      await navigator.clipboard.writeText(text);
    } catch (e) {
      // Ignore clipboard failure in environments where it's not available
      // eslint-disable-next-line no-console
      console.error('Share failed', e);
    }
  };

  // Auto-show and auto-hide hint nudge when conditions are met
  useEffect(() => {
    if (shouldShowHintPrompt) {
      setShowHintNudge(true);
      const timer = setTimeout(() => {
        setShowHintNudge(false);
      }, 4000);
      return () => clearTimeout(timer);
    } else {
      setShowHintNudge(false);
    }
  }, [shouldShowHintPrompt, checkAttempts, isPuzzleComplete, isGameOver]);


  // Track puzzle completion (only for real wins, not post-loss solution reveal)
  const [hasRecordedCompletion, setHasRecordedCompletion] = useState(false);
  useEffect(() => {
    if (
      isPuzzleComplete &&
      !isGameOver &&
      !solutionRevealed &&
      !hasRecordedCompletion &&
      hasRecordedPuzzleStart &&
      !isPuzzleCompleted // Prevent duplicate completion
    ) {
      const itemsPlaced = Array.from(game.itemPlacements.values()).filter(zone => zone !== 'outside').length;
      
      // Store the locked state when recording completion
      const lockedState = {
        itemPlacements: game.itemPlacements,
        zoneOrder: game.zoneOrder,
        lockedItems: game.lockedItems,
        revealedRules: game.revealedRules,
      };
      
      recordPuzzleCompletion(
        checkAttempts, 
        lockedCount, 
        itemsPlaced, 
        puzzleData.id,
        lockedState
      );
      setHasRecordedCompletion(true);
      playSuccessSound();
      setIsCelebrating(true);
      setTimeout(() => setIsCelebrating(false), 900);
      // Show success sheet immediately when puzzle is submitted
      setShowSuccessSheet(true);
      setHasSeenSummary(true);
    }
  }, [isPuzzleComplete, hasRecordedCompletion, hasRecordedPuzzleStart, checkAttempts, lockedCount, game.itemPlacements, game.zoneOrder, game.lockedItems, game.revealedRules, recordPuzzleCompletion, puzzleData.id, isPuzzleCompleted]);
  
  // Automatically reveal solution when summary sheet is shown
  useEffect(() => {
    if (showLossSheet && isGameOver && !solutionRevealed) {
      // When revealing the solution after a loss, mark every item the player
      // did not have locked as "incorrect" for post-mortem styling.
      setIncorrectItemIds(prev => {
        const allFailed = new Set(prev);
        puzzleData.items.forEach(item => {
          if (!game.lockedItems.has(item.id)) {
            allFailed.add(item.id);
          }
        });
        return allFailed;
      });

      setSolutionRevealed(true);
      game.autoPlaceAllItems();
    }
  }, [showLossSheet, isGameOver, solutionRevealed, puzzleData.items, game.lockedItems, game]);
  
  // Reset game state when puzzle changes (but preserve state if puzzle is already completed)
  useEffect(() => {
    // Only reset when puzzle actually changes, not when completion check function changes
    const puzzleChanged = prevPuzzleIdRef.current !== puzzleData.id;
    if (!puzzleChanged && prevPuzzleIdRef.current !== undefined) {
      return; // Don't reset if puzzle hasn't changed
    }
    
    if (puzzleData.id) {
      prevPuzzleIdRef.current = puzzleData.id;
    }
    
    const wasCompleted = puzzleData.id ? checkIsPuzzleCompleted(puzzleData.id) : false;
    const puzzleStats = puzzleData.id ? stats.stats.puzzles[puzzleData.id] : undefined;
    
    setIncorrectItemIds(new Set());
    // Restore check attempts from stats if puzzle was completed, otherwise reset to 0
    if (wasCompleted && puzzleStats) {
      setCheckAttempts(puzzleStats.attempts);
    } else {
      setCheckAttempts(0);
    }
    setCanCheckPuzzle(!wasCompleted); // Disable check button if completed
    setHasRecordedPuzzleStart(false);
    setHasRecordedCompletion(wasCompleted); // Mark as recorded if already completed
    setJustLockedIds(new Set());
    setShowTryAgain(false);
    setIsButtonShaking(false);
    setIsCelebrating(false);
    setHintsUsed(0);
    setIsHintMenuOpen(false);
    if (hintMenuTimeoutRef.current) {
      clearTimeout(hintMenuTimeoutRef.current);
      hintMenuTimeoutRef.current = null;
    }
    setIsGameOver(false);
    setShowLossSheet(false);
    
    // Check if this puzzle's summary was dismissed
    const isDismissed = puzzleData.id ? dismissedPuzzlesRef.current.has(puzzleData.id) : false;
    
    // Show success sheet if puzzle was already completed AND user hasn't dismissed it for this puzzle
    setShowSuccessSheet(wasCompleted && !isDismissed);
    setHasSeenSummary(false); // Reset to false so the summary sheet shows when reopening
    setSolutionRevealed(false);
    setFinalCorrectCount(null);
    
    if (puzzleData.id && puzzleData.id.includes('-')) {
      const puzzleDate = new Date(puzzleData.id);
      setArchiveMonth(new Date(puzzleDate.getFullYear(), puzzleDate.getMonth(), 1));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [puzzleData.id]); // Only depend on puzzleData.id - use ref to track actual changes


  return (
    <>
      {/* Game Start Screen */}
      <GameStart
        isOpen={!hasStartedGame && currentView !== 'how-to-play'}
        onPlay={() => {
          // If first-time user, show How to Play instead of starting game
          if (showHowToPlayOnStart) {
            setCurrentView('how-to-play');
            setHasStartedGame(true); // Hide the start screen
          } else {
            setHasStartedGame(true);
          }
        }}
        puzzleNumber={puzzleNumber}
        puzzleDate={puzzleData.id}
      />

      {/* Main Game UI */}
      {hasStartedGame && (
        <DndProvider
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
          activeId={activeCardId}
          renderOverlay={renderOverlay}
        >
        <div className="h-screen bg-[#FAFAFA] flex items-center justify-center p-0 safe-area overflow-hidden" style={{ height: '100dvh' }}>
      <div className="w-full max-w-[428px] bg-[#FAFAFA] flex flex-col h-full mx-auto shadow-lg relative">
        {/* Progress Bar */}
        <div className="w-full h-1 bg-slate-200/50 relative overflow-hidden flex-shrink-0">
          {lockedCount > 0 && (
            <div 
              className="h-full bg-[#B2EBF2] transition-all duration-300 ease-out absolute left-0"
              style={{ width: `${(lockedCount / totalItems) * 100}%` }}
            />
          )}
        </div>

        {/* Date and Difficulty Indicator (Spectrum-style) */}
        {formatPuzzleDate() && (
          <div className="w-full bg-[#FAFAFA] px-3 pt-2.5 pb-1.5 flex-shrink-0">
            <div className="text-xs text-slate-600 font-normal flex items-center gap-1.5">
              <span>{formatPuzzleDate()}</span>
              <span className="w-1 h-1 rounded-full bg-yellow-400 flex-shrink-0" />
              <span>{getDifficultyLabel()}</span>
            </div>
          </div>
        )}
        
        {/* Header with Logo and Progress */}
        <header className="w-full bg-[#FAFAFA] border-b border-slate-200/50 px-3 py-2.5 sm:py-2 flex-shrink-0 pt-safe">
          <div className="w-full mx-auto flex items-center justify-between">
            <motion.div 
              key={lockedCount}
              initial={{ scale: 1.2, opacity: 0.5 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="text-xs text-slate-600 font-medium"
            >
              {lockedCount}/{totalItems} locked
            </motion.div>
            <button
              type="button"
              onClick={() => setHasStartedGame(false)}
              className="hover:opacity-80 transition-opacity cursor-pointer"
              aria-label="Return to start screen"
            >
              <img
                src="/vennstack.png"
                alt="VennStack Logo"
                className="h-7 sm:h-8 w-auto"
              />
            </button>
            <div className="flex items-center gap-1">
              {/* Hint icon */}
              <div className="relative">
                <motion.button
                  type="button"
                  onClick={() => {
                    // Toggle the hint options menu; actual hint is chosen from the menu
                    setIsHintMenuOpen(prev => {
                      const newState = !prev;
                      // Clear timeout when toggling
                      if (hintMenuTimeoutRef.current) {
                        clearTimeout(hintMenuTimeoutRef.current);
                        hintMenuTimeoutRef.current = null;
                      }
                      return newState;
                    });
                  }}
                  className={`
                    p-2 rounded-lg transition-colors text-slate-600
                    hover:bg-slate-100
                    ${showHintNudge && !isPuzzleComplete && !isGameOver ? 'bg-sky-50 ring-2 ring-sky-300 ring-offset-1 ring-offset-[#FAFAFA]' : ''}
                  `}
                  aria-label="Get a hint"
                  animate={
                    showHintNudge && !isPuzzleComplete && !isGameOver
                      ? { scale: [1, 1.1, 1], boxShadow: ['0 0 0 rgba(59,130,246,0.0)', '0 0 18px rgba(59,130,246,0.45)', '0 0 0 rgba(59,130,246,0.0)'] }
                      : { scale: 1, boxShadow: '0 0 0 rgba(0,0,0,0)' }
                  }
                  transition={{
                    duration: 0.9,
                    ease: 'easeInOut',
                    repeat: showHintNudge && !isPuzzleComplete && !isGameOver ? 2 : 0,
                  }}
                >
                  <HelpCircle size={18} />
                </motion.button>

                {/* Hint options menu */}
                <AnimatePresence>
                  {isHintMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -6 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -6 }}
                      transition={{ duration: 0.18 }}
                      className="absolute right-0 top-full mt-1 w-52 bg-white rounded-xl shadow-xl border border-slate-200/60 z-50 overflow-hidden"
                      onMouseEnter={() => {
                        // Clear timeout if mouse re-enters
                        if (hintMenuTimeoutRef.current) {
                          clearTimeout(hintMenuTimeoutRef.current);
                          hintMenuTimeoutRef.current = null;
                        }
                      }}
                      onMouseLeave={() => {
                        // Close menu after 2 seconds when mouse leaves
                        hintMenuTimeoutRef.current = setTimeout(() => {
                          setIsHintMenuOpen(false);
                          hintMenuTimeoutRef.current = null;
                        }, 2000);
                      }}
                    >
                      {canUseHintAction ? (
                        <button
                          type="button"
                          onClick={() => {
                            if (!(game as any).revealOneHint) return;
                            const revealedId = (game as any).revealOneHint();
                            if (revealedId) {
                              setHintsUsed(prev => prev + 1);
                              setJustLockedIds(new Set([revealedId]));
                              setTimeout(() => setJustLockedIds(new Set()), 450);
                              playHintSound();
                            }
                            setIsHintMenuOpen(false);
                            if (hintMenuTimeoutRef.current) {
                              clearTimeout(hintMenuTimeoutRef.current);
                              hintMenuTimeoutRef.current = null;
                            }
                          }}
                          className="w-full text-left px-3 py-2.5 text-xs sm:text-sm hover:bg-slate-50 text-slate-700"
                        >
                          Reveal a card&apos;s correct spot
                          <span className="block text-[10px] sm:text-[11px] text-slate-400 mt-0.5">
                            Hints left: {MAX_HINTS - hintsUsed}
                          </span>
                        </button>
                      ) : (
                        <div className="px-3 py-2.5 text-[10px] sm:text-[11px] text-slate-500">
                          {!hasPlacedItems
                            ? 'Place at least one card on the board to request a hint.'
                            : hintsUsed >= MAX_HINTS
                            ? 'No hints left for this puzzle.'
                            : 'Hints are unavailable right now.'}
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              
              <button
                onClick={() => {
                  setIsMenuOpen(true);
                  setCurrentView('menu');
                }}
                className="p-2 rounded-lg hover:bg-slate-100 transition-colors text-slate-600"
                aria-label="Open menu"
              >
                <MenuIcon size={20} />
              </button>
            </div>
          </div>
        </header>

        {/* Main Game Area */}
        <main className="flex-1 min-h-0 overflow-hidden flex flex-col">
          <Board
            puzzle={game.puzzle}
            lockedItems={game.lockedItems}
            itemPlacements={game.itemPlacements}
            zoneOrder={game.zoneOrder}
            revealedRules={game.revealedRules}
            incorrectItems={incorrectItemIds}
            solutionRevealed={solutionRevealed}
            onReturnToPool={handleReturnToPool}
            isGameLocked={isPuzzleComplete || isGameOver}
            activeCardId={activeCardId}
            justLockedIds={justLockedIds}
            isCelebrating={isCelebrating}
          />
        </main>

        {/* Footer Section - Word Pool / Success Message / Share Bar and Button */}
        <motion.div className="flex-shrink-0 flex flex-col relative z-20">
          {/* Word Pool at Bottom (normal play) or Share Bar after loss/success + solution reveal */}
          {(solutionRevealed && isGameOver) || (isPuzzleComplete && !isGameOver && !solutionRevealed && hasSeenSummary && !showSuccessSheet) ? (
            <div className="bg-[#F8FAFC] border-t border-slate-200/30 border-b border-slate-200/30 px-3 pt-3 pb-3 sm:p-3 min-h-[6rem]">
              <div className="max-w-[428px] mx-auto flex flex-col gap-2">
                {hasSeenSummary && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      setCurrentView('archive');
                      if (puzzleData.id && puzzleData.id.includes('-')) {
                        const puzzleDate = new Date(puzzleData.id);
                        setArchiveMonth(new Date(puzzleDate.getFullYear(), puzzleDate.getMonth(), 1));
                      }
                    }}
                    className="w-full text-xs sm:text-sm font-semibold px-3 py-2 rounded-full border border-slate-300 text-slate-800 hover:bg-slate-50 transition-colors"
                  >
                    Play more in the archive
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleShareResult}
                  className="w-full text-xs sm:text-sm font-semibold px-3 py-2 rounded-full bg-[#B2EBF2] hover:bg-[#80DEEA] text-slate-800 transition-colors"
                >
                  Share Result
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-[#F8FAFC] border-t border-slate-200/30 border-b border-slate-200/30 px-3 pt-3 pb-3 sm:p-3 min-h-[6rem]">
              <WordPool
                items={game.puzzle.items}
                lockedItems={game.lockedItems}
                itemPlacements={game.itemPlacements}
                isGameLocked={isPuzzleComplete || isGameOver}
                activeCardId={activeCardId}
              />
            </div>
          )}

          {/* Attempt Progress Bar - Above Button */}
          {(isGameOver && hasSeenSummary && !showLossSheet) || (isPuzzleComplete && !isGameOver && !solutionRevealed && hasSeenSummary && !showSuccessSheet) ? (
            // After summary has been seen, show pulsing chevron instead of progress bar and button
            <div className="w-full bg-[#FAFAFA] px-3 pb-1 sm:pb-1.5">
              <div className="max-w-[428px] mx-auto relative w-full">
                <button
                  type="button"
                  onClick={() => {
                    if (isGameOver) {
                      setShowLossSheet(true);
                    } else if (isPuzzleComplete && !isGameOver && !solutionRevealed) {
                      setShowSuccessSheet(true);
                    }
                  }}
                  className="w-full flex flex-col items-center justify-center gap-1 py-2 pointer-events-auto"
                >
                  <motion.div
                    animate={{
                      y: [0, -4, 0],
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  >
                    <ChevronUp size={20} className="text-slate-500" />
                  </motion.div>
                  <span className="text-[10px] text-slate-500">Swipe for your summary</span>
                </button>
              </div>
            </div>
          ) : (
            <AttemptProgressBar
              attemptsUsed={checkAttempts}
              maxAttempts={MAX_CHECK_ATTEMPTS}
              buttonWidth={buttonWidth}
              isGameOver={isGameOver}
              isSuccess={isPuzzleComplete && !isGameOver && !solutionRevealed}
            />
          )}
          
          {/* Check / Share Button */}
          {!((isGameOver && hasSeenSummary && !showLossSheet) || (isPuzzleComplete && !isGameOver && !solutionRevealed && hasSeenSummary && !showSuccessSheet)) && (
          <div className="pt-1.5 px-3 sm:pt-2 sm:px-3 pointer-events-none flex-shrink-0 relative z-30 bg-[#FAFAFA]" style={{ paddingBottom: `max(0.75rem, env(safe-area-inset-bottom, 0.75rem))` }}>
            <div className="max-w-[428px] mx-auto relative w-full space-y-1.5">
              <motion.button
                ref={buttonRef}
                onClick={handlePrimaryButtonClick}
                disabled={!hasPlacedItems || !canCheckPuzzle || isGameOver}
                animate={{
                  scale: !hasPlacedItems || !canCheckPuzzle
                    ? 1
                    : isButtonShaking
                    ? [1, 1.02, 0.98, 1.02, 1]
                    : [1, 1.02, 1],
                  opacity: !hasPlacedItems || !canCheckPuzzle ? 0.6 : 1,
                }}
                transition={{
                  duration: 0.3,
                  ease: "easeInOut",
                }}
                whileHover={
                  !hasPlacedItems || !canCheckPuzzle
                    ? {}
                    : { scale: 1.02, boxShadow: "0 12px 32px rgba(178, 235, 242, 0.4)" }
                }
                whileTap={
                  !hasPlacedItems || !canCheckPuzzle
                    ? {}
                    : { scale: 0.95 }
                }
                className={`
                  w-full px-4 sm:px-6 py-2.5 sm:py-3 rounded-full font-semibold text-xs sm:text-sm
                  pointer-events-auto relative overflow-hidden
                  ${
                    isPuzzleComplete && !isGameOver && !solutionRevealed
                      ? 'bg-[#B2EBF2] text-slate-800 shadow-lg cursor-pointer'
                      : isGameOver
                      ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                      : !hasPlacedItems || !canCheckPuzzle
                      ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                      : 'bg-[#B2EBF2] text-slate-800 cursor-pointer'
                  }
                `}
                style={{ 
                  boxShadow:
                    isPuzzleComplete && !isGameOver && !solutionRevealed
                      ? '0 10px 30px rgba(178, 235, 242, 0.4)'
                      : !hasPlacedItems || !canCheckPuzzle
                      ? 'none'
                      : '0 8px 24px rgba(178, 235, 242, 0.3)' 
                }}
              >
                <span className="block">
                  {isPuzzleComplete && !isGameOver && !solutionRevealed
                    ? 'Share Result'
                    : isGameOver
                    ? 'Out of Attempts'
                    : showTryAgain
                    ? 'Try Again'
                    : 'Check Answer'}
                </span>
              </motion.button>

              {/* Secondary daily-game CTA: quick access to Stats after a win */}
              {isPuzzleComplete && !isGameOver && !solutionRevealed && (
                <button
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false);
                    setCurrentView('stats');
                  }}
                  className="mt-0.5 w-full text-[11px] sm:text-xs text-slate-500 hover:text-slate-700 font-medium text-center pointer-events-auto"
                >
                  See Stats
                </button>
              )}
            </div>
          </div>
          )}
        </motion.div>
      </div>

      {/* Menu */}
      <Menu 
        isOpen={isMenuOpen && currentView === 'menu'} 
        onClose={() => {
          setIsMenuOpen(false);
          setCurrentView(null);
        }}
        onNavigate={(view) => {
          setIsMenuOpen(false);
          
          if (view === 'stats') {
            setCurrentView('stats');
          } else if (view === 'archive') {
            setCurrentView('archive');
            if (puzzleData.id && puzzleData.id.includes('-')) {
              const puzzleDate = new Date(puzzleData.id);
              setArchiveMonth(new Date(puzzleDate.getFullYear(), puzzleDate.getMonth(), 1));
            }
          } else if (view === 'how-to-play') {
            setCurrentView('how-to-play');
          } else if (view === 'about') {
            setCurrentView('about');
          } else {
            setCurrentView(null);
          }
        }}
      />

      {/* Stats */}
      <Stats
        isOpen={currentView === 'stats'}
        onBack={() => {
          setCurrentView('menu');
        }}
        onReset={() => {
          // Clear dismissed puzzles ref when stats are reset
          dismissedPuzzlesRef.current.clear();
          // Reset first-time user flag so they see the tutorial again
          setShowHowToPlayOnStart(true);
        }}
      />

      {/* How to Play */}
      <HowToPlay
        isOpen={currentView === 'how-to-play'}
        onBack={() => {
          // If this was shown from the start screen, mark as played and start the game
          if (showHowToPlayOnStart) {
            const FIRST_TIME_KEY = 'vennstack_has_played';
            localStorage.setItem(FIRST_TIME_KEY, 'true');
            setShowHowToPlayOnStart(false);
            setHasStartedGame(true);
            setCurrentView(null);
          } else {
            // Otherwise, just go back to menu
            setCurrentView('menu');
          }
        }}
      />

      {/* About */}
      <About
        isOpen={currentView === 'about'}
        onBack={() => {
          setCurrentView('menu');
        }}
      />

      {/* Puzzle Archive */}
      {currentView === 'archive' && (
        <PuzzleArchive
          puzzles={allPuzzles}
          currentMonth={archiveMonth}
          onMonthChange={setArchiveMonth}
          onPuzzleSelect={(puzzle) => {
            setPuzzleData(puzzle);
            setCurrentView(null);
            setIsMenuOpen(false);
            // Close any open summary sheets when selecting a new puzzle
            setShowSuccessSheet(false);
            setShowLossSheet(false);
          }}
          onClose={() => {
            setCurrentView(null);
            setIsMenuOpen(false);
          }}
          activePuzzle={puzzleData}
        />
      )}

      {/* Confetti for success */}
      <Confetti isActive={isPuzzleComplete && !isGameOver && !solutionRevealed} />

      {/* Loss summary bottom sheet */}
      <LossSummarySheet
        isOpen={showLossSheet}
        totalItems={totalItems}
        correctFound={resultCorrect}
        attemptsUsed={checkAttempts}
        maxAttempts={MAX_CHECK_ATTEMPTS}
        shareGrid={shareGrid}
        countdownText={countdownText}
        onClose={() => {
          setShowLossSheet(false);
          setHasSeenSummary(true);
        }}
        onShare={handleShareResult}
        onOpenArchive={() => {
          setShowLossSheet(false);
          setHasSeenSummary(true); // Mark summary as seen so it doesn't reappear
          // Mark this puzzle's summary as dismissed
          if (puzzleData.id) {
            dismissedPuzzlesRef.current.add(puzzleData.id);
          }
          setIsMenuOpen(false);
          setCurrentView('archive');
          if (puzzleData.id && puzzleData.id.includes('-')) {
            const puzzleDate = new Date(puzzleData.id);
            setArchiveMonth(new Date(puzzleDate.getFullYear(), puzzleDate.getMonth(), 1));
          }
        }}
      />

      {/* Success summary bottom sheet */}
      <SuccessSummarySheet
        isOpen={showSuccessSheet}
        totalItems={totalItems}
        attemptsUsed={checkAttempts}
        maxAttempts={MAX_CHECK_ATTEMPTS}
        shareGrid={shareGrid}
        countdownText={countdownText}
        onClose={() => {
          setShowSuccessSheet(false);
          setHasSeenSummary(true);
          // Mark this puzzle's summary as dismissed
          if (puzzleData.id) {
            dismissedPuzzlesRef.current.add(puzzleData.id);
          }
        }}
        onShare={handleShareResult}
        onOpenArchive={() => {
          setShowSuccessSheet(false);
          setHasSeenSummary(true); // Mark summary as seen so it doesn't reappear
          // Mark this puzzle's summary as dismissed
          if (puzzleData.id) {
            dismissedPuzzlesRef.current.add(puzzleData.id);
          }
          setIsMenuOpen(false);
          setCurrentView('archive');
          if (puzzleData.id && puzzleData.id.includes('-')) {
            const puzzleDate = new Date(puzzleData.id);
            setArchiveMonth(new Date(puzzleDate.getFullYear(), puzzleDate.getMonth(), 1));
          }
        }}
      />
        </div>
        </DndProvider>
      )}
    </>
  );
}

export default App;
