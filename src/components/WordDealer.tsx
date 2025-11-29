import { useDroppable } from '@dnd-kit/core';
import { useMemo, useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Item, Zone } from '../types/game';
import { Card } from './Card';
import { ZoneDropData } from '../types/dnd';

interface WordDealerProps {
  items: Item[];
  lockedItems: Set<string>;
  itemPlacements: Map<string, Zone>;
  isGameLocked?: boolean;
  activeCardId?: string | null;
  onScrollStateChange?: (canScroll: boolean) => void;
}

export function WordDealer({ 
  items, 
  lockedItems, 
  itemPlacements, 
  isGameLocked,
  activeCardId,
  onScrollStateChange
}: WordDealerProps) {
  const { setNodeRef } = useDroppable({
    id: 'word-pool',
    data: { type: 'zone', zone: 'word-pool' } as ZoneDropData
  });

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [canScroll, setCanScroll] = useState(false);
  const canScrollRef = useRef(false);

  // Get available items (not locked, not placed)
  // Note: We keep activeCardId in the list but hide it with opacity
  // to prevent dnd-kit from losing the reference during drag
  const availableItems = useMemo(() => {
    return items.filter(
      item => !lockedItems.has(item.id) 
           && !itemPlacements.has(item.id)
    );
  }, [items, lockedItems, itemPlacements]);

  // Check scroll position and update chevron visibility
  const updateScrollIndicators = () => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const { scrollLeft, scrollWidth, clientWidth } = container;
    const isAtStart = scrollLeft <= 1;
    const isAtEnd = scrollLeft >= scrollWidth - clientWidth - 1;
    const scrollable = scrollWidth > clientWidth;

    setCanScrollLeft(scrollable && !isAtStart);
    setCanScrollRight(scrollable && !isAtEnd);
    
    // Update canScroll state and notify parent when it changes
    if (scrollable !== canScrollRef.current) {
      canScrollRef.current = scrollable;
      setCanScroll(scrollable);
      onScrollStateChange?.(scrollable);
    }
  };

  // Update indicators on scroll and when items change
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    // Initial check - this will also notify parent of initial scroll state
    updateScrollIndicators();

    container.addEventListener('scroll', updateScrollIndicators);
    // Also check on resize
    window.addEventListener('resize', updateScrollIndicators);

    return () => {
      container.removeEventListener('scroll', updateScrollIndicators);
      window.removeEventListener('resize', updateScrollIndicators);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [availableItems]);

  if (availableItems.length === 0) {
    // No cards left to deal
    return (
      <div
        ref={setNodeRef}
        data-zone="word-pool"
        className="bg-[#F8FAFC] border-t border-slate-200/30 border-b border-slate-200/30 p-4 min-h-[80px] flex items-center justify-center"
      >
        <div className="text-sm text-slate-400 font-medium">All cards placed!</div>
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      data-zone="word-pool"
      className="bg-[#F8FAFC] border-t border-slate-200/30 border-b border-slate-200/30 p-3 sm:p-4 min-h-[80px] relative"
    >
      {/* Horizontal scrollable container for all cards */}
      <div
        ref={scrollContainerRef}
        className="flex items-center gap-2 overflow-x-auto overflow-y-hidden scrollbar-hide pb-1"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch',
          // When no scrolling is needed, disable horizontal touch actions to allow dragging
          // This prevents the scroll container from intercepting horizontal drag gestures
          // pan-x allows horizontal scrolling when needed, pan-y only allows vertical when not scrolling
          touchAction: canScroll ? 'pan-x pan-y' : 'pan-y',
        }}
      >
        {availableItems.map((item) => (
          <div 
            key={item.id} 
            className="flex-shrink-0"
            // Hide the original card while dragging, but keep it in the DOM
            style={{ opacity: item.id === activeCardId ? 0 : 1 }}
          >
            <Card
              item={item}
              state="unlocked"
              zoneType="word-pool"
              isGameLocked={isGameLocked}
            />
          </div>
        ))}
      </div>

      {/* Left scroll indicator */}
      {canScrollLeft && (
        <div className="absolute left-0 top-0 bottom-0 w-24 flex items-center pointer-events-none">
          <div
            className="w-full h-full flex items-center justify-start pl-2"
            style={{
              background: 'linear-gradient(to right, rgba(248, 250, 252, 1), rgba(248, 250, 252, 0))',
            }}
          >
            <motion.div
              style={{
                height: '60px',
                width: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
              }}
              animate={{
                opacity: [1, 0.6, 1],
              }}
              transition={{
                duration: 2.5,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            >
              <div
                style={{
                  transform: 'scaleY(2.14)', // Scale to 60px height (60/28 ≈ 2.14)
                  transformOrigin: 'center',
                  display: 'inline-block',
                }}
              >
                <ChevronLeft 
                  strokeWidth={2.5}
                  style={{
                    height: '28px',
                    width: '20px',
                    display: 'block',
                    color: '#B2EBF2', // Match Check Answer button color
                  }}
                />
              </div>
            </motion.div>
          </div>
        </div>
      )}

      {/* Right scroll indicator */}
      {canScrollRight && (
        <div className="absolute right-0 top-0 bottom-0 w-24 flex items-center pointer-events-none">
          <div
            className="w-full h-full flex items-center justify-end pr-2"
            style={{
              background: 'linear-gradient(to left, rgba(248, 250, 252, 1), rgba(248, 250, 252, 0))',
            }}
          >
            <motion.div
              style={{
                height: '60px',
                width: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
              }}
              animate={{
                opacity: [1, 0.6, 1],
              }}
              transition={{
                duration: 2.5,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            >
              <div
                style={{
                  transform: 'scaleY(2.14)', // Scale to 60px height (60/28 ≈ 2.14)
                  transformOrigin: 'center',
                  display: 'inline-block',
                }}
              >
                <ChevronRight 
                  strokeWidth={2.5}
                  style={{
                    height: '28px',
                    width: '20px',
                    display: 'block',
                    color: '#B2EBF2', // Match Check Answer button color
                  }}
                />
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </div>
  );
}

