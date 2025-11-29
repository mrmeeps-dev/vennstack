import { useState, useCallback, useEffect } from 'react';
import { PuzzleData, Zone, GameState, GameActions } from '../types/game';
import { playLockSound } from '../utils/audio';
import { calculateInsertPosition } from '../utils/insertionCalculator';

interface LockedState {
  itemPlacements: Record<string, Zone>;
  zoneOrder: Record<Zone, string[]>;
  lockedItems: string[];
  revealedRules: { left: boolean; right: boolean };
  isMirrored?: boolean;
}

// Helper function to get expected zone based on mirrored state
function getExpectedZone(item: { zone: Zone }, isMirrored: boolean): Zone {
  if (item.zone === 'left') {
    return isMirrored ? 'right' : 'left';
  }
  if (item.zone === 'right') {
    return isMirrored ? 'left' : 'right';
  }
  // 'both' and 'outside' are invariant
  return item.zone;
}

// Helper function to calculate if orientation is mirrored based on current placements
function calculateIsMirrored(
  items: PuzzleData['items'],
  itemPlacements: Map<string, Zone>
): boolean {
  let standardMatches = 0;
  let mirroredMatches = 0;

  items.forEach(item => {
    const placedZone = itemPlacements.get(item.id);
    if (!placedZone) return;

    // Only consider left/right items (invariant zones don't flip)
    if (item.zone === 'left' || item.zone === 'right') {
      // Standard hypothesis: placedZone === item.zone
      if (placedZone === item.zone) {
        standardMatches++;
      }
      // Mirrored hypothesis: left item in right zone, right item in left zone
      if (
        (item.zone === 'left' && placedZone === 'right') ||
        (item.zone === 'right' && placedZone === 'left')
      ) {
        mirroredMatches++;
      }
    }
  });

  // Return true if mirrored matches exceed standard matches
  return mirroredMatches > standardMatches;
}

// Helper function to check if orientation is crystallized (locked exclusive-zone items exist)
function isOrientationCrystallized(
  items: PuzzleData['items'],
  lockedItems: Set<string>
): boolean {
  return items.some(item => {
    if (lockedItems.has(item.id) && (item.zone === 'left' || item.zone === 'right')) {
      return true;
    }
    return false;
  });
}

export function useVennEngine(
  puzzleData: PuzzleData,
  isCompleted: boolean = false,
  lockedState?: LockedState
): GameState & GameActions {
  // Initialize isMirrored from locked state or calculate from board state
  const [isMirrored, setIsMirrored] = useState<boolean>(() => {
    if (isCompleted && lockedState?.isMirrored !== undefined) {
      return lockedState.isMirrored;
    }
    if (isCompleted && lockedState) {
      // Recalculate from saved board state for backward compatibility
      const placements = new Map(Object.entries(lockedState.itemPlacements));
      return calculateIsMirrored(puzzleData.items, placements);
    }
    return false;
  });

  // Initialize state from locked state if puzzle is completed
  const [lockedItems, setLockedItems] = useState<Set<string>>(() => {
    if (isCompleted && lockedState) {
      return new Set(lockedState.lockedItems);
    }
    return new Set();
  });
  
  const [itemPlacements, setItemPlacements] = useState<Map<string, Zone>>(() => {
    if (isCompleted && lockedState) {
      return new Map(Object.entries(lockedState.itemPlacements));
    }
    return new Map();
  });
  
  const [zoneOrder, setZoneOrder] = useState<Map<Zone, string[]>>(() => {
    if (isCompleted && lockedState) {
      const order = new Map<Zone, string[]>();
      Object.entries(lockedState.zoneOrder).forEach(([zone, items]) => {
        order.set(zone as Zone, items);
      });
      return order;
    }
    return new Map([
      ['left', []],
      ['right', []],
      ['both', []],
      ['outside', []],
    ]);
  });
  
  const [revealedRules, setRevealedRules] = useState(() => {
    if (isCompleted && lockedState) {
      return lockedState.revealedRules;
    }
    return { left: false, right: false };
  });

  useEffect(() => {
    // Only reset if puzzle is not completed
    if (!isCompleted) {
      setLockedItems(new Set());
      setItemPlacements(new Map());
      setZoneOrder(new Map([['left', []], ['right', []], ['both', []], ['outside', []]]));
      setRevealedRules({ left: false, right: false });
      setIsMirrored(false);
    } else if (lockedState) {
      // Restore locked state if puzzle is completed and state exists
      setLockedItems(new Set(lockedState.lockedItems));
      setItemPlacements(new Map(Object.entries(lockedState.itemPlacements)));
      const order = new Map<Zone, string[]>();
      Object.entries(lockedState.zoneOrder).forEach(([zone, items]) => {
        order.set(zone as Zone, items);
      });
      setZoneOrder(order);
      setRevealedRules(lockedState.revealedRules);
      // Restore isMirrored from state or recalculate
      if (lockedState.isMirrored !== undefined) {
        setIsMirrored(lockedState.isMirrored);
      } else {
        const placements = new Map(Object.entries(lockedState.itemPlacements));
        setIsMirrored(calculateIsMirrored(puzzleData.items, placements));
      }
    } else if (isCompleted && !lockedState) {
      // If puzzle is completed but no locked state exists (old completion),
      // auto-place all items in their correct zones
      const placements = new Map<string, Zone>();
      const orders = new Map<Zone, string[]>([
        ['left', []], ['right', []], ['both', []], ['outside', []]
      ]);
      const locked = new Set<string>();

      puzzleData.items.forEach(item => {
        placements.set(item.id, item.zone);
        orders.get(item.zone)!.push(item.id);
        locked.add(item.id);
      });

      setItemPlacements(placements);
      setZoneOrder(orders);
      setLockedItems(locked);
      setRevealedRules({ left: true, right: true });
      setIsMirrored(false);
    }
  }, [puzzleData.id, puzzleData.items, isCompleted, lockedState]);

  const placeItem = useCallback((itemId: string, targetZone: Zone, insertAfterId?: string | null) => {
    // Prevent changes if puzzle is completed
    if (isCompleted) return;
    
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
  }, [isCompleted]);

  const removeItem = useCallback((itemId: string) => {
    // Prevent changes if puzzle is completed
    if (isCompleted) return;
    
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
  }, [isCompleted]);


  const validatePuzzle = useCallback(() => {
    // Prevent validation if puzzle is completed
    if (isCompleted) {
      return { correct: [], incorrect: [], isMirrored: false };
    }
    
    // CRITICAL: Check if orientation is crystallized (locked exclusive-zone items exist)
    const crystallized = isOrientationCrystallized(puzzleData.items, lockedItems);
    
    // Calculate new orientation only if not crystallized
    let currentIsMirrored = isMirrored;
    if (!crystallized) {
      const calculatedMirrored = calculateIsMirrored(puzzleData.items, itemPlacements);
      currentIsMirrored = calculatedMirrored;
      setIsMirrored(calculatedMirrored);
    }
    
    const correct: string[] = [];
    const incorrect: string[] = [];

    puzzleData.items.forEach(item => {
      const placedZone = itemPlacements.get(item.id);
      if (!placedZone) return;

      // Use getExpectedZone to determine correct zone based on mirrored state
      const expectedZone = getExpectedZone(item, currentIsMirrored);

      if (placedZone === expectedZone) {
        correct.push(item.id);
        setLockedItems(prev => new Set(prev).add(item.id));
        playLockSound();
      } else {
        incorrect.push(item.id);
      }
    });

    // Check rule discovery
    setRevealedRules(prev => {
      const updatedLocked = new Set(lockedItems);
      correct.forEach(id => updatedLocked.add(id));
      
      // If all items are locked, automatically reveal both categories
      const allLocked = updatedLocked.size === puzzleData.items.length;
      if (allLocked) {
        return { left: true, right: true };
      }
      
      // Count items that belong to left category (regardless of which box they're in)
      // Use item.zone (intrinsic category), not physical placement
      const leftCount = puzzleData.items.filter(
        item => item.zone === 'left' && updatedLocked.has(item.id)
      ).length;
      // Count items that belong to right category (regardless of which box they're in)
      const rightCount = puzzleData.items.filter(
        item => item.zone === 'right' && updatedLocked.has(item.id)
      ).length;

      return {
        left: prev.left || leftCount >= 3,
        right: prev.right || rightCount >= 3
      };
    });

    return { correct, incorrect, isMirrored: currentIsMirrored };
  }, [puzzleData, itemPlacements, lockedItems, isCompleted, isMirrored]);


  const autoPlaceAllItems = useCallback(() => {
    const placements = new Map<string, Zone>();
    const orders = new Map<Zone, string[]>([
      ['left', []], ['right', []], ['both', []], ['outside', []]
    ]);

    // Place all items in their correct zones (natural zones from puzzle definition)
    puzzleData.items.forEach(item => {
      placements.set(item.id, item.zone);
      orders.get(item.zone)!.push(item.id);
    });

    setItemPlacements(placements);
    setZoneOrder(orders);
    setLockedItems(new Set(puzzleData.items.map(i => i.id)));
    setRevealedRules({ left: true, right: true });
    // Reset mirrored state since we're placing everything correctly
    setIsMirrored(false);
  }, [puzzleData]);

  const handleDrop = useCallback((event: any, mousePosition?: { x: number; y: number } | null) => {
    const { active, over } = event;
    
    if (!over) {
      removeItem(active.id as string);
      return;
    }

    const dropData = over.data?.current;
    
    // Handle case where dropData might be undefined or missing zone
    // Also check that it's a zone drop (not a card drop)
    if (!dropData || dropData.type !== 'zone' || !dropData.zone || dropData.zone === 'word-pool') {
      removeItem(active.id as string);
      return;
    }

    // Ensure zone is a valid Zone type
    const targetZone = dropData.zone as Zone;
    if (!['left', 'right', 'both', 'outside'].includes(targetZone)) {
      removeItem(active.id as string);
      return;
    }

    // Calculate insertion position based on mouse coordinates
    let dropPoint: { x: number; y: number };
    
    if (mousePosition) {
      dropPoint = mousePosition;
    } else {
      // Fall back to center of zone
      const zoneElement = document.querySelector(`[data-zone="${targetZone}"]`);
      if (zoneElement) {
        const rect = zoneElement.getBoundingClientRect();
        dropPoint = {
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2
        };
      } else {
        // Can't calculate, append to end
        placeItem(active.id as string, targetZone, undefined);
        return;
      }
    }

    const insertAfterId = calculateInsertPosition(
      targetZone,
      dropPoint,
      active.id as string
    );

    placeItem(active.id as string, targetZone, insertAfterId);
  }, [placeItem, removeItem]);

  const revealOneHint = useCallback(() => {
    // Prevent hints if puzzle is completed
    if (isCompleted) return null;
    
    // Consider only cards that are already placed on the board (not in the pool),
    // not yet locked. Prefer incorrect placements, but fall back to any placed card
    // so a single correct placed card can still be locked as a hint.
    const placedNotLocked = puzzleData.items.filter(item => {
      const placedZone = itemPlacements.get(item.id);
      return (
        placedZone !== undefined &&
        placedZone !== null &&
        placedZone !== 'outside' &&
        !lockedItems.has(item.id)
      );
    });

    if (placedNotLocked.length === 0) {
      return null;
    }

    const incorrectPlaced = placedNotLocked.filter(item => {
      const placedZone = itemPlacements.get(item.id);
      const expectedZone = getExpectedZone(item, isMirrored);
      return placedZone !== expectedZone;
    });

    const pool = incorrectPlaced.length > 0 ? incorrectPlaced : placedNotLocked;
    const target = pool[0];
    const itemId = target.id;

    // Move item to its correct zone based on mirrored state
    const expectedZone = getExpectedZone(target, isMirrored);
    placeItem(itemId, expectedZone, undefined);

    // Lock it in place and play sound
    setLockedItems(prev => {
      const next = new Set(prev);
      next.add(itemId);
      return next;
    });
    playLockSound();

    // Update rule reveal state to count this hinted item
    setRevealedRules(prev => {
      const updatedLocked = new Set(lockedItems);
      updatedLocked.add(itemId);

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

    return itemId;
  }, [itemPlacements, lockedItems, placeItem, puzzleData, isCompleted, isMirrored]);

  return {
    puzzle: puzzleData,
    lockedItems,
    itemPlacements,
    zoneOrder,
    revealedRules,
    isMirrored,
    placeItem,
    removeItem,
    validatePuzzle,
    autoPlaceAllItems,
    handleDrop,
    revealOneHint
  };
}
