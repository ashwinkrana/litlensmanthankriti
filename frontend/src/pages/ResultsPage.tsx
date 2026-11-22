import { useState } from 'react'
import type { ReviewResult } from '../api/types'
import { StatsBar } from '../components/StatsBar'
import { AskPanel } from '../components/panels/AskPanel'
import { ComparisonPanel } from '../components/panels/ComparisonPanel'
import { ExportPanel } from '../components/panels/ExportPanel'
import { PapersPanel } from '../components/panels/PapersPanel'
import { ReviewPanel } from '../components/panels/ReviewPanel'
import { ChatIcon, DownloadIcon, PenIcon, TableIcon, TargetIcon } from '../components/icons'
import { HootNote, HootSpeaker } from '../components/hoot/HootPerch'
import { useHootScene, type HootLine } from '../lib/hootContext'
import { percent01 } from '../lib/format'
import type { Theme } from '../components/TopBar'

type TabKey = 'review' | 'comparison' | 'papers' | 'ask' | 'export'

const TABS: { key: TabKey; label: string; icon: typeof PenIcon }[] = [
  { key: 'review', label: 'Review', icon: PenIcon },
  { key: 'comparison', label: 'Comparison', icon: TableIcon },
  { key: 'papers', label: 'Papers', icon: TargetIcon },
  { key: 'ask', label: 'Ask', icon: ChatIcon },
  { key: 'export', label: 'Export', icon: DownloadIcon },
]

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`

/** What Hoot says about each tab, built only from this review's real data. */
function tabLine(tab: TabKey, review: ReviewResult): HootLine {
  const n = review.papers.length
  const v = review.verification
  switch (tab) {
    case 'review': {
      if (!v) return { mood: 'speaking', caption: `Here is the review I wrote from ${plural(n, 'paper')}.` }
      const weak = v.weak_claims.length
      return {
        mood: 'speaking',
        caption:
          `I wrote this from ${plural(n, 'paper')}. ${percent01(v.citation_validity)} of my citations matched a selected paper.` +
          (weak ? ` I flagged ${plural(weak, 'weakly supported claim')} at the end.` : ''),
      }
    }
    case 'comparison':
      return { mood: 'thinking', caption: 'Each paper side by side: problem, method, data, results and limits.' }
    case 'papers':
      return { mood: 'idle', caption: `These are the ${plural(n, 'paper')} I picked, most relevant first.` }
    case 'ask':
      return review.qa_ready
        ? { mood: 'listening', caption: 'Ask me anything. I answer from the full PDFs and cite the pages.' }
        : { mood: 'working', caption: 'I am still reading the full PDFs. Questions open when I finish.' }
    case 'export':
      return { mood: 'speaking', caption: 'Take it with you: Markdown for your notes, BibTeX for your reference manager.' }
  }
}

export function ResultsPage({
  review,
  animate,
  wide,
  theme,
}: {
  review: ReviewResult
  animate: boolean
  wide: boolean
  theme: Theme
}) {
  const [tab, setTab] = useState<TabKey>('review')
  const line = tabLine(tab, review)
  useHootScene(line.mood, line.caption)

  return (
    <main className="mx-auto w-full max-w-7xl px-5 py-6 md:px-8">
      <div className="mb-5 grid grid-cols-1 items-end gap-4 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="font-mono text-[11px] font-semibold uppercase tracking-widest text-faint">review</p>
              <h1 className="mt-1 text-xl font-bold tracking-tight text-ink md:text-2xl">{review.topic}</h1>
            </div>
            {!wide && <HootSpeaker animate={animate} theme={theme} size={84} bubble="none" floor={0.5} />}
          </div>
          {!wide && <HootNote className="mt-3" />}
          <div className="mt-4">
            <StatsBar review={review} />
          </div>
        </div>
        {wide && (
          <div className="flex justify-end lg:col-span-4">
            <HootSpeaker animate={animate} theme={theme} size={128} bubble="left" floor={0.6} />
          </div>
        )}
      </div>

      <div className="mb-5 flex flex-wrap gap-1.5">
        {TABS.map((t) => {
          const Icon = t.icon
          const active = tab === t.key
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              aria-pressed={active}
              className={`inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-sm font-semibold transition ${
                active
                  ? 'border-amb-line bg-amb-soft text-amb glow-amber'
                  : 'border-edge bg-card text-mut hover:border-amb-line hover:text-amb'
              }`}
            >
              <Icon className="h-4 w-4" />
              {t.label}
            </button>
          )
        })}
      </div>

      {tab === 'review' && <ReviewPanel review={review} />}
      {tab === 'comparison' && <ComparisonPanel review={review} />}
      {tab === 'papers' && <PapersPanel review={review} />}
      {tab === 'ask' && <AskPanel review={review} />}
      {tab === 'export' && <ExportPanel review={review} />}
    </main>
  )
}
