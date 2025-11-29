import { PuzzleData } from '../types/game';
import samplePuzzle from '../data/samplePuzzle.json';

/**
 * Format date as YYYY-MM-DD
 */
function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Cache for loaded puzzles
const puzzleCache = new Map<string, PuzzleData>();

/**
 * Load a puzzle by date (YYYY-MM-DD format)
 * Falls back to samplePuzzle if the puzzle doesn't exist
 */
export async function loadPuzzleByDate(date: string): Promise<PuzzleData> {
  // Check cache first
  if (puzzleCache.has(date)) {
    return puzzleCache.get(date)!;
  }

  try {
    // Try to load from bundled puzzles first (using import.meta.glob)
    const puzzleModules = import.meta.glob('/src/data/*.json', { eager: false }) as Record<string, () => Promise<{ default: PuzzleData } | PuzzleData>>;
    const puzzlePath = `/src/data/${date}.json`;
    
    if (puzzleModules[puzzlePath]) {
      const module = await puzzleModules[puzzlePath]();
      const puzzle = (module as { default: PuzzleData }).default || module as PuzzleData;
      puzzleCache.set(date, puzzle);
      return puzzle;
    }
    
    // If not found in bundled puzzles, try fetching from public/data (for dynamically added puzzles)
    try {
      const response = await fetch(`/data/${date}.json`);
      if (response.ok) {
        const puzzle = await response.json() as PuzzleData;
        puzzleCache.set(date, puzzle);
        return puzzle;
      }
    } catch (fetchError) {
      // Ignore fetch errors, fall through to sample puzzle
    }
    
    // Puzzle doesn't exist, fall back to sample
    // Silently fall back to sample puzzle (no console log in production)
    return samplePuzzle as PuzzleData;
  } catch (error) {
    console.error(`Error loading puzzle for ${date}:`, error);
    // Fall back to sample puzzle
    return samplePuzzle as PuzzleData;
  }
}

/**
 * Load today's puzzle
 */
export async function loadTodaysPuzzle(): Promise<PuzzleData> {
  const today = formatDate(new Date());
  return loadPuzzleByDate(today);
}

/**
 * Load all puzzles from the data directory
 * Returns a map of date -> puzzle for efficient lookup
 */
export async function loadAllPuzzles(): Promise<Map<string, PuzzleData>> {
  const puzzleMap = new Map<string, PuzzleData>();
  
  try {
    // Use Vite's import.meta.glob to get all puzzle files
    // This works at build time and provides all available puzzles
    const puzzleModules = import.meta.glob('/src/data/*.json', { eager: false }) as Record<string, () => Promise<{ default: PuzzleData } | PuzzleData>>;
    
    // Load all puzzles
    const loadPromises = Object.entries(puzzleModules).map(async ([path, moduleLoader]) => {
      try {
        const moduleResult = await moduleLoader();
        const puzzleData = (moduleResult as { default: PuzzleData }).default || moduleResult as PuzzleData;
        
        // Extract date from filename (e.g., /src/data/2025-01-15.json -> 2025-01-15)
        const filename = path.split('/').pop()?.replace('.json', '');
        if (filename && /^\d{4}-\d{2}-\d{2}$/.test(filename)) {
          puzzleMap.set(filename, puzzleData);
          puzzleCache.set(filename, puzzleData);
        }
      } catch (error) {
        console.error(`Error loading puzzle from ${path}:`, error);
      }
    });
    
    await Promise.all(loadPromises);
  } catch (error) {
    console.error('Error loading puzzles:', error);
  }
  
  // Always include sample puzzle as fallback
  if (!puzzleMap.has(samplePuzzle.id)) {
    puzzleMap.set(samplePuzzle.id, samplePuzzle as PuzzleData);
    puzzleCache.set(samplePuzzle.id, samplePuzzle as PuzzleData);
  }
  
  return puzzleMap;
}

/**
 * Get all puzzles as an array (for archive view)
 */
export async function getAllPuzzlesArray(): Promise<PuzzleData[]> {
  const puzzleMap = await loadAllPuzzles();
  return Array.from(puzzleMap.values()).sort((a, b) => {
    // Sort by date (id) descending (newest first)
    return b.id.localeCompare(a.id);
  });
}

