import { useEffect, useState } from 'react'
import { Mascot } from 'wobnimo/react'
import owl from '../../mascots/owl'
import { XIcon } from './icons'

export type BuddyState =
  | 'idle'
  | 'thinking'
  | 'listening'
  | 'speaking'
  | 'working'
  | 'error'
  | 'surprised'
  | 'celebrating'
  | 'sad'
  | 'sleeping'

const LABELS: Record<BuddyState, string> = {
  idle: 'Hoot is here when you need me',
  thinking: 'Hoot is thinking…',
  listening: 'Hoot is listening',
  speaking: 'Hoot is reading aloud',
  working: 'Hoot is working on it',
  error: 'Hoot hit a snag',
  surprised: 'Oh!',
  celebrating: 'Hoot celebrates with you!',
  sad: "Hoot couldn't help",
  sleeping: 'Hoot is dozing zzz',
}

const TINY: Record<BuddyState, string> = {
  idle: 'ready',
  thinking: 'thinking',
  listening: 'listening',
  speaking: 'speaking',
  working: 'working',
  error: 'oops',
  surprised: 'oh!',
  celebrating: 'yay!',
  sad: 'sorry',
  sleeping: 'zzz',
}

const DOT: Record<BuddyState, string> = {
  idle: 'bg-[#cbd5e1]',
  thinking: 'bg-[#fbbf24]',
  listening: 'bg-[#7dd3fc]',
  speaking: 'bg-[#fbbf24]',
  working: 'bg-[#fbbf24]',
  error: 'bg-[#fb7185]',
  surprised: 'bg-[#c084fc]',
  celebrating: 'bg-[#4ade80]',
  sad: 'bg-[#94a3b8]',
  sleeping: 'bg-[#94a3b8]',
}

/**
 * Floating study-desk companion. A single owl instance renders on a
 * transparent canvas inside its own fixed, resizing box — so it never
 * affects page layout. The owl's colours are fixed hex values (light- and
 * dark-mode independent); only the surrounding panel uses app theme tokens.
 */
// Open by default only on screens with room beside the content; at common
// projector sizes (1024–1440px) the open card would cover the page.
function isWide(): boolean {
  return typeof window !== 'undefined' && (window.matchMedia?.('(min-width: 1536px)').matches ?? true)
}

/**
 * `docked`: start minimized (e.g. on the run and results pages, where the
 * full card would cover the review text). The user can still open it.
 */
export function MascotBuddy({
  status,
  docked = false,
  animate = true,
}: {
  status: BuddyState
  docked?: boolean
  /** false: hold the owl still (the top-bar "Motion off" setting). */
  animate?: boolean
}) {
  const [open, setOpen] = useState(() => !docked && isWide())
  const [poke, setPoke] = useState<BuddyState | null>(null)

  // Re-evaluate when the page changes; a manual open/close lasts until then.
  const [prevDocked, setPrevDocked] = useState(docked)
  if (docked !== prevDocked) {
    setPrevDocked(docked)
    setOpen(!docked && isWide())
  }

  useEffect(() => {
    if (!poke) return
    const t = setTimeout(() => setPoke(null), 1400)
    return () => clearTimeout(t)
  }, [poke])

  const shown = poke ?? status
  const size = open ? 132 : 56

  return (
    <div className="fixed bottom-4 right-4 z-40 md:bottom-6 md:right-6">
      <div
        className={`flex items-center border-[1.5px] border-edge bg-card shadow-book-overlay transition-all duration-300 ${
          open ? 'flex-col gap-2 rounded-2xl p-3' : 'gap-3 rounded-full py-2 pl-2 pr-4'
        }`}
      >
        <div className="shrink-0 transition-all duration-300" style={{ width: size, height: size }}>
          {/* The library defaults to a fixed 160px box; make it fill (and shrink with) our box. */}
          <Mascot
            key={animate ? 'live' : 'still'}
            speed={animate ? 1 : 0}
            effects={animate}
            respectReducedMotion={false}
            character={owl}
            state={shown}
            onPoke={() => setPoke('surprised')}
            style={{ width: '100%', height: '100%' }}
          />
        </div>

        {open ? (
          <div className="flex w-full flex-col">
            <div className="mb-1 flex items-center justify-between">
              <span className="font-mono text-[10px] font-semibold uppercase tracking-widest text-faint">
                Hoot · owl
              </span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Minimize Hoot"
                className="rounded-full p-1 text-faint transition hover:text-ink"
              >
                <XIcon className="h-3.5 w-3.5" />
              </button>
            </div>
            <p className="flex items-center gap-1.5 font-hand text-[16px] leading-tight text-amb">
              <span className={`h-2 w-2 shrink-0 rounded-full ${DOT[shown]}`} />
              <span>{LABELS[shown]}</span>
            </p>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Open Hoot"
            className="flex flex-col items-start leading-tight"
          >
            <span className="font-hand text-[17px] font-semibold text-amb">Hoot</span>
            <span className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wide text-faint">
              <span className={`h-1.5 w-1.5 rounded-full ${DOT[shown]}`} />
              {TINY[shown]}
            </span>
          </button>
        )}
      </div>
    </div>
  )
}
