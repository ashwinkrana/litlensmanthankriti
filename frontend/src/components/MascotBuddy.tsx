import { useState } from 'react'
import { useHoot, type HootMood } from '../lib/hootContext'
import { HootFigure } from './hoot/HootFigure'
import { XIcon } from './icons'
import type { Theme } from './TopBar'

// One word for the minimised badge.
const SHORT: Record<HootMood, string> = {
  idle: 'ready',
  thinking: 'thinking',
  listening: 'listening',
  speaking: 'writing',
  working: 'working',
  error: 'oops',
  surprised: 'oh!',
  celebrating: 'done!',
  sad: 'sorry',
  sleeping: 'zzz',
}

// A status light: real state, so the colour carries meaning.
const LIGHT: Record<HootMood, string> = {
  idle: 'bg-faint',
  thinking: 'bg-amb-dot',
  listening: 'bg-sky-dot',
  speaking: 'bg-amb-dot',
  working: 'bg-amb-dot',
  error: 'bg-rose-dot',
  surprised: 'bg-purp-dot',
  celebrating: 'bg-mint-dot',
  sad: 'bg-faint',
  sleeping: 'bg-faint',
}

// Open by default only with room beside the content (projectors are 1024-1440px).
function isWide(): boolean {
  return typeof window !== 'undefined' && (window.matchMedia?.('(min-width: 1536px)').matches ?? true)
}

/**
 * The floating Hoot badge (bottom-right). Shows what Hoot is doing and his
 * caption; minimised by default where it would cover content. Hidden while
 * Hoot is perched on the home page instead.
 */
export function MascotBuddy({
  theme,
  docked = false,
  hidden = false,
  animate = true,
}: {
  theme: Theme
  /** Start minimised (run and results pages). The user can still open it. */
  docked?: boolean
  /** Hoot is shown elsewhere (perched on the home page). */
  hidden?: boolean
  /** false: hold the owl still (the top-bar "Motion off" setting). */
  animate?: boolean
}) {
  const { mood, caption } = useHoot()
  const [open, setOpen] = useState(() => !docked && isWide())

  // Re-evaluate when the page changes; a manual open/close lasts until then.
  const [prevDocked, setPrevDocked] = useState(docked)
  if (docked !== prevDocked) {
    setPrevDocked(docked)
    setOpen(!docked && isWide())
  }

  if (hidden) return null
  const size = open ? 132 : 56

  return (
    <div className="fixed bottom-4 right-4 z-40 md:bottom-6 md:right-6">
      <div
        className={`flex items-center border border-edge bg-card shadow-book-overlay transition-all duration-300 ${
          open ? 'w-[220px] flex-col gap-2 rounded-2xl p-3' : 'gap-3 rounded-full py-1.5 pl-1.5 pr-4'
        }`}
      >
        <div className="shrink-0 transition-all duration-300" style={{ width: size, height: size }}>
          <HootFigure
            mood={mood}
            theme={theme}
            animate={animate}
            framing={open ? 1 : 0.82}
            floor={open ? 1 : 0}
            className="h-full w-full"
          />
        </div>

        {open ? (
          <div className="flex w-full flex-col">
            <div className="mb-1 flex items-center justify-between">
              <span className="text-xs font-bold text-ink">Hoot</span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Minimise Hoot"
                className="rounded-full p-1 text-faint transition hover:text-ink"
              >
                <XIcon className="h-3.5 w-3.5" />
              </button>
            </div>
            <p className="flex items-start gap-1.5 text-sm leading-snug text-txt" aria-live="polite">
              <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${LIGHT[mood]}`} />
              <span>{caption}</span>
            </p>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label={`Open Hoot: ${caption}`}
            className="flex flex-col items-start leading-tight"
          >
            <span className="font-hand text-[17px] font-semibold text-amb">Hoot</span>
            <span className="flex items-center gap-1 font-mono text-[10px] text-faint">
              <span className={`h-1.5 w-1.5 rounded-full ${LIGHT[mood]}`} />
              {SHORT[mood]}
            </span>
          </button>
        )}
      </div>
    </div>
  )
}
