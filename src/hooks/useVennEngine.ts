import { useState, useCallback, useRef } from 'react';
import { PuzzleData, Zone, GameState, GameActions } from '../types/game';
import { playLockSound } from '../utils/audio';

// Custom arrayMove function for reordering items within zones
const arrayMove = <T>(array: T[], from: number, to: number): T[] => {
  const newArray = [...array];
  const [removed] = newArray.splice(from, 1);
  newArray.splice(to, 0, removed);
  return newArray;
};

export function useVennEngine(puzzleData: PuzzleData): GameState & GameActions {
  const [lockedItems, setLockedItems] = useState<Set<string>>(new Set());
  const [itemPlacements, setItemPlacements] = useState<Map<string, Zone>>(new Map());
  const [zoneOrder, setZoneOrder] = useState<Map<Zone, string[]>>(new Map([
    ['left', []],
    ['right', []],
    ['both', []],
    ['outside', []],
  ]));
  const [revealedRules, setRevealedRules] = useState({
    left: false,
    right: false,
  });
  
  // Track pending placements to prevent duplicate calls from React StrictMode
  // Use a Set for synchronous O(1) checking
  const pendingPlacementsRef = useRef<Set<string>>(new Set());
  
  // Global counter for tracking state updates (for debugging)
  const updateCounterRef = useRef(0);

  const placeItem = useCallback((itemId: string, targetZone: Zone, insertAfterId?: string | null) => {
    // CRITICAL: Synchronous lock check FIRST - before any logging or state access
    // This prevents React StrictMode from causing duplicate placements
    if (pendingPlacementsRef.current.has(itemId)) {
      // Already processing this item - skip silently (no console logs to avoid noise)
      console.warn(`⚠️ placeItem: Item ${itemId} already being placed, skipping duplicate call`);
      return;
    }
    
    // Mark as pending synchronously (BEFORE any state access or logging)
    pendingPlacementsRef.current.add(itemId);
    
    // Increment update counter and capture update ID for debugging
    updateCounterRef.current += 1;
    const updateId = updateCounterRef.current;
    
    // CRITICAL: Update both states using functional updates
    // React will batch these updates, but we need to ensure they're both based on current state
    
    // Update itemPlacements first
    setItemPlacements(prevPlacements => {
      const oldZone = prevPlacements.get(itemId);
      
      // Early exit: if item is already in target zone and not a reorder, skip
      if (oldZone === targetZone && insertAfterId === undefined) {
        // Item already in target zone - clear lock and return early
        pendingPlacementsRef.current.delete(itemId);
        return prevPlacements;
      }
      
      const nextPlacements = new Map(prevPlacements);
      // CRITICAL: The Map.set() will overwrite any existing entry for this itemId
      // This ensures the item can only be in ONE zone in itemPlacements
      nextPlacements.set(itemId, targetZone);
      return nextPlacements;
    });

    // Update zoneOrder - this will be batched with the itemPlacements update
    // CRITICAL: Remove from ALL zones first, then add to target zone
    // This ensures no duplicates exist during the update
    setZoneOrder(prevOrder => {
      const nextOrder = new Map(prevOrder);
      
      // A. Remove from ALL zones first (defensive cleanup)
      // This ensures the item is removed from any zone it might be in
      for (const zone of nextOrder.keys()) {
        const zoneArray = nextOrder.get(zone) || [];
        if (zoneArray.includes(itemId)) {
          nextOrder.set(zone, zoneArray.filter(id => id !== itemId));
        }
      }
      
      // B. Clean the target zone's order array before insertion
      // This handles reordering within the same zone or ensures clean insertion
      const cleanedTargetOrder = (nextOrder.get(targetZone) || []).filter(id => id !== itemId);
      
      // C. Calculate final order using cleanedTargetOrder as the base
      let finalOrder: string[];
      if (insertAfterId === null) {
        // Insert at the beginning
        finalOrder = [itemId, ...cleanedTargetOrder];
      } else if (insertAfterId !== undefined) {
        // Insert after the specified item
        const insertIndex = cleanedTargetOrder.findIndex(id => id === insertAfterId);
        if (insertIndex >= 0) {
          const newOrder = [...cleanedTargetOrder];
          newOrder.splice(insertIndex + 1, 0, itemId);
          finalOrder = newOrder;
        } else {
          // If insertAfterId not found, append to end
          finalOrder = [...cleanedTargetOrder, itemId];
        }
      } else {
        // Append to end (default behavior)
        finalOrder = [...cleanedTargetOrder, itemId];
      }
      
      nextOrder.set(targetZone, finalOrder);
      
      // Validation: Ensure item is only in target zone
      const zonesAfter: Zone[] = [];
      for (const [zone, order] of nextOrder.entries()) {
        if (order.includes(itemId)) {
          zonesAfter.push(zone);
        }
      }
      
      if (zonesAfter.length > 1) {
        console.error(`[${updateId}] ❌ CORRUPTION DETECTED: ${itemId} duplicated in zones:`, zonesAfter);
        // Force fix: keep only in target zone
        for (const zone of zonesAfter) {
          if (zone !== targetZone) {
            const order = nextOrder.get(zone) || [];
            nextOrder.set(zone, order.filter(id => id !== itemId));
          }
        }
      } else if (zonesAfter.length === 1 && zonesAfter[0] !== targetZone) {
        console.error(`[${updateId}] ❌ MISMATCH: ${itemId} in wrong zone. Expected: ${targetZone}, Got: ${zonesAfter[0]}`);
      }
      
      // Clear pending placement after zoneOrder update completes
      pendingPlacementsRef.current.delete(itemId);
      
      return nextOrder;
    });
  }, []);

  const removeItem = useCallback((itemId: string) => {
    // Increment update counter and capture update ID for debugging
    updateCounterRef.current += 1;
    const updateId = updateCounterRef.current;
    
    setItemPlacements(prev => {
      const next = new Map(prev);
      const zone = prev.get(itemId);
      next.delete(itemId);
      return next;
    });

    // Remove from zone order - CRITICAL: Use robust cleanup logic
    setZoneOrder(prev => {
      const next = new Map(prev);
      
      // --- DEEP LOGGING BEFORE UPDATE ---
      const zonesBefore: Zone[] = [];
      for (const [zone, order] of prev.entries()) {
        if (order.includes(itemId)) {
          zonesBefore.push(zone);
        }
      }
      console.log(`[${updateId}] 🔍 PRE-UPDATE: ${itemId} in:`, zonesBefore);
      // ----------------------------------
      
      // CRITICAL FIX: Iterate over next.keys() (the map we're building) instead of prev.entries()
      // This ensures we're always working with the current state, not stale previous state
      // This prevents race conditions when setZoneOrder is called multiple times rapidly
      for (const zone of next.keys()) {
        const order = next.get(zone) || [];
        // Use filter to remove item from ALL zone arrays in the current 'next' map
        if (order.includes(itemId)) {
          next.set(zone, order.filter(id => id !== itemId));
        }
      }
      
      // --- DEEP LOGGING AFTER UPDATE ---
      const zonesAfter: Zone[] = [];
      for (const [zone, order] of next.entries()) {
        if (order.includes(itemId)) {
          zonesAfter.push(zone);
        }
      }
      console.log(`[${updateId}] ✅ POST-UPDATE: ${itemId} in:`, zonesAfter);
      if (zonesAfter.length > 0) {
        console.error(`[${updateId}] ❌ CORRUPTION DETECTED: ${itemId} still in zones after removeItem:`, zonesAfter);
        // Force cleanup
        for (const zone of zonesAfter) {
          const order = next.get(zone) || [];
          next.set(zone, order.filter(id => id !== itemId));
        }
        // Log after fix
        const afterFixZones: Zone[] = [];
        for (const [zone, order] of next.entries()) {
          if (order.includes(itemId)) {
            afterFixZones.push(zone);
          }
        }
        console.log(`[${updateId}] 🔧 After corruption fix: ${itemId} in:`, afterFixZones);
      }
      // ----------------------------------
      
      return next;
    });
  }, []);

  const reorderItemsInZone = useCallback((zone: Zone, activeId: string, overId: string) => {
    // Increment update counter and capture update ID for debugging
    updateCounterRef.current += 1;
    const updateId = updateCounterRef.current;
    
    setZoneOrder(prev => {
      const next = new Map(prev);
      
      // --- DEEP LOGGING BEFORE UPDATE ---
      const zonesBefore: Zone[] = [];
      for (const [z, order] of prev.entries()) {
        if (order.includes(activeId)) {
          zonesBefore.push(z);
        }
      }
      console.log(`[${updateId}] 🔍 PRE-UPDATE: ${activeId} in:`, zonesBefore);
      // ----------------------------------
      
      const zoneOrder = prev.get(zone) || [];
      const oldIndex = zoneOrder.indexOf(activeId);
      const newIndex = zoneOrder.indexOf(overId);
      
      if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
        const newOrder = arrayMove(zoneOrder, oldIndex, newIndex);
        next.set(zone, newOrder);
      }
      
      // --- DEEP LOGGING AFTER UPDATE ---
      const zonesAfter: Zone[] = [];
      for (const [z, order] of next.entries()) {
        if (order.includes(activeId)) {
          zonesAfter.push(z);
        }
      }
      console.log(`[${updateId}] ✅ POST-UPDATE: ${activeId} in:`, zonesAfter);
      if (zonesAfter.length > 1) {
        console.error(`[${updateId}] ❌ CORRUPTION DETECTED: ${activeId} duplicated in zones:`, zonesAfter);
        // Force fix: keep only in target zone
        for (const z of zonesAfter) {
          if (z !== zone) {
            const order = next.get(z) || [];
            next.set(z, order.filter(id => id !== activeId));
          }
        }
        // Log after fix
        const afterFixZones: Zone[] = [];
        for (const [z, order] of next.entries()) {
          if (order.includes(activeId)) {
            afterFixZones.push(z);
          }
        }
        console.log(`[${updateId}] 🔧 After corruption fix: ${activeId} in:`, afterFixZones);
      }
      // ----------------------------------
      
      return next;
    });
  }, []);

  const validatePuzzle = useCallback((): { correct: string[]; incorrect: string[] } => {
    const correct: string[] = [];
    const incorrect: string[] = [];

    puzzleData.items.forEach(item => {
      const placedZone = itemPlacements.get(item.id);
      if (placedZone === undefined) {
        // Item not placed yet - skip
        return;
      }

      if (placedZone === item.zone) {
        correct.push(item.id);
        // Lock correct items
        setLockedItems(prev => {
          const next = new Set(prev);
          next.add(item.id);
          return next;
        });
        playLockSound();
      } else {
        incorrect.push(item.id);
        // Keep incorrect items in place - don't remove from placements
        // They'll show error state and can be moved by the user
      }
    });

    // Check rule discovery after validation
    setRevealedRules(currentRules => {
      const updated = { ...currentRules };
      const updatedLocked = new Set(lockedItems);
      correct.forEach(id => updatedLocked.add(id));
      
      // Check if 3 items are locked in left zone (Set A only)
      const leftLockedCount = puzzleData.items.filter(
        item => item.zone === 'left' && updatedLocked.has(item.id)
      ).length;
      
      if (leftLockedCount >= 3 && !updated.left) {
        updated.left = true;
      }
      
      // Check if 3 items are locked in right zone (Set B only)
      const rightLockedCount = puzzleData.items.filter(
        item => item.zone === 'right' && updatedLocked.has(item.id)
      ).length;
      
      if (rightLockedCount >= 3 && !updated.right) {
        updated.right = true;
      }
      
      return updated;
    });

    return { correct, incorrect };
  }, [puzzleData, itemPlacements, lockedItems]);

  const checkRuleDiscovery = useCallback(() => {
    setRevealedRules(prev => {
      const next = { ...prev };
      
      // Check if 3 items are locked in left zone (Set A only)
      const leftLockedCount = puzzleData.items.filter(
        item => item.zone === 'left' && lockedItems.has(item.id)
      ).length;
      
      if (leftLockedCount >= 3 && !next.left) {
        next.left = true;
      }
      
      // Check if 3 items are locked in right zone (Set B only)
      const rightLockedCount = puzzleData.items.filter(
        item => item.zone === 'right' && lockedItems.has(item.id)
      ).length;
      
      if (rightLockedCount >= 3 && !next.right) {
        next.right = true;
      }
      
      return next;
    });
  }, [puzzleData, lockedItems]);

  const autoPlaceAllItems = useCallback(() => {
    // Place all items in their correct zones
    setItemPlacements(prev => {
      const next = new Map(prev);
      puzzleData.items.forEach(item => {
        next.set(item.id, item.zone);
      });
      return next;
    });
    
    // Set zone order to match puzzle data order
    setZoneOrder(prev => {
      const next = new Map(prev);
      const leftItems: string[] = [];
      const rightItems: string[] = [];
      const bothItems: string[] = [];
      const outsideItems: string[] = [];
      
      puzzleData.items.forEach(item => {
        if (item.zone === 'left') leftItems.push(item.id);
        else if (item.zone === 'right') rightItems.push(item.id);
        else if (item.zone === 'both') bothItems.push(item.id);
        else if (item.zone === 'outside') outsideItems.push(item.id);
      });
      
      next.set('left', leftItems);
      next.set('right', rightItems);
      next.set('both', bothItems);
      next.set('outside', outsideItems);
      
      return next;
    });
    
    // Lock all items (they're all in correct positions now)
    setLockedItems(prev => {
      const next = new Set(prev);
      puzzleData.items.forEach(item => {
        next.add(item.id);
      });
      return next;
    });
    // Reveal all rules
    setRevealedRules({ left: true, right: true });
  }, [puzzleData]);

  return {
    puzzle: puzzleData,
    lockedItems,
    itemPlacements,
    zoneOrder,
    revealedRules,
    phase: 'investigation' as const,
    placeItem,
    removeItem,
    validatePuzzle,
    checkRuleDiscovery,
    autoPlaceAllItems,
    reorderItemsInZone,
  };
}

