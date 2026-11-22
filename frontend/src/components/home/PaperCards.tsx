import { useState } from 'react'
import { motion } from 'motion/react'
import type { Extraction, Paper } from '../../api/types'
import reviewMock from '../../mocks/review.json'
import { shortAuthors } from '../../lib/format'

type Pair = { paper: Paper; extraction?: Extraction }

const REVIEW = reviewMock as unknown as { papers: Paper[]; extractions: Extraction[] }
const DECK: Pair[] = [...REVIEW.papers]
  .sort((a, b) => b.relevance - a.relevance)
  .map((paper) => ({ paper, extraction: REVIEW.extractions.find((e) => e.ref === paper.ref) }))
// The "rookie": the newest paper in the set (highest arXiv id).
const NEWEST = [...REVIEW.papers].sort((a, b) => b.arxiv_id.localeCompare(a.arxiv_id))[0]?.ref

// "Team colours": one border colour per arXiv category.
const TEAM: Record<string, string> = {
  'cs.CV': '#c8102e',
  'cs.CL': '#1e63d6',
  'cs.LG': '#1d7a46',
  'cs.IR': '#c2541a',
  'eess.IV': '#0f7c86',
}
const teamColor = (cat: string) => TEAM[cat] ?? '#3d4a5c'

const clean = (title: string) => title.replace(/^\[MOCK\]\s*/, '')
const surname = (authors: string[]) => {
  const first = authors[0]?.split(' ').pop() ?? 'Unknown'
  return authors.length > 1 ? `${first} et al.` : first
}

function Front({ paper }: { paper: Paper }) {
  const color = teamColor(paper.primary_category)
  return (
    <div
      className="card-flip__face absolute inset-0 flex flex-col overflow-hidden rounded-2xl bg-card shadow-book-lift"
      style={{ border: `10px solid ${color}` }}
    >
      {paper.ref === NEWEST && (
        <span
          className="absolute right-0 top-0 rounded-bl-xl px-3 py-1 font-mono text-[11px] font-bold text-[#1c1405]"
          style={{ background: '#d4a017' }}
        >
          Newest
        </span>
      )}
      <div className="flex items-center gap-2 px-4 pt-4">
        <span
          className="flex h-9 w-9 items-center justify-center rounded-full font-mono text-[11px] font-bold text-white"
          style={{ background: color }}
        >
          {paper.ref}
        </span>
        <span className="font-mono text-[11px] text-mut">
          {paper.primary_category} {paper.year}
        </span>
      </div>
      <p className="mt-4 line-clamp-5 px-4 font-display text-xl font-bold leading-snug text-ink">{clean(paper.title)}</p>
      <p className="mt-2 px-4 text-xs text-mut">{shortAuthors(paper.authors)}</p>
      <p className="mt-3 line-clamp-4 px-4 text-xs leading-relaxed text-txt">{paper.abstract}</p>
      <div className="mt-auto px-4 py-2.5 font-display text-sm font-bold uppercase tracking-wide text-white" style={{ background: color }}>
        {surname(paper.authors)}
      </div>
    </div>
  )
}

function Back({ paper, extraction }: Pair) {
  const rows: [string, string][] = [
    ['Method', extraction?.method ?? 'Not reported'],
    ['Data', extraction?.datasets.length ? extraction.datasets.join(', ') : 'Not reported'],
    ...((extraction?.metrics ?? []).slice(0, 2).map((m) => [m.name, m.value]) as [string, string][]),
    ['Relevance', `${Math.round(paper.relevance * 100)}%`],
  ]
  return (
    <div className="card-flip__face card-flip__back absolute inset-0 flex flex-col overflow-hidden rounded-2xl border border-edge bg-card2 p-4 shadow-book-lift">
      <p className="font-display text-sm font-bold uppercase tracking-wide text-ink">{surname(paper.authors)}</p>
      <p className="font-mono text-[11px] text-mut">arXiv:{paper.arxiv_id}</p>
      <dl className="mt-3 divide-y divide-edge font-mono text-[11.5px]">
        {rows.map(([k, v]) => (
          <div key={k} className="grid grid-cols-[5.5rem_1fr] gap-2 py-1.5">
            <dt className="text-mut">{k}</dt>
            <dd className="text-ink">{v}</dd>
          </div>
        ))}
      </dl>
      {extraction?.key_result && <p className="mt-auto text-xs leading-snug text-txt">{extraction.key_result}</p>}
    </div>
  )
}

// Fanned positions for the top three cards; the rest wait behind.
const FAN = [
  { x: 0, y: 0, rotate: -3, scale: 1 },
  { x: 26, y: 10, rotate: 4, scale: 0.97 },
  { x: 50, y: 22, rotate: 10, scale: 0.94 },
]

/**
 * A dealt stack of sample papers as trading cards: front is the paper,
 * flip for its extraction stats. Uses the mock review (labelled as such).
 */
export function PaperCards({ animate }: { animate: boolean }) {
  const [order, setOrder] = useState(DECK.map((d) => d.paper.ref))
  const [flipped, setFlipped] = useState(false)
  const top = DECK.find((d) => d.paper.ref === order[0])!

  const deal = () => {
    setFlipped(false)
    setOrder((o) => [...o.slice(1), o[0]])
  }

  return (
    <figure>
      <div className="relative mx-auto h-[380px] w-[280px]">
        {DECK.map((pair) => {
          const i = order.indexOf(pair.paper.ref)
          const pos = FAN[i]
          const isTop = i === 0
          return (
            <motion.div
              key={pair.paper.ref}
              className="card-flip absolute inset-0"
              data-flipped={isTop && flipped ? 'true' : 'false'}
              style={{ zIndex: 10 - i }}
              initial={false}
              animate={pos ? { ...pos, opacity: 1 } : { x: 60, y: 30, rotate: 12, scale: 0.9, opacity: 0 }}
              transition={animate ? { type: 'spring', stiffness: 160, damping: 22 } : { duration: 0 }}
              aria-hidden={!isTop}
            >
              <button
                type="button"
                tabIndex={isTop ? 0 : -1}
                onClick={() => isTop && setFlipped((f) => !f)}
                aria-label={isTop ? `${clean(pair.paper.title)}. ${flipped ? 'Showing stats; flip to front' : 'Flip for stats'}` : undefined}
                className="card-flip__inner relative block h-full w-full cursor-pointer text-left"
              >
                <Front paper={pair.paper} />
                <Back {...pair} />
              </button>
            </motion.div>
          )
        })}
      </div>

      <div className="mt-5 flex items-center justify-center gap-2">
        <button
          type="button"
          onClick={() => setFlipped((f) => !f)}
          className="rounded-xl border border-edge bg-card px-3.5 py-2 text-sm font-semibold text-txt transition hover:border-amb-line hover:text-amb active:scale-[0.98]"
        >
          {flipped ? 'Show paper' : 'Flip for stats'}
        </button>
        <button
          type="button"
          onClick={deal}
          className="rounded-xl border border-edge bg-card px-3.5 py-2 text-sm font-semibold text-txt transition hover:border-amb-line hover:text-amb active:scale-[0.98]"
        >
          Deal next
        </button>
      </div>
      <figcaption className="mt-3 text-center text-xs text-mut">
        Sample cards from mock data. In a real run, each paper LitLens selects gets one. Showing {top.paper.ref} of{' '}
        {DECK.length}.
      </figcaption>
    </figure>
  )
}
