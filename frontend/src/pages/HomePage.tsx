import { useRef, useState, type CSSProperties } from 'react'
import { ArrowRightIcon, SparkleIcon } from '../components/icons'
import { InkButton, Spinner } from '../components/ui'
import { HootOnBranch, HootSpeaker } from '../components/hoot/HootPerch'
import type { Theme } from '../components/TopBar'
import { useMediaQuery } from '../lib/useMediaQuery'
import { useHoot } from '../lib/hootContext'
import { useCursorParallax } from '../lib/useCursorParallax'

// Parallax depth per layer, in px at the window's edge: subtle, deeper = further forward.
const depth = (px: number) => ({ '--depth': px }) as CSSProperties

const DECKS = [
  { value: 4, label: '4 Quick' },
  { value: 8, label: '8 Standard' },
  { value: 12, label: '12 Deep' },
]

const PITCH = 'Synthesize recent arXiv preprints into a cited review with verified references, extraction tables, and Q&A.'

export function HomePage({
  demoTopics,
  onStart,
  busy,
  animate,
  wide,
  theme,
}: {
  demoTopics: string[]
  onStart: (topic: string, deck: number) => void
  busy: boolean
  animate: boolean
  /** Wide screens: Hoot's line floats beside him; phones: under him. */
  wide: boolean
  theme: Theme
}) {
  // Room for the branch at the page edge without crowding the centred prompt
  // (below 1440px the bubble and branch tip run into the headline and card).
  const onBranch = useMediaQuery('(min-width: 1440px)')
  const hoot = useHoot()
  const stage = useRef<HTMLElement>(null)
  useCursorParallax(stage, animate)
  const [topic, setTopic] = useState('')
  const [deck, setDeck] = useState(8)
  const trimmed = topic.trim()
  const canRun = trimmed.length >= 3 && trimmed.length <= 200 && !busy
  const tooLong = trimmed.length > 200

  const submit = () => {
    if (canRun) onStart(trimmed, deck)
  }

  return (
    <div className="relative">
    {onBranch && <HootOnBranch animate={animate} theme={theme} className="top-[6%]" />}
    {/* Centred in the first screen (viewport minus top bar and footer). */}
    <main ref={stage} className="mx-auto flex min-h-[calc(100dvh-7.5rem)] w-full max-w-3xl flex-col justify-center px-5 py-10 text-center">
      {/* Narrower screens: Hoot hosts the page from above the headline */}
      {!onBranch && (
        <div className="mb-2 flex justify-center">
          <HootSpeaker animate={animate} theme={theme} size={wide ? 132 : 108} bubble={wide ? 'right' : 'below'} floor={0.6} />
        </div>
      )}

      <div className="parallax space-y-2" style={depth(6)}>
        <h1 className="text-3xl font-extrabold tracking-tight text-ink md:text-4xl">
          What would you like to explore today?
        </h1>
        <p className="text-sm text-mut">{PITCH}</p>
      </div>

      <div className="parallax mt-8" style={depth(9)}>
      <div className="rounded-xl border border-edge bg-field p-4 text-left shadow-book transition-all focus-within:border-amb-line focus-within:shadow-[var(--focus-ring)]">
        <textarea
          value={topic}
          onChange={(e) => {
            setTopic(e.target.value)
            hoot.react('listening', 'Go on, I am listening.', 1800)
          }}
          onKeyDown={(e) => {
            // Enter runs the review; Shift+Enter adds a new line.
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              submit()
            }
          }}
          aria-label="Research topic"
          rows={3}
          placeholder="e.g. Graph neural networks for molecular property prediction and drug discovery…"
          className="w-full resize-none bg-transparent text-base font-medium text-ink outline-none placeholder:text-faint"
        />
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-edge2 pt-3">
          <div className="inline-flex items-center gap-1 rounded-full border border-edge bg-card p-1 text-xs">
            {DECKS.map((d) => (
              <button
                key={d.value}
                type="button"
                onClick={() => setDeck(d.value)}
                className={`rounded-full px-2.5 py-1 font-semibold transition ${
                  deck === d.value
                    ? 'bg-amb-soft text-amb ring-1 ring-inset ring-amb-line'
                    : 'text-faint hover:text-txt'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>

          <InkButton onClick={submit} disabled={busy}>
            {busy ? <Spinner className="h-4 w-4 border-slate-400 border-t-slate-950" /> : <span>Run Review</span>}
            {!busy && <ArrowRightIcon className="h-4 w-4" />}
          </InkButton>
        </div>
        {tooLong && <p className="mt-2 text-xs text-rose">Topic is too long (max 200 characters).</p>}
      </div>
      </div>

      <div className="parallax mt-6" style={depth(13)}>
        <p className="font-mono text-[11px] font-semibold uppercase tracking-widest text-faint">
          try a demo topic
        </p>
        <div className="mt-3 flex flex-wrap justify-center gap-2">
          {demoTopics.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => {
                setTopic(t)
                hoot.react('surprised', 'Good pick. Press Run Review when you are ready.', 2600)
              }}
              className="inline-flex items-center gap-1.5 rounded-full border border-edge bg-card px-3 py-1.5 text-xs font-medium text-mut transition hover:border-amb-line hover:text-amb"
            >
              <SparkleIcon className="h-3 w-3 text-amb-dot" />
              {t}
            </button>
          ))}
        </div>
      </div>
    </main>
    </div>
  )
}
