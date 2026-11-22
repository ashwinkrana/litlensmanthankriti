import type { ReactNode } from 'react'
import type { Stage, StageEvent } from '../api/types'
import { formatMs, totalTokens } from '../lib/format'
import { BotIcon, CheckIcon, DotsIcon, FlaskIcon, LayersIcon, PenIcon, SearchIcon, ShieldCheckIcon, SparkleIcon, TableIcon, XIcon } from './icons'
import { Chip, ProgressBar, Spinner } from './ui'

type StageMeta = {
  key: Stage
  label: string
  hint: string
  icon: ReactNode
}

const STAGES: StageMeta[] = [
  { key: 'planning', label: 'Plan search', hint: 'Design arXiv queries', icon: <PenIcon className="h-4 w-4" /> },
  { key: 'searching', label: 'Search arXiv', hint: 'Fetch candidate papers', icon: <SearchIcon className="h-4 w-4" /> },
  { key: 'ranking', label: 'Rank papers', hint: 'Semantic relevance', icon: <LayersIcon className="h-4 w-4" /> },
  { key: 'extracting', label: 'Extract facts', hint: 'Structured per-paper facts', icon: <FlaskIcon className="h-4 w-4" /> },
  { key: 'synthesizing', label: 'Synthesize review', hint: 'Write the review', icon: <PenIcon className="h-4 w-4" /> },
  { key: 'verifying', label: 'Verify citations', hint: 'Ground every claim', icon: <ShieldCheckIcon className="h-4 w-4" /> },
  { key: 'indexing', label: 'Index full text', hint: 'Build Q&A corpus', icon: <TableIcon className="h-4 w-4" /> },
]

function lastEvent(events: StageEvent[], stage: Stage): StageEvent | undefined {
  return [...events].reverse().find((e) => e.stage === stage)
}

function stateFor(events: StageEvent[], stage: Stage): 'pending' | 'active' | 'done' | 'error' {
  const last = lastEvent(events, stage)
  if (!last) return 'pending'
  if (last.status === 'completed') return 'done'
  if (last.status === 'failed' || last.status === 'skipped') return 'error'
  return 'active'
}

function durationFor(events: StageEvent[], stage: Stage): number {
  const mine = events.filter((e) => e.stage === stage)
  if (mine.length === 0) return 0
  const started = mine[0].elapsed_ms
  const ended = mine[mine.length - 1].elapsed_ms
  return ended - started
}

function StatusIcon({ state }: { state: 'pending' | 'active' | 'done' | 'error' }) {
  if (state === 'done') return <CheckIcon className="h-4 w-4 text-mint" />
  if (state === 'error') return <XIcon className="h-4 w-4 text-rose" />
  if (state === 'active') return <Spinner className="h-4 w-4" />
  return <DotsIcon className="h-4 w-4 text-faint" />
}

export function AgentTimeline({ events }: { events: StageEvent[] }) {
  const finished = stateFor(events, 'done') === 'done'
  const failed = stateFor(events, 'error') === 'error'

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="inline-flex items-center gap-2 text-sm font-bold text-ink">
          <BotIcon className="h-4 w-4 text-amb-dot" /> Agent pipeline
        </h2>
        <Chip tone={failed ? 'coral' : finished ? 'mint' : 'sky'} dot>
          {failed ? 'Run failed' : finished ? 'Pipeline complete' : 'In progress'}
        </Chip>
      </div>

      <ol className="mt-4 space-y-2">
        {STAGES.map((stage, i) => {
          const state = stateFor(events, stage.key)
          const last = lastEvent(events, stage.key)
          const duration = durationFor(events, stage.key)
          const provider = last?.provider
          const tokens = last ? totalTokens(last.tokens) : 0
          return (
            <li key={stage.key} className="flex items-start gap-3">
              <div className="flex flex-col items-center">
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${
                    state === 'done'
                      ? 'border-mint-line bg-mint-soft text-mint'
                      : state === 'error'
                        ? 'border-rose-line bg-rose-soft text-rose'
                        : state === 'active'
                          ? 'border-amb-line bg-amb-soft text-amb glow-amber'
                          : 'border-edge bg-card text-faint'
                  }`}
                >
                  {stage.icon}
                </span>
                {i < STAGES.length - 1 && <span className="my-1 w-px flex-1 bg-edge" />}
              </div>

              <div className={`flex-1 rounded-xl border p-3 ${state === 'active' ? 'index-card--lift border-amb-line' : 'border-edge bg-card'}`}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-ink">{stage.label}</span>
                    <StatusIcon state={state} />
                  </div>
                  <div className="flex items-center gap-3 font-mono text-[11px] text-mut">
                    {last?.message && <span className="text-mut">{last.message}</span>}
                    {duration > 0 && <span>{formatMs(duration)}</span>}
                    {provider && <Chip tone="sky">{provider}</Chip>}
                    {tokens > 0 && <span>{tokens.toLocaleString()} tok</span>}
                  </div>
                </div>
                {last?.progress && <ProgressBar current={last.progress.current} total={last.progress.total} />}
                <p className="mt-1 text-xs text-faint">{stage.hint}</p>
              </div>
            </li>
          )
        })}
        <li className="flex items-start gap-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-amb-line bg-amb-soft text-amb">
            <SparkleIcon className="h-4 w-4" />
          </span>
          <div className="flex-1 rounded-xl border border-edge bg-card p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-ink">Review ready</span>
              {!finished && <Spinner className="h-3.5 w-3.5" />}
            </div>
            <p className="mt-1 text-xs text-faint">Markdown + verified citations + Q&A corpus</p>
          </div>
        </li>
      </ol>
    </div>
  )
}
