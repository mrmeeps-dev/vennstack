import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion } from 'framer-motion';
import { forwardRef } from 'react';
import { Check, X } from 'lucide-react';
import { Item, Zone as ZoneType } from '../types/game';
import { CARD_BASE_CLASSES, CARD_TEXT_SIZE, CARD_UTILITY_CLASSES, CARD_BOX_SHADOW } from './WordCard';
import { ZoneDensity } from '../hooks/useZoneDensity';
import { useDndAnimations } from '../hooks/useDndAnimations';
import { CardDragData } from '../types/dnd';

interface DraggableCardProps {
  item: Item;
  state: 'unlocked' | 'locked' | 'incorrect';
  zoneType?: ZoneType;
  density?: ZoneDensity;
  onReturnToPool?: (itemId: string) => void;
  isLocked?: boolean;
  forceReveal?: boolean;
  index?: number;
}

export const DraggableCard = forwardRef<HTMLDivElement, DraggableCardProps>(function DraggableCard({
  item,
  state,
  zoneType,
  density,
  onReturnToPool,
  isLocked = false,
  forceReveal = false,
  index = 0,
}, forwardedRef) {
  const animations = useDndAnimations();
  
  const negativeMargin = density?.negativeMargin ?? '0px';
  const stacking = density?.stacking ?? false;
  const fontSize = density?.fontSize ?? 'text-sm';

  // Determine if this card can be dragged
  const isDraggable = !isLocked && state !== 'locked';

  // Use @dnd-kit's useSortable hook
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({
    id: item.id,
    data: {
      type: 'card',
      cardId: item.id,
      sourceZone: zoneType || 'word-pool'
    } as CardDragData,
    disabled: state === 'locked' || isLocked
  });

  // Get color based on zone and state
  const getCardStyle = () => {
    if (state === 'locked' && zoneType) {
      switch (zoneType) {
        case 'left':
          return 'bg-white border-2 border-[#14B8A6] text-[#14B8A6]';
        case 'right':
          return 'bg-white border-2 border-[#A855F7] text-[#A855F7]';
        case 'both':
          return 'bg-white border-2 border-[#60A5FA] text-[#60A5FA]';
        case 'outside':
          return 'bg-white border-2 border-[#94A3B8] text-[#94A3B8]';
        default:
          return 'bg-white border-2 border-[#60A5FA] text-[#60A5FA]';
      }
    } else if (state === 'incorrect') {
      return 'bg-white border-2 border-[#E57373] text-[#E57373]';
    } else {
      return 'bg-white border-2 border-[#E2E8F0] text-[#333333]';
    }
  };

  const getCheckmarkColor = () => {
    if (!zoneType) return '#60A5FA';
    switch (zoneType) {
      case 'left':
        return '#14B8A6';
      case 'right':
        return '#A855F7';
      case 'both':
        return '#60A5FA';
      case 'outside':
        return '#94A3B8';
      default:
        return '#60A5FA';
    }
  };

  // CRITICAL: Disable layoutId during drag to prevent conflicts
  const motionProps = {
    layout: !isDragging,
    layoutId: isDragging ? undefined : `card-${item.id}`,
    transition: animations.drop
  };

  // Combine @dnd-kit transform with custom styles
  const combinedStyle = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0 : 1, // Hide original, overlay shows clone
    marginBottom: stacking ? negativeMargin : undefined,
    zIndex: stacking ? 'auto' : undefined,
    pointerEvents: isDragging ? 'none' as const : 'auto' as const
  };

  // Render locked card (not draggable, with checkmark)
  if (state === 'locked') {
    return (
      <motion.div
        ref={forwardedRef}
        {...motionProps}
        className="relative outline-none w-max"
        initial={forceReveal ? { scale: 0.8, opacity: 0, rotate: -5 } : false}
        animate={forceReveal ? { scale: 1, opacity: 1, rotate: 0 } : {}}
        transition={forceReveal ? {
          scale: { 
            duration: 0.25, 
            delay: index * 0.03,
            ease: [0.34, 1.56, 0.64, 1]
          },
          opacity: { 
            duration: 0.2, 
            delay: index * 0.03,
            ease: 'easeOut'
          },
          rotate: { 
            duration: 0.25, 
            delay: index * 0.03,
            ease: [0.34, 1.56, 0.64, 1]
          },
        } : animations.drop}
        data-card-id={item.id}
        data-zone={zoneType || 'word-pool'}
      >
        <div
          style={{
            boxShadow: CARD_BOX_SHADOW,
          }}
          className={`${CARD_BASE_CLASSES} ${CARD_UTILITY_CLASSES} ${getCardStyle()} ${CARD_TEXT_SIZE} font-medium flex items-center justify-center gap-1`}
        >
          <Check size={12} color={getCheckmarkColor()} />
          <span className={`${fontSize} whitespace-nowrap overflow-hidden text-ellipsis max-w-full`}>
            {item.text}
          </span>
        </div>
      </motion.div>
    );
  }

  // Combine refs - use setNodeRef from useSortable for draggable cards
  const combinedRef = (node: HTMLDivElement | null) => {
    setNodeRef(node);
    if (typeof forwardedRef === 'function') {
      forwardedRef(node);
    } else if (forwardedRef) {
      forwardedRef.current = node;
    }
  };

  // Render unlocked or incorrect card (draggable)
  return (
    <motion.div
      ref={combinedRef}
      style={combinedStyle}
      {...motionProps}
      {...attributes}
      {...listeners}
      className={`relative outline-none w-max ${isDraggable ? 'cursor-grab active:cursor-grabbing' : 'cursor-not-allowed'}`}
      data-card-id={item.id}
      data-zone={zoneType || 'word-pool'}
    >
      <div
        style={{
          boxShadow: CARD_BOX_SHADOW,
        }}
        className={`${CARD_BASE_CLASSES} ${CARD_UTILITY_CLASSES} ${getCardStyle()} ${CARD_TEXT_SIZE} font-medium flex items-center justify-center gap-1`}
      >
        {state === 'incorrect' && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              if (onReturnToPool) {
                onReturnToPool(item.id);
              }
            }}
            onPointerDown={(e) => {
              e.stopPropagation();
            }}
            className="rounded p-0.5 cursor-pointer flex-shrink-0"
            aria-label="Return to word pool"
            type="button"
          >
            <X size={12} color="#E57373" />
          </button>
        )}
        <span className={`${fontSize} whitespace-nowrap overflow-hidden text-ellipsis max-w-full ${state === 'incorrect' ? 'flex-1' : ''}`}>
          {item.text}
        </span>
      </div>
    </motion.div>
  );
});
