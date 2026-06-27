import { useState, useEffect, useCallback } from 'react'
import {
  ChevronRight, ChevronLeft, FlipHorizontal2,
  Trophy, CalendarDays, Shuffle, RotateCcw,
} from 'lucide-react'
import { Flashcard } from '../components/Flashcard'
import type { DailyPair, MappingFile, DailyMode, ProgressStore } from '../types'
import { baseMode } from '../types'
import type { useDailyProgress } from '../hooks/useDailyProgress'

type DailyActions = ReturnType<typeof useDailyProgress>[1]

type Props = {
  mode: DailyMode
  unit: number
  data: MappingFile
  store: ProgressStore
  recordSeen: (mode: 'en' | 'he', unit: number, term: string) => void
  dailyActions: DailyActions
  onBack: () => void
  onHome: () => void
  onFreePlay: () => void
}

const MODE_LABELS: Record<DailyMode, string> = {
  'daily-en': 'לימוד יומי — אנגלית',
  'daily-he': 'לימוד יומי — עברית',
}

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function DailyGamePage({
  mode, unit, data, store, recordSeen, dailyActions, onBack, onHome, onFreePlay,
}: Props) {
  const bm = baseMode(mode)
  const unitKey = `unit_${unit}`
  const allPairs = data.mapping[unitKey] ?? []

  const [deck, setDeck] = useState<DailyPair[]>([])
  const [originalDeck, setOriginalDeck] = useState<DailyPair[]>([])
  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [isShuffled, setIsShuffled] = useState(false)
  const [finished, setFinished] = useState(false)
  const [ready, setReady] = useState(false)

  // Build deck on mount (may write new day assignments to store)
  useEffect(() => {
    const d = dailyActions.getOrBuildTodaysDeck(bm, unit, allPairs)
    setDeck(d)
    setOriginalDeck(d)
    setReady(true)
  }, [unit, bm]) // eslint-disable-line react-hooks/exhaustive-deps

  const alreadyDone = ready && dailyActions.isSessionDoneToday(bm, unit)
  const dayNumber   = dailyActions.getDayNumber(bm, unit)

  const currentCard = deck[index]
  const unitProgress = store[bm][unitKey] ?? {}
  const seenCount = currentCard ? (unitProgress[currentCard.from] ?? 0) : 0

  const newCount    = deck.filter(p => p.isNew).length
  const reviewCount = deck.length - newCount

  const advance = useCallback(() => {
    if (!currentCard) return
    recordSeen(bm, unit, currentCard.from)
    if (index + 1 >= deck.length) {
      dailyActions.completeSession(bm, unit)
      setFinished(true)
    } else {
      setIndex(i => i + 1)
      setFlipped(false)
    }
  }, [currentCard, deck.length, index, bm, unit, recordSeen, dailyActions])

  const retreat = useCallback(() => {
    if (index === 0) return
    setIndex(i => i - 1)
    setFlipped(false)
  }, [index])

  const restart = () => {
    setIndex(0)
    setFlipped(false)
    setFinished(false)
  }

  const toggleShuffle = () => {
    setDeck(isShuffled ? originalDeck : shuffleArray(originalDeck))
    setIsShuffled(s => !s)
    setIndex(0)
    setFlipped(false)
    setFinished(false)
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'ArrowRight') advance()
      if (e.key === 'ArrowLeft') retreat()
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault()
        setFlipped(f => !f)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [advance, retreat])

  if (!ready) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-text-grey bg-bg-grey">
        טוען…
      </div>
    )
  }

  // ── Already done today ────────────────────────────────────────────────────
  if (alreadyDone && !finished) {
    const nextCount = dailyActions.getNextSessionCount(bm, unit, allPairs.length)
    return (
      <div className="flex flex-col min-h-screen bg-bg-grey">
        <div className="flex items-center px-4 py-3 gap-2 bg-bg-white border-b border-stroke-light">
          <button onClick={onBack} className="text-blue-bright w-9 h-9 flex items-center justify-center">
            <ChevronRight size={22} />
          </button>
          <span className="flex-1 font-semibold text-base text-text-dark">{MODE_LABELS[mode]}</span>
        </div>
        <div className="flex flex-col flex-1 items-center justify-center p-8 gap-6 text-center">
          <CalendarDays size={64} className="text-blue-bright" />
          <h2 className="text-xl font-bold m-0 text-text-dark">כל הכבוד! סיימת את השיעור להיום</h2>
          <p className="text-sm text-text-grey">
            מחר תתחיל עם {nextCount} מילים — יום {dayNumber + 1}
          </p>
          <div className="flex flex-col gap-3 w-full max-w-xs">
            <button
              onClick={onFreePlay}
              className="w-full py-3 rounded-xl font-medium text-sm bg-blue-bright text-white"
            >
              תרגול חופשי
            </button>
            <button
              onClick={onHome}
              className="w-full py-3 rounded-xl font-medium text-sm bg-blue-light border border-stroke text-text-dark"
            >
              חזור לבית
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── Session complete ──────────────────────────────────────────────────────
  if (finished) {
    const nextCount = dailyActions.getNextSessionCount(bm, unit, allPairs.length)
    return (
      <div className="flex flex-col min-h-screen items-center justify-center p-8 gap-6 text-center bg-bg-grey">
        <Trophy size={64} className="text-system-yellow" />
        <h2 className="text-xl font-bold m-0 text-text-dark">סיימת את יום {dayNumber}!</h2>
        <div className="flex gap-4 text-sm text-text-grey">
          <span>{reviewCount} חזרה</span>
          <span>·</span>
          <span>{newCount} מילים חדשות</span>
        </div>
        {nextCount > deck.length && (
          <p className="text-sm text-text-grey">
            מחר: {nextCount} מילים — יום {dayNumber + 1}
          </p>
        )}
        <div className="flex flex-col gap-3 w-full max-w-xs">
          <button
            onClick={restart}
            className="w-full py-3 rounded-xl font-medium text-sm bg-blue-bright text-white"
          >
            חזור שוב
          </button>
          <button
            onClick={onFreePlay}
            className="w-full py-3 rounded-xl font-medium text-sm bg-blue-light border border-stroke text-text-dark"
          >
            תרגול חופשי
          </button>
          <button
            onClick={onHome}
            className="w-full py-3 rounded-xl font-medium text-sm text-text-grey"
          >
            דף הבית
          </button>
        </div>
      </div>
    )
  }

  // ── Active session ────────────────────────────────────────────────────────
  const progressPct = deck.length > 0 ? Math.round(((index + 1) / deck.length) * 100) : 0

  return (
    <div className="flex flex-col min-h-screen bg-bg-grey">
      {/* Header */}
      <div className="flex items-center px-4 py-3 gap-2 bg-bg-white border-b border-stroke-light">
        <button onClick={onBack} className="text-blue-bright w-9 h-9 flex items-center justify-center">
          <ChevronRight size={22} />
        </button>
        <div className="flex flex-col flex-1 text-right">
          <span className="text-xs text-text-grey">
            {MODE_LABELS[mode]} · יחידה {unit} · יום {dayNumber}
          </span>
          <span className="text-sm font-medium text-text-dark">
            {index + 1} / {deck.length}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {newCount > 0 && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-system-yellow-light text-system-yellow font-medium">
              {newCount} חדש
            </span>
          )}
          <button
            onClick={onHome}
            className="text-sm py-1 px-3 rounded-xl bg-blue-light text-text-dark"
          >
            יציאה
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-stroke-light">
        <div
          className="h-full bg-blue-bright transition-all duration-300"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      {/* Main content */}
      <div className="flex flex-col flex-1 p-4 gap-4">
        {/* Seen count */}
        <div className="flex items-center justify-between text-xs text-text-grey">
          <span>יעד: 28</span>
          <span>נראתה {seenCount} פעמים</span>
        </div>

        {/* Card */}
        <Flashcard
          front={currentCard?.from ?? ''}
          back={currentCard?.to ?? ''}
          flipped={flipped}
          mode={bm}
          isNew={currentCard?.isNew}
          onClick={() => setFlipped(f => !f)}
        />

        {/* Navigation */}
        <div className="flex items-center gap-3 mt-2">
          <button
            onClick={retreat}
            disabled={index === 0}
            className="flex-1 py-3 rounded-xl font-medium text-sm flex items-center justify-center gap-1.5 bg-blue-light border border-stroke text-text-dark disabled:opacity-30"
          >
            <ChevronRight size={16} />
            הקודם
          </button>
          <button
            onClick={() => setFlipped(f => !f)}
            className="flex-1 py-3 rounded-xl font-medium text-sm flex items-center justify-center gap-1.5 bg-blue-light-2 border border-stroke text-text-dark"
          >
            <FlipHorizontal2 size={16} />
            הפוך
          </button>
          <button
            onClick={advance}
            className="flex-1 py-3 rounded-xl font-medium text-sm flex items-center justify-center gap-1.5 bg-blue-bright text-white"
          >
            הבא
            <ChevronLeft size={16} />
          </button>
        </div>

        {/* Secondary controls */}
        <div className="flex gap-3">
          <button
            onClick={toggleShuffle}
            className={`flex-1 py-2 rounded-xl text-sm flex items-center justify-center gap-1.5 border ${
              isShuffled
                ? 'bg-system-green-light text-system-green border-system-green'
                : 'bg-blue-light text-text-grey border-stroke'
            }`}
          >
            <Shuffle size={14} />
            {isShuffled ? 'ערבוב פעיל' : 'ערבב'}
          </button>
          <button
            onClick={restart}
            className="flex-1 py-2 rounded-xl text-sm flex items-center justify-center gap-1.5 bg-blue-light text-text-grey border border-stroke"
          >
            <RotateCcw size={14} />
            התחל מחדש
          </button>
        </div>
      </div>
    </div>
  )
}
