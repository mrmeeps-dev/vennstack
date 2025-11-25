import { useMemo } from 'react';
import { Droppable, Draggable } from '@hello-pangea/dnd';
import { WordCard, CARD_BASE_CLASSES, CARD_SPAN_TEXT_SIZE, CARD_BOX_SHADOW } from './WordCard';
import { Item } from '../types/game';

interface WordPoolProps {
  items: Item[];
  lockedItems: Set<string>;
  itemPlacements: Map<string, import('../types/game').Zone>;
  shakingItemId: string | null;
  justLockedId: string | null;
  isLocked?: boolean;
}

export function WordPool({ items, lockedItems, itemPlacements, shakingItemId, justLockedId, isLocked = false }: WordPoolProps) {
  // Show items that are not locked and not placed in any zone
  // Use useMemo to stabilize the array for RBD
  // CRITICAL: Ensure items array is stable and indices are sequential (0, 1, 2, ...)
  const availableItems = useMemo(() => {
    // Filter items that should be shown in the pool
    const filtered = items.filter(item => {
      // Defensive check: ensure item is valid
      if (!item || !item.id) {
        console.warn('⚠️ WordPool: Invalid item detected, filtering out');
        return false;
      }
      
      const itemIsLocked = lockedItems.has(item.id);
      const placement = itemPlacements.get(item.id);
      // Show only if not locked and not placed in any zone (including "outside")
      return !itemIsLocked && placement === undefined;
    });
    
    // Ensure no duplicate IDs (defensive check)
    const seenIds = new Set<string>();
    const uniqueItems = filtered.filter(item => {
      if (seenIds.has(item.id)) {
        console.warn(`⚠️ WordPool: Duplicate item ID ${item.id} detected, filtering out duplicate`);
        return false;
      }
      seenIds.add(item.id);
      return true;
    });
    
    return uniqueItems;
  }, [items, lockedItems, itemPlacements]);

  // Debug: Log available items on render
  if (typeof window !== 'undefined' && (window as any).__DEBUG_RBD__) {
    console.log('🔍 WordPool availableItems:', availableItems.map(i => ({ id: i.id, text: i.text })));
  }

  return (
    <Droppable droppableId="word-pool" isDropDisabled={isLocked} direction="horizontal">
      {(provided, snapshot) => (
        <div 
          ref={provided.innerRef}
          {...provided.droppableProps}
          className="w-full mx-auto rounded-lg p-2"
          style={{
            backgroundColor: snapshot.isDraggingOver ? 'rgba(148, 163, 184, 0.1)' : 'transparent',
            transition: 'background-color 0.2s',
          }}
        >
          <div className="flex flex-wrap gap-1.5 sm:gap-2 justify-center pb-2">
            {/* CRITICAL: Indices must be sequential (0, 1, 2, ...) for @hello-pangea/dnd */}
            {availableItems.map((item, index) => {
              // Ensure draggableId is consistently a string
              const draggableId = String(item.id);
              
              // Debug: Log each draggable being rendered
              if (typeof window !== 'undefined' && (window as any).__DEBUG_RBD__) {
                console.log(`🔍 WordPool rendering draggable: id=${draggableId}, index=${index}, text=${item.text}`);
              }
              
              return (
              <Draggable key={draggableId} draggableId={draggableId} index={index} isDragDisabled={isLocked}>
                {(provided, snapshot) => (
                  <div 
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    style={{
                      ...provided.draggableProps.style,
                      cursor: isLocked ? 'not-allowed' : 'grab',
                      // Ensure drag preview is properly positioned
                      ...(snapshot.isDragging && provided.draggableProps.style?.position === 'fixed' 
                        ? { 
                            transform: provided.draggableProps.style.transform || 'none',
                            transition: 'none' // Disable transitions during drag
                          } 
                        : {})
                    }}
                    className="relative"
                  >
                    {snapshot.isDragging ? (
                      /* Ghost placeholder when item is being dragged */
                      <div className={`${CARD_BASE_CLASSES} bg-slate-200/50 opacity-40 flex items-center justify-center`} style={{ boxShadow: CARD_BOX_SHADOW }}>
                        <span className={`font-medium ${CARD_SPAN_TEXT_SIZE} text-slate-400 whitespace-nowrap`}>{item.text}</span>
                      </div>
                    ) : (
                      <WordCard
                        item={item}
                        isLocked={isLocked || false}
                        shouldShake={shakingItemId === item.id}
                        justLocked={justLockedId === item.id}
                      />
                    )}
                  </div>
                )}
              </Draggable>
              );
            })}
            {provided.placeholder}
          </div>
        </div>
      )}
    </Droppable>
  );
}

