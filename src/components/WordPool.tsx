import { useDroppable } from '@dnd-kit/core';
import { Item, Zone } from '../types/game';
import { Card } from './Card';
import { ZoneDropData } from '../types/dnd';

interface WordPoolProps {
  items: Item[];
  lockedItems: Set<string>;
  itemPlacements: Map<string, Zone>;
  isGameLocked?: boolean;
  activeCardId?: string | null;
}

export function WordPool({ 
  items, 
  lockedItems, 
  itemPlacements, 
  isGameLocked,
  activeCardId 
}: WordPoolProps) {
  const { setNodeRef } = useDroppable({
    id: 'word-pool',
    data: { type: 'zone', zone: 'word-pool' } as ZoneDropData
  });

  // CRITICAL: Filter out locked, placed, AND currently dragging cards
  const availableItems = items.filter(
    item => !lockedItems.has(item.id) 
         && !itemPlacements.has(item.id)
         && item.id !== activeCardId
  );

  return (
    <div
      ref={setNodeRef}
      data-zone="word-pool"
      className="bg-gray-50 border-t border-gray-200 p-4 min-h-[100px] touch-none"
    >
      <div className="flex flex-wrap gap-2 justify-center">
        {availableItems.map(item => (
          <Card
            key={item.id}
            item={item}
            state="unlocked"
            zoneType="word-pool"
            isGameLocked={isGameLocked}
          />
        ))}
      </div>
    </div>
  );
}
