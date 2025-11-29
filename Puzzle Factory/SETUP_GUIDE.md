# Puzzle Factory Setup Guide

This guide ensures you have everything set up correctly for efficient puzzle generation and import.

## ✅ System Status

The puzzle system is now **fully functional** with:
- ✅ Dynamic puzzle loading (app loads puzzles by date automatically)
- ✅ Archive support (all imported puzzles appear in archive)
- ✅ Automatic theme tracking (THEMES.md updates automatically)
- ✅ Validation (import script checks all requirements)
- ✅ Duplicate prevention (warns about duplicate themes)

## Quick Start Workflow

### For Single Puzzle

1. **Generate**: Upload `GUIDELINES.md`, `PUZZLE_SCHEMA.md`, `THEMES.md` to AI
2. **Request**: "Generate a puzzle for 2025-03-15"
3. **Import**: Paste JSON into `import-puzzle.js` and run it
4. **Done**: Puzzle is available in app (restart dev server if running)

### For Weekly Puzzles (7 puzzles)

1. **Generate**: Request all 7 dates at once:
   ```
   Generate puzzles for March 15-21, 2025:
   - 2025-03-15 (Saturday, Level 3)
   - 2025-03-16 (Sunday, Level 4)
   - ... (list all 7 dates)
   ```
2. **Import**: For each puzzle JSON:
   - Paste into `import-puzzle.js`
   - Run: `node "Puzzle Factory/import-puzzle.js"`
   - Repeat for next puzzle

### For Monthly Puzzles (30 puzzles)

**Option 1: Generate all at once**
```
Generate puzzles for all dates in March 2025.
Output as JSON array or separate objects.
```

**Option 2: Generate in batches**
- Week 1: Dates 1-7
- Week 2: Dates 8-14
- Week 3: Dates 15-21
- Week 4: Dates 22-28
- Remaining: Dates 29-31

Then import each puzzle individually.

## File Locations

- **Puzzle Storage**: `src/data/{date}.json` (e.g., `src/data/2025-03-15.json`)
- **Theme Tracking**: `Puzzle Factory/THEMES.md` (auto-updated)
- **Import Script**: `Puzzle Factory/import-puzzle.js`

## How the App Loads Puzzles

1. **On App Start**: 
   - Loads today's puzzle from `src/data/YYYY-MM-DD.json`
   - Falls back to `samplePuzzle.json` if today's puzzle doesn't exist

2. **Archive View**:
   - Loads all puzzles from `src/data/*.json`
   - Displays them in calendar view
   - Sorted by date (newest first)

3. **Puzzle Selection**:
   - User can click any date in archive
   - App loads that puzzle dynamically

## Important Notes

### After Importing Puzzles

- **Development**: Restart dev server (`npm run dev`) to see new puzzles
- **Production**: Run `npm run build` to include new puzzles in build

### Puzzle Naming

- Puzzles MUST use `YYYY-MM-DD` format for the `id` field
- Filename is automatically set to `{id}.json`
- Example: Puzzle with `id: "2025-03-15"` → `src/data/2025-03-15.json`

### Duplicate Prevention

- Import script checks THEMES.md for duplicates
- Warns if normalized pair already exists
- Still imports puzzle (you can override if needed)

### Validation

The import script validates:
- ✅ Date format (YYYY-MM-DD)
- ✅ Exactly 10 items
- ✅ Distribution constraints (2-3, 2-3, 2-3, 1-3)
- ✅ Required fields (id, rules, items)

## Troubleshooting

### Puzzle Not Appearing in App

1. **Check file location**: Should be in `src/data/{date}.json`
2. **Check date format**: Must be `YYYY-MM-DD`
3. **Restart dev server**: New files need server restart
4. **Check console**: Look for loading errors

### Import Script Errors

- **"Puzzle already exists"**: Puzzle with that date already imported
- **"Validation errors"**: Check the error list and fix puzzle JSON
- **"Missing id field"**: Ensure puzzle has `id: "YYYY-MM-DD"`

### Archive Not Showing Puzzles

- Ensure puzzles are in `src/data/` directory
- Check that puzzle IDs are valid dates
- Restart dev server
- Check browser console for errors

## Efficiency Tips

1. **Batch Generation**: Generate a week/month at once with AI
2. **Template Copy**: Keep `import-puzzle.js` open, just replace the JSON
3. **Theme Check**: Review THEMES.md before generating to avoid duplicates
4. **Date Planning**: Generate puzzles for upcoming weeks in advance

## Next Steps

1. Generate your first puzzle using the workflow above
2. Import it using `import-puzzle.js`
3. Restart dev server and verify it appears
4. Check archive to see all imported puzzles

You're all set! 🎉

