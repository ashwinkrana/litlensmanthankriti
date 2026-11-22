import { useState } from 'react'
import { ArrowRightIcon, SparkleIcon } from '../icons'
import { InkButton, Spinner } from '../ui'

const DECKS = [
  { value: 4, label: '4 Quick' },
  { value: 8, label: '8 Standard' },
  { value: 12, label: '12 Deep' },
]

export type ComposerProps = {
  deck: number
  onDeckChange: (deck: number) => void
  onStart: (topic: string, deck: number) => void
  busy: boolean
  demoTopics: string[]
  /** Where the demo-topic chips sit under the input. */
  align?: 'center' | 'left'
  /** Small heading above the chips; null hides it. */
  chipsLabel?: string | null
}

/**
 * Topic input + paper-count selector + Run button + demo topics.
 * Shared by every home-page variant so behaviour stays identical.
 */
export function TopicComposer({
  deck,
  onDeckChange,
  onStart,
  busy,
  demoTopics,
  align = 'center',
  chipsLabel = 'Try a demo topic',
}: ComposerProps) {
  const [topic, setTopic] = useState('')
  const trimmed = topic.trim()
  const canRun = trimmed.length >= 3 && trimmed.length <= 200 && !busy
  const tooLong = trimmed.length > 200

  const submit = () => {
    if (canRun) onStart(trimmed, deck)
  }

  return (
    <div>
      <div className="rounded-xl border border-edge bg-field p-4 text-left shadow-book transition-all focus-within:border-amb-line focus-within:shadow-[var(--focus-ring)]">
        <label htmlFor="topic" className="sr-only">
          Research topic
        </label>
        <textarea
          id="topic"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          onKeyDown={(e) => {
            // Enter runs, Shift+Enter adds a new line.
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              submit()
            }
          }}
          rows={3}
          placeholder="e.g. Graph neural networks for molecular property prediction and drug discovery…"
          className="w-full resize-none bg-transparent text-base font-medium text-ink outline-none placeholder:text-faint"
        />
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-edge2 pt-3">
          <div
            role="radiogroup"
            aria-label="Number of papers"
            className="inline-flex items-center gap-1 rounded-full border border-edge bg-card p-1 text-xs"
          >
            {DECKS.map((d) => (
              <button
                key={d.value}
                type="button"
                role="radio"
                aria-checked={deck === d.value}
                onClick={() => onDeckChange(d.value)}
                className={`rounded-full px-2.5 py-1 font-semibold transition ${
                  deck === d.value ? 'bg-amb-soft text-amb ring-1 ring-inset ring-amb-line' : 'text-faint hover:text-txt'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>

          <InkButton onClick={submit} disabled={!canRun}>
            {busy ? <Spinner className="h-4 w-4 border-slate-400 border-t-slate-950" /> : <span>Run review</span>}
            {!busy && <ArrowRightIcon className="h-4 w-4" />}
          </InkButton>
        </div>
        {tooLong && <p className="mt-2 text-xs text-rose">Topic is too long (max 200 characters).</p>}
      </div>

      {demoTopics.length > 0 && (
        <div className={`mt-5 ${align === 'center' ? 'text-center' : 'text-left'}`}>
          {chipsLabel && <p className="text-xs font-semibold text-mut">{chipsLabel}</p>}
          <div className={`mt-2.5 flex flex-wrap gap-2 ${align === 'center' ? 'justify-center' : ''}`}>
            {demoTopics.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTopic(t)}
                className="inline-flex items-center gap-1.5 rounded-full border border-edge bg-card px-3 py-1.5 text-xs font-medium text-mut transition hover:border-amb-line hover:text-amb active:scale-[0.98]"
              >
                <SparkleIcon className="h-3 w-3 text-amb-dot" />
                {t}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
