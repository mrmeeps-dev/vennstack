import { Zone } from './Zone';
import { PuzzleData, Zone as ZoneType, Item } from '../types/game';

interface BoardProps {
  puzzle: PuzzleData;
  lockedItems: Set<string>;
  itemPlacements: Map<string, ZoneType>;
  zoneOrder: Map<ZoneType, string[]>;
  revealedRules: { left: boolean; right: boolean };
  incorrectItems: Set<string>;
  onReturnToPool?: (itemId: string) => void;
  isGameLocked?: boolean;
  activeCardId?: string | null;
  justLockedIds?: Set<string>;
  solutionRevealed?: boolean;
  isCelebrating?: boolean;
  isMirrored?: boolean;
}

export function Board({
  puzzle,
  lockedItems,
  itemPlacements: _itemPlacements,
  zoneOrder,
  revealedRules,
  incorrectItems,
  onReturnToPool,
  isGameLocked,
  activeCardId,
  justLockedIds,
  solutionRevealed = false,
  isCelebrating = false,
  isMirrored = false
}: BoardProps) {
  const getZoneItems = (zone: ZoneType): Item[] => {
    const order = zoneOrder.get(zone) || [];
    return order
      .map(id => puzzle.items.find(item => item.id === id))
      .filter((item): item is Item => item !== undefined);
  };

  // Get rule labels based on mirrored state
  const getLeftRule = () => isMirrored ? puzzle.rules.right : puzzle.rules.left;
  const getRightRule = () => isMirrored ? puzzle.rules.left : puzzle.rules.right;

  return (
    <div className="w-full mx-auto px-3 sm:px-2 relative h-full grid grid-rows-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_0.5rem_minmax(0,1fr)] min-h-0 overflow-hidden">
      {/* Top Zone (left) */}
      <div className="min-h-0 h-full overflow-hidden">
        <Zone
          zoneType="left"
          label={getLeftRule()}
          placeholderLabel="Category A"
          items={getZoneItems('left')}
          lockedItems={lockedItems}
          incorrectItems={incorrectItems}
          isRevealed={revealedRules.left}
          onReturnToPool={onReturnToPool}
          isGameLocked={isGameLocked}
          activeCardId={activeCardId}
          justLockedIds={justLockedIds}
          solutionRevealed={solutionRevealed}
          isCelebrating={isCelebrating}
          position="top"
          isInternal={true}
        />
      </div>

      {/* Middle/Overlap Zone (both) */}
      <div className="min-h-0 h-full overflow-hidden">
        <Zone
          zoneType="both"
          label={`${getLeftRule()} & ${getRightRule()}`}
          placeholderLabel="Both Sets"
          items={getZoneItems('both')}
          lockedItems={lockedItems}
          incorrectItems={incorrectItems}
          isRevealed={revealedRules.left && revealedRules.right}
          onReturnToPool={onReturnToPool}
          isGameLocked={isGameLocked}
          activeCardId={activeCardId}
          justLockedIds={justLockedIds}
          solutionRevealed={solutionRevealed}
          isCelebrating={isCelebrating}
          position="middle"
          isInternal={true}
        />
      </div>

      {/* Bottom Zone (right) */}
      <div className="min-h-0 h-full overflow-hidden">
        <Zone
          zoneType="right"
          label={getRightRule()}
          placeholderLabel="Category B"
          items={getZoneItems('right')}
          lockedItems={lockedItems}
          incorrectItems={incorrectItems}
          isRevealed={revealedRules.right}
          onReturnToPool={onReturnToPool}
          isGameLocked={isGameLocked}
          activeCardId={activeCardId}
          justLockedIds={justLockedIds}
          solutionRevealed={solutionRevealed}
          isCelebrating={isCelebrating}
          position="middle"
          isInternal={true}
        />
      </div>

      {/* Gap to visually detach "Neither" */}
      <div></div>

      {/* Outside Zone (neither) */}
      <div className="min-h-0 h-full overflow-hidden">
        <Zone
          zoneType="outside"
          label="Neither"
          placeholderLabel="Neither"
          items={getZoneItems('outside')}
          lockedItems={lockedItems}
          incorrectItems={incorrectItems}
          isRevealed={true}
          onReturnToPool={onReturnToPool}
          isGameLocked={isGameLocked}
          activeCardId={activeCardId}
          justLockedIds={justLockedIds}
          solutionRevealed={solutionRevealed}
          isCelebrating={isCelebrating}
          position="bottom"
          isInternal={false}
        />
      </div>
    </div>
  );
}
