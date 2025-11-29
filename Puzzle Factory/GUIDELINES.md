# Venn Diagram Puzzle Generation Protocol

## 1. Core Mechanics

The puzzle consists of a Word Pool of 10 items and two Categories (Category A and Category B). The goal is to sort the 10 items into four distinct buckets based on boolean logic.

### The Four Buckets

- **Category A Only**: Item satisfies $A$ but NOT $B$.
- **Category B Only**: Item satisfies $B$ but NOT $A$.
- **Intersection (Both)**: Item satisfies primarily $A$ AND primarily $B$.
- **Complement (Neither)**: Item satisfies neither definition.

### Distribution Constraints

To prevent "meta-gaming" (solving by counting slots), the distribution of the 10 words must vary within these bounds:

- **A Only**: 2–3 items
- **B Only**: 2–3 items
- **Both**: 2–3 items
- **Neither**: 1–3 items

**Hard Constraint**: No bucket may be empty.

## 2. The Weekly Difficulty Curve

Difficulty is defined not just by obscurity, but by the type of logic required to validate the category.

### Level 1: Monday (Easy)

**Logic**: Purely observational or elementary fact-based.

**Category Types**: Tangible, physical, high-frequency attributes. Colors, shapes, animals, common foods.

**Cognitive Load**: Instant recognition.

**Example**:
- Category A: Things that are Green.
- Category B: Fruits.
- A Only: Grass.
- B Only: Strawberry.
- Both: Lime.
- Neither: Fire Truck.

### Level 2: Tuesday / Wednesday (Medium)

**Logic**: Encyclopedic knowledge and factual verification.

**Category Types**: Grade-school facts (Geography, Basic Science, History, Basic Math). 

**Cognitive Load**: Requires verifying a fact or piece of knowledge.

**Example**:
- Category A: European Countries.
- Category B: Things that are Red.
- A Only: France, Germany (European but not red).
- B Only: Apple, Cherry (Red but not European countries).
- Both: Spain (European country with red in flag), Italy (European country with red in flag).
- Neither: Brazil (South American), Blue (Color but not red).

**IMPORTANT**: Do NOT use spelling-based categories (starts with, ends with, contains letters, etc.) even in this tier. Focus on factual knowledge instead.

### Level 3: Thursday / Friday / Saturday (Hard)

**Logic**: Abstract concepts, Associations, and Idioms.

**Category Types**: Functions, Materials, "Things found in a...", or Idiomatic usage.

**Cognitive Load**: Requires thinking about the use or context of the object, not just its identity.

**Example**:
- Category A: Things with teeth.
- Category B: Things that are zipped.
- A Only: Comb, Saw.
- B Only: Computer File (Digital zip), Lips ("Zip it").
- Both: Jacket, Mouth (Human).
- Neither: Spoon.

### Level 4: Sunday (Grandmaster)

**Logic**: Deceptive simplicity, Compound Words, or "Invisible" Categories.

**Category Types**: Words that can follow/precede another word, Homophones, heteronyms, or second-order trivia.

**Cognitive Load**: The player must mentally manipulate the word (add to it, change its sound) to find the fit.

**Example**:
- Category A: Words that follow "Blue".
- Category B: Palindromes.
- A Only: Moon, Berry, Cheese.
- B Only: Madam, Racecar.
- Both: Eye (Blue Eye / Palindrome), Noon (Blue Noon / Palindrome).
- Neither: Sun, Hello.

## 3. The "Human Intelligence" Guardrails (Critical)

AI generators often fail by prioritizing "Technical Truth" over "Human Truth." The following rules act as a Turing filter.

### Rule 3.1: The "Tomato is a Fruit" Prohibition

Do not use technical classifications that contradict common usage unless the puzzle is explicitly themed as a "Trick" puzzle.

- **Bad AI Logic**: Classifying "Peanut" as a "Legume" and rejecting it from "Nuts."
- **Human Logic**: In a puzzle about snacks, a Peanut is a Nut.
- **Directive**: If a classification requires a sentence starting with "Actually, strictly speaking...", reject it.

### Rule 3.2: The "Wikipedia Specificity" Trap

Avoid categories where the membership is vast but obscure.

- **Bad Category**: "People named Michael." (Includes thousands of obscure people).
- **Good Category**: "Famous Michaels" (Jordan, Jackson, Fox).
- **Validation**: If the word requires a Google search for an average college graduate, it is invalid for Mon-Thu puzzles.

### Rule 3.3: The "Contextual Homonym" Lock

If a word is used, ALL its common meanings must comfortably sit in the assigned bucket, OR the intended meaning must be indisputable based on the other 9 words.

- **Risk**: Word "Bat". Categories: "Animals" / "Wooden things".
- **Conflict**: "Bat" fits A (animal) and B (baseball bat).
- **Resolution**: The word "Bat" is INVALID for this specific pairing because it is ambiguously "Both" or "Neither" depending on player interpretation.
- **Exception**: If the category is "Homonyms," this rule is inverted.

### Rule 3.4: The "Red Herring" Quality Control

Words in the "Neither" category cannot be random noise. They must be thematically proximal.

- **Theme**: "Birds" vs "Mammals".
- **Bad Neither**: "Spatula" (Too easy, distinct domain).
- **Good Neither**: "Lizard" (Animal, but neither bird nor mammal).
- **Excellent Neither**: "Airplane" (Flies like a bird, but isn't one).

### Rule 3.5: The "Platonic Ideal" Mandate

When checking if an item fits a visual or physical category (e.g., Colors, Shapes, Materials), verify against the object's "Kindergarten Flashcard" version.

**The Test**: If you drew a cartoon of the object for a 5-year-old, would it have this attribute?

**Example**:
- Category: "Green Things"
- Item: "Banana" → REJECT. (Standard banana is yellow).
- Item: "Frog" → ACCEPT. (Standard frog is green).
- Item: "Traffic Light" → REJECT. (It has green, but is not inherently green).

### Rule 3.6: The "Compound Concept" Threshold (For Level 4)

When using "Word Association" categories (e.g., "Words following 'Hot'"), the resulting pair must form a specific, recognized dictionary entry or strong idiom, not just a description.

**The Test**: Does the pair change the meaning of the second word, or create a specific entity?

**Example**:
- Category: "Words following 'Hot'"
- Item: "Dog" (Hot Dog) → ACCEPT. (A Hot Dog is not a dog that is warm).
- Item: "Tub" (Hot Tub) → ACCEPT. (Specific type of tub).
- Item: "Soup" (Hot Soup) → REJECT. (This is just soup that is hot).

### Rule 3.7: The "Synecdoche" Restriction

Avoid confusing "Is a..." with "Has a..." unless the category explicitly allows it.

- **Bad Logic**: "Car" fits in "Headlights". (A car has headlights, it is not a headlight).
- **Good Logic**: "Car" fits in "Things with Headlights".
- **Correction**: Ensure the category phrasing matches the relationship.
  - **Strict**: "Red Things" (Must BE red).
  - **Loose**: "Things containing Red" (Can HAVE red).

## 4. Category Compatibility Matrix

The AI must verify the two categories are "Orthogonal" (perpendicular).

| Status | Relationship | Example A | Example B | Verdict |
|--------|--------------|-----------|------------|---------|
| Invalid | Subset | Fruit | Apples | REJECT (B is inside A) |
| Invalid | Disjoint | Even #s | Odd #s | REJECT (Intersection impossible) |
| Invalid | Synonymous | Fast | Rapid | REJECT (A is B) |
| Valid | Intersecting | Red | Fruit | ACCEPT |
| Valid | Orthogonal | Red Things | Edible | ACCEPT |

## 5. Final Output Validation Checklist

Before finalizing a puzzle, the AI must run this simulation:

1. **Uniqueness Check**: Is there any reasonable argument that a word in "A Only" could technically fit in "B"? If yes → Regenerate word.
2. **Obscurity Check**: Is the word in the top 30,000 most common words in English? If no (and not a Proper Noun) → Regenerate word.
3. **Spelling Check**: Ensure all words are spelled correctly in standard US English (e.g., "Color" not "Colour"). Note: Spelling-based categories are forbidden - this check is for word correctness only.
4. **The "Distractor" Stability Check**: For items in the "Neither" (Complement) bucket, ensure they do not "almost" fit.
   - **Check**: If Category A is "Red Things", do not put "Pink" or "Orange" in the "Neither" bucket (too similar, creates confusion).
   - **Check**: If Category B is "Round Things", do not put "Oval" or "Egg" in the "Neither" bucket. It creates visual fighting.
   - **Goal**: The "Neither" bucket should be wrong for clear reasons, not technical reasons.

