import { useState, useCallback, useEffect } from 'react';
import { PuzzleData, Zone, GameState, GameActions } from '../types/game';
import { playLockSound } from '../utils/audio';
import { calculateInsertPosition } from '../utils/insertionCalculator';

interface LockedState {
  itemPlacements: Record<string, Zone>;
  zoneOrder: Record<Zone, string[]>;
  lockedItems: string[];
  revealedRules: { left: boolean; right: boolean };
}

export function useVennEngine(
  puzzleData: PuzzleData,
  isCompleted: boolean = false,
  lockedState?: LockedState
): GameState & GameActions {
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
  }, []);

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
  }, []);


  const validatePuzzle = useCallback(() => {
    // Prevent validation if puzzle is completed
    if (isCompleted) {
      return { correct: [], incorrect: [] };
    }
    
    const correct: string[] = [];
    const incorrect: string[] = [];

    // First, check if left and right categories are swapped
    // Get all items that should be in left or right (excluding both/outside)
    const leftItems = puzzleData.items.filter(item => item.zone === 'left');
    const rightItems = puzzleData.items.filter(item => item.zone === 'right');
    
    // Check if all left items are together in one zone (either left or right)
    const leftItemsPlaced = leftItems.filter(item => {
      const placedZone = itemPlacements.get(item.id);
      return placedZone === 'left' || placedZone === 'right';
    });
    
    // Check if all right items are together in one zone (either left or right)
    const rightItemsPlaced = rightItems.filter(item => {
      const placedZone = itemPlacements.get(item.id);
      return placedZone === 'left' || placedZone === 'right';
    });
    
    // Determine if there's a swap: all left items in one zone, all right items in the other
    let isSwapped = false;
    if (leftItemsPlaced.length === leftItems.length && rightItemsPlaced.length === rightItems.length) {
      // Check if all left items are in the same zone
      const leftItemZones = new Set(leftItems.map(item => itemPlacements.get(item.id)).filter(Boolean));
      const rightItemZones = new Set(rightItems.map(item => itemPlacements.get(item.id)).filter(Boolean));
      
      // If left items are all in 'right' and right items are all in 'left', it's swapped
      if (leftItemZones.size === 1 && rightItemZones.size === 1) {
        const leftZone = Array.from(leftItemZones)[0];
        const rightZone = Array.from(rightItemZones)[0];
        isSwapped = (leftZone === 'right' && rightZone === 'left');
      }
    }

    puzzleData.items.forEach(item => {
      const placedZone = itemPlacements.get(item.id);
      if (!placedZone) return;

      let isCorrect = false;
      
      // Handle swapped left/right categories
      if (isSwapped && (item.zone === 'left' || item.zone === 'right')) {
        // If swapped, left items in right zone are correct, right items in left zone are correct
        isCorrect = (item.zone === 'left' && placedZone === 'right') || 
                   (item.zone === 'right' && placedZone === 'left');
      } else {
        // Normal validation: must be in exact zone (or swapped if swap detected)
        isCorrect = placedZone === item.zone;
      }

      if (isCorrect) {
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
      
      // Count items that belong to left category (regardless of which box they're in)
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

    return { correct, incorrect };
  }, [puzzleData, itemPlacements, lockedItems, isCompleted]);


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

  const handleDrop = useCallback((event: any, mousePosition?: { x: number; y: number } | null) => {
    const { active, over } = event;
    
    if (!over) {
      removeItem(active.id as string);
      return;
    }

    const dropData = over.data.current;
    
    if (dropData.zone === 'word-pool') {
      removeItem(active.id as string);
      return;
    }

    // Calculate insertion position based on mouse coordinates
    let dropPoint: { x: number; y: number };
    
    if (mousePosition) {
      dropPoint = mousePosition;
    } else {
      // Fall back to center of zone
      const zoneElement = document.querySelector(`[data-zone="${dropData.zone}"]`);
      if (zoneElement) {
        const rect = zoneElement.getBoundingClientRect();
        dropPoint = {
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2
        };
      } else {
        // Can't calculate, append to end
        placeItem(active.id as string, dropData.zone as Zone, undefined);
        return;
      }
    }

    const insertAfterId = calculateInsertPosition(
      dropData.zone,
      dropPoint,
      active.id as string
    );

    placeItem(active.id as string, dropData.zone as Zone, insertAfterId);
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
      return placedZone !== item.zone;
    });

    const pool = incorrectPlaced.length > 0 ? incorrectPlaced : placedNotLocked;
    const target = pool[0];
    const itemId = target.id;

    // Move item to its correct zone
    placeItem(itemId, target.zone, undefined);

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
  }, [itemPlacements, lockedItems, placeItem, puzzleData, isCompleted]);

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
    handleDrop,
    revealOneHint
  };
}
