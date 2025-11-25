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
  rules: {
    left: string;
    right: string;
  };
  items: Item[];
}

export type GamePhase = "investigation" | "hypothesis" | "validation" | "discovery";

export interface GameState {
  puzzle: PuzzleData;
  lockedItems: Set<string>;
  itemPlacements: Map<string, Zone>; // Track where each item is currently placed
  zoneOrder: Map<Zone, string[]>; // Track the order of items in each zone
  revealedRules: {
    left: boolean;
    right: boolean;
  };
  phase: GamePhase;
}

export interface GameActions {
  placeItem: (itemId: string, targetZone: Zone, insertAfterId?: string | null) => void;
  removeItem: (itemId: string) => void;
  reorderItemsInZone: (zone: Zone, activeId: string, overId: string) => void;
  validatePuzzle: () => { correct: string[]; incorrect: string[] };
  checkRuleDiscovery: () => void;
  autoPlaceAllItems: () => void;
}

