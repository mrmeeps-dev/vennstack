import { useMemo, memo } from 'react';
import { Droppable, Draggable } from '@hello-pangea/dnd';
import { Zone as ZoneType, Item } from '../types/game';
import { Check, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { CARD_BASE_CLASSES, CARD_TEXT_SIZE, CARD_UTILITY_CLASSES, CARD_BOX_SHADOW } from './WordCard';
import { useZoneDensity, ZoneDensity } from '../hooks/useZoneDensity';

// Constant empty Set to avoid creating new instances on every render
const EMPTY_SET = new Set<string>();

// Separate component for sortable unlocked items to avoid Rules of Hooks violation
function SortableUnlockedItem({ item, index, isLocked, density }: { item: Item; index: number; isLocked?: boolean; density?: ZoneDensity }) {
  const negativeMargin = density?.negativeMargin ?? '0px';
  const stacking = density?.stacking ?? false;
  const fontSize = density?.fontSize ?? 'text-sm';

  return (
    <Draggable draggableId={String(item.id)} index={index} isDragDisabled={isLocked}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          style={{
            ...provided.draggableProps.style,
            marginBottom: snapshot.isDragging ? 0 : (stacking ? negativeMargin : undefined),
            zIndex: snapshot.isDragging ? 9999 : (stacking ? 'auto' : undefined),
            boxShadow: snapshot.isDragging ? 'none' : CARD_BOX_SHADOW,
            // Ensure drag preview is properly positioned
            ...(snapshot.isDragging && provided.draggableProps.style?.position === 'fixed' 
              ? { 
                  transform: provided.draggableProps.style.transform || 'none',
                  transition: 'none' // Disable transitions during drag
                } 
              : {})
          }}
          {...(provided.draggableProps as any)}
          {...(provided.dragHandleProps as any)}
          className={`${CARD_BASE_CLASSES} ${CARD_UTILITY_CLASSES} bg-white border-2 border-[#E2E8F0] text-[#333333] ${CARD_TEXT_SIZE} font-medium cursor-grab active:cursor-grabbing flex items-center justify-center ${
            snapshot.isDragging ? 'opacity-0 pointer-events-none' : 'opacity-100'
          }`}
        >
          <span className={`font-medium ${fontSize} whitespace-nowrap overflow-hidden text-ellipsis max-w-full`}>{item.text}</span>
        </div>
      )}
    </Draggable>
  );
}

// Separate component for sortable locked items to avoid Rules of Hooks violation
function SortableLockedItem({ item, index, zoneType, forceReveal, isOver, showRedBorder, density }: { item: Item; index: number; zoneType: ZoneType; forceReveal?: boolean; isOver?: boolean; showRedBorder?: boolean; density?: ZoneDensity }) {
  const getLockedItemColor = () => {
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
  };

  const getCheckmarkColor = () => {
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

  const negativeMargin = density?.negativeMargin ?? '0px';
  const stacking = density?.stacking ?? false;
  const fontSize = density?.fontSize ?? 'text-sm';

  return (
    <Draggable draggableId={String(item.id)} index={index} isDragDisabled={true}>
      {(provided) => (
        <motion.div
          ref={provided.innerRef}
          style={{
            ...provided.draggableProps.style,
            marginBottom: stacking ? negativeMargin : undefined,
            zIndex: stacking ? 'auto' : undefined,
            boxShadow: CARD_BOX_SHADOW,
          }}
          animate={forceReveal ? (showRedBorder ? { 
            scale: [0.6, 1.1, 1], 
            opacity: 1, 
            rotate: [0, 5, 0],
            y: 0,
            x: isOver ? 10 : 0
          } : { 
            scale: 1, 
            opacity: 1, 
            rotate: 0,
            x: isOver ? 10 : 0
          }) : { 
            x: isOver ? 10 : 0 
          }}
          initial={forceReveal ? (showRedBorder ? { scale: 0.6, opacity: 0, rotate: -15, y: -30 } : { scale: 0.8, opacity: 0, rotate: -5 }) : false}
          transition={forceReveal ? (showRedBorder ? {
            scale: { 
              duration: 0.3, 
              delay: 0.1 + index * 0.05,
              times: [0, 0.6, 1],
              ease: [0.34, 1.56, 0.64, 1]
            },
            opacity: { 
              duration: 0.2, 
              delay: 0.1 + index * 0.05,
              ease: 'easeOut'
            },
            rotate: { 
              duration: 0.3, 
              delay: 0.1 + index * 0.05,
              ease: [0.34, 1.56, 0.64, 1]
            },
            y: { 
              duration: 0.3, 
              delay: 0.1 + index * 0.05,
              ease: [0.34, 1.56, 0.64, 1]
            },
            x: { duration: 0.2 }
          } : {
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
            x: { duration: 0.2 }
          }) : { 
            x: { duration: 0.2 }
          }}
          {...(provided.draggableProps as any)}
          className={`${CARD_BASE_CLASSES} ${CARD_UTILITY_CLASSES} ${getLockedItemColor()} ${CARD_TEXT_SIZE} font-medium flex items-center justify-center gap-1 ${showRedBorder ? 'border-2 border-red-500' : ''}`}
        >
          {showRedBorder ? (
            <motion.div
              initial={forceReveal ? { scale: 0, rotate: -180 } : false}
              animate={forceReveal ? { scale: 1, rotate: 0 } : {}}
              transition={forceReveal ? { 
                delay: 0.2 + index * 0.05, 
                type: 'spring', 
                stiffness: 600,
                damping: 15
              } : {}}
            >
              <Check size={12} color={getCheckmarkColor()} />
            </motion.div>
          ) : (
            <Check size={12} color={getCheckmarkColor()} />
          )}
          <span className={`${fontSize} whitespace-nowrap overflow-hidden text-ellipsis max-w-full`}>{item.text}</span>
        </motion.div>
      )}
    </Draggable>
  );
}

// Separate component for sortable incorrect items to avoid Rules of Hooks violation
function SortableIncorrectItem({ item, index, onReturnToPool, isLocked, density }: { item: Item; index: number; onReturnToPool?: (itemId: string) => void; isLocked?: boolean; density?: ZoneDensity }) {
  const negativeMargin = density?.negativeMargin ?? '0px';
  const stacking = density?.stacking ?? false;
  const fontSize = density?.fontSize ?? 'text-sm';

  return (
    <Draggable draggableId={String(item.id)} index={index} isDragDisabled={isLocked}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          style={{
            ...provided.draggableProps.style,
            marginBottom: snapshot.isDragging ? 0 : (stacking ? negativeMargin : undefined),
            zIndex: snapshot.isDragging ? 9999 : (stacking ? 'auto' : undefined),
            boxShadow: snapshot.isDragging ? 'none' : CARD_BOX_SHADOW,
            // Ensure drag preview is properly positioned
            ...(snapshot.isDragging && provided.draggableProps.style?.position === 'fixed' 
              ? { 
                  transform: provided.draggableProps.style.transform || 'none',
                  transition: 'none' // Disable transitions during drag
                } 
              : {})
          }}
          {...(provided.draggableProps as any)}
          {...(provided.dragHandleProps as any)}
          className={`${CARD_BASE_CLASSES} ${CARD_UTILITY_CLASSES} bg-white border-2 border-[#E57373] text-[#E57373] ${CARD_TEXT_SIZE} font-medium flex items-center justify-center gap-1 ${
            snapshot.isDragging ? 'opacity-0 pointer-events-none border-slate-300 text-[#333333]' : 'opacity-100'
          }`}
        >
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
            onMouseDown={(e) => {
              e.stopPropagation();
            }}
            onTouchStart={(e) => {
              e.stopPropagation();
            }}
            className="rounded p-0.5 cursor-pointer flex-shrink-0"
            aria-label="Return to word pool"
            type="button"
            style={{ pointerEvents: 'auto' }}
          >
            <X size={12} color="#E57373" />
          </button>
          <span 
            className={`${fontSize} whitespace-nowrap overflow-hidden text-ellipsis max-w-full cursor-grab active:cursor-grabbing flex-1`}
          >
            {item.text}
          </span>
        </div>
      )}
    </Draggable>
  );
}

interface ZoneProps {
  zoneType: ZoneType;
  label: string;
  placeholderLabel: string;
  items: Item[];
  lockedItems: Set<string>;
  isRevealed: boolean;
  position?: 'top' | 'middle' | 'bottom';
  isInternal?: boolean;
  incorrectItemIds?: Set<string>;
  onReturnToPool?: (itemId: string) => void;
  isLocked?: boolean;
  forceReveal?: boolean;
  revealDelay?: number;
}

const zoneColors = {
  left: 'bg-[#D1F7F5]',
  right: 'bg-[#E8DAEF]',
  both: 'bg-[#C5E3F0]',
  outside: 'bg-[#F0F2F5]',
};


function ZoneComponent({ zoneType, label, placeholderLabel, items, lockedItems, isRevealed, position = 'middle', isInternal = false, incorrectItemIds = EMPTY_SET, onReturnToPool, isLocked = false, forceReveal = false, revealDelay }: ZoneProps) {
  // Items are already sorted by zoneOrder from Board.tsx
  // We need to render them in this order for RBD indices to match
  // Use useMemo to stabilize the array for RBD with proper dependencies
  // CRITICAL: Ensure items array is stable and indices are sequential (0, 1, 2, ...)
  const placedItems = useMemo(() => {
    // Create a stable array reference - filter out any null/undefined items
    // and ensure we have a clean array for @hello-pangea/dnd
    const validItems = items.filter(item => item != null && item.id != null);
    
    // Ensure no duplicate IDs in the array (defensive check)
    const seenIds = new Set<string>();
    const uniqueItems = validItems.filter(item => {
      if (seenIds.has(item.id)) {
        console.warn(`⚠️ Zone ${zoneType}: Duplicate item ID ${item.id} detected, filtering out duplicate`);
        return false;
      }
      seenIds.add(item.id);
      return true;
    });
    
    return uniqueItems;
  }, [items, zoneType]);

  const getRoundedCorners = () => {
    // Round top corners for the top zone (Category A)
    if (isInternal && position === 'top') return 'rounded-t-3xl';
    // Round bottom corners for the Neither zone
    if (!isInternal && position === 'bottom') return 'rounded-b-3xl';
    return '';
  };

  const getBorderStyle = () => {
    if (zoneType === 'outside') {
      return 'border-2 border-solid border-[#E2E8F0]';
    }
    return 'border-0';
  };

  // Calculate density
  const density = useZoneDensity(placedItems.length);

  // Defensive check: Ensure zoneType is valid
  if (!zoneType || typeof zoneType !== 'string') {
    console.error(`❌ Zone: Invalid zoneType ${zoneType}, cannot render Droppable`);
    return null;
  }

  return (
    <Droppable droppableId={zoneType} isDropDisabled={isLocked}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.droppableProps}
          className={`
            relative ${getBorderStyle()} w-full h-full
            ${zoneColors[zoneType]}
            ${getRoundedCorners()}
            overflow-hidden flex flex-col min-h-0
          `}
        >
          {/* Hover overlay for drag feedback */}
          <div
            className="absolute inset-0 pointer-events-none z-5"
            style={{
              backgroundColor: snapshot.isDraggingOver ? 'rgba(0,0,0,0.05)' : 'transparent',
              transition: 'background-color 0.2s',
            }}
          />
          {/* Soft pill label at top of bin - CENTERED */}
          <motion.div 
            className={`absolute top-3 left-1/2 -translate-x-1/2 pointer-events-none z-20 w-full flex justify-center`}
            initial={forceReveal ? { opacity: 0, y: -10 } : false}
            animate={forceReveal ? { opacity: 1, y: 0 } : {}}
            transition={forceReveal ? { delay: revealDelay || 0, duration: 0.25, ease: 'easeOut' } : {}}
          >
            <div className={`
              px-2.5 py-1 rounded-full text-xs uppercase tracking-wider font-bold bg-white/50 shadow-sm backdrop-blur-sm
              ${zoneType === 'left' ? 'text-[#0D9488]' : ''}
              ${zoneType === 'right' ? 'text-[#9333EA]' : ''}
              ${zoneType === 'both' ? 'text-[#3B82F6]' : ''}
              ${zoneType === 'outside' ? 'text-[#64748B]' : ''}
            `}>
              {isRevealed ? label.toUpperCase() : placeholderLabel.toUpperCase()}
            </div>
          </motion.div>
          
          {/* Items container - CENTERED with layout smoothing */}
          <div 
            className={`
              flex flex-wrap ${density.gap}
              justify-center content-start h-full overflow-hidden min-h-0
              px-2 pt-14 pb-2
              relative z-10 w-full
            `}
            style={{
              gap: density.stacking ? `calc(0.5rem + ${density.negativeMargin})` : undefined,
            }}
          >
            {/* Render items in zoneOrder order, determining type for each */}
            {/* CRITICAL: Indices must be sequential (0, 1, 2, ...) for @hello-pangea/dnd */}
            {/* CRITICAL: Never return null - all items in placedItems are already validated */}
            {placedItems.map((item, index) => {
              // Item is already validated in useMemo, so we can safely use it
              const isLockedItem = lockedItems.has(item.id);
              const isIncorrect = incorrectItemIds.has(item.id);
              const isIncorrectButLocked = isIncorrect && isLockedItem;
              const isLockedCorrect = isLockedItem && !isIncorrect;
              const isIncorrectUnlocked = isIncorrect && !isLockedItem;
              const isUnlocked = !isLockedItem && !isIncorrect;

              // Ensure draggableId is consistently a string
              const draggableId = String(item.id);

              // Render appropriate component based on item state
              // All branches must return a valid React element (never null)
              if (isLockedCorrect) {
                return (
                  <SortableLockedItem 
                    key={draggableId} 
                    item={item} 
                    index={index}
                    zoneType={zoneType} 
                    forceReveal={forceReveal} 
                    isOver={snapshot.isDraggingOver} 
                    density={density} 
                  />
                );
              } else if (isIncorrectButLocked) {
                return (
                  <SortableLockedItem 
                    key={draggableId} 
                    item={item} 
                    index={index}
                    zoneType={zoneType} 
                    forceReveal={forceReveal} 
                    isOver={snapshot.isDraggingOver} 
                    showRedBorder={true} 
                    density={density} 
                  />
                );
              } else if (isIncorrectUnlocked) {
                return (
                  <SortableIncorrectItem 
                    key={draggableId} 
                    item={item} 
                    index={index}
                    onReturnToPool={onReturnToPool} 
                    isLocked={isLocked} 
                    density={density} 
                  />
                );
              } else {
                // Default to unlocked - this should always be true if we reach here
                return (
                  <SortableUnlockedItem 
                    key={draggableId} 
                    item={item} 
                    index={index}
                    isLocked={isLocked} 
                    density={density} 
                  />
                );
              }
            })}
            {provided.placeholder}
          </div>
        </div>
      )}
    </Droppable>
  );
}

// Memoize Zone component to reduce re-renders and help with @hello-pangea/dnd's internal tracking
// This also helps reduce the defaultProps warning by stabilizing the component
export const Zone = memo(ZoneComponent, (prevProps, nextProps) => {
  // Custom comparison function to prevent unnecessary re-renders
  // Only re-render if these critical props change
  return (
    prevProps.zoneType === nextProps.zoneType &&
    prevProps.items === nextProps.items &&
    prevProps.lockedItems === nextProps.lockedItems &&
    prevProps.isRevealed === nextProps.isRevealed &&
    prevProps.incorrectItemIds === nextProps.incorrectItemIds &&
    prevProps.isLocked === nextProps.isLocked &&
    prevProps.forceReveal === nextProps.forceReveal &&
    prevProps.onReturnToPool === nextProps.onReturnToPool
  );
});

