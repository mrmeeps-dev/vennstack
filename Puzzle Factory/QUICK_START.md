# Quick Start: Generating Puzzles with AI

## Overview

This guide explains how to use the AI generation prompt to create new puzzles efficiently while avoiding duplicates.

## Files You'll Need

1. **AI_GENERATION_PROMPT.md** - The prompt to give to your AI
2. **GUIDELINES.md** - Reference document (upload to AI)
3. **PUZZLE_SCHEMA.md** - Reference document (upload to AI)
4. **THEMES.md** - Upload to AI for duplicate checking

## Process

### Step 1: Prepare Your AI Session

Upload these files to your AI assistant:
- `GUIDELINES.md`
- `PUZZLE_SCHEMA.md`
- `THEMES.md`

### Step 2: Provide the Prompt

Copy the entire contents of `AI_GENERATION_PROMPT.md` and paste it as your initial prompt, or reference it with:

```
Please follow the instructions in AI_GENERATION_PROMPT.md to generate a puzzle for [DATE].
```

### Step 3: Request Puzzles

Provide the date(s) you need:

```
Generate a puzzle for 2025-03-15
```

Or for multiple dates:

```
Generate puzzles for:
- 2025-03-15 (Saturday, Level 3)
- 2025-03-16 (Sunday, Level 4)
- 2025-03-17 (Monday, Level 1)
```

### Step 4: Save Puzzle Files

Save the generated JSON to a file in the `new-puzzles/` directory. You can name it anything (e.g., `puzzle1.json`), as the import script will use the `id` field from the JSON.

### Step 5: Import Puzzles

Run the import script to move puzzles to the main storage and update THEMES.md:

```bash
cd "Puzzle Factory"
node import-puzzles.js
```

The script will:
- Validate each puzzle
- Move it to `src/data/` with filename `{puzzle-id}.json`
- Update `THEMES.md` automatically with new category pairs
- Warn about duplicates if found

**Note**: The import script handles updating THEMES.md automatically - you don't need to edit it manually!

## Tips for Efficient Generation

1. **Batch Requests**: Generate a full month at once for efficiency
2. **Check Registry First**: Review existing puzzles to understand what's been done
3. **Iterate on Rejection**: If AI generates invalid puzzles, point to specific guideline violations
4. **Use Examples**: Reference `example-puzzle.json` when the AI needs clarification

## Common Issues

### AI Generates Duplicates
- **Solution**: Emphasize checking `THEMES.md` more carefully, especially the "Quick Reference: Normalized Pairs" section
- **Solution**: Ask AI to list all normalized pairs it's considering before generating

### AI Violates "Human Intelligence" Rules
- **Solution**: Point to specific rule in GUIDELINES.md Section 3
- **Solution**: Ask "Would an average person agree this word belongs here?"

### Distribution Errors
- **Solution**: Ask AI to count items per zone before finalizing
- **Solution**: Remind that total must be exactly 10

### Difficulty Mismatch
- **Solution**: Remind AI to check day of week and match difficulty tier
- **Solution**: Ask "Does this require the cognitive load appropriate for [difficulty level]?"

## Example Full Request

```
I need a puzzle for 2025-06-20 (Friday, Level 3 - Hard).

Please:
1. Check THEMES.md for duplicates (see "Quick Reference: Normalized Pairs")
2. Generate categories appropriate for Level 3
3. Create 10 words following distribution rules
4. Validate using all checks in GUIDELINES.md
5. Output complete JSON following PUZZLE_SCHEMA.md

Return only valid JSON, no explanations.
```

## Bulk Generation

For generating many puzzles:

```
Generate puzzles for all dates in March 2025. 

For each puzzle:
- Calculate day of week and difficulty
- Check THEMES.md for duplicates
- Generate appropriate categories
- Validate completely
- Output as array of puzzle objects

Format as monthly collection (see PUZZLE_SCHEMA.md).

After generation, save each puzzle as a separate JSON file in `new-puzzles/` and run the import script.
```

