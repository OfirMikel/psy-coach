# PsyCoach Flashcard App — Engineering Spec

Stack: React 19 · TypeScript 6 · Tailwind v4 (`@tailwindcss/vite`) · Vite 8  
No router package, no state library, no backend.

---

## Directory Structure

```
app/
├── public/
│   └── data/
│       ├── mapping.json          # Hebrew → English, units 1-10
│       └── heb_mapping.json      # Hebrew term → Hebrew definition, units 1-10
├── src/
│   ├── main.tsx                  # Entry point — sets dir="rtl" on <html>
│   ├── index.css                 # CSS variables + global resets
│   ├── App.tsx                   # Root — owns router state + progress store
│   ├── types.ts                  # All shared TypeScript types
│   ├── hooks/
│   │   ├── useData.ts            # Loads both JSON files, memoises result
│   │   └── useProgress.ts        # Reads/writes localStorage progress store
│   ├── pages/
│   │   ├── HomePage.tsx
│   │   ├── UnitSelectPage.tsx
│   │   ├── GamePage.tsx
│   │   └── AnalyticsPage.tsx
│   └── components/
│       ├── Flashcard.tsx         # The flipping card (3-D CSS transform)
│       ├── ProgressBar.tsx       # Reusable colour-ramped bar
│       ├── UnitCard.tsx          # Unit button with mini mastery indicator
│       └── NavBar.tsx            # Shared top bar (back arrow + title)
```

---

## TypeScript Types (`src/types.ts`)

```ts
// ── Data shapes (match JSON file structure) ─────────────────────────────────

export type Pair = { from: string; to: string }

export type MappingFile = {
  name: string
  description: string
  mapping: Record<string, Pair[]>   // key = "unit_1" … "unit_10"
}

// ── App routing ──────────────────────────────────────────────────────────────

export type Mode = 'en' | 'he'

export type View = 'home' | 'unitSelect' | 'game' | 'analytics'

export type NavState =
  | { view: 'home' }
  | { view: 'unitSelect'; mode: Mode }
  | { view: 'game';       mode: Mode; unit: number }
  | { view: 'analytics' }

// ── Progress store (mirrors localStorage schema) ─────────────────────────────

// unitKey = "unit_1" … "unit_10"
// innerKey = the `from` field of a Pair (the Hebrew term shown on card front)
export type UnitProgress  = Record<string, number>          // term → seen-count
export type ModeProgress  = Record<string, UnitProgress>    // unitKey → UnitProgress
export type ProgressStore = Record<Mode, ModeProgress>      // mode → ModeProgress
```

---

## Routing (`App.tsx`)

Single `useState<NavState>` drives which page renders. No `<BrowserRouter>`.

```ts
const [nav, setNav] = useState<NavState>({ view: 'home' })

// helpers passed as props:
const goHome       = () => setNav({ view: 'home' })
const goUnitSelect = (mode: Mode) => setNav({ view: 'unitSelect', mode })
const goGame       = (mode: Mode, unit: number) => setNav({ view: 'game', mode, unit })
const goAnalytics  = () => setNav({ view: 'analytics' })
```

`App.tsx` also owns the `ProgressStore` state and the two data files, passing them down as props.

---

## Data Loading (`src/hooks/useData.ts`)

```ts
// Fetches both JSON files in parallel on mount.
// Returns { enData: MappingFile | null, heData: MappingFile | null, loading: boolean }
export function useData()
```

- Called once in `App.tsx`; results passed as props to pages that need them
- On fetch error, logs to console and leaves the file as `null` (pages show a loading/error state)

---

## Progress Store (`src/hooks/useProgress.ts`)

```ts
const LS_KEY = 'psycoach_progress'

// Reads LS on mount. Returns [store, recordSeen].
export function useProgress(): [ProgressStore, (mode: Mode, unit: number, term: string) => void]
```

### `recordSeen(mode, unit, term)`
1. Read current store from state (not re-read from LS — already in memory)
2. Increment `store[mode][unitKey][term]` by 1, defaulting to 0 if absent
3. Write the **full updated store** back to `localStorage.setItem(LS_KEY, JSON.stringify(store))`
4. Call `setState` with the new store so UI re-renders

### Why write the full object
The store is small (only seen cards, max ~1,600 entries of `"term": count`). Patching a single key in LS would require `JSON.parse` + merge + `JSON.stringify` on every call anyway — keeping the full object in React state and flushing it is simpler and equally fast.

### Initial load
```ts
function loadStore(): ProgressStore {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (raw) return JSON.parse(raw) as ProgressStore
  } catch {}
  return { en: {}, he: {} }
}
```

---

## Flashcard Logic (`pages/GamePage.tsx`)

### State
```ts
const [deck, setDeck]       = useState<Pair[]>([])   // ordered/shuffled pairs
const [index, setIndex]     = useState(0)
const [flipped, setFlipped] = useState(false)
const [shuffled, setShuffled] = useState(false)
const [finished, setFinished] = useState(false)
```

### Seen-count increment rule
`recordSeen` is called exactly when the user advances **forward** (Next button or right-arrow key). Going back (Previous / left-arrow) never increments.

```ts
function advance() {
  recordSeen(mode, unit, deck[index].from)   // increment before moving
  if (index + 1 >= deck.length) {
    setFinished(true)
  } else {
    setIndex(i => i + 1)
    setFlipped(false)
  }
}

function retreat() {
  if (index === 0) return
  setIndex(i => i - 1)
  setFlipped(false)
  // NO recordSeen call
}
```

### Keyboard handler
```ts
useEffect(() => {
  function onKey(e: KeyboardEvent) {
    if (e.key === 'ArrowRight') advance()
    if (e.key === 'ArrowLeft')  retreat()
    if (e.key === ' ' || e.key === 'Enter') setFlipped(f => !f)
  }
  window.addEventListener('keydown', onKey)
  return () => window.removeEventListener('keydown', onKey)
}, [index, flipped, deck])
```

### Shuffle
```ts
function toggleShuffle() {
  setShuffled(s => !s)
  setDeck(d => shuffled ? originalDeck : [...d].sort(() => Math.random() - 0.5))
  setIndex(0)
  setFlipped(false)
}
```

---

## Flashcard Component (`components/Flashcard.tsx`)

Props: `{ front: string; back: string; flipped: boolean; mode: Mode; onClick: () => void }`

CSS 3-D flip via Tailwind utility classes + inline transform-style. Two absolute-positioned faces:
- **Front**: Hebrew term, RTL, serif, ~2rem
- **Back**: Translation/definition. `dir="ltr"` for English mode; `dir="rtl"` for Hebrew mode

```css
/* Applied to the card wrapper */
perspective: 1000px;

/* Inner container — rotates */
transform-style: preserve-3d;
transition: transform 0.45s ease;
transform: rotateY(flipped ? 180deg : 0deg);

/* Back face */
transform: rotateY(180deg);
backface-visibility: hidden;
```

---

## ProgressBar Component (`components/ProgressBar.tsx`)

Props: `{ count: number; max?: number }` (max defaults to 28)

```
count / max → pct (0–100)

pct < 36%  → fill: --system-red,    track: --system-red-light-10
pct < 72%  → fill: --system-yellow, track: --system-yellow-light
pct < 100% → fill: --system-green,  track: --system-green-light
pct >= 100%→ fill: --system-green,  track: --system-green-light, show ✓ icon
```

Rendered as a `<div>` with inline width style — no SVG needed.

---

## Analytics Page (`pages/AnalyticsPage.tsx`)

Receives: `store: ProgressStore`, `enData: MappingFile`, `heData: MappingFile`

### Derived values (computed in render, not stored)
```ts
// Per unit, per mode:
const totalCards  = data.mapping[unitKey].length
const seenCards   = Object.keys(store[mode][unitKey] ?? {}).length
const masteredCards = Object.values(store[mode][unitKey] ?? {}).filter(n => n >= 28).length

// For the expanded card list:
const seenEntries = data.mapping[unitKey]
  .filter(p => (store[mode][unitKey]?.[p.from] ?? 0) > 0)
  .map(p => ({ pair: p, count: store[mode][unitKey][p.from] }))
```

### Unit row expand/collapse
`useState<string | null>(null)` tracks the currently expanded unit key. Clicking a unit row toggles it.

---

## Global Styles (`src/index.css`)

```css
@import "tailwindcss";

:root {
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
}

html {
  direction: rtl;
  lang: he;
}

body {
  background-color: var(--bg-grey);
  color: var(--text-dark);
  font-family: system-ui, sans-serif;
  -webkit-font-smoothing: antialiased;
}
```

---

## Vite Config

Add Tailwind v4 plugin:

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
})
```

---

## Build & Run

```bash
cd app
npm install
npm run dev      # http://localhost:5173
npm run build    # dist/ — fully static, deploy anywhere
```

---

## Constraints & Non-Goals

- No React Router — nav state is a plain `useState` in `App.tsx`
- No Redux / Zustand — two `useState` hooks (nav + progress) are sufficient
- No unit tests in v1
- No i18n library — Hebrew strings are hardcoded (the app is Hebrew-only)
- No service worker / offline mode
- JSON files served statically from `/public/data/` — no build-time import