import { Zone } from './Zone';
import { Item, Zone as ZoneType } from '../types/game';

interface BoardProps {
  puzzle: {
    rules: {
      left: string;
      right: string;
    };
    items: Item[];
  };
  lockedItems: Set<string>;
  itemPlacements: Map<string, import('../types/game').Zone>;
  zoneOrder: Map<import('../types/game').Zone, string[]>;
  revealedRules: {
    left: boolean;
    right: boolean;
  };
  incorrectItemIds: Set<string>;
  onReturnToPool?: (itemId: string) => void;
  isLocked?: boolean;
  forceReveal?: boolean;
}

export function Board({
  puzzle,
  lockedItems,
  itemPlacements,
  zoneOrder,
  revealedRules,
  incorrectItemIds,
  onReturnToPool,
  isLocked = false,
  forceReveal = false,
}: BoardProps) {
  // Helper function to sort items according to zoneOrder
  const sortItemsByZoneOrder = (items: Item[], zone: ZoneType): Item[] => {
    const order = zoneOrder.get(zone) || [];
    const itemMap = new Map(items.map(item => [item.id, item]));
    
    // Create ordered array based on zoneOrder, then append any items not in order
    const ordered: Item[] = [];
    const unordered: Item[] = [];
    
    order.forEach(id => {
      const item = itemMap.get(id);
      if (item) {
        ordered.push(item);
        itemMap.delete(id);
      }
    });
    
    // Add any remaining items that weren't in the order
    itemMap.forEach(item => unordered.push(item));
    
    return [...ordered, ...unordered];
  };

  // Get items placed in each zone and sort them according to zoneOrder
  // itemPlacements Map is the source of truth - each item can only be in one zone
  // CRITICAL: Each item must appear in exactly one zone or none at all
  const itemsToRender = puzzle.items;
  
  // CRITICAL: Validate itemPlacements - each item should only be in ONE zone
  // This is a safety check to detect state corruption
  // Note: A Map can only have one value per key, so this should never find duplicates
  // But we check anyway as a safety measure
  const itemZoneCounts = new Map<string, ZoneType[]>();
  for (const [itemId, zone] of itemPlacements.entries()) {
    if (!itemZoneCounts.has(itemId)) {
      itemZoneCounts.set(itemId, []);
    }
    itemZoneCounts.get(itemId)!.push(zone);
  }
  for (const [itemId, zones] of itemZoneCounts.entries()) {
    if (zones.length > 1) {
      console.error(`❌ Board.tsx: Item ${itemId} appears in itemPlacements multiple times!`, zones);
      // This should never happen with a Map, but if it does, we need to fix it
      // The Map.set() should overwrite, so this indicates a serious bug
    }
  }
  
  // Check for items appearing in multiple filtered lists (only log if found)
  const leftIds = itemsToRender.filter(item => itemPlacements.get(item.id) === 'left').map(i => i.id);
  const rightIds = itemsToRender.filter(item => itemPlacements.get(item.id) === 'right').map(i => i.id);
  const bothIds = itemsToRender.filter(item => itemPlacements.get(item.id) === 'both').map(i => i.id);
  const outsideIds = itemsToRender.filter(item => itemPlacements.get(item.id) === 'outside').map(i => i.id);
  
  const allPlacedIds = [...leftIds, ...rightIds, ...bothIds, ...outsideIds];
  const idCounts = new Map<string, number>();
  allPlacedIds.forEach(id => {
    idCounts.set(id, (idCounts.get(id) || 0) + 1);
  });
  
  const duplicates = Array.from(idCounts.entries()).filter(([, count]) => count > 1);
  if (duplicates.length > 0) {
    console.error(`❌ Board.tsx: Items in multiple zones:`, duplicates);
    duplicates.forEach(([itemId, count]) => {
      const zones = [];
      if (leftIds.includes(itemId)) zones.push('left');
      if (rightIds.includes(itemId)) zones.push('right');
      if (bothIds.includes(itemId)) zones.push('both');
      if (outsideIds.includes(itemId)) zones.push('outside');
      console.error(`  Item ${itemId} in:`, zones);
    });
  }
  
  // CRITICAL: Filter items for each zone, ensuring no item appears in multiple zones
  // Use a Set to track which items have been assigned to prevent duplicates
  const assignedItems = new Set<string>();
  
  // Helper to check if item should be shown in a zone
  // Note: We rely on the library's drag preview during drag - no special handling needed
  const shouldShowInZone = (item: Item, zone: ZoneType): boolean => {
    const placement = itemPlacements.get(item.id);
    
    // Normal filtering: show if placement matches zone
    if (placement === zone) {
      if (assignedItems.has(item.id)) {
        console.error(`❌ Board.tsx: Item ${item.id} already assigned to another zone, skipping from ${zone}`);
        return false;
      }
      assignedItems.add(item.id);
      return true;
    }
    
    return false;
  };
  
  const leftPlacedItems = sortItemsByZoneOrder(
    itemsToRender.filter(item => shouldShowInZone(item, 'left')),
    'left'
  );
  const rightPlacedItems = sortItemsByZoneOrder(
    itemsToRender.filter(item => shouldShowInZone(item, 'right')),
    'right'
  );
  const bothPlacedItems = sortItemsByZoneOrder(
    itemsToRender.filter(item => shouldShowInZone(item, 'both')),
    'both'
  );
  const outsidePlacedItems = sortItemsByZoneOrder(
    itemsToRender.filter(item => shouldShowInZone(item, 'outside')),
    'outside'
  );
  
  // CRITICAL: Final validation - check for duplicate renders across zones
  const allRenderedItems = new Set<string>();
  const duplicateItems: string[] = [];
  
  for (const item of leftPlacedItems) {
    if (allRenderedItems.has(item.id)) {
      duplicateItems.push(item.id);
      console.error(`❌ Board.tsx: Item ${item.id} is being rendered in LEFT and another zone!`);
    }
    allRenderedItems.add(item.id);
  }
  for (const item of rightPlacedItems) {
    if (allRenderedItems.has(item.id)) {
      duplicateItems.push(item.id);
      console.error(`❌ Board.tsx: Item ${item.id} is being rendered in RIGHT and another zone!`);
    }
    allRenderedItems.add(item.id);
  }
  for (const item of bothPlacedItems) {
    if (allRenderedItems.has(item.id)) {
      duplicateItems.push(item.id);
      console.error(`❌ Board.tsx: Item ${item.id} is being rendered in BOTH and another zone!`);
    }
    allRenderedItems.add(item.id);
  }
  for (const item of outsidePlacedItems) {
    if (allRenderedItems.has(item.id)) {
      duplicateItems.push(item.id);
      console.error(`❌ Board.tsx: Item ${item.id} is being rendered in OUTSIDE and another zone!`);
    }
    allRenderedItems.add(item.id);
  }
  
  if (duplicateItems.length > 0) {
    console.error(`❌ Board.tsx: Found ${duplicateItems.length} duplicate items being rendered:`, duplicateItems);
    // Force fix: Remove duplicates by keeping only the first occurrence
    // This is a safety measure, but the real fix should be in the state management
  }

  return (
    <div className="w-full mx-auto px-3 sm:px-2 relative h-full grid grid-rows-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_0.5rem_minmax(0,1fr)] min-h-0 overflow-hidden">
      {/* Top Zone (left) - 1.3fr */}
      <div className="min-h-0 h-full overflow-hidden">
        <Zone
          zoneType="left"
          label={puzzle.rules.left}
          placeholderLabel="Category A"
          items={leftPlacedItems}
          lockedItems={lockedItems}
          isRevealed={forceReveal || revealedRules.left}
          position="top"
          isInternal={true}
          incorrectItemIds={incorrectItemIds}
          onReturnToPool={onReturnToPool}
          isLocked={isLocked}
          forceReveal={forceReveal}
          revealDelay={forceReveal ? 1.5 : undefined}
        />
      </div>

      {/* Middle/Overlap Zone (both) - 0.8fr */}
      <div className="min-h-0 h-full overflow-hidden">
        <Zone
          zoneType="both"
          label={`${puzzle.rules.left} & ${puzzle.rules.right}`}
          placeholderLabel="Both Sets"
          items={bothPlacedItems}
          lockedItems={lockedItems}
          isRevealed={forceReveal || (revealedRules.left && revealedRules.right)}
          position="middle"
          isInternal={true}
          incorrectItemIds={incorrectItemIds}
          onReturnToPool={onReturnToPool}
          isLocked={isLocked}
          forceReveal={forceReveal}
          revealDelay={forceReveal ? 1.8 : undefined}
        />
      </div>

      {/* Bottom Zone (right) - 1.3fr */}
      <div className="min-h-0 h-full overflow-hidden">
        <Zone
          zoneType="right"
          label={puzzle.rules.right}
          placeholderLabel="Category B"
          items={rightPlacedItems}
          lockedItems={lockedItems}
          isRevealed={forceReveal || revealedRules.right}
          position="middle"
          isInternal={true}
          incorrectItemIds={incorrectItemIds}
          onReturnToPool={onReturnToPool}
          isLocked={isLocked}
          forceReveal={forceReveal}
          revealDelay={forceReveal ? 2.1 : undefined}
        />
      </div>

      {/* Gap to visually detach "Neither" - 0.5rem */}
      <div></div>

      {/* Outside Zone (neither) - 1fr */}
      <div className="min-h-0 h-full overflow-hidden">
        <Zone
          zoneType="outside"
          label="Neither"
          placeholderLabel="Neither"
          items={outsidePlacedItems}
          lockedItems={lockedItems}
          isRevealed={true}
          position="bottom"
          isInternal={false}
          incorrectItemIds={incorrectItemIds}
          onReturnToPool={onReturnToPool}
        />
      </div>
    </div>
  );
}

