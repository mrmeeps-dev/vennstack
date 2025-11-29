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
  date?: {
    year: number;
    month: number;
    day: number;
    dayOfWeek: number;
  };
  difficulty?: number;
  difficultyLabel?: string;
  rules: {
    left: string;
    right: string;
  };
  items: Item[];
}

export interface GameState {
  puzzle: PuzzleData;
  lockedItems: Set<string>;
  itemPlacements: Map<string, Zone>;
  zoneOrder: Map<Zone, string[]>;
  revealedRules: {
    left: boolean;
    right: boolean;
  };
  isMirrored: boolean;
}

export interface GameActions {
  placeItem: (itemId: string, targetZone: Zone, insertAfterId?: string | null) => void;
  removeItem: (itemId: string) => void;
  validatePuzzle: () => { correct: string[]; incorrect: string[]; isMirrored: boolean };
  autoPlaceAllItems: () => void;
  handleDrop: (event: any, mousePosition?: { x: number; y: number } | null) => void;
  revealOneHint?: () => string | null;
}

