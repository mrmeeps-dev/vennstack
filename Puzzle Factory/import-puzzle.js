#!/usr/bin/env node

/**
 * Import Puzzle Script
 * 
 * 1. Paste your puzzle JSON (single puzzle or array of puzzles) into puzzle-to-import.json
 * 2. Run: node import-puzzle.js
 * 
 * The script will:
 * - Handle both single puzzles and arrays (for two-week batches)
 * - Validate each puzzle
 * - Save each puzzle to src/data/{puzzle-id}.json
 * - Update THEMES.md automatically for each puzzle
 * - Clear puzzle-to-import.json for next use
 */

import { writeFileSync, existsSync, mkdirSync, readFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ============================================================================
// READ PUZZLE FROM FILE
// ============================================================================

const PUZZLE_FACTORY_DIR = __dirname;
const IMPORT_FILE = join(PUZZLE_FACTORY_DIR, 'puzzle-to-import.json');

if (!existsSync(IMPORT_FILE)) {
  console.error(`❌ File not found: ${IMPORT_FILE}`);
  console.error('   Please create puzzle-to-import.json and paste your puzzle JSON there.');
  process.exit(1);
}

let puzzleData;
try {
  const fileContent = readFileSync(IMPORT_FILE, 'utf-8');
  puzzleData = JSON.parse(fileContent);
  
  // Handle both single puzzle and array of puzzles
  const puzzles = Array.isArray(puzzleData) ? puzzleData : [puzzleData];
  
  // Check if it's still the empty template
  if (puzzles.length === 0 || (puzzles[0].items && puzzles[0].items.length === 0) || (puzzles[0].rules && puzzles[0].rules.left === 'Category A')) {
    console.error('❌ puzzle-to-import.json appears to be empty or still contains the template.');
    console.error('   Please paste your puzzle JSON (single puzzle or array) into puzzle-to-import.json');
    process.exit(1);
  }
} catch (error) {
  console.error(`❌ Error reading puzzle-to-import.json: ${error.message}`);
  console.error('   Please ensure the file contains valid JSON (single puzzle object or array of puzzles).');
  process.exit(1);
}

// ============================================================================
// SCRIPT (don't modify below)
// ============================================================================

const THEMES_FILE = join(PUZZLE_FACTORY_DIR, 'THEMES.md');
const DATA_DIR = join(PUZZLE_FACTORY_DIR, '..', 'src', 'data');

const DIFFICULTY_LABELS = {
  1: 'Easy',
  2: 'Medium',
  3: 'Hard',
  4: 'Grandmaster'
};

function getDayOfWeek(dateString) {
  const date = new Date(dateString);
  return date.getDay();
}

function getDifficulty(dayOfWeek) {
  if (dayOfWeek === 1) return 1;
  if (dayOfWeek === 2 || dayOfWeek === 3) return 2;
  if (dayOfWeek === 4 || dayOfWeek === 5 || dayOfWeek === 6) return 3;
  if (dayOfWeek === 0) return 4;
  return 2;
}

function getDifficultyLabel(difficulty) {
  const labels = {
    1: 'Easy',
    2: 'Medium',
    3: 'Hard',
    4: 'Grandmaster'
  };
  return labels[difficulty] || 'Medium';
}

function calculateDateFromId(id) {
  const [year, month, day] = id.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  const dayOfWeek = date.getDay();
  const difficulty = getDifficulty(dayOfWeek);
  
  return {
    year,
    month,
    day,
    dayOfWeek,
    difficulty,
    difficultyLabel: getDifficultyLabel(difficulty)
  };
}

function createNormalizedPair(categoryA, categoryB) {
  const sorted = [categoryA, categoryB].sort();
  return sorted.join(' | ');
}

function validatePuzzle(puzzle) {
  const errors = [];

  if (!puzzle.id) {
    errors.push('Missing id field');
  } else if (!/^\d{4}-\d{2}-\d{2}$/.test(puzzle.id)) {
    errors.push(`Invalid id format: ${puzzle.id}. Expected YYYY-MM-DD`);
  }

  if (!puzzle.rules || !puzzle.rules.left || !puzzle.rules.right) {
    errors.push('Missing or invalid rules field (requires left and right categories)');
  }

  if (!puzzle.items || !Array.isArray(puzzle.items)) {
    errors.push('Missing or invalid items array');
  } else if (puzzle.items.length !== 10) {
    errors.push(`Expected exactly 10 items, found ${puzzle.items.length}`);
  }

  if (puzzle.distribution) {
    const { left, right, both, outside } = puzzle.distribution;
    const total = left + right + both + outside;
    if (total !== 10) {
      errors.push(`Distribution total is ${total}, expected 10`);
    }
    if (left < 2 || left > 3) errors.push(`Left zone should have 2-3 items, found ${left}`);
    if (right < 2 || right > 3) errors.push(`Right zone should have 2-3 items, found ${right}`);
    if (both < 2 || both > 3) errors.push(`Both zone should have 2-3 items, found ${both}`);
    if (outside < 1 || outside > 3) errors.push(`Outside zone should have 1-3 items, found ${outside}`);
  }

  return errors;
}

function parseThemesFile() {
  if (!existsSync(THEMES_FILE)) {
    return { byDate: [], normalizedPairs: new Set() };
  }

  const content = readFileSync(THEMES_FILE, 'utf-8');
  const normalizedPairs = new Set();
  const byDate = [];

  const quickRefMatch = content.match(/## Quick Reference: Normalized Pairs\n\n([\s\S]*?)(?=\n---|\n##|$)/);
  if (quickRefMatch) {
    const pairsSection = quickRefMatch[1];
    const pairMatches = pairsSection.match(/^- `([^`]+)`/gm);
    if (pairMatches) {
      pairMatches.forEach(match => {
        const pair = match.match(/^- `([^`]+)`/)[1];
        normalizedPairs.add(pair);
      });
    }
  }

  const dateMatches = content.matchAll(/### (\d{4}-\d{2}-\d{2})\n- \*\*Category A\*\*: ([^\n]+)\n- \*\*Category B\*\*: ([^\n]+)\n- \*\*Difficulty\*\*: (\d)/g);
  for (const match of dateMatches) {
    byDate.push({
      date: match[1],
      categoryA: match[2],
      categoryB: match[3],
      difficulty: parseInt(match[4])
    });
  }

  return { byDate, normalizedPairs };
}

function updateThemesFile(puzzle) {
  const { byDate, normalizedPairs } = parseThemesFile();
  const normalizedPair = createNormalizedPair(puzzle.rules.left, puzzle.rules.right);
  const difficulty = puzzle.difficulty || getDifficulty(getDayOfWeek(puzzle.id));

  if (normalizedPairs.has(normalizedPair)) {
    console.warn(`⚠️  Warning: Duplicate theme detected: ${normalizedPair}`);
  }

  let content = readFileSync(THEMES_FILE, 'utf-8');

  // Add to "Puzzles by Date" section
  const allPuzzles = [...byDate, {
    date: puzzle.id,
    categoryA: puzzle.rules.left,
    categoryB: puzzle.rules.right,
    difficulty
  }].sort((a, b) => a.date.localeCompare(b.date));

  let newPuzzlesSection = '';
  for (const p of allPuzzles) {
    const normalized = createNormalizedPair(p.categoryA, p.categoryB);
    newPuzzlesSection += `### ${p.date}
- **Category A**: ${p.categoryA}
- **Category B**: ${p.categoryB}
- **Difficulty**: ${p.difficulty} (${DIFFICULTY_LABELS[p.difficulty]})
- **Normalized Pair**: \`${normalized}\`

`;
  }

  const dateSectionMatch = content.match(/(## Puzzles by Date\n\n)([\s\S]*?)(\n---)/);
  if (dateSectionMatch) {
    content = content.replace(
      dateSectionMatch[0],
      dateSectionMatch[1] + newPuzzlesSection + dateSectionMatch[3]
    );
  } else {
    content = content.replace(
      /(## Theme Categories)/,
      `## Puzzles by Date\n\n${newPuzzlesSection}---\n\n$1`
    );
  }

  // Update difficulty tier sections
  const difficultyTiers = {
    1: 'Level 1: Easy (Monday)',
    2: 'Level 2: Medium (Tuesday/Wednesday)',
    3: 'Level 3: Hard (Thursday/Friday/Saturday)',
    4: 'Level 4: Grandmaster (Sunday)'
  };

  for (const [level, header] of Object.entries(difficultyTiers)) {
    const tierMatch = content.match(new RegExp(`(### ${header.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\n_No themes yet_)`));
    if (tierMatch && parseInt(level) === difficulty) {
      content = content.replace(
        tierMatch[0],
        `### ${header}\n- ${puzzle.rules.left} | ${puzzle.rules.right}`
      );
    } else {
      const tierListMatch = content.match(new RegExp(`(### ${header.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\n)([\\s\\S]*?)(\n\n###|$)`));
      if (tierListMatch && parseInt(level) === difficulty) {
        const existingList = tierListMatch[2].trim();
        if (existingList && !existingList.includes(`${puzzle.rules.left} | ${puzzle.rules.right}`)) {
          content = content.replace(
            tierListMatch[0],
            tierListMatch[1] + existingList + `\n- ${puzzle.rules.left} | ${puzzle.rules.right}` + tierListMatch[3]
          );
        }
      }
    }
  }

  // Update Quick Reference section
  const quickRefMatch = content.match(/(## Quick Reference: Normalized Pairs\n\n)([\s\S]*?)(\n---|\n##|$)/);
  if (quickRefMatch) {
    const existingPairs = quickRefMatch[2].trim().split('\n').filter(line => line.startsWith('-'));
    const allPairs = [...new Set([...existingPairs.map(p => p.replace(/^- `([^`]+)`/, '$1')), normalizedPair])].sort();
    
    const newQuickRef = allPairs.map(pair => `- \`${pair}\``).join('\n') + '\n';
    content = content.replace(quickRefMatch[0], quickRefMatch[1] + newQuickRef + (quickRefMatch[3] || ''));
  } else {
    content = content.replace(
      /(## Notes)/,
      `## Quick Reference: Normalized Pairs\n\nUse this list to quickly check for duplicates. Categories are sorted alphabetically and joined with \` | \`.\n\n- \`${normalizedPair}\`\n\n---\n\n$1`
    );
  }

  writeFileSync(THEMES_FILE, content, 'utf-8');
  console.log(`✅ Updated THEMES.md`);
}

function findLatestPuzzleDate() {
  if (!existsSync(DATA_DIR)) {
    return null;
  }

  const files = readdirSync(DATA_DIR);
  const puzzleFiles = files.filter(f => /^\d{4}-\d{2}-\d{2}\.json$/.test(f));
  
  if (puzzleFiles.length === 0) {
    return null;
  }

  // Sort dates descending and get the latest
  const dates = puzzleFiles.map(f => f.replace('.json', '')).sort().reverse();
  return dates[0];
}

function getNextMonday(startDate) {
  // Parse the date string (YYYY-MM-DD)
  const [year, month, day] = startDate.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  
  // Add 14 days (two weeks)
  date.setDate(date.getDate() + 14);
  
  // Find the next Monday (if not already Monday, go to next Monday)
  const dayOfWeek = date.getDay();
  // Monday is 1, so if it's Monday (1), we're done. Otherwise, calculate days until next Monday
  const daysUntilMonday = dayOfWeek === 1 ? 0 : (8 - dayOfWeek) % 7;
  if (daysUntilMonday > 0) {
    date.setDate(date.getDate() + daysUntilMonday);
  }
  
  // Format as YYYY-MM-DD
  const yearStr = date.getFullYear();
  const monthStr = String(date.getMonth() + 1).padStart(2, '0');
  const dayStr = String(date.getDate()).padStart(2, '0');
  
  return `${yearStr}-${monthStr}-${dayStr}`;
}

function formatDateForPrompt(dateString) {
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                      'July', 'August', 'September', 'October', 'November', 'December'];
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayOfWeek = date.getDay();
  
  return {
    formatted: `${monthNames[month - 1]} ${day}, ${year}`,
    dayName: dayNames[dayOfWeek]
  };
}

function generateDateList(startDate) {
  const [year, month, day] = startDate.split('-').map(Number);
  const start = new Date(year, month - 1, day);
  const dates = [];
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const difficultyMap = {
    1: 'Level 1 - Easy',
    2: 'Level 2 - Medium',
    3: 'Level 3 - Hard',
    4: 'Level 4 - Grandmaster'
  };
  
  for (let i = 0; i < 14; i++) {
    const current = new Date(start);
    current.setDate(start.getDate() + i);
    const yearStr = current.getFullYear();
    const monthStr = String(current.getMonth() + 1).padStart(2, '0');
    const dayStr = String(current.getDate()).padStart(2, '0');
    const dateStr = `${yearStr}-${monthStr}-${dayStr}`;
    const dayOfWeek = current.getDay();
    const difficulty = getDifficulty(dayOfWeek);
    
    dates.push({
      date: dateStr,
      dayName: dayNames[dayOfWeek],
      difficulty: difficultyMap[difficulty]
    });
  }
  
  return dates;
}

function updatePromptFile(latestDate) {
  const PROMPT_FILE = join(PUZZLE_FACTORY_DIR, 'AI_GENERATION_PROMPT.md');
  
  if (!existsSync(PROMPT_FILE)) {
    console.warn('⚠️  AI_GENERATION_PROMPT.md not found, skipping prompt update');
    return;
  }

  const nextMonday = getNextMonday(latestDate);
  const dateInfo = formatDateForPrompt(nextMonday);
  const dateList = generateDateList(nextMonday);
  
  let content = readFileSync(PROMPT_FILE, 'utf-8');
  
  // Build the new example section
  const newExampleContent = `Generate puzzles for two weeks starting Monday, ${dateInfo.formatted}:
${dateList.map(d => `- ${d.date} (${d.dayName}, ${d.difficulty})`).join('\n')}`;
  
  // Find the code block section and replace its content
  // Match: ```\nGenerate puzzles for two weeks starting Monday, ...\n- ...\n```\n
  const codeBlockPattern = /(```\n)Generate puzzles for two weeks starting Monday, [^\n]+:\n(?:- \d{4}-\d{2}-\d{2} \([^\n]+\n)+(```)/;
  
  if (codeBlockPattern.test(content)) {
    content = content.replace(codeBlockPattern, `$1${newExampleContent}\n$2`);
    writeFileSync(PROMPT_FILE, content, 'utf-8');
    console.log(`✅ Updated AI_GENERATION_PROMPT.md with next batch: ${dateInfo.formatted}`);
  } else {
    console.warn('⚠️  Could not find example section in prompt file to update');
  }
}

// Main execution
const puzzles = Array.isArray(puzzleData) ? puzzleData : [puzzleData];
console.log(`🧩 Importing ${puzzles.length} puzzle(s)...\n`);

let successCount = 0;
let failCount = 0;
let latestPuzzleDate = null;

for (const puzzle of puzzles) {
  try {
    // Auto-calculate date object and difficulty from id
    const dateInfo = calculateDateFromId(puzzle.id);
    puzzle.date = {
      year: dateInfo.year,
      month: dateInfo.month,
      day: dateInfo.day,
      dayOfWeek: dateInfo.dayOfWeek
    };
    puzzle.difficulty = dateInfo.difficulty;
    puzzle.difficultyLabel = dateInfo.difficultyLabel;

    console.log(`📅 Processing puzzle ${puzzle.id}:`);
    console.log(`   - Day of week: ${dateInfo.dayOfWeek} (${['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dateInfo.dayOfWeek]})`);
    console.log(`   - Difficulty: ${dateInfo.difficulty} (${dateInfo.difficultyLabel})`);

    // Validate
    const errors = validatePuzzle(puzzle);
    if (errors.length > 0) {
      console.error(`❌ Validation errors for puzzle ${puzzle.id}:`);
      errors.forEach(err => console.error(`   - ${err}`));
      failCount++;
      console.log(''); // Empty line for spacing
      continue;
    }

    // Check if puzzle already exists
    const filename = `${puzzle.id}.json`;
    const destPath = join(DATA_DIR, filename);

    if (existsSync(destPath)) {
      console.warn(`⚠️  Puzzle ${puzzle.id} already exists. Skipping...\n`);
      failCount++;
      continue;
    }

    // Ensure data directory exists
    if (!existsSync(DATA_DIR)) {
      mkdirSync(DATA_DIR, { recursive: true });
    }

    // Write puzzle file
    writeFileSync(destPath, JSON.stringify(puzzle, null, 2), 'utf-8');
    console.log(`✅ Saved puzzle ${puzzle.id} to: ${destPath}`);

    // Update themes
    updateThemesFile(puzzle);
    
    // Track latest date for prompt update
    if (!latestPuzzleDate || puzzle.id > latestPuzzleDate) {
      latestPuzzleDate = puzzle.id;
    }
    
    successCount++;
    console.log(''); // Empty line for spacing
  } catch (error) {
    console.error(`❌ Error processing puzzle ${puzzle.id || 'unknown'}:`, error.message);
    failCount++;
    console.log(''); // Empty line for spacing
  }
}

// Clear the import file after successful import
if (successCount > 0) {
  writeFileSync(IMPORT_FILE, '{}', 'utf-8');
  console.log(`✅ Cleared puzzle-to-import.json for next use.`);
}

// Update prompt file with next batch date (next Monday after latest puzzle)
if (latestPuzzleDate && successCount > 0) {
  updatePromptFile(latestPuzzleDate);
}

console.log(`\n✨ Done! Successfully imported ${successCount}/${puzzles.length} puzzle(s).`);
if (failCount > 0) {
  console.log(`   ${failCount} puzzle(s) failed to import.`);
}

