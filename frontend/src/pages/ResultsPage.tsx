import { useState } from 'react'
import type { ReviewResult } from '../api/types'
import { StatsBar } from '../components/StatsBar'
import { AskPanel } from '../components/panels/AskPanel'
import { ComparisonPanel } from '../components/panels/ComparisonPanel'
import { ExportPanel } from '../components/panels/ExportPanel'
import { PapersPanel } from '../components/panels/PapersPanel'
import { ReviewPanel } from '../components/panels/ReviewPanel'
import { ChatIcon, DownloadIcon, PenIcon, TableIcon, TargetIcon } from '../components/icons'

type TabKey = 'review' | 'comparison' | 'papers' | 'ask' | 'export'

const TABS: { key: TabKey; label: string; icon: typeof PenIcon }[] = [
  { key: 'review', label: 'Review', icon: PenIcon },
  { key: 'comparison', label: 'Comparison', icon: TableIcon },
  { key: 'papers', label: 'Papers', icon: TargetIcon },
  { key: 'ask', label: 'Ask', icon: ChatIcon },
  { key: 'export', label: 'Export', icon: DownloadIcon },
]

export function ResultsPage({ review }: { review: ReviewResult }) {
  const [tab, setTab] = useState<TabKey>('review')

  return (
    <main className="mx-auto w-full max-w-7xl px-5 py-6 md:px-8">
      <div className="mb-4">
        <p className="font-mono text-[11px] font-semibold uppercase tracking-widest text-faint">review</p>
        <h1 className="mt-1 text-xl font-bold tracking-tight text-ink md:text-2xl">{review.topic}</h1>
      </div>

      <div className="mb-5">
        <StatsBar review={review} />
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
