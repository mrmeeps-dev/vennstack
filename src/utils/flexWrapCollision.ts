import { CollisionDetection, closestCenter, CollisionDescriptor } from '@dnd-kit/core';
import { Coordinates } from '@dnd-kit/utilities';

interface CardRect {
  id: string;
  rect: DOMRect;
  row: number;
  indexInRow: number;
}

export function createFlexWrapCollision(): CollisionDetection {
  return (args) => {
    const { active: _active, droppableContainers, pointerCoordinates } = args;
    
    if (!pointerCoordinates) {
      return closestCenter(args);
    }
    
    // Step 1: Find target zone using standard detection (zones only)
    const zoneContainers = droppableContainers.filter(c => 
      c.id.toString().startsWith('zone-') || c.id === 'word-pool'
    );
    
    const zoneCollisions = closestCenter({
      ...args,
      droppableContainers: zoneContainers
    });
    
    if (zoneCollisions.length === 0) return [];
    
    const targetZoneId = zoneCollisions[0].id.toString();
    const zoneId = targetZoneId.replace('zone-', '');
    
    // Step 2: Get cards in this zone with row positions
    const cards = getCardsWithRowPositions(zoneId);
    
    if (cards.length === 0) {
      // Empty zone - use zone collision
      return zoneCollisions;
    }
    
    // Step 3: Find closest gap (horizontal within row)
    const gap = findClosestGap(cards, pointerCoordinates, zoneId);
    
    return gap ? [{ id: gap.id, data: { droppableContainer: gap } }] : zoneCollisions;
  };
}

function getCardsWithRowPositions(zoneId: string): CardRect[] {
  const zoneElement = document.querySelector(`[data-zone="${zoneId}"]`);
  if (!zoneElement) return [];
  
  const cardElements = Array.from(
    zoneElement.querySelectorAll('[data-card-id]:not([style*="opacity: 0"])')
  );
  
  // Get rects and sort by position
  const rects = cardElements
    .map(el => ({
      id: el.getAttribute('data-card-id')!,
      rect: el.getBoundingClientRect(),
      row: 0,
      indexInRow: 0
    }))
    .sort((a, b) => {
      // Sort by Y first (rows), then X (position in row)
      const yDiff = a.rect.top - b.rect.top;
      return Math.abs(yDiff) < 10 ? a.rect.left - b.rect.left : yDiff;
    });
  
  // Assign row numbers (cards within 10px vertical = same row)
  let currentRow = 0;
  let lastTop = rects[0]?.rect.top;
  
  rects.forEach((card, idx) => {
    if (idx > 0 && Math.abs(card.rect.top - lastTop) > 10) {
      currentRow++;
      lastTop = card.rect.top;
    }
    card.row = currentRow;
  });
  
  // Assign index within row
  const rowMap = new Map<number, number>();
  rects.forEach(card => {
    card.indexInRow = rowMap.get(card.row) || 0;
    rowMap.set(card.row, card.indexInRow + 1);
  });
  
  return rects;
}

function findClosestGap(
  cards: CardRect[],
  pointer: Coordinates,
  zoneId: string
): CollisionDescriptor | null {
  // Find which row pointer is closest to
  const rows = [...new Set(cards.map(c => c.row))];
  const targetRow = rows.reduce((closest, row) => {
    const rowCards = cards.filter(c => c.row === row);
    const avgY = rowCards.reduce((sum, c) => sum + c.rect.top, 0) / rowCards.length;
    const closestY = cards.filter(c => c.row === closest)[0].rect.top;
    return Math.abs(pointer.y - avgY) < Math.abs(pointer.y - closestY) ? row : closest;
  }, 0);
  
  const rowCards = cards.filter(c => c.row === targetRow);
  
  // Calculate all gaps in this row
  const gaps: Array<{ id: string; x: number; dist: number; after: string | null }> = [];
  
  // Gap before first card
  gaps.push({
    id: `gap-start-${zoneId}`,
    x: rowCards[0].rect.left - 20,
    dist: Math.abs(pointer.x - (rowCards[0].rect.left - 20)),
    after: null
  });
  
  // Gaps between cards
  for (let i = 0; i < rowCards.length - 1; i++) {
    const gapX = (rowCards[i].rect.right + rowCards[i + 1].rect.left) / 2;
    gaps.push({
      id: `gap-after-${rowCards[i].id}`,
      x: gapX,
      dist: Math.abs(pointer.x - gapX),
      after: rowCards[i].id
    });
  }
  
  // Gap after last card
  const last = rowCards[rowCards.length - 1];
  gaps.push({
    id: `gap-end-${zoneId}`,
    x: last.rect.right + 20,
    dist: Math.abs(pointer.x - (last.rect.right + 20)),
    after: last.id
  });
  
  // Return closest gap
  gaps.sort((a, b) => a.dist - b.dist);
  const closest = gaps[0];
  
  return {
    id: closest.id,
    data: {
      droppableContainer: {
        id: closest.id,
        data: {
          current: {
            type: 'gap',
            zone: zoneId,
            insertAfterId: closest.after
          }
        }
      },
      value: 0
    }
  } as unknown as CollisionDescriptor;
}






