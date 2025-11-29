# Puzzle JSON Data Structure

## Overview

Puzzles are organized by month and day, with difficulty automatically determined by the day of the week. Each puzzle follows a consistent structure that maps to the game's four-zone system.

## Date and Difficulty Mapping

- **Monday**: Level 1 (Easy)
- **Tuesday/Wednesday**: Level 2 (Medium)
- **Thursday/Friday/Saturday**: Level 3 (Hard)
- **Sunday**: Level 4 (Grandmaster)

The puzzle ID format is `YYYY-MM-DD`, which allows automatic calculation of the day of week and thus the difficulty level.

## JSON Structure

### Individual Puzzle Format

```json
{
  "id": "2025-01-15",
  "date": {
    "year": 2025,
    "month": 1,
    "day": 15,
    "dayOfWeek": 3
  },
  "difficulty": 2,
  "difficultyLabel": "Medium",
  "rules": {
    "left": "Category A Name",
    "right": "Category B Name"
  },
  "items": [
    {
      "id": "1",
      "text": "Word",
      "zone": "left",
      "explanation": "Why this word belongs in this zone."
    }
  ],
  "distribution": {
    "left": 2,
    "right": 3,
    "both": 2,
    "outside": 3
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

### Monthly Puzzle Collection Format

For bulk puzzle generation, puzzles can be organized by month:

```json
{
  "year": 2025,
  "month": 1,
  "puzzles": [
    {
      "id": "2025-01-01",
      "day": 1,
      "difficulty": 4,
      "rules": { ... },
      "items": [ ... ]
    },
    {
      "id": "2025-01-02",
      "day": 2,
      "difficulty": 1,
      "rules": { ... },
      "items": [ ... ]
    }
  ]
}
```

## Field Descriptions

### Root Level

- **id** (string, required): Unique identifier in format `YYYY-MM-DD`
- **date** (object, required): Date breakdown for easy parsing
  - **year** (number): 4-digit year
  - **month** (number): 1-12
  - **day** (number): 1-31
  - **dayOfWeek** (number): 0-6 (0=Sunday, 1=Monday, ..., 6=Saturday)
- **difficulty** (number, required): 1-4, automatically calculated from dayOfWeek
- **difficultyLabel** (string, required): Human-readable difficulty tier name
- **rules** (object, required): The two categories
  - **left** (string): Category A name
  - **right** (string): Category B name
- **items** (array, required): Exactly 10 items
- **distribution** (object, required): Count of items per zone
  - **left** (number): 2-3 items
  - **right** (number): 2-3 items
  - **both** (number): 2-3 items
  - **outside** (number): 1-3 items
- **metadata** (object, optional): Generation and validation info

### Item Object

- **id** (string, required): Unique identifier within puzzle ("1" through "10")
- **text** (string, required): The word/phrase (should be in top 30,000 words unless proper noun)
- **zone** (string, required): One of "left", "right", "both", "outside"
- **explanation** (string, required): Brief explanation of why this word belongs in this zone

## Zone Mapping

The puzzle zones map to the four buckets as follows:

- **left** → Category A Only
- **right** → Category B Only
- **both** → Intersection (Both A and B)
- **outside** → Complement (Neither A nor B)

## Validation Rules

When generating puzzles, ensure:

1. **Distribution**: Each zone must have at least 1 item, and follow the 2-3, 2-3, 2-3, 1-3 pattern
2. **Total Items**: Exactly 10 items
3. **Uniqueness**: No word should be ambiguously placed
4. **Obscurity**: Words should be in top 30,000 unless proper nouns
5. **Spelling**: US English spelling (word correctness only - spelling-based categories are forbidden)
6. **Homonyms**: All common meanings must fit the assigned zone, or context must be clear
7. **Compatibility**: Categories must be orthogonal (not subset, disjoint, or synonymous)

## Example Puzzle

See `example-puzzle.json` for a complete example following this schema.

