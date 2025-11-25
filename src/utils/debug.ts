import { GameState, Zone } from '../types/game';

/**
 * Debug utilities to help identify duplication issues
 * 
 * Usage in browser console:
 * window.debugVennGame() - checks for duplicates in current game state
 */

export function checkForDuplicates(gameState: GameState) {
  const { itemPlacements, zoneOrder } = gameState;
  
  // Check itemPlacements - should have each item only once
  const itemCounts = new Map<string, number>();
  for (const [itemId, zone] of itemPlacements.entries()) {
    itemCounts.set(itemId, (itemCounts.get(itemId) || 0) + 1);
  }
  
  const duplicatePlacements = Array.from(itemCounts.entries()).filter(([_, count]) => count > 1);
  if (duplicatePlacements.length > 0) {
    console.error('❌ DUPLICATE PLACEMENTS:', duplicatePlacements);
  }
  
  // Check zoneOrder - items should only appear in one zone's order
  const itemZoneCounts = new Map<string, Zone[]>();
  for (const [zone, order] of zoneOrder.entries()) {
    order.forEach(itemId => {
      if (!itemZoneCounts.has(itemId)) {
        itemZoneCounts.set(itemId, []);
      }
      itemZoneCounts.get(itemId)!.push(zone as Zone);
    });
  }
  
  const duplicateOrders = Array.from(itemZoneCounts.entries()).filter(([_, zones]) => zones.length > 1);
  if (duplicateOrders.length > 0) {
    console.error('❌ DUPLICATE ZONE ORDERS:', duplicateOrders);
    duplicateOrders.forEach(([itemId, zones]) => {
      console.error(`  Item ${itemId} in: ${zones.join(', ')}`);
    });
  }
  
  // Check consistency between itemPlacements and zoneOrder
  const inconsistencies: string[] = [];
  for (const [itemId, zone] of itemPlacements.entries()) {
    const zonesInOrder = itemZoneCounts.get(itemId) || [];
    if (zonesInOrder.length === 0) {
      inconsistencies.push(`Item ${itemId}: In itemPlacements (${zone}) but NOT in any zoneOrder`);
    } else if (zonesInOrder.length > 1) {
      inconsistencies.push(`Item ${itemId}: In itemPlacements (${zone}) but in multiple zoneOrders (${zonesInOrder.join(', ')})`);
    } else if (zonesInOrder[0] !== zone) {
      inconsistencies.push(`Item ${itemId}: In itemPlacements (${zone}) but in different zoneOrder (${zonesInOrder[0]})`);
    }
  }
  
  if (inconsistencies.length > 0) {
    console.error('❌ STATE INCONSISTENCIES:', inconsistencies);
  }
  
  // Only log summary if there are issues
  if (duplicatePlacements.length > 0 || duplicateOrders.length > 0 || inconsistencies.length > 0) {
    console.error(`📊 Issues found: ${duplicatePlacements.length} duplicates, ${duplicateOrders.length} order conflicts, ${inconsistencies.length} inconsistencies`);
  }
  
  return {
    duplicatePlacements,
    duplicateOrders,
    inconsistencies,
    itemPlacements: Object.fromEntries(itemPlacements),
    zoneOrder: Object.fromEntries(
      Array.from(zoneOrder.entries()).map(([zone, order]) => [zone, order])
    )
  };
}

// Make it available globally for debugging
if (typeof window !== 'undefined') {
  (window as any).checkForDuplicates = checkForDuplicates;
}

