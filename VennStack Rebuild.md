# Complete VennStack Rebuild - Correct Architecture

## Overview

Build drag-and-drop card game with proper visual continuity. Key principle: Cards "teleport" to final position with entrance animation (scale-in), NOT position transitions. This eliminates all flash/jump issues.

## Core Principles

1. **No Position Transitions**: Cards never animate position changes in flex layout
2. **Entrance Animations Only**: Scale/opacity on appearance
3. **Complete Filtering**: Dragged card removed from render entirely (not hidden)
4. **Single Source of Truth**: React state drives everything
5. **Instant Placement**: Card appears at final position immediately on drop

## Technology Stack

- React 18 + TypeScript + Vite
- @dnd-kit/core (drag detection only)
- CSS animations (entrance effects, NOT transitions)
- Tailwind CSS

## Phase 1: Setup and Types

### Install Dependencies

```bash
npm install @dnd-kit/core @dnd-kit/utilities
```

### Core Types

File: [`src/types/game.ts`](src/types/game.ts)

```typescript
export type Zone = "left" | "right" | "both" | "outside";

export interface Item {
  id: string;
  text: string;
  emoji?: string;
  zone: Zone;
  explanation: string;
}

export interface PuzzleData {
  id: string;
  rules: { left: string; right: string };
  items: Item[];
}

export interface GameState {
  puzzle: PuzzleData;
  lockedItems: Set<string>;
  itemPlacements: Map<string, Zone>;
  zoneOrder: Map<Zone, string[]>;
  revealedRules: { left: boolean; right: boolean };
}

export interface GameActions {
  placeItem: (itemId: string, targetZone: Zone, insertAfterId?: string | null) => void;
  removeItem: (itemId: string) => void;
  validatePuzzle: () => { correct: string[]; incorrect: string[] };
  autoPlaceAllItems: () => void;
  handleDrop: (event: any) => void;
}
```

File: [`src/types/dnd.ts`](src/types/dnd.ts)

```typescript
import { Zone } from './game';

export interface CardDragData {
  type: 'card';
  cardId: string;
  sourceZone: Zone | 'word-pool';
}

export interface ZoneDropData {
  type: 'zone';
  zone: Zone | 'word-pool';
}
```

## Phase 2: CSS Animation System

File: [`src/styles/card-animations.css`](src/styles/card-animations.css)

```css
/* CRITICAL: NO position/transform transitions */
.card {
  /* Only animate colors, NOT position/transform */
  transition: background-color 200ms ease-out,
              border-color 200ms ease-out;
}

/* Drop-in entrance animation - plays automatically on mount
 * CRITICAL FIX: This animation runs on mount, NOT via a CSS class toggle
 * The key-changing strategy in React forces remount, triggering this animation
 */
@keyframes drop-in {
  from { 
    transform: scale(0.95);
    opacity: 0.8;
  }
  to { 
    transform: scale(1);
    opacity: 1;
  }
}

/* Applied to cards when the game is ready (prevents initial page load animation) */
body.game-ready .card {
  animation: drop-in 300ms cubic-bezier(0.34, 1.56, 0.64, 1);
}

/* Lock success animation */
@keyframes lock-pop {
  0% { transform: scale(1); }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); }
}

.card.just-locked {
  animation: lock-pop 400ms cubic-bezier(0.34, 1.56, 0.64, 1) !important;
}

/* Error shake */
@keyframes error-shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-10px); }
  50% { transform: translateX(10px); }
  75% { transform: translateX(-10px); }
}

.card.incorrect {
  animation: error-shake 500ms ease-in-out !important;
}

/* Zone hover */
.zone {
  transition: box-shadow 150ms ease-out;
}

.zone.is-drag-over {
  box-shadow: inset 0 0 0 2px rgba(59, 130, 246, 0.5);
}
```

Import in [`src/index.css`](src/index.css):

```css
@import './styles/card-animations.css';
```

## Phase 3: Insertion Position Calculator

File: [`src/utils/insertionCalculator.ts`](src/utils/insertionCalculator.ts)

```typescript
import { Coordinates } from '@dnd-kit/utilities';

/**
 * Calculate where to insert a card in a flex-wrap zone
 * Returns: card ID to insert after, or null for start, or undefined for end
 * 
 * CRITICAL FIX: This logic is "Flex-Aware" - it accounts for multi-row layouts
 * by prioritizing Y-axis (row detection) before X-axis (left/right within row)
 */
export function calculateInsertPosition(
  zoneId: string,
  dropPoint: Coordinates,
  draggedCardId: string
): string | null | undefined {
  const zoneElement = document.querySelector(`[data-zone="${zoneId}"]`);
  if (!zoneElement) return undefined; // Zone not found, append to end

  // Get all visible cards in zone (excluding dragged card)
  const cardElements = Array.from(
    zoneElement.querySelectorAll('[data-card-id]')
  ).filter(el => {
    const cardId = el.getAttribute('data-card-id');
    return cardId !== draggedCardId;
  }) as HTMLElement[];

  if (cardElements.length === 0) {
    return null; // Empty zone, insert at start
  }

  // Map cards with their position data
  const cardData = cardElements.map(card => {
    const rect = card.getBoundingClientRect();
    return {
      cardId: card.getAttribute('data-card-id')!,
      element: card,
      centerX: rect.left + rect.width / 2,
      centerY: rect.top + rect.height / 2,
      top: rect.top,
      bottom: rect.bottom,
      left: rect.left,
      right: rect.right
    };
  });

  // Step 1: Group cards by rows using Y-position clustering
  // Cards are considered on the same row if their centerY is within ~20px
  const ROW_TOLERANCE = 20;
  const rows: typeof cardData[] = [];
  
  cardData.forEach(card => {
    const existingRow = rows.find(row => 
      Math.abs(row[0].centerY - card.centerY) < ROW_TOLERANCE
    );
    
    if (existingRow) {
      existingRow.push(card);
    } else {
      rows.push([card]);
    }
  });

  // Sort rows by Y position, and sort cards within each row by X position
  rows.forEach(row => row.sort((a, b) => a.centerX - b.centerX));
  rows.sort((a, b) => a[0].centerY - b[0].centerY);

  // Step 2: Determine which row the drop point is on
  let targetRow: typeof cardData | null = null;
  
  for (const row of rows) {
    const rowTop = Math.min(...row.map(c => c.top));
    const rowBottom = Math.max(...row.map(c => c.bottom));
    
    if (dropPoint.y >= rowTop && dropPoint.y <= rowBottom) {
      targetRow = row;
      break;
    }
  }

  // If drop point is below all rows, append to end
  if (!targetRow && dropPoint.y > rows[rows.length - 1][0].bottom) {
    return undefined;
  }

  // If drop point is above all rows, insert at start
  if (!targetRow && dropPoint.y < rows[0][0].top) {
    return null;
  }

  // If we still don't have a row (between rows), find closest row by Y distance
  if (!targetRow) {
    const rowDistances = rows.map(row => ({
      row,
      dist: Math.abs(row[0].centerY - dropPoint.y)
    }));
    rowDistances.sort((a, b) => a.dist - b.dist);
    targetRow = rowDistances[0].row;
  }

  // Step 3: Within the target row, compare X positions
  for (let i = 0; i < targetRow.length; i++) {
    const card = targetRow[i];
    
    // If drop point is before this card's center
    if (dropPoint.x < card.centerX) {
      // Insert before this card
      if (i === 0) {
        return null; // Insert at very start
      }
      return targetRow[i - 1].cardId; // Insert after previous card
    }
  }

  // Drop point is after all cards in the row
  return targetRow[targetRow.length - 1].cardId;
}
```

## Phase 4: Game Logic Hook

File: [`src/hooks/useVennEngine.ts`](src/hooks/useVennEngine.ts)

```typescript
import { useState, useCallback, useEffect } from 'react';
import { PuzzleData, Zone, GameState, GameActions } from '../types/game';
import { calculateInsertPosition } from '../utils/insertionCalculator';

export function useVennEngine(puzzleData: PuzzleData): GameState & GameActions {
  const [lockedItems, setLockedItems] = useState<Set<string>>(new Set());
  const [itemPlacements, setItemPlacements] = useState<Map<string, Zone>>(new Map());
  const [zoneOrder, setZoneOrder] = useState<Map<Zone, string[]>>(
    new Map([['left', []], ['right', []], ['both', []], ['outside', []]])
  );
  const [revealedRules, setRevealedRules] = useState({ left: false, right: false });

  useEffect(() => {
    setLockedItems(new Set());
    setItemPlacements(new Map());
    setZoneOrder(new Map([['left', []], ['right', []], ['both', []], ['outside', []]]));
    setRevealedRules({ left: false, right: false });
  }, [puzzleData.id]);

  const placeItem = useCallback((itemId: string, targetZone: Zone, insertAfterId?: string | null) => {
    setItemPlacements(prev => new Map(prev).set(itemId, targetZone));

    setZoneOrder(prev => {
      const next = new Map(prev);
      
      // Remove from all zones
      for (const [zone, order] of next.entries()) {
        next.set(zone, order.filter(id => id !== itemId));
      }
      
      const targetOrder = next.get(targetZone) || [];
      
      if (insertAfterId === null) {
        next.set(targetZone, [itemId, ...targetOrder]);
      } else if (insertAfterId !== undefined) {
        const insertIndex = targetOrder.indexOf(insertAfterId);
        const newOrder = [...targetOrder];
        newOrder.splice(insertIndex + 1, 0, itemId);
        next.set(targetZone, newOrder);
      } else {
        next.set(targetZone, [...targetOrder, itemId]);
      }
      
      return next;
    });
  }, []);

  const removeItem = useCallback((itemId: string) => {
    setItemPlacements(prev => {
      const next = new Map(prev);
      next.delete(itemId);
      return next;
    });

    setZoneOrder(prev => {
      const next = new Map(prev);
      for (const [zone, order] of next.entries()) {
        next.set(zone, order.filter(id => id !== itemId));
      }
      return next;
    });
  }, []);

  const validatePuzzle = useCallback(() => {
    const correct: string[] = [];
    const incorrect: string[] = [];

    puzzleData.items.forEach(item => {
      const placedZone = itemPlacements.get(item.id);
      if (!placedZone) return;

      if (placedZone === item.zone) {
        correct.push(item.id);
        setLockedItems(prev => new Set(prev).add(item.id));
      } else {
        incorrect.push(item.id);
      }
    });

    // Check rule discovery
    setRevealedRules(prev => {
      const updatedLocked = new Set(lockedItems);
      correct.forEach(id => updatedLocked.add(id));
      
      const leftCount = puzzleData.items.filter(
        item => item.zone === 'left' && updatedLocked.has(item.id)
      ).length;
      const rightCount = puzzleData.items.filter(
        item => item.zone === 'right' && updatedLocked.has(item.id)
      ).length;

      return {
        left: prev.left || leftCount >= 3,
        right: prev.right || rightCount >= 3
      };
    });

    return { correct, incorrect };
  }, [puzzleData, itemPlacements, lockedItems]);

  const autoPlaceAllItems = useCallback(() => {
    const placements = new Map<string, Zone>();
    const orders = new Map<Zone, string[]>([
      ['left', []], ['right', []], ['both', []], ['outside', []]
    ]);

    puzzleData.items.forEach(item => {
      placements.set(item.id, item.zone);
      orders.get(item.zone)!.push(item.id);
    });

    setItemPlacements(placements);
    setZoneOrder(orders);
    setLockedItems(new Set(puzzleData.items.map(i => i.id)));
    setRevealedRules({ left: true, right: true });
  }, [puzzleData]);

  const handleDrop = useCallback((event: any) => {
    const { active, over, activatorEvent } = event;
    
    if (!over) {
      removeItem(active.id as string);
      return;
    }

    const dropData = over.data.current;
    
    if (dropData.zone === 'word-pool') {
      removeItem(active.id as string);
      return;
    }

    // Calculate insertion position based on drop coordinates
    const dropPoint = {
      x: activatorEvent.clientX,
      y: activatorEvent.clientY
    };

    const insertAfterId = calculateInsertPosition(
      dropData.zone,
      dropPoint,
      active.id as string
    );

    placeItem(active.id as string, dropData.zone as Zone, insertAfterId);
  }, [placeItem, removeItem]);

  return {
    puzzle: puzzleData,
    lockedItems,
    itemPlacements,
    zoneOrder,
    revealedRules,
    placeItem,
    removeItem,
    validatePuzzle,
    autoPlaceAllItems,
    handleDrop
  };
}
```

## Phase 5: Card Component

File: [`src/components/Card.tsx`](src/components/Card.tsx)

```typescript
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
}

export function Card({ 
  item, 
  state, 
  zoneType, 
  onReturnToPool, 
  isGameLocked,
  justLocked = false
}: CardProps) {
  const [animationClass, setAnimationClass] = useState('');

  const isDraggable = !isGameLocked && state === 'unlocked';

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
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
      const timer = setTimeout(() => setAnimationClass(''), 400);
      return () => clearTimeout(timer);
    }
  }, [justLocked]);

  // CRITICAL: Card is filtered out during drag, so this won't render
  // This is defensive - if it does render during drag, don't show it
  if (isDragging) {
    return null;
  }

  const style = {
    transform: CSS.Translate.toString(transform),
  };

  const getCardClasses = () => {
    const base = 'card px-3 py-2 rounded-xl text-sm font-medium select-none shadow-md';
    
    if (state === 'locked') {
      const colors = {
        left: 'bg-white border-2 border-teal-500 text-teal-600',
        right: 'bg-white border-2 border-purple-500 text-purple-600',
        both: 'bg-white border-2 border-blue-500 text-blue-600',
        outside: 'bg-white border-2 border-gray-400 text-gray-600'
      };
      return `${base} ${colors[zoneType as Zone] || 'bg-white border-2 border-blue-500'}`;
    }
    
    if (state === 'incorrect') {
      return `${base} incorrect bg-white border-2 border-red-400 text-red-600`;
    }
    
    return `${base} bg-white border-2 border-gray-200 text-gray-800 cursor-grab active:cursor-grabbing hover:border-gray-300`;
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`${getCardClasses()} ${animationClass}`}
      {...(isDraggable ? attributes : {})}
      {...(isDraggable ? listeners : {})}
      data-card-id={item.id}
      data-zone={zoneType}
    >
      {state === 'locked' && <span className="mr-1.5">✓</span>}
      {state === 'incorrect' && (
        <button
          onClick={() => onReturnToPool?.(item.id)}
          className="mr-1.5 text-lg leading-none hover:opacity-70"
          type="button"
        >
          ×
        </button>
      )}
      {item.text}
    </div>
  );
}
```

## Phase 6: Zone Component

File: [`src/components/Zone.tsx`](src/components/Zone.tsx)

```typescript
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
}

const ZONE_COLORS = {
  left: 'bg-teal-50',
  right: 'bg-purple-50',
  both: 'bg-blue-50',
  outside: 'bg-gray-50'
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
  justLockedIds = new Set()
}: ZoneProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `zone-${zoneType}`,
    data: { type: 'zone', zone: zoneType } as ZoneDropData
  });

  // CRITICAL: Filter out card being dragged
  const visibleItems = items.filter(item => item.id !== activeCardId);

  return (
    <div
      ref={setNodeRef}
      data-zone={zoneType}
      className={`
        zone ${ZONE_COLORS[zoneType]} 
        rounded-3xl p-4 relative min-h-[120px]
        ${isOver ? 'is-drag-over' : ''}
      `}
    >
      <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10">
        <div className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-white/60 backdrop-blur-sm">
          {isRevealed ? label : placeholderLabel}
        </div>
      </div>

      <div className="pt-12 flex flex-wrap gap-2 justify-start">
        {visibleItems.map(item => (
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
          />
        ))}
      </div>
    </div>
  );
}
```

## Phase 7: Word Pool Component

File: [`src/components/WordPool.tsx`](src/components/WordPool.tsx)

```typescript
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
      className="bg-gray-50 border-t border-gray-200 p-4 min-h-[100px]"
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
```

## Phase 8: DndProvider Component

File: [`src/components/DndProvider.tsx`](src/components/DndProvider.tsx)

```typescript
import { 
  DndContext, 
  PointerSensor, 
  useSensor, 
  useSensors, 
  DragOverlay,
  closestCenter
} from '@dnd-kit/core';
import { ReactNode } from 'react';
import { createPortal } from 'react-dom';

interface DndProviderProps {
  children: ReactNode;
  onDragStart: (event: any) => void;
  onDragEnd: (event: any) => void;
  onDragCancel: () => void;
  activeId: string | null;
  renderOverlay: (id: string) => ReactNode;
}

export function DndProvider({
  children,
  onDragStart,
  onDragEnd,
  onDragCancel,
  activeId,
  renderOverlay
}: DndProviderProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
        delay: 150,
        tolerance: 5
      }
    })
  );

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragCancel={onDragCancel}
    >
      {children}
      {createPortal(
        <DragOverlay dropAnimation={null}>
          {activeId && renderOverlay(activeId)}
        </DragOverlay>,
        document.body
      )}
    </DndContext>
  );
}
```

## Phase 9: Board Component

File: [`src/components/Board.tsx`](src/components/Board.tsx)

```typescript
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
}

export function Board({
  puzzle,
  lockedItems,
  itemPlacements,
  zoneOrder,
  revealedRules,
  incorrectItems,
  onReturnToPool,
  isGameLocked,
  activeCardId,
  justLockedIds
}: BoardProps) {
  const getZoneItems = (zone: ZoneType): Item[] => {
    const order = zoneOrder.get(zone) || [];
    return order
      .map(id => puzzle.items.find(item => item.id === id))
      .filter((item): item is Item => item !== undefined);
  };

  return (
    <div className="flex-1 overflow-auto p-4 space-y-3">
      <Zone
        zoneType="left"
        label={puzzle.rules.left}
        placeholderLabel="Category A"
        items={getZoneItems('left')}
        lockedItems={lockedItems}
        incorrectItems={incorrectItems}
        isRevealed={revealedRules.left}
        onReturnToPool={onReturnToPool}
        isGameLocked={isGameLocked}
        activeCardId={activeCardId}
        justLockedIds={justLockedIds}
      />
      
      <Zone
        zoneType="both"
        label={`${puzzle.rules.left} & ${puzzle.rules.right}`}
        placeholderLabel="Both Sets"
        items={getZoneItems('both')}
        lockedItems={lockedItems}
        incorrectItems={incorrectItems}
        isRevealed={revealedRules.left && revealedRules.right}
        onReturnToPool={onReturnToPool}
        isGameLocked={isGameLocked}
        activeCardId={activeCardId}
        justLockedIds={justLockedIds}
      />
      
      <Zone
        zoneType="right"
        label={puzzle.rules.right}
        placeholderLabel="Category B"
        items={getZoneItems('right')}
        lockedItems={lockedItems}
        incorrectItems={incorrectItems}
        isRevealed={revealedRules.right}
        onReturnToPool={onReturnToPool}
        isGameLocked={isGameLocked}
        activeCardId={activeCardId}
        justLockedIds={justLockedIds}
      />
      
      <div className="h-4" />
      
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
      />
    </div>
  );
}
```

## Phase 10: Main App Component

File: [`src/App.tsx`](src/App.tsx)

```typescript
import { useState, useEffect } from 'react';
import { Board } from './components/Board';
import { WordPool } from './components/WordPool';
import { DndProvider } from './components/DndProvider';
import { useVennEngine } from './hooks/useVennEngine';
import samplePuzzle from './data/samplePuzzle.json';
import { PuzzleData } from './types/game';

function App() {
  const [puzzleData] = useState<PuzzleData>(samplePuzzle as PuzzleData);
  const game = useVennEngine(puzzleData);
  
  const [activeCardId, setActiveCardId] = useState<string | null>(null);
  const [incorrectItems, setIncorrectItems] = useState<Set<string>>(new Set());
  const [checkAttempts, setCheckAttempts] = useState(0);
  const [gameState, setGameState] = useState<'playing' | 'won' | 'lost'>('playing');
  const [justLockedIds, setJustLockedIds] = useState<Set<string>>(new Set());
  
  const MAX_ATTEMPTS = 5;

  // CRITICAL FIX: Enable animations only after initial mount
  // This prevents the drop-in animation from playing on page load
  useEffect(() => {
    // Small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      document.body.classList.add('game-ready');
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const handleDragStart = (event: any) => {
    setActiveCardId(event.active.id);
  };

  const handleDragEnd = (event: any) => {
    // Process drop
    game.handleDrop(event);
    
    // CRITICAL FIX: Clear active state immediately
    // No setTimeout hack - React's state update will handle the handover
    // The key-changing strategy in Zone.tsx forces remount, triggering animation
    setActiveCardId(null);
    
    // Clear error state
    setIncorrectItems(prev => {
      const next = new Set(prev);
      next.delete(event.active.id);
      return next;
    });
  };

  const handleReturnToPool = (itemId: string) => {
    game.removeItem(itemId);
    setIncorrectItems(prev => {
      const next = new Set(prev);
      next.delete(itemId);
      return next;
    });
  };

  const handleCheckPuzzle = () => {
    const result = game.validatePuzzle();
    
    // Track newly locked items for animation
    const newlyLocked = new Set(
      result.correct.filter(id => !game.lockedItems.has(id))
    );
    setJustLockedIds(newlyLocked);
    setTimeout(() => setJustLockedIds(new Set()), 400);
    
    setIncorrectItems(new Set(result.incorrect));
    setCheckAttempts(prev => prev + 1);
    
    const allLocked = game.lockedItems.size + result.correct.length;
    if (result.incorrect.length === 0 && allLocked === game.puzzle.items.length) {
      setGameState('won');
    } else if (checkAttempts + 1 >= MAX_ATTEMPTS) {
      setGameState('lost');
      setTimeout(() => game.autoPlaceAllItems(), 500);
    }
  };

  const renderOverlay = (cardId: string) => {
    const item = game.puzzle.items.find(i => i.id === cardId);
    if (!item) return null;
    
    return (
      <div className="bg-white border-2 border-gray-300 px-3 py-2 rounded-xl text-sm font-medium shadow-xl scale-105 cursor-grabbing">
        {item.text}
      </div>
    );
  };

  const hasPlacedItems = game.itemPlacements.size > 0;
  const isGameLocked = gameState !== 'playing';

  return (
    <DndProvider
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveCardId(null)}
      activeId={activeCardId}
      renderOverlay={renderOverlay}
    >
      <div className="h-screen bg-gray-50 flex flex-col max-w-md mx-auto">
        <header className="bg-white border-b border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {game.lockedItems.size} / {game.puzzle.items.length} locked
            </div>
            <img src="/vennstack.png" alt="VennStack" className="h-8" />
            <div className="text-sm text-gray-600">
              {checkAttempts}/{MAX_ATTEMPTS}
            </div>
          </div>
        </header>

        <Board
          puzzle={game.puzzle}
          lockedItems={game.lockedItems}
          itemPlacements={game.itemPlacements}
          zoneOrder={game.zoneOrder}
          revealedRules={game.revealedRules}
          incorrectItems={incorrectItems}
          onReturnToPool={handleReturnToPool}
          isGameLocked={isGameLocked}
          activeCardId={activeCardId}
          justLockedIds={justLockedIds}
        />

        <WordPool
          items={game.puzzle.items}
          lockedItems={game.lockedItems}
          itemPlacements={game.itemPlacements}
          isGameLocked={isGameLocked}
          activeCardId={activeCardId}
        />

        <div className="p-4 bg-white border-t border-gray-200">
          <button
            onClick={handleCheckPuzzle}
            disabled={!hasPlacedItems || checkAttempts >= MAX_ATTEMPTS || isGameLocked}
            className="w-full py-3 rounded-full font-semibold text-white bg-cyan-500 hover:bg-cyan-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {checkAttempts >= MAX_ATTEMPTS ? 'Solution Revealed' : 'Check Answer'}
          </button>
        </div>

        {gameState !== 'playing' && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-6 max-w-sm">
              <h2 className="text-2xl font-bold mb-4">
                {gameState === 'won' ? '🎉 You Won!' : '😔 Game Over'}
              </h2>
              <p className="text-gray-600">
                {gameState === 'won' 
                  ? `Solved in ${checkAttempts} attempts!`
                  : 'Out of attempts. Solution revealed.'}
              </p>
            </div>
          </div>
        )}
      </div>
    </DndProvider>
  );
}

export default App;
```

## Phase 11: Testing Protocol

Test in this exact order:

### Desktop (Chrome/Safari)

1. Drag from pool to zone - verify smooth drop-in animation
2. Drag between zones - verify card moves correctly
3. Drop back to pool - verify removal
4. Check correct answer - verify lock animation plays
5. Check incorrect answer - verify shake animation
6. Win game - verify confetti/modal
7. Lose game - verify auto-place

### Mobile (iOS Safari, Android Chrome)

8. Touch drag from pool
9. Touch drag between zones
10. Scroll page without triggering drag
11. Drag without triggering scroll

### Edge Cases

12. Empty zone drops
13. Rapid consecutive drags
14. Multiple cards in dense zones
15. Resize window during drag

## Phase 12: Add Advanced Features

After core works perfectly:

1. Progress bar with animations
2. Stats tracking with localStorage
3. Puzzle archive
4. Confetti (reinstall framer-motion)
5. Game results modal
6. Sound effects

## Critical Success Factors

1. **No position transitions** - only entrance animations
2. **Complete filtering** - dragged card never rendered in source
3. **Key-changing strategy** - `key={`${item.id}-${zoneType}`}` forces React remount for drop animations
4. **Flex-aware insertion** - Y-axis (row detection) prioritized before X-axis (left/right within row)
5. **Animation triggers** - Drop-in plays on mount via key change; just-locked tracked separately
6. **Game-ready class** - Prevents animations on initial page load

## Key Fixes Applied

### Fix #1: Multi-Row Insertion Logic
- **Problem**: Simple X-axis comparison failed with wrapped flex rows
- **Solution**: Row-aware algorithm that groups cards by Y-position, then compares X within same row
- **Location**: `src/utils/insertionCalculator.ts`

### Fix #2: No setTimeout for Handover
- **Problem**: 16ms timeout caused flashing/ghosting on varying frame rates
- **Solution**: React key changes (`${item.id}-${zoneType}`) force remount, triggering CSS animation naturally
- **Location**: `src/components/Zone.tsx` (key prop), `src/App.tsx` (removed setTimeout), `src/styles/card-animations.css`

### Fix #3: Reliable Animation Trigger
- **Problem**: CSS class + setTimeout could miss initial mount frame
- **Solution**: Animation plays on component mount via CSS, controlled by `body.game-ready` to prevent page-load flashing
- **Location**: `src/styles/card-animations.css`, `src/App.tsx` (useEffect for game-ready class)

## What We're NOT Doing

- Position/transform transitions (causes flash)
- Opacity hiding (leaves card in layout)
- Framer Motion layout animations (conflicts)
- Complex density systems (use simple flex-wrap)
- Real-time gap indicators (not needed with few cards)