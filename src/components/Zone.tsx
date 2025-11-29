import { useDroppable } from '@dnd-kit/core';
import { Zone as ZoneType, Item } from '../types/game';
import { Card } from './Card';
import { ZoneDropData } from '../types/dnd';

interface ZoneProps {
  zoneType: ZoneType;
  label: string;
  placeholderLabel: string;
  items: Item[];
  lockedItems: Set<string>;
  incorrectItems: Set<string>;
  isRevealed: boolean;
  onReturnToPool?: (itemId: string) => void;
  isGameLocked?: boolean;
  activeCardId?: string | null;
  justLockedIds?: Set<string>;
  solutionRevealed?: boolean;
  position?: 'top' | 'middle' | 'bottom';
  isInternal?: boolean;
  isCelebrating?: boolean;
  isWinState?: boolean; // True when both rules are revealed (win state)
  bothDefinition?: string; // Synthesized definition for "Both Sets" zone
}

const ZONE_COLORS = {
  left: 'bg-[#D1F7F5]',
  right: 'bg-[#E8DAEF]',
  both: 'bg-[#C5E3F0]',
  outside: 'bg-[#F0F2F5]'
};

export function Zone({
  zoneType,
  label,
  placeholderLabel,
  items,
  lockedItems,
  incorrectItems,
  isRevealed,
  onReturnToPool,
  isGameLocked,
  activeCardId,
  justLockedIds = new Set(),
  solutionRevealed = false,
  position = 'middle',
  isInternal = false,
  isCelebrating = false,
  isWinState = false,
  bothDefinition
}: ZoneProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `zone-${zoneType}`,
    data: { type: 'zone', zone: zoneType } as ZoneDropData
  });

  // CRITICAL: Filter out card being dragged
  const visibleItems = items.filter(item => item.id !== activeCardId);

  const getRoundedCorners = () => {
    if (isInternal && position === 'top') return 'rounded-t-3xl';
    if (!isInternal && position === 'bottom') return 'rounded-b-3xl';
    return '';
  };

  const getBorderStyle = () => {
    if (zoneType === 'outside') {
      return 'border-2 border-solid border-[#E2E8F0]';
    }
    return 'border-0';
  };

  const getBackgroundStyle = (): { background?: string } => {
    // Zone colors: left: #D1F7F5, both: #C5E3F0, right: #E8DAEF
    // Fast transitions: 90-95% solid color, 5-10% transition at edges
    if (zoneType === 'left' && isInternal && position === 'top') {
      // Left zone: solid left color, ends at left color (transition happens in both zone)
      return {
        background: 'linear-gradient(to bottom, #D1F7F5 0%, #D1F7F5 100%)'
      };
    }
    if (zoneType === 'both' && isInternal && position === 'middle') {
      // Both zone: transition from left at top, mostly both color, transition to right at bottom (gradient zones grown by 30%)
      return {
        background: 'linear-gradient(to bottom, #D1F7F5 0%, #C5E3F0 7%, #C5E3F0 90%, #E8DAEF 100%)'
      };
    }
    if (zoneType === 'right' && isInternal && position === 'middle') {
      // Right zone: starts with right color to match both zone's end, then solid right color
      return {
        background: 'linear-gradient(to bottom, #E8DAEF 0%, #E8DAEF 100%)'
      };
    }
    // Default: use solid color
    return {};
  };

  return (
    <div
      ref={setNodeRef}
      data-zone={zoneType}
      style={getBackgroundStyle()}
      className={`
        zone ${!getBackgroundStyle().background ? ZONE_COLORS[zoneType] : ''} touch-none
        ${getRoundedCorners()}
        ${getBorderStyle()}
        relative w-full h-full
        overflow-hidden flex flex-col min-h-0
        ${isOver ? 'is-drag-over' : ''}
        ${isWinState && isInternal ? 'opacity-60' : ''}
      `}
    >
      {/* Zone label */}
      {zoneType === 'outside' ? (
        // "Neither" zone: watermark style - no background, small, transparent, uppercase
        <div className="absolute top-3 left-1/2 -translate-x-1/2 pointer-events-none z-20 w-full flex justify-center">
          <div className="text-xs uppercase tracking-wider font-semibold text-slate-700 opacity-60">
            {isRevealed ? label.toUpperCase() : placeholderLabel.toUpperCase()}
          </div>
        </div>
      ) : (
        // Category zones: in win state, no white pill - text directly on colored background
        <div className={`absolute ${isWinState ? 'top-4' : 'top-3'} left-1/2 -translate-x-1/2 pointer-events-none z-20 w-full flex justify-center`}>
          <div className={`
            ${isWinState 
              ? 'text-2xl tracking-wide font-black text-slate-900' 
              : 'px-2.5 py-1 rounded-full text-xs uppercase tracking-wider font-bold bg-white/90 shadow-sm backdrop-blur-sm'
            }
            ${!isWinState && zoneType === 'left' ? 'text-[#0D9488]' : ''}
            ${!isWinState && zoneType === 'right' ? 'text-[#9333EA]' : ''}
            ${!isWinState && zoneType === 'both' ? 'text-[#3B82F6]' : ''}
          `}>
            {isRevealed 
              ? (zoneType === 'both' && bothDefinition 
                  ? bothDefinition 
                  : (isWinState ? label : label.toUpperCase())
                )
              : placeholderLabel.toUpperCase()
            }
          </div>
        </div>
      )}
      
      {/* Items container - allow content to expand, but clip to zone bounds */}
      <div className="w-full h-full px-2 pt-14 pb-2 relative z-10 overflow-hidden">
        <div className="max-w-full mx-auto h-full">
          <div className="flex flex-wrap gap-1 justify-center content-start min-h-full w-full">
            {visibleItems.map((item) => (
              <Card
                key={`${item.id}-${zoneType}`}
                item={item}
                state={
                  lockedItems.has(item.id) ? 'locked'
                  : incorrectItems.has(item.id) ? 'incorrect'
                  : 'unlocked'
                }
                zoneType={zoneType}
                onReturnToPool={onReturnToPool}
                isGameLocked={isGameLocked}
                justLocked={justLockedIds.has(item.id)}
                solutionRevealed={solutionRevealed}
                wasIncorrect={solutionRevealed && incorrectItems.has(item.id)}
                isCelebrating={isCelebrating && lockedItems.has(item.id)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
