import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { useState, useEffect } from 'react';
import { Item, Zone } from '../types/game';
import { CardDragData } from '../types/dnd';

interface CardProps {
  item: Item;
  state: 'unlocked' | 'locked' | 'incorrect';
  zoneType?: Zone | 'word-pool';
  onReturnToPool?: (itemId: string) => void;
  isGameLocked?: boolean;
  justLocked?: boolean;
  solutionRevealed?: boolean;
  wasIncorrect?: boolean;
  isCelebrating?: boolean;
}

export function Card({ 
  item, 
  state, 
  zoneType, 
  onReturnToPool, 
  isGameLocked,
  justLocked = false,
  solutionRevealed = false,
  wasIncorrect = false,
  isCelebrating = false
}: CardProps) {
  const [animationClass, setAnimationClass] = useState('');

  // Cards are draggable if game is not locked and card is either unlocked or incorrect
  // (incorrect cards should be draggable so users can move them to try different categories)
  const isDraggable = !isGameLocked && (state === 'unlocked' || state === 'incorrect');

  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: item.id,
    data: {
      type: 'card',
      cardId: item.id,
      sourceZone: zoneType || 'word-pool'
    } as CardDragData,
    disabled: !isDraggable
  });

  // Handle lock animation
  useEffect(() => {
    if (justLocked) {
      setAnimationClass('just-locked');
      const timer = setTimeout(() => setAnimationClass(''), 450);
      return () => clearTimeout(timer);
    }
  }, [justLocked]);

  // Note: Card must remain in DOM during drag for dnd-kit to maintain reference
  // It will be hidden via opacity in WordDealer.tsx

  // Dynamic font sizing for long words to prevent line breaks
  const getFontSize = () => {
    const textLength = item.text.length;
    if (textLength > 12) {
      return 'text-xs'; // 12px for very long words
    } else if (textLength > 9) {
      return 'text-[13px]'; // 13px for long words
    }
    return 'text-sm'; // 14px default
  };

  // Only apply transform if it exists
  const style = transform ? {
    transform: CSS.Translate.toString(transform),
  } : undefined;

  const getCardClasses = () => {
    // Ensure minimum 44px height for WCAG 2.5.5 AAA touch target compliance
    // Reduced padding (py-1) for more compact display
    // Softer, more modern styling: thinner borders, softer shadows, more rounded
    // Font size is applied dynamically via getFontSize()
    const base = 'card px-3 py-1 rounded-xl font-medium select-none min-h-[44px] flex items-center justify-center relative';
    const shadow = 'shadow-[0_1px_3px_0_rgba(0,0,0,0.08),0_1px_2px_0_rgba(0,0,0,0.04)]';
    
    if (state === 'locked') {
      // In solution view, locked cards that were incorrect for the player
      // should read as "wrong": red text and red outline.
      if (solutionRevealed && wasIncorrect) {
        return `${base} ${shadow} bg-white border border-red-300 text-red-600`;
      }

      // Locked & correct: keep default text color, rely on border color change for feedback
      // Match the outline color to the stronger category title colors.
      const borderColors = {
        // Match Zone label colors: #0D9488, #9333EA, #3B82F6, #64748B
        left: 'border-[#0D9488]',
        right: 'border-[#9333EA]',
        both: 'border-[#3B82F6]',
        outside: 'border-[#64748B]',
      } as const;

      const borderClass = borderColors[zoneType as Zone] || 'border-[#3B82F6]';

      return `${base} ${shadow} bg-white border ${borderClass} text-gray-700`;
    }

    if (state === 'incorrect') {
      // Incorrect cards: red outline only, keep default text color
      // Incorrect cards are draggable, so add cursor styles
      const cursorClasses = !isGameLocked ? 'cursor-grab active:cursor-grabbing hover:border-red-500' : '';
      return `${base} ${shadow} incorrect bg-white border-2 border-red-500 text-gray-700 ${cursorClasses}`;
    }
    
    return `${base} ${shadow} bg-white/95 border border-gray-200/80 text-gray-700 cursor-grab active:cursor-grabbing hover:border-gray-300/80 hover:bg-white`;
  };

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        ...(isDraggable ? { touchAction: 'pan-x' as const } : {}),
      }}
      className={`${getCardClasses()} ${animationClass} ${isCelebrating && state === 'locked' ? 'celebrate-pulse' : ''} ${solutionRevealed && wasIncorrect ? 'solution-float' : ''}`}
      {...(isDraggable ? attributes : {})}
      {...(isDraggable ? listeners : {})}
      data-card-id={item.id}
      data-zone={zoneType}
    >
      {/* Text is always in the same position - no icons to avoid layout shift */}
      <span className={getFontSize()}>{item.text}</span>
    </div>
  );
}

