# AI Puzzle Generation Prompt

## Instructions

You are an expert puzzle designer tasked with creating Venn Diagram puzzles for VennStack. Follow these instructions precisely to generate high-quality, human-solvable puzzles.

## Required Reading

Before generating any puzzle, you MUST review:
1. **GUIDELINES.md** - Complete puzzle generation protocol
2. **PUZZLE_SCHEMA.md** - JSON data structure specification
3. **THEMES.md** - Existing puzzle themes to avoid duplicates

## Your Task

**Standard Approach: Generate 14 puzzles (two weeks) starting on a Monday.**

Generate puzzles for two weeks starting on the specified Monday date. Each puzzle must follow the schema in `PUZZLE_SCHEMA.md`.

**Request Format:**
```
Generate puzzles for two weeks starting Monday, [DATE]:
- [DATE] (Monday, Level 1 - Easy)
- [DATE+1] (Tuesday, Level 2 - Medium)
- [DATE+2] (Wednesday, Level 2 - Medium)
- [DATE+3] (Thursday, Level 3 - Hard)
- [DATE+4] (Friday, Level 3 - Hard)
- [DATE+5] (Saturday, Level 3 - Hard)
- [DATE+6] (Sunday, Level 4 - Grandmaster)
- [DATE+7] (Monday, Level 1 - Easy)
- [DATE+8] (Tuesday, Level 2 - Medium)
- [DATE+9] (Wednesday, Level 2 - Medium)
- [DATE+10] (Thursday, Level 3 - Hard)
- [DATE+11] (Friday, Level 3 - Hard)
- [DATE+12] (Saturday, Level 3 - Hard)
- [DATE+13] (Sunday, Level 4 - Grandmaster)
```

**Output:** Provide a JSON array with all 14 puzzles. Each puzzle must be a complete, valid JSON object following the schema.

## Step-by-Step Process

### Step 1: Determine Difficulty from Date

Given a date in `YYYY-MM-DD` format:
- Calculate the day of the week (0=Sunday, 1=Monday, ..., 6=Saturday)
- Map to difficulty level:
  - **Monday (1)**: Level 1 - Easy
  - **Tuesday (2) / Wednesday (3)**: Level 2 - Medium
  - **Thursday (4) / Friday (5) / Saturday (6)**: Level 3 - Hard
  - **Sunday (0)**: Level 4 - Grandmaster

### Step 2: Check for Duplicates

Before generating categories, check `THEMES.md` to ensure:
- The exact category pair (A/B) has not been used before (check the "Quick Reference: Normalized Pairs" section)
- Similar category pairs are avoided (e.g., "Fruits" vs "Red Fruits" is too similar to "Fruits" vs "Red Things")
- Normalized pairs are created by sorting categories alphabetically and joining with ` | `

**If a duplicate is found, generate a new category pair.**

### Step 3: Generate Categories

Based on the difficulty level, generate two categories that are:
- **Orthogonal** (not subset, disjoint, or synonymous)
- **Appropriate for the difficulty tier** (see GUIDELINES.md Section 2)
- **Human-friendly** (follow all guardrails in GUIDELINES.md Section 3)

### Step 4: Generate Word Pool

Create exactly 10 words that:
- Satisfy the distribution constraints (2-3, 2-3, 2-3, 1-3)
- Are in the top 30,000 English words (unless proper nouns)
- Pass all validation checks (GUIDELINES.md Section 5)
- Have clear, unambiguous placement

### Step 5: Validate the Puzzle

Run through the complete validation checklist:

1. **Distribution Check**: 
   - Left: 2-3 items ✓
   - Right: 2-3 items ✓
   - Both: 2-3 items ✓
   - Outside: 1-3 items ✓
   - Total: Exactly 10 items ✓
   - No empty buckets ✓

2. **Category Compatibility Check**:
   - Not subset (e.g., "Fruit" / "Apples") ✓
   - Not disjoint (e.g., "Even #s" / "Odd #s") ✓
   - Not synonymous (e.g., "Fast" / "Rapid") ✓
   - Categories are orthogonal ✓

3. **Human Intelligence Guardrails**:
   - No "Tomato is a Fruit" violations (use common usage) ✓
   - No Wikipedia specificity traps (avoid obscure categories) ✓
   - No homonym conflicts (all meanings fit or context is clear) ✓
   - "Neither" words are thematically proximal ✓

4. **Word Quality Checks**:
   - Uniqueness: Each word has only one valid placement ✓
   - Obscurity: Words are common (top 30K) or proper nouns ✓
   - Spelling: US English spelling (word correctness only - spelling-based categories are forbidden) ✓

5. **Difficulty Appropriateness**:
   - Level 1: Observational, tangible attributes ✓
   - Level 2: Encyclopedic knowledge (NO spelling-based categories) ✓
   - Level 3: Abstract concepts, associations ✓
   - Level 4: Word manipulation, homophones, meta (but NOT simple "starts/ends with") ✓

### Step 6: Format Output

Generate a complete JSON object following the schema in `PUZZLE_SCHEMA.md`.

**Important Note on Dates and Difficulty:**
- The `id` field (YYYY-MM-DD format) is the **only required date field** you must provide correctly
- The import script will **automatically calculate** the `date` object (year, month, day, dayOfWeek) and `difficulty`/`difficultyLabel` from the `id`
- However, you should still **include** the `date` object and `difficulty` fields in your JSON for validation purposes - they will be auto-corrected during import if there are any discrepancies
- Dates are **not special** (no holidays, no themed dates) - they're just identifiers. Difficulty is determined solely by day of week.

```json
{
  "id": "YYYY-MM-DD",
  "date": {
    "year": YYYY,
    "month": M,
    "day": D,
    "dayOfWeek": 0-6
  },
  "difficulty": 1-4,
  "difficultyLabel": "Easy" | "Medium" | "Hard" | "Grandmaster",
  "rules": {
    "left": "Category A",
    "right": "Category B"
  },
  "items": [
    {
      "id": "1",
      "text": "Word",
      "zone": "left" | "right" | "both" | "outside",
      "explanation": "Brief explanation"
    }
    // ... 9 more items
  ],
  "distribution": {
    "left": 2-3,
    "right": 2-3,
    "both": 2-3,
    "outside": 1-3
  },
  "metadata": {
    "generatedBy": "AI",
    "validated": true,
    "validationChecks": {
      "uniqueness": true,
      "obscurity": true,
      "spelling": true,
      "homonymCheck": true,
      "compatibility": true
    }
  }
}
```

## Critical Reminders

1. **Common Usage Over Technical Truth**: If you find yourself thinking "Actually, technically...", STOP and use common understanding instead.

2. **Thematic Proximity**: "Neither" words should be related to the theme, not random. If categories are "Birds" vs "Mammals", "Lizard" is good, "Spatula" is bad.

3. **No Ambiguity**: Every word must have ONE clear placement. If a word could reasonably fit multiple zones, it's invalid.

4. **Difficulty Matching**: A Sunday puzzle should require word manipulation, not just recognition. A Monday puzzle should be instantly recognizable.

5. **Duplicate Prevention**: Always check THEMES.md. Similar category pairs count as duplicates. Use normalized pairs (alphabetically sorted) to check for duplicates.

6. **NEVER Use Spelling-Based Categories**: **ABSOLUTELY FORBIDDEN** - Do NOT create categories based on spelling patterns such as:
   - ❌ "Starts with [letter]" (e.g., "Starts with S", "Starts with T")
   - ❌ "Ends with [letter]" (e.g., "Ends with E", "Ends with Y")
   - ❌ "Contains [letter]" (e.g., "Contains double letters", "Has 5 letters")
   - ❌ Any category that requires checking spelling/orthography to determine membership
   
   **Why**: These puzzles are mechanical, uninteresting, and don't require meaningful thought. They reduce the puzzle to a spelling exercise rather than a logic challenge.
   
   **Exception**: Level 4 (Sunday - Grandmaster) puzzles may use word manipulation, but even then, avoid simple "starts/ends with" patterns. Use more creative approaches like "Words that follow [word]" or palindromes.

## Example Request

```
Generate puzzles for two weeks starting Monday, December 22, 2025:
- 2025-12-22 (Monday, Level 1 - Easy)
- 2025-12-23 (Tuesday, Level 2 - Medium)
- 2025-12-24 (Wednesday, Level 2 - Medium)
- 2025-12-25 (Thursday, Level 3 - Hard)
- 2025-12-26 (Friday, Level 3 - Hard)
- 2025-12-27 (Saturday, Level 3 - Hard)
- 2025-12-28 (Sunday, Level 4 - Grandmaster)
- 2025-12-29 (Monday, Level 1 - Easy)
- 2025-12-30 (Tuesday, Level 2 - Medium)
- 2025-12-31 (Wednesday, Level 2 - Medium)
- 2026-01-01 (Thursday, Level 3 - Hard)
- 2026-01-02 (Friday, Level 3 - Hard)
- 2026-01-03 (Saturday, Level 3 - Hard)
- 2026-01-04 (Sunday, Level 4 - Grandmaster)
```

For each date:
1. Calculate the day of week and difficulty
2. Check THEMES.md for duplicates
3. Generate appropriate categories
4. Create 10 words with proper distribution
5. Validate completely

## Output Format

Provide TWO outputs in this order:

### 1. Comprehensive Validation Table (for quick human review)

Create a SINGLE table that shows all puzzles at once for easy validation. Include all key information in one view:

```
## Puzzles Overview

| Date | Day | Difficulty | Category A | Category B | Left | Right | Both | Outside | Total | Validation |
|------|-----|------------|------------|------------|------|-------|------|---------|-------|------------|
| 2025-03-17 | Monday | Level 1 - Easy | Mammals | Flying Animals | 3 | 2 | 2 | 3 | 10 | ✓ |
| 2025-03-18 | Tuesday | Level 2 - Medium | Fruits | Red Things | 2 | 3 | 2 | 3 | 10 | ✓ |
| ... | ... | ... | ... | ... | ... | ... | ... | ... | ... | ... |

**Items by Puzzle:**

### 2025-03-17 (Monday, Level 1 - Easy)
- **Left Only (3)**: whale, dolphin, elephant
- **Right Only (2)**: eagle, sparrow
- **Both (2)**: bat, flying squirrel
- **Outside (3)**: lizard, snake, turtle

### 2025-03-18 (Tuesday, Level 2 - Medium)
- **Left Only (2)**: banana, orange
- **Right Only (3)**: apple, cherry, strawberry
- **Both (2)**: apple, cherry
- **Outside (3)**: carrot, tomato, pepper
...
```

### 2. Complete JSON Array (single copy-pastable block)

After the validation table, provide ALL puzzles as a single JSON array in ONE code block. This makes it easy to copy and paste the entire set:

```json
[
  {
    "id": "2025-03-17",
    "date": {
      "year": 2025,
      "month": 3,
      "day": 17,
      "dayOfWeek": 1
    },
    "difficulty": 1,
    "difficultyLabel": "Easy",
    "rules": {
      "left": "Mammals",
      "right": "Flying Animals"
    },
    "items": [
      // ... full items array
    ],
    "distribution": {
      "left": 3,
      "right": 2,
      "both": 2,
      "outside": 3
    },
    "metadata": {
      // ... metadata
    }
  },
  {
    "id": "2025-03-18",
    // ... second puzzle
  }
  // ... all remaining puzzles
]
```

**Important:** 
- The validation table should be FIRST, showing all puzzles in one comprehensive view
- The JSON array should be SECOND, containing all 14 puzzles in a single copy-pastable code block
- The import script can handle both single puzzles and arrays of puzzles

## Quality Standards

A good puzzle:
- Can be solved by an average college-educated person without Google
- Has clear, unambiguous word placements
- Uses categories that are interesting but not obscure
- Follows all distribution and validation rules
- Passes the "human intelligence" test (would a human agree with all placements?)

If you cannot generate a puzzle that meets all these standards, indicate which validation failed and why.

