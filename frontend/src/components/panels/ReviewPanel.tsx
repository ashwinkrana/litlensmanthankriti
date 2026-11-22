import { useState, type ReactNode } from 'react'
import type { ReviewResult, Paper } from '../../api/types'
import { leadFinding, percent01, shortAuthors } from '../../lib/format'
import { MarkdownReview } from '../MarkdownReview'
import { AlertIcon, LayersIcon, LinkIcon, PenIcon, SparkleIcon } from '../icons'
import { Chip, Badge, IndexCard, SectionLabel } from '../ui'

type ViewMode = 'minimalist' | 'detailed'

const MODES: { key: ViewMode; label: string; icon: ReactNode }[] = [
  { key: 'minimalist', label: 'Minimalist', icon: <PenIcon className="h-3.5 w-3.5" /> },
  { key: 'detailed', label: 'Detailed Lab', icon: <LayersIcon className="h-3.5 w-3.5" /> },
]

function ModeToggle({ mode, onChange }: { mode: ViewMode; onChange: (m: ViewMode) => void }) {
  return (
    <div className="inline-flex items-center gap-1 rounded-full border border-edge bg-card p-1">
      {MODES.map((m) => {
        const active = mode === m.key
        return (
          <button
            key={m.key}
            type="button"
            onClick={() => onChange(m.key)}
            aria-pressed={active}
            className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 font-mono text-[11px] font-semibold transition ${
              active ? 'bg-amb-soft text-amb shadow-sm ring-1 ring-inset ring-amb-line' : 'text-faint hover:text-txt'
            }`}
          >
            {m.icon}
            {m.label}
          </button>
        )
      })}
    </div>
  )
}

function KeyFinding({ review }: { review: ReviewResult }) {
  return (
    <div className="rounded-xl border border-amb-line bg-amb-soft p-4">
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amb">
        <SparkleIcon className="h-4 w-4" />
        Key synthesis finding
      </div>
      <p className="mt-2 text-sm leading-relaxed text-txt">{leadFinding(review.review_md)}</p>
    </div>
  )
}

function WeakClaims({ review }: { review: ReviewResult }) {
  const claims = review.verification?.weak_claims ?? []
  if (claims.length === 0) return null
  return (
    <div className="rounded-xl border border-rose-line bg-rose-soft p-4">
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-rose">
        <AlertIcon className="h-4 w-4" /> Weakly supported claims
      </div>
      <ul className="mt-2 space-y-2">
        {claims.map((c, i) => (
          <li key={i} className="text-sm text-txt">
            <span className="mr-1 font-mono text-xs font-bold text-rose">[{c.ref}]</span>
            {c.sentence}
            <span className="ml-2 font-mono text-[11px] text-faint">support {percent01(c.score)}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function GroundingTable({ review }: { review: ReviewResult }) {
  const byRef = new Map(review.papers.map((p) => [p.ref, p]))
  const rows = review.extractions.map((e) => ({ e, paper: byRef.get(e.ref) }))
  return (
    <IndexCard className="overflow-hidden">
      <div className="flex items-center justify-between border-b border-edge2 bg-field px-4 py-3">
        <span className="font-mono text-xs font-semibold text-txt">Grounding verification summary</span>
        <span className="font-mono text-[11px] text-faint">{rows.length} studies</span>
      </div>
      <div className="divide-y divide-edge2 text-sm">
        {rows.map(({ e, paper }) => (
          <div key={e.ref} className="flex flex-wrap items-center justify-between gap-2 p-3">
            <div>
              <span className="font-bold text-ink">[{e.ref}] {paper?.title ?? 'Paper'}</span>
              <p className="mt-0.5 text-xs text-faint">
                {paper ? `${shortAuthors(paper.authors)} (${paper.year})` : ''} · {e.method}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Chip tone="mint" dot>extracted</Chip>
              <span className="font-mono text-xs text-mut">{e.key_result}</span>
            </div>
          </div>
        ))}
        {rows.length === 0 && <p className="p-4 text-sm text-faint">No extraction data yet.</p>}
      </div>
    </IndexCard>
  )
}

function RunParams({ review }: { review: ReviewResult }) {
  const s = review.stats
  const indexed = review.papers.filter((p) => p.fulltext_status === 'indexed').length
  return (
    <IndexCard className="p-4">
      <div className="flex items-center justify-between border-b border-edge2 pb-2">
        <span className="font-mono text-xs font-semibold text-faint">Run ID: {review.job_id.slice(0, 12)}</span>
        <span className="rounded-full border border-mint-line bg-mint-soft px-2 py-0.5 font-mono text-xs font-bold text-mint">
          {percent01(review.verification?.citation_validity ?? 0)} corroborated
        </span>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
        <div>
          <div className="text-faint">Selected</div>
          <div className="font-semibold text-txt">{s.papers_selected} of {s.papers_considered}</div>
        </div>
        <div>
          <div className="text-faint">Full text</div>
          <div className="font-semibold text-txt">{indexed} indexed</div>
        </div>
        <div>
          <div className="text-faint">Providers</div>
          <div className="font-semibold text-txt">{(s.providers_used ?? ['—']).join(' · ')}</div>
        </div>
        <div>
          <div className="text-faint">Time</div>
          <div className="font-semibold text-txt">{Math.round(s.total_ms / 1000)}s</div>
        </div>
      </div>
    </IndexCard>
  )
}

function BenchmarkMatrix({ review }: { review: ReviewResult }) {
  const byRef = new Map(review.papers.map((p) => [p.ref, p]))
  return (
    <IndexCard className="overflow-hidden">
      <div className="flex items-center justify-between border-b border-edge2 bg-field px-4 py-3">
        <span className="font-mono text-xs font-semibold text-txt">Empirical benchmark matrix</span>
        <span className="font-mono text-[11px] text-faint">extracted metrics</span>
      </div>
      <table className="w-full text-left text-xs">
        <thead className="border-b border-edge2 bg-field/60 text-faint">
          <tr>
            <th className="p-3 font-mono font-semibold">Paper</th>
            <th className="p-3 font-mono font-semibold">Method</th>
            <th className="p-3 font-mono font-semibold">Reported</th>
            <th className="p-3 font-mono font-semibold">Rel.</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-edge2">
          {review.extractions.map((e) => {
            const p = byRef.get(e.ref)
            const metric = e.metrics[0]
            return (
              <tr key={e.ref}>
                <td className="p-3 font-semibold text-ink">
                  [{e.ref}] {shortAuthors(p?.authors ?? [])}
                </td>
                <td className="p-3 text-mut">{e.method}</td>
                <td className="p-3 font-mono text-mint">
                  {metric ? `${metric.name}: ${metric.value}` : e.key_result}
                </td>
                <td className="p-3 font-semibold text-mint">{percent01(p?.relevance ?? 0)}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </IndexCard>
  )
}

function ChunkInspector({ papers }: { papers: Paper[] }) {
  const top = [...papers].sort((a, b) => b.relevance - a.relevance).slice(0, 4)
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <SectionLabel>Most relevant sources</SectionLabel>
        <Badge>top {top.length} · abstracts</Badge>
      </div>
      {top.map((p) => (
        <IndexCard key={p.ref} className="p-4">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold text-ink">[{p.ref}] {shortAuthors(p.authors)}</span>
            <span className="rounded-full border border-mint-line bg-mint-soft px-2 py-0.5 font-mono text-[10px] font-semibold text-mint">
              {(p.relevance * 100).toFixed(0)}% relevance
            </span>
          </div>
          <p className="mt-1 font-mono text-[10px] text-faint">arXiv:{p.arxiv_id} · {p.primary_category}</p>
          <p className="mt-2 rounded-lg border border-amb-line bg-amb-soft/40 p-3 text-xs leading-relaxed text-mut">
            {p.abstract}
          </p>
          <a href={p.url_abs} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-amb hover:text-ink">
            <LinkIcon className="h-3.5 w-3.5" /> Open arXiv
          </a>
        </IndexCard>
      ))}
    </div>
  )
}

export function ReviewPanel({ review }: { review: ReviewResult }) {
  const [mode, setMode] = useState<ViewMode>('minimalist')

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SectionLabel>Review display</SectionLabel>
        <ModeToggle mode={mode} onChange={setMode} />
      </div>

      {mode === 'detailed' ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <section className="space-y-6 lg:col-span-7">
            <RunParams review={review} />
            <BenchmarkMatrix review={review} />
            <div className="rounded-xl border border-edge bg-card p-4">
              <SectionLabel className="mb-3 block">Synthesized monograph</SectionLabel>
              <MarkdownReview markdown={review.review_md} papers={review.papers} />
              <WeakClaims review={review} />
            </div>
          </section>
          <aside className="lg:col-span-5">
            <ChunkInspector papers={review.papers} />
          </aside>
        </div>
      ) : (
        <>
          <KeyFinding review={review} />
          <IndexCard className="p-5">
            <MarkdownReview markdown={review.review_md} papers={review.papers} />
          </IndexCard>
          <WeakClaims review={review} />
          <GroundingTable review={review} />
        </>
      )}
    </div>
  )
}
