import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { askQuestion } from '../../api/client'
import type { QASource, ReviewResult } from '../../api/types'
import { BotIcon, ChatIcon, LinkIcon } from '../icons'
import { IndexCard, SectionLabel, Spinner } from '../ui'
import { useHoot } from '../../lib/hootContext'
import { HootAvatar } from '../hoot/HootAvatar'

type Message = {
  id: number
  role: 'user' | 'assistant' | 'error'
  content: string
  sources?: QASource[]
}

let nextId = 0

const NOT_REPORTED = /^not reported$/i

function shorten(text: string, max = 60): string {
  return text.length <= max ? text : `${text.slice(0, max).replace(/\s+\S*$/, '')}…`
}

/**
 * Up to four starter questions built from this review's own data, so they
 * are specific to the topic and likely answerable from the papers.
 */
function suggestQuestions(review: ReviewResult): string[] {
  const out: string[] = []
  const top = [...review.papers].sort((a, b) => b.relevance - a.relevance)[0]
  if (top) out.push(`How does the method in “${shorten(top.title)}” work?`)

  const counts = new Map<string, number>()
  for (const e of review.extractions)
    for (const m of e.metrics) {
      const name = m.name.trim()
      if (name && !NOT_REPORTED.test(name)) counts.set(name, (counts.get(name) ?? 0) + 1)
    }
  const metric = [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0]
  if (metric) out.push(`Which paper reports the best ${metric}, and in what setup?`)

  const hasDatasets = review.extractions.some((e) => e.datasets.some((d) => !NOT_REPORTED.test(d.trim())))
  out.push(
    hasDatasets
      ? 'Which datasets are used for evaluation, and how big are they?'
      : 'How do these papers evaluate their approaches?',
  )
  out.push('What limitations or open problems do the authors mention?')
  return out.slice(0, 4)
}

function SourceRow({ source }: { source: QASource }) {
  return (
    <li className="rounded-xl border border-edge bg-card2 p-3 transition hover:border-amb-line">
      <div className="flex items-center justify-between">
        <span className="font-mono text-xs font-bold text-amb">[ref {source.ref}]</span>
        <span className="rounded-full border border-mint-line bg-mint-soft px-2 py-0.5 font-mono text-[10px] font-semibold text-mint">
          {(source.score * 100).toFixed(0)}%
        </span>
      </div>
      <p className="mt-1.5 text-xs leading-relaxed text-txt">{source.snippet}</p>
      <a href={`https://arxiv.org/abs/${source.arxiv_id}`} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1.5 font-mono text-[11px] font-medium text-faint hover:text-amb">
        <LinkIcon className="h-3 w-3" /> arXiv:{source.arxiv_id} · p.{source.page}
      </a>
    </li>
  )
}

export function AskPanel({ review }: { review: ReviewResult }) {
  const [question, setQuestion] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const hoot = useHoot()

  if (!review.qa_ready) {
    return (
      <IndexCard className="p-6 text-center">
        <Spinner className="mx-auto h-6 w-6" />
        <p className="mt-3 text-sm font-semibold text-txt">Indexing full text…</p>
        <p className="mt-1 text-xs text-faint">Q&A becomes available once paper full text is indexed.</p>
      </IndexCard>
    )
  }

  const asked = new Set(messages.filter((m) => m.role === 'user').map((m) => m.content))
  const suggestions = suggestQuestions(review).filter((s) => !asked.has(s))

  const submit = async (text?: string) => {
    const q = (text ?? question).trim()
    if (!q || loading) return
    const userMsg: Message = { id: nextId++, role: 'user', content: q }
    setMessages((m) => [...m, userMsg])
    setQuestion('')
    setLoading(true)
    hoot.react('thinking', "Searching the papers' full text…", 60_000)
    try {
      const res = await askQuestion(review.job_id, { question: q })
      setMessages((m) => [
        ...m,
        { id: nextId++, role: 'assistant', content: res.answer_md, sources: res.sources },
      ])
      hoot.react('speaking', 'Here is what the papers say, with the pages I used.', 4000)
    } catch (e) {
      setMessages((m) => [
        ...m,
        { id: nextId++, role: 'error', content: e instanceof Error ? e.message : 'Ask failed. Try again.' },
      ])
      hoot.react('sad', 'I could not answer that one. Try rephrasing it?', 5000)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <SectionLabel className="inline-flex items-center gap-2">
          <ChatIcon className="h-3.5 w-3.5 text-amb-dot" /> Ask the corpus
        </SectionLabel>
        <span className="font-mono text-[11px] text-faint">full-text RAG over {review.papers.length} papers</span>
      </div>

      <IndexCard className="flex flex-col gap-3 p-4">
        <div className="flex items-center gap-3 rounded-xl border border-edge bg-field p-3 transition-all focus-within:border-amb-line focus-within:shadow-[var(--focus-ring)]">
          <BotIcon className="h-5 w-5 text-faint" />
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
            placeholder="Ask about the papers… e.g. which studies used real wet-lab data?"
            className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-faint"
          />
          <button
            type="button"
            onClick={() => submit()}
            disabled={loading || !question.trim()}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-cta text-cta-ink shadow-book transition enabled:hover:scale-105 enabled:active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Ask"
          >
            {loading ? <Spinner className="h-4 w-4 border-cta-ink/40 border-t-cta-ink" /> : <ChatIcon className="h-4 w-4" />}
          </button>
        </div>

        {suggestions.length > 0 && (
          <div>
            <p className="mb-2 text-xs text-faint">
              {messages.length === 0 ? 'Try one of these. Answers cite the PDF page they came from.' : 'More to ask'}
            </p>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => submit(s)}
                  disabled={loading}
                  className="inline-flex items-center gap-1.5 rounded-full border border-edge bg-card2 px-3 py-1.5 text-left text-xs font-medium text-txt transition hover:border-amb-line hover:text-amb disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <ChatIcon className="h-3 w-3 shrink-0 text-amb-dot" />
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-4">
          {messages.map((m) => (
            <div key={m.id} className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                {m.role === 'user' ? (
                  <span className="rounded-full bg-card2 px-2 py-0.5 text-xs font-semibold text-txt">You</span>
                ) : (
                  <>
                    {/* answers come from Hoot: a still of him speaking, or sad on an error */}
                    <HootAvatar mood={m.role === 'error' ? 'sad' : 'speaking'} size={30} />
                    <span className={`text-xs font-semibold ${m.role === 'error' ? 'text-rose' : 'text-ink'}`}>Hoot</span>
                  </>
                )}
              </div>
              {m.role !== 'error' && (
                <div className="rounded-xl border border-edge bg-card2 p-3 text-sm leading-relaxed text-txt">
                  {m.role === 'user' ? (
                    <p className="text-ink">{m.content}</p>
                  ) : (
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
                  )}
                </div>
              )}
              {m.role === 'error' && <p className="rounded-xl bg-rose-soft p-3 text-sm text-rose">{m.content}</p>}
              {m.sources && m.sources.length > 0 && (
                <ul className="space-y-2 pl-2">
                  {m.sources.map((s, i) => (
                    <SourceRow key={i} source={s} />
                  ))}
                </ul>
              )}
            </div>
          ))}
          {loading && (
            <p className="flex items-center gap-2 text-xs text-mut" role="status">
              <Spinner className="h-3.5 w-3.5" /> Searching the papers’ full text…
            </p>
          )}
        </div>
      </IndexCard>
    </div>
  )
}
