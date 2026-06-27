# Daily Learning Mode — Feature Spec

An optional third learning mode layered on top of the existing flashcard system.
It introduces a cumulative daily schedule: 7 new words per day, every previous day's words always come along for the ride.

---

## The Learning Model

| Day | New words | Words in session |
|-----|-----------|-----------------|
| 1   | 7         | 7               |
| 2   | 7         | 14              |
| 3   | 7         | 21              |
| N   | 7         | N × 7           |

- Each day **7 new words** are added to the deck
- The session always contains **all words assigned so far** (cumulative)
- Words are drawn from a single chosen unit, in the unit's natural order
- When all words in the unit have been assigned, daily sessions become pure review (no new additions)
- "Day" is defined by **calendar date** — one session per calendar day. If the user misses days, they continue from where they left off (no penalty, no catch-up flood)

---

## UX Flow

```
Home page
  └─ "לימוד יומי" card (new, third mode)
       └─ Unit select page  (same component, different Nav title)
            └─ Daily Game page
                 ├─ If today's session not yet done → show today's deck
                 └─ If already done today       → show "come back tomorrow" screen
```

The mode is **optional** — the existing unit-based and analytics flows are unchanged.

---

## Pages / Views

### Home page addition
Add a third mode card between the two existing ones and the analytics button:
- Icon: `CalendarDays` (Lucide)
- Hebrew label: **לימוד יומי**
- Subtitle: 7 מילים חדשות ביום, עם חזרה על כל מה שלמדת

### Unit select (reused)
Same `UnitSelectPage` component, `mode='daily-en'` or `mode='daily-he'`.
Each unit card shows:
- How many words have been assigned so far out of total
- Which day number the user is on (e.g. "יום 4")
- Standard mastery progress bar

### Daily Game page (`DailyGamePage.tsx`)

#### States

**1. Already done today**
- Text: "כל הכבוד! סיימת את השיעור להיום"
- Sub-text showing tomorrow's word count (e.g. "מחר תתחיל עם 28 מילים")
- Buttons: "חזור לבית" | "תרגול חופשי" (jumps to regular game for same unit)

**2. Active session**
- Header: mode label + "יום N — X מילים" + exit button
- Progress bar (cards seen in this session)
- Flashcard (same component, same flip behaviour)
- Controls: Prev / Flip / Next (Next increments seen-count via the existing `recordSeen`)
- A small badge on each card: "חדש היום" (yellow) for Day-N words, no badge for review words
- Shuffle toggle applies only within the today's deck order

**3. Session complete**
- Trophy icon + "סיימת את יום N!"
- Tomorrow's preview: "מחר: X מילים" (today's count + 7 or total remaining if < 7)
- Buttons: **חזור לבית** | **חזור שוב** (restart today's deck)

---

## localStorage Schema Extension

Add a `daily` key alongside the existing `psycoach_progress` key:

```
Key: "psycoach_daily"
Value:
{
  "en": {                           // mode: English flashcards
    "unit_3": {
      "startDate": "2026-06-27",    // ISO date string — Day 1 anchor
      "lastSessionDate": "2026-06-27", // ISO date of last completed session
      "dayReached": 4,              // highest day whose session was completed
      "assignments": {
        "1": ["שָׁלוֹם", "בַּיִת", ...],   // 7 terms assigned on Day 1
        "2": ["סֵפֶר", "מַיִם", ...],      // 7 new terms added on Day 2
        ...
      }
    }
  },
  "he": {                           // mode: Hebrew definitions
    "unit_1": { ... }
  }
}
```

### Key rules
- `startDate` is set the first time the user opens Daily mode for that unit/mode pair — never changes
- `assignments` is built lazily: Day N's 7 words are assigned the first time the user opens that day's session
- `lastSessionDate` is updated when the user presses "הבא" on the last card of the day's deck
- `dayReached` increments when the session is completed (last card advanced)
- Words for a day are drawn in order from the unit's pair list, starting after the last assigned index
- If fewer than 7 words remain unassigned, the last day gets however many are left

---

## Daily Mode Type Extension (`types.ts`)

```ts
export type DailyMode = 'daily-en' | 'daily-he'

// Extend NavState:
| { view: 'unitSelect'; mode: Mode | DailyMode }
| { view: 'dailyGame'; mode: DailyMode; unit: number }

// New localStorage structure:
export type DailyUnitState = {
  startDate: string           // ISO 8601 date e.g. "2026-06-27"
  lastSessionDate: string     // ISO 8601 date
  dayReached: number          // last completed day
  assignments: Record<string, string[]>  // day number (as string key) → array of `from` terms
}
export type DailyModeProgress = Record<string, DailyUnitState>  // unitKey → state
export type DailyStore = Record<'en' | 'he', DailyModeProgress>
```

---

## New Hook: `useDailyProgress.ts`

```ts
export function useDailyProgress(): [
  DailyStore,
  {
    getOrBuildTodaysDeck: (mode: 'en' | 'he', unit: number, allPairs: Pair[]) => Pair[],
    completeSession: (mode: 'en' | 'he', unit: number) => void,
    isSessionDoneToday: (mode: 'en' | 'he', unit: number) => boolean,
    getDayNumber: (mode: 'en' | 'he', unit: number) => number,
  }
]
```

### `getOrBuildTodaysDeck`
1. Load `DailyUnitState` for this mode+unit; if none, initialise with `startDate = today`
2. Compute `dayNumber = dayReached + 1` (the upcoming day to work on)
3. If `assignments[dayNumber]` does not exist yet, pick the next 7 unassigned `from` terms from `allPairs` and write them to `assignments[dayNumber]`
4. Collect all terms from `assignments["1"]` … `assignments[dayNumber]`
5. Map those terms back to full `Pair` objects from `allPairs`
6. Return the ordered `Pair[]`; each pair carries a flag `isNew: boolean` (true if term is in `assignments[dayNumber]`)

### `completeSession`
Sets `lastSessionDate = today` and `dayReached = dayNumber`, writes to localStorage.

### `isSessionDoneToday`
Returns `lastSessionDate === today`.

### `getDayNumber`
Returns `dayReached + 1` (the day the user is currently on).

---

## New Component: `DailyGamePage.tsx`

Structurally identical to `GamePage.tsx` with these differences:

| Aspect | Regular game | Daily game |
|--------|-------------|------------|
| Deck source | Full unit pairs | `getOrBuildTodaysDeck()` |
| "New" badge | — | Yellow `חדש` chip on front of card for Day-N words |
| Session complete | Trophy screen | Trophy + tomorrow preview |
| Already done | — | "Come back tomorrow" screen |
| Progress bar | Cards seen in unit | Cards seen in today's deck |

---

## `DailyGamePage` "New word" badge

The deck returned by `getOrBuildTodaysDeck` can be enriched by the hook with an `isNew` flag.
The `Flashcard` component gets an optional `isNew?: boolean` prop that renders a small
`bg-system-yellow-light text-system-yellow` pill in the top-left corner of the front face saying **חדש**.

---

## UnitCard updates for Daily mode

When rendered inside the Daily unit selector, the `UnitCard` should additionally show:
- Day number: "יום 4" badge
- Next session card count: "28 מילים מחר"
- A lock icon (`Lock` from Lucide) + greyed-out state if the session is already done today

---

## Home page addition

Insert between the two existing mode cards and the analytics button:

```tsx
<button onClick={() => onSelectMode('daily-en')}>
  <CalendarDays /> לימוד יומי — אנגלית
  <span>7 מילים חדשות ביום</span>
</button>
<button onClick={() => onSelectMode('daily-he')}>
  <CalendarDays /> לימוד יומי — עברית
  <span>7 מילים חדשות ביום</span>
</button>
```

Or combine into one "daily" card and let the user pick language after selecting the unit — open design choice.

---

## What NOT to change

- `useProgress` and `psycoach_progress` — seen-counts for all seen cards still accumulate normally via `recordSeen`, including from daily sessions
- `AnalyticsPage` — already reads from `psycoach_progress`; daily sessions contribute to it automatically
- `mapping.json` / `heb_mapping.json` — data source unchanged
- `Flashcard`, `ProgressBar`, `NavBar` components — reused as-is (Flashcard gets one optional prop)

---

## Implementation Order

1. Extend `types.ts` with `DailyMode`, `DailyUnitState`, `DailyStore`
2. Write `useDailyProgress.ts`
3. Add optional `isNew` prop to `Flashcard.tsx`
4. Write `DailyGamePage.tsx`
5. Update `HomePage.tsx` (add daily mode cards)
6. Update `UnitSelectPage.tsx` (handle `DailyMode` nav state, pass daily props to `UnitCard`)
7. Update `App.tsx` — add `'dailyGame'` nav case, instantiate `useDailyProgress`
