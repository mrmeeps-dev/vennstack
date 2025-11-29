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
  const rightmostCard = targetRow[targetRow.length - 1];
  const leftmostCard = targetRow[0];
  
  // If drop point is clearly to the right of the rightmost card, append to end
  // Use right edge + tolerance to detect drops in empty space to the right
  const TOLERANCE = 30; // pixels of empty space before we consider it "clearly to the right"
  if (dropPoint.x > rightmostCard.right + TOLERANCE) {
    return targetRow[targetRow.length - 1].cardId;
  }
  
  // If drop point is clearly to the left of the leftmost card, insert at start
  if (dropPoint.x < leftmostCard.left - TOLERANCE) {
    return null;
  }
  
  // Otherwise, find the insertion point between cards
  for (let i = 0; i < targetRow.length; i++) {
    const card = targetRow[i];
    
    // Check if drop point is before this card's left edge
    if (dropPoint.x < card.left) {
      // Insert before this card
      if (i === 0) {
        return null; // Insert at very start
      }
      return targetRow[i - 1].cardId; // Insert after previous card
    }
    
    // Check if drop point is within this card's bounds
    if (dropPoint.x >= card.left && dropPoint.x <= card.right) {
      // Drop is on this card - check if left or right half
      const cardMidpoint = card.left + (card.right - card.left) / 2;
      if (dropPoint.x < cardMidpoint) {
        // Left half - insert before this card
        if (i === 0) {
          return null;
        }
        return targetRow[i - 1].cardId;
      } else {
        // Right half - insert after this card
        return card.cardId;
      }
    }
  }

  // Drop point is after all cards in the row (but within tolerance)
  // This handles the case where drop is just slightly to the right of last card
  return targetRow[targetRow.length - 1].cardId;
}

