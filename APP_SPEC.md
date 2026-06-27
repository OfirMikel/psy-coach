# PsyCoach Flashcard App — Feature Spec

A single-page React/TypeScript/Tailwind app for studying vocabulary from the Campus dictionary.
No backend — data is loaded from two static JSON files in `/public/data/`.

---

## Data Sources

| File | Content |
|------|---------|
| `mapping.json` | Hebrew → English pairs, units 1-10 (~400 pairs/unit) |
| `heb_mapping.json` | Hebrew term → Hebrew definition, units 1-10 (~150 pairs/unit) |

---

## Pages / Views

### 1. Home Page
- App title and short description
- Two large mode-selection cards:
  - **Learn English** — practise translating Hebrew words into English
  - **Learn Hebrew** — practise reading Hebrew terms with their Hebrew definitions
- Each card shows an icon, title, and one-line description
- Navigation link to the **Analytics** page

### 2. Unit Selection Page
- Shown after choosing a mode
- Grid of 10 unit buttons (Unit 1 – Unit 10), each showing the pair count for that unit
- Each unit button also shows a mini mastery indicator (% of cards seen ≥ 1 time in that unit)
- "Back" link returns to Home

### 3. Flashcard Game Page

#### Layout
- Header: mode name + unit label + progress ("Card 12 / 40") + "Exit" button
- Central flashcard (large, centered)
- Control bar below the card

#### Flashcard behaviour
- **Front** — always shows the Hebrew word/term (RTL text, large font)
- **Back** — shows the translation/definition
  - English mode → English word(s), large font
  - Hebrew mode → Hebrew definition paragraph, RTL text
- Click the card (or press Space / Enter) to **flip** it with a CSS 3-D flip animation
- Card flips back to front automatically when advancing to the next card
- Each time a card is **advanced past** (Next pressed, or deck wraps), its seen-count is incremented by 1 and saved to localStorage

#### Controls
- **Previous** (← arrow or left-arrow key) — go back one card (does NOT increment seen-count)
- **Next** (→ arrow or right-arrow key) — advance one card (increments seen-count)
- **Shuffle** toggle — randomises card order (persists for the session)
- **Restart** — resets to card 1 in the current unit
- Progress bar at the top of the card showing % of cards seen in this session

#### End-of-deck screen
- "You've finished Unit N!" message
- Buttons: **Restart this unit** | **Pick another unit** | **Home**

---

### 4. Analytics Page

#### Overview strip
- Total cards seen across all modes and units
- Total unique cards mastered (seen ≥ 28 times)
- Overall mastery % across all cards

#### Per-mode breakdown
Two sections: "Learn English" and "Learn Hebrew", each showing:

**Unit grid** — one row per unit (Unit 1 – Unit 10):
- Unit label
- Number of cards seen at least once / total cards in unit
- A mastery progress bar:
  - Fills from 0 → 100% as the card approaches 28 views
  - Bar colour: red (0–9 views) → amber (10–19) → green (20–27) → solid green + ✓ (28+)
- Clicking a unit expands a **card list** showing every card seen so far, each with:
  - The Hebrew term
  - Its translation/definition (truncated)
  - A small progress bar (seen-count / 28) filling to 100%
  - The exact seen-count number

#### localStorage schema
Only cards that have been seen at least once are stored — never pre-populate.

```
Key:   "psycoach_progress"
Value: JSON object
{
  "en": {                          // Learn English mode
    "unit_1": {
      "<hebrew_term>": <seen_count: number>   // e.g. "שָׁלוֹם": 5
    },
    ...
  },
  "he": {                          // Learn Hebrew mode
    "unit_3": {
      "<hebrew_term>": <seen_count: number>
    },
    ...
  }
}
```

- Keys are the `from` field of each mapping entry (the Hebrew term shown on the card front)
- A key is added the **first time** a card is advanced past; subsequent passes increment its count
- Mastery threshold: **28 views** = 100% on the per-card progress bar

---

## UI / Style Guidelines

### Layout — Mobile First
- Designed for a phone screen first; tablet/desktop get wider max-width containers
- Default page max-width: 430px centered; analytics page may expand to 640px on wider screens
- Touch-friendly tap targets (min 44px height)

### Language — Hebrew Primary
- All UI labels, buttons, and headings are in Hebrew (RTL)
- `<html dir="rtl" lang="he">` set globally
- Hebrew card text: `font-family: serif`, large (2rem+)
- English card text (back of English-mode cards): sans-serif, `dir="ltr"` inline

### Theme — Light
- Page background: `--bg-grey` (#F4F4F4)
- Card / surface background: `--bg-white` (#FEFEFE)
- Primary text: `--text-dark` (#1C1C1C)
- Secondary / muted text: `--text-grey` (#5B6770)
- Borders / dividers: `--stroke` (#CBD1DB), lighter: `--stroke-light` (#F1F2F6)
- Disabled states: `--grey-disable` (#A7B2BA)

### Colour Palette (CSS variables — set on `:root`)
```css
--grey-light:          #F8F8F8;
--grey:                #ECECEC;
--grey-disable:        #A7B2BA;
--bg-grey:             #F4F4F4;
--blue:                #1C1C1C;
--blue-light:          #E8E8E8;
--blue-light-2:        #EFEFEF;
--blue-bright:         #5585BF;
--bg-white:            #FEFEFE;
--white:               #FEFEFE;
--white-70:            #FEFEFEB2;
--text-grey:           #5B6770;
--text-dark:           #1C1C1C;
--text-grey-med:       #3A384B;
--system-green:        #2E8B57;
--system-yellow:       #CFAD00;
--system-orange:       #CE5814;
--system-orange-light: #FEEADF;
--system-green-light:  #C8F5DC;
--system-yellow-light: #F7F0D1;
--system-red:          #B31942;
--system-red-light:    #E0B4C0;
--system-red-light-5:  #B319420D;
--system-red-light-10: #FFCEDB;
--system-red-bright:   #B319421A;
--stroke:              #CBD1DB;
--stroke-light:        #F1F2F6;
```

### Component Tokens
- **Primary button**: `--blue-bright` (#5585BF) bg, white text, rounded-xl
- **Secondary button**: `--blue-light` (#E8E8E8) bg, `--text-dark` text
- **Progress bar ramp** (seen-count / 28):
  - 0–9 views → `--system-red` fill on `--system-red-light-10` track
  - 10–19 views → `--system-yellow` fill on `--system-yellow-light` track
  - 20–27 views → `--system-green` fill on `--system-green-light` track
  - 28+ views → solid `--system-green` + ✓ icon
- **Card shadow**: `box-shadow: 0 2px 8px rgba(0,0,0,0.08)`
- No external fonts or CDN dependencies (system fonts only)

---

## Technical Notes

- `fetch('/data/mapping.json')` and `fetch('/data/heb_mapping.json')` at runtime
- State managed with React `useState` / `useReducer` — no external state library
- Routing: simple view-state enum (`'home' | 'unitSelect' | 'game' | 'analytics'`), no router package
- Tailwind v4 via `@tailwindcss/vite` plugin
- localStorage key: `"psycoach_progress"` — read once on app mount, written incrementally (never rewritten in full; only the changed card's count is patched)