# Puzzle Factory

Simple steps to generate and import new puzzles.

## Get New Puzzles

### Step 1: Generate with AI
1. Upload to your AI: `GUIDELINES.md`, `PUZZLE_SCHEMA.md`, and `THEMES.md`
2. Copy the prompt from `AI_GENERATION_PROMPT.md`
3. Request puzzle(s):
   - Single: "Generate a puzzle for 2025-03-15"
   - Week: "Generate puzzles for March 15-21, 2025"
   - Month: "Generate puzzles for all dates in March 2025"
4. Copy the JSON output

### Step 2: Paste Puzzle JSON
1. Open `puzzle-to-import.json` in the `Puzzle Factory/` directory
2. Replace the entire contents with your puzzle JSON (copy-paste from AI output)
3. Save the file

### Step 3: Import
1. Run the import script:
   ```bash
   node "Puzzle Factory/import-puzzle.js"
   ```

The script will:
- ✅ Read the puzzle from `puzzle-to-import.json`
- ✅ Validate the puzzle
- ✅ Save it to `src/data/{puzzle-id}.json`
- ✅ Update `THEMES.md` automatically
- ✅ Clear `puzzle-to-import.json` for next use
- ⚠️ Warn about duplicates

**Note**: For multiple puzzles, repeat Steps 2-3 for each puzzle.

### Step 4: Use in App
After importing, the puzzle will automatically be available in the app:
- **Today's puzzle**: Loads automatically if the date matches today
- **Archive**: All imported puzzles appear in the archive view
- **Rebuild**: Run `npm run build` or restart dev server to see new puzzles

---

## Documentation

- **SETUP_GUIDE.md** - Complete setup and workflow guide (start here!)
- **GUIDELINES.md** - Puzzle generation rules
- **PUZZLE_SCHEMA.md** - JSON structure  
- **THEMES.md** - Used themes (check for duplicates)
- **AI_GENERATION_PROMPT.md** - AI prompt template
- **example-puzzle.json** - Example puzzle
- **ASSESSMENT.md** - System assessment and technical details
