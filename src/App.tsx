import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { DragDropContext, DropResult, DragStart } from '@hello-pangea/dnd';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu as MenuIcon, Eye } from 'lucide-react';
import { Board } from './components/Board';
import { WordPool } from './components/WordPool';
import { AttemptProgressBar } from './components/AttemptProgressBar';
import { Menu } from './components/Menu';
import { Stats } from './components/Stats';
import { PuzzleArchive } from './components/PuzzleArchive';
import { Confetti } from './components/Confetti';
import { GameResults } from './components/GameResults';
import { useVennEngine } from './hooks/useVennEngine';
import { useStats } from './hooks/useStats';
import samplePuzzle from './data/samplePuzzle.json';
import { PuzzleData, Zone as ZoneType } from './types/game';
import { checkForDuplicates } from './utils/debug';

function App() {
  const puzzleData = samplePuzzle as PuzzleData;
  const game = useVennEngine(puzzleData);
  const stats = useStats();
  const [shakingItemId, _setShakingItemId] = useState<string | null>(null);
  const [justLockedId, setJustLockedId] = useState<string | null>(null);
  const [incorrectItemIds, setIncorrectItemIds] = useState<Set<string>>(new Set());
  const [checkAttempts, setCheckAttempts] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentView, setCurrentView] = useState<'menu' | 'stats' | 'archive' | null>(null);
  const [canCheckPuzzle, setCanCheckPuzzle] = useState(true);
  const [hasRecordedPuzzleStart, setHasRecordedPuzzleStart] = useState(false);
  const [archiveMonth, setArchiveMonth] = useState(() => {
    // Initialize to current puzzle's month, or current month
    const puzzleDate = puzzleData.id && puzzleData.id.includes('-') 
      ? new Date(puzzleData.id) 
      : new Date();
    return new Date(puzzleDate.getFullYear(), puzzleDate.getMonth(), 1);
  });
  const previousPlacementsRef = useRef<string>('');
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [buttonWidth, setButtonWidth] = useState<number | null>(null);
  const MAX_CHECK_ATTEMPTS = 5;
  
  // For now, we have just one puzzle. In the future, this could load from a puzzles API
  const allPuzzles: PuzzleData[] = [puzzleData];

  const handleDragStart = (_start: DragStart) => {
    // No-op: We don't need to track drag state anymore
    // The library handles the drag preview, and we delay all state updates until after animation
  };

  const handleDragEnd = (result: DropResult) => {
    try {
      // Prevent dragging when game has ended
      if (gameEndState !== null) {
        return;
      }

      // Validation: Ensure result is valid
      if (!result || !result.draggableId) {
        console.error('❌ handleDragEnd: Invalid drag result, missing draggableId');
        return;
      }

      const itemId = result.draggableId;
      
      // Validation: Ensure item exists in puzzle
      const itemExists = game.puzzle.items.some(item => String(item.id) === itemId);
      if (!itemExists) {
        console.error(`❌ handleDragEnd: Item ${itemId} does not exist in puzzle`);
        return;
      }

      // Validation: Ensure source is valid
      if (!result.source || !result.source.droppableId) {
        console.error(`❌ handleDragEnd: Invalid source for item ${itemId}`);
        return;
      }

      console.log('🔄 Drag ended:', {
        draggableId: result.draggableId,
        source: result.source,
        destination: result.destination,
      });

      // If no destination, item was dropped outside (return to pool)
      if (!result.destination) {
        // Delay state update to allow drag animation to complete
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            game.removeItem(itemId);
            // Clear error state
            setIncorrectItemIds(prev => {
              const next = new Set(prev);
              next.delete(itemId);
              return next;
            });
          });
        });
        return;
      }

      // Validation: Ensure destination is valid
      if (!result.destination.droppableId || typeof result.destination.index !== 'number') {
        console.error(`❌ handleDragEnd: Invalid destination for item ${itemId}`);
        return;
      }

      const sourceDroppableId = result.source.droppableId;
      const destinationDroppableId = result.destination.droppableId;
      const destinationIndex = result.destination.index;
      
      // Validation: Ensure destination index is non-negative
      if (destinationIndex < 0) {
        console.error(`❌ handleDragEnd: Invalid destination index ${destinationIndex} for item ${itemId}`);
        return;
      }

    // If dropped on WordPool, remove from placements (return to pool)
    if (destinationDroppableId === 'word-pool') {
      // Delay state update to allow drag animation to complete
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          game.removeItem(itemId);
          // Clear error state
          setIncorrectItemIds(prev => {
            const next = new Set(prev);
            next.delete(itemId);
            return next;
          });
        });
      });
      return;
    }

    // Check if this is a reorder within the same zone
    if (sourceDroppableId === destinationDroppableId && sourceDroppableId !== 'word-pool') {
      // Same zone reorder - no cross-zone unmounting needed
      const zone = sourceDroppableId as ZoneType;
      const zoneOrder = game.zoneOrder.get(zone) || [];
      const sourceIndex = result.source.index;
      
      // Only reorder if the index actually changed
      if (sourceIndex !== destinationIndex) {
        // Find the item at the destination index (the item we're moving relative to)
        // We need to account for the fact that the item being moved might already be in the list
        const adjustedOrder = zoneOrder.filter(id => id !== itemId);
        let overId: string;
        
        if (destinationIndex === 0) {
          // Moving to the beginning - use the first item as reference
          overId = adjustedOrder[0] || itemId;
        } else if (destinationIndex <= adjustedOrder.length) {
          // Moving to a position - use the item at that position as reference
          overId = adjustedOrder[destinationIndex - 1] || itemId;
        } else {
          // Moving to the end - use the last item as reference
          overId = adjustedOrder[adjustedOrder.length - 1] || itemId;
        }
        
        // Delay state update to allow drag animation to complete
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            game.reorderItemsInZone(zone, itemId, overId);
            
            // Clear error state for this specific item when moved
            setIncorrectItemIds(prev => {
              const next = new Set(prev);
              next.delete(itemId);
              return next;
            });
          });
        });
        
        return;
      }
    }

      // Cross-zone drag or drag from pool to zone
      const targetZone = destinationDroppableId as ZoneType;
      
      // Validation: Ensure targetZone is a valid zone type
      const validZones: ZoneType[] = ['left', 'right', 'both', 'outside'];
      if (!validZones.includes(targetZone)) {
        console.error(`❌ handleDragEnd: Invalid target zone ${targetZone} for item ${itemId}`);
        return;
      }
      
      // Calculate insertAfterId based on destination index
      const zoneOrder = game.zoneOrder.get(targetZone) || [];
      let insertAfterId: string | null | undefined = undefined;
      
      if (destinationIndex === 0) {
        // Insert at beginning
        insertAfterId = null;
      } else if (destinationIndex <= zoneOrder.length) {
        // Insert after the item at (destinationIndex - 1)
        // But we need to account for the fact that the item being moved might already be in this zone
        const adjustedOrder = zoneOrder.filter(id => id !== itemId);
        if (destinationIndex - 1 < adjustedOrder.length) {
          insertAfterId = adjustedOrder[destinationIndex - 1];
        } else {
          // Insert at end
          insertAfterId = adjustedOrder[adjustedOrder.length - 1] || undefined;
        }
      }

      // Check for duplicates before placement (only log if found)
      const currentZoneInOrder: ZoneType[] = [];
      for (const [zone, order] of game.zoneOrder.entries()) {
        if (order.includes(itemId)) {
          currentZoneInOrder.push(zone);
        }
      }
      if (currentZoneInOrder.length > 1) {
        console.error(`❌ BEFORE placeItem: Item ${itemId} already in multiple zones!`, currentZoneInOrder);
      }
      
      // CRITICAL: Delay ALL state updates to allow drag animation to complete
      // This prevents React from re-rendering and moving Draggables during animation
      // The library's drag preview handles the visual during drag
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          // 1. EXECUTE PLACEMENT FIRST: Place the item before clearing error state
          game.placeItem(itemId, targetZone, insertAfterId);
          
          // 2. THEN, clear error state: Now that placement is complete, clear the error state
          setIncorrectItemIds(prev => {
            const next = new Set(prev);
            next.delete(itemId);
            return next;
          });
        });
      });
      
      // FINAL DEBUG CHECK: Verify item is only in one zone after placement
      // Use a longer timeout to ensure React state updates have completed
      // React 18 batches updates more aggressively, so we need to wait a bit longer
      setTimeout(() => {
        const finalPlacement = game.itemPlacements.get(itemId);
        const zonesInOrder: ZoneType[] = [];
        for (const [zone, order] of game.zoneOrder.entries()) {
          if (order.includes(itemId)) {
            zonesInOrder.push(zone);
          }
        }
        
        if (zonesInOrder.length > 1) {
          console.error(`❌ DRAG END DUPLICATE: Item ${itemId} in multiple zoneOrders:`, zonesInOrder);
          console.error(`   itemPlacements says:`, finalPlacement);
        } else if (zonesInOrder.length === 0 && finalPlacement !== undefined) {
          console.warn(`⚠️ DRAG END: Item ${itemId} in itemPlacements (${finalPlacement}) but not in zoneOrder`);
        } else if (finalPlacement !== undefined && finalPlacement !== targetZone) {
          // Only warn if placement exists but doesn't match (undefined is expected during state update)
          console.warn(`⚠️ DRAG END: Item ${itemId} placement mismatch. Expected: ${targetZone}, Got: ${finalPlacement}`);
        } else if (finalPlacement === targetZone) {
          console.log(`✅ DRAG END: Item ${itemId} successfully placed in ${targetZone}`);
        }
        // If finalPlacement is undefined, state update is still in progress - this is normal
      }, 50);
    } catch (error) {
      console.error('❌ handleDragEnd: Error during drag operation:', error);
      // Don't throw - just log the error to prevent app crash
    }
  };

  const handleReturnToPool = (itemId: string) => {
    // Remove item from placements to return it to word pool
    game.removeItem(itemId);
    // Also remove from incorrect items set
    setIncorrectItemIds(prev => {
      const next = new Set(prev);
      next.delete(itemId);
      if (next.size === 0) {
      }
      return next;
    });
  };

  // Record puzzle start on mount
  useEffect(() => {
    if (!hasRecordedPuzzleStart) {
      stats.recordPuzzleStart(puzzleData.id);
      setHasRecordedPuzzleStart(true);
    }
  }, [hasRecordedPuzzleStart, stats, puzzleData.id]);

  const handleCheckPuzzle = () => {
    // Disable button until user makes a change
    setCanCheckPuzzle(false);
    
    // Increment check attempts
    setCheckAttempts(prev => prev + 1);
    
    // Record attempt in stats
    stats.recordAttempt(puzzleData.id);
    
    const result = game.validatePuzzle();
    
    // Track if there are incorrect items
    setIncorrectItemIds(new Set(result.incorrect));
    
    // Store current placements to detect changes
    previousPlacementsRef.current = JSON.stringify(Array.from(game.itemPlacements.entries()));
    
    // Note: Incorrect items now stay in place with error state (red border + X)
    // They can be dragged to a new position or back to the pool

    // Show success feedback for correct items
    result.correct.forEach(itemId => {
      setJustLockedId(itemId);
      setTimeout(() => setJustLockedId(null), 400);
    });
  };

  // Detect changes to itemPlacements to re-enable the button
  useEffect(() => {
    if (!canCheckPuzzle) {
      const currentPlacements = JSON.stringify(Array.from(game.itemPlacements.entries()));
      if (currentPlacements !== previousPlacementsRef.current) {
        setCanCheckPuzzle(true);
        previousPlacementsRef.current = currentPlacements;
      }
    } else {
      // Update ref when button is enabled to track future changes
      previousPlacementsRef.current = JSON.stringify(Array.from(game.itemPlacements.entries()));
    }
  }, [game.itemPlacements, canCheckPuzzle]);

  // Make game state available globally for debugging (call checkForDuplicates manually when needed)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).checkForDuplicates = () => checkForDuplicates(game);
      (window as any).vennGameState = game;
    }
  }, [game]);


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

  // Calculate progress: how many items are placed (including items in "outside"/"neither" zone)
  const placedCount = game.itemPlacements.size;
  const totalItems = game.puzzle.items.length;
  const hasPlacedItems = placedCount > 0;
  
  // Calculate locked (correctly placed) items
  const lockedCount = game.lockedItems.size;
  const isPuzzleComplete = lockedCount === totalItems && totalItems > 0;

  // Track puzzle completion
  const [hasRecordedCompletion, setHasRecordedCompletion] = useState(false);
  useEffect(() => {
    if (isPuzzleComplete && !hasRecordedCompletion && hasRecordedPuzzleStart) {
      const itemsPlaced = Array.from(game.itemPlacements.values()).filter(zone => zone !== 'outside').length;
      stats.recordPuzzleCompletion(checkAttempts, lockedCount, itemsPlaced, puzzleData.id);
      setHasRecordedCompletion(true);
    }
  }, [isPuzzleComplete, hasRecordedCompletion, hasRecordedPuzzleStart, checkAttempts, lockedCount, game.itemPlacements, stats, puzzleData.id]);

  // End game state detection
  const [gameEndState, setGameEndState] = useState<'success' | 'failed' | null>(null);
  const [userIncorrectItems, setUserIncorrectItems] = useState<Set<string>>(new Set());
  const [hasAutoPlaced, setHasAutoPlaced] = useState(false);
  const [showGameResults, setShowGameResults] = useState(false);
  
  useEffect(() => {
    if (isPuzzleComplete && !gameEndState) {
      setGameEndState('success');
      // Show results modal after a brief delay
      setTimeout(() => {
        setShowGameResults(true);
      }, 500);
    } else if (checkAttempts >= MAX_CHECK_ATTEMPTS && !isPuzzleComplete && !gameEndState) {
      setGameEndState('failed');
      // Store which items were incorrectly placed by the user before auto-placement
      const incorrect = Array.from(game.itemPlacements.entries())
        .filter(([itemId, zone]) => {
          const item = game.puzzle.items.find(i => i.id === itemId);
          return item && item.zone !== zone && zone !== 'outside';
        })
        .map(([itemId]) => itemId);
      setUserIncorrectItems(new Set(incorrect));
      
      // Auto-place all items in correct zones after a brief delay for the message to appear
      if (!hasAutoPlaced) {
        setTimeout(() => {
          game.autoPlaceAllItems();
          // Show results modal after auto-placement animation (reduced delay since animations are faster)
          setTimeout(() => {
            setShowGameResults(true);
          }, 1000);
        }, 500); // Delay to let user see the message, then items will smoothly animate into place
        setHasAutoPlaced(true);
      }
    }
  }, [isPuzzleComplete, checkAttempts, gameEndState, game.itemPlacements, game.puzzle.items, game, hasAutoPlaced]);

  return (
    <DragDropContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="h-screen bg-[#FAFAFA] flex items-center justify-center p-0 safe-area overflow-hidden" style={{ height: '100dvh' }}>
        <div className="w-full max-w-[428px] bg-[#FAFAFA] flex flex-col h-full mx-auto shadow-lg relative">
          {/* Progress Bar */}
          <div className="w-full h-1 bg-slate-200/50 relative overflow-hidden flex-shrink-0">
            {/* Locked (correctly placed) segment - matches check puzzle button color */}
            {lockedCount > 0 && (
              <div 
                className="h-full bg-[#06B6D4] transition-all duration-300 ease-out absolute left-0"
                style={{ width: `${(lockedCount / totalItems) * 100}%` }}
              />
            )}
          </div>
          
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
              <img
                src="/vennstack.png"
                alt="VennStack Logo"
                className="h-7 sm:h-8 w-auto"
              />
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
          </header>

          {/* Main Game Area */}
          <motion.main layout className="flex-1 min-h-0 pt-3 sm:pt-2 overflow-hidden flex flex-col">
            <Board
              puzzle={game.puzzle}
              lockedItems={game.lockedItems}
              itemPlacements={game.itemPlacements}
              zoneOrder={game.zoneOrder}
              revealedRules={game.revealedRules}
              incorrectItemIds={gameEndState === 'failed' ? userIncorrectItems : incorrectItemIds}
              onReturnToPool={gameEndState === null ? handleReturnToPool : undefined}
              isLocked={gameEndState !== null}
              forceReveal={gameEndState !== null}
            />
          </motion.main>

          {/* Footer Section - Word Pool and Button */}
          <motion.div layout className="flex-shrink-0 flex flex-col relative z-20">
            {/* Word Pool at Bottom */}
            <div className="bg-[#F8FAFC] border-t border-slate-200/30 border-b border-slate-200/30 px-3 pt-3 pb-3 sm:p-3 min-h-[6rem]">
              <WordPool
                items={game.puzzle.items}
                lockedItems={game.lockedItems}
                itemPlacements={game.itemPlacements}
                shakingItemId={shakingItemId}
                justLockedId={justLockedId}
                isLocked={gameEndState !== null}
              />
            </div>

            {/* Attempt Progress Bar - Above Button */}
            <AttemptProgressBar attemptsUsed={checkAttempts} maxAttempts={MAX_CHECK_ATTEMPTS} buttonWidth={buttonWidth} />
            
            {/* Check Puzzle Button - Floating Vibrant Pill */}
            <div className="pt-1.5 px-3 sm:pt-2 sm:px-3 pointer-events-none flex-shrink-0 relative z-30 bg-[#FAFAFA]" style={{ paddingBottom: `max(0.75rem, env(safe-area-inset-bottom, 0.75rem))` }}>
              <div className="max-w-[428px] mx-auto relative w-full">
              <motion.button
                ref={buttonRef}
                onClick={handleCheckPuzzle}
                disabled={!hasPlacedItems || checkAttempts >= MAX_CHECK_ATTEMPTS || !canCheckPuzzle || gameEndState !== null}
                animate={{
                  scale: !hasPlacedItems || checkAttempts >= MAX_CHECK_ATTEMPTS || !canCheckPuzzle || gameEndState !== null ? 1 : [1, 1.02, 1],
                  opacity: !hasPlacedItems || checkAttempts >= MAX_CHECK_ATTEMPTS || !canCheckPuzzle || gameEndState !== null ? 0.6 : 1,
                }}
                transition={{
                  duration: 0.3,
                  ease: "easeInOut",
                }}
                whileHover={
                  !hasPlacedItems || checkAttempts >= MAX_CHECK_ATTEMPTS || !canCheckPuzzle || gameEndState !== null
                    ? {}
                    : { scale: 1.02, boxShadow: "0 12px 32px rgba(6, 182, 212, 0.5)" }
                }
                whileTap={
                  !hasPlacedItems || checkAttempts >= MAX_CHECK_ATTEMPTS || !canCheckPuzzle || gameEndState !== null
                    ? {}
                    : { scale: 0.95 }
                }
                className={`
                  w-full px-4 sm:px-6 py-2.5 sm:py-3 rounded-full font-semibold text-xs sm:text-sm text-white
                  pointer-events-auto relative overflow-hidden
                  ${!hasPlacedItems || checkAttempts >= MAX_CHECK_ATTEMPTS || !canCheckPuzzle || gameEndState !== null
                    ? 'bg-slate-300 text-slate-500 cursor-not-allowed' 
                    : 'bg-[#06B6D4] cursor-pointer'
                  }
                `}
                style={{ 
                  boxShadow: !hasPlacedItems || checkAttempts >= MAX_CHECK_ATTEMPTS || !canCheckPuzzle || gameEndState !== null
                    ? 'none' 
                    : '0 8px 24px rgba(6, 182, 212, 0.4)' 
                }}
              >
                <AnimatePresence mode="wait">
                  <motion.span
                    key={`${canCheckPuzzle}-${checkAttempts}-${hasPlacedItems}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="block"
                  >
                    {checkAttempts >= MAX_CHECK_ATTEMPTS 
                      ? 'Solution Revealed' 
                      : !canCheckPuzzle && hasPlacedItems
                      ? 'Adjust placement to continue'
                      : 'Check Answer'
                    }
                  </motion.span>
                </AnimatePresence>
              </motion.button>
              </div>
            </div>
          </motion.div>


        </div>
      </div>

      {/* Menu */}
      <Menu 
        isOpen={isMenuOpen && currentView === 'menu'} 
        onClose={() => {
          setIsMenuOpen(false);
          setCurrentView(null);
        }}
        onNavigate={(view) => {
          // Close menu whenever any option is selected
          setIsMenuOpen(false);
          
          if (view === 'stats') {
            setCurrentView('stats');
          } else if (view === 'archive') {
            setCurrentView('archive');
            // Navigate to active puzzle's month when opening archive
            if (puzzleData.id && puzzleData.id.includes('-')) {
              const puzzleDate = new Date(puzzleData.id);
              setArchiveMonth(new Date(puzzleDate.getFullYear(), puzzleDate.getMonth(), 1));
            }
          } else {
            // For other views (how-to-play, about, contact), just close menu
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
      />

      {/* Puzzle Archive */}
      {currentView === 'archive' && (
        <PuzzleArchive
          puzzles={allPuzzles}
          currentMonth={archiveMonth}
          onMonthChange={setArchiveMonth}
          onPuzzleSelect={(_puzzle) => {
            // For now, just close the archive. In the future, this could load the selected puzzle
            setCurrentView(null);
            setIsMenuOpen(false);
            // TODO: Load and switch to the selected puzzle
          }}
          onClose={() => {
            setCurrentView(null);
            setIsMenuOpen(false);
          }}
          activePuzzle={puzzleData}
        />
      )}

      {/* Confetti for success */}
      <Confetti isActive={gameEndState === 'success'} />

      {/* Game Results Modal - Using Portal to bypass overflow constraints */}
      <GameResults
        isOpen={showGameResults}
        gameState={gameEndState}
        categories={puzzleData.rules}
        userState={game.itemPlacements}
        correctState={game.puzzle.items}
        totalItems={totalItems}
        attemptsUsed={checkAttempts}
        onClose={() => setShowGameResults(false)}
        onBackToMenu={() => {
          setShowGameResults(false);
          setIsMenuOpen(true);
          setCurrentView('menu');
        }}
        onReviewBoard={() => {
          setShowGameResults(false);
        }}
      />

      {/* Floating "Show Results" Button - Appears when game ended but modal is closed */}
      {gameEndState !== null && !showGameResults && createPortal(
        <motion.button
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 20 }}
          transition={{ type: 'spring', delay: 0.3 }}
          onClick={() => setShowGameResults(true)}
          className="fixed bottom-6 right-6 z-50 bg-[#06B6D4] hover:bg-[#0891B2] text-white px-4 py-3 rounded-full shadow-lg font-semibold text-sm flex items-center gap-2 transition-colors"
          style={{ 
            boxShadow: '0 8px 24px rgba(6, 182, 212, 0.4)',
            paddingBottom: `max(0.75rem, calc(0.75rem + env(safe-area-inset-bottom, 0)))`
          }}
        >
          <Eye size={18} />
          Show Results
        </motion.button>,
        document.body
      )}
    </DragDropContext>
  );
}

export default App;

