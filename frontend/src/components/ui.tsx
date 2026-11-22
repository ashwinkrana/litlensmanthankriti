import type { ReactNode } from 'react'

/* ---------- Accent chip palette (theme-aware) ---------- */
const HL = {
  yellow: 'bg-amb-soft border-amb-line text-amb',
  mint: 'bg-mint-soft border-mint-line text-mint',
  coral: 'bg-rose-soft border-rose-line text-rose',
  sky: 'bg-sky-soft border-sky-line text-sky',
  lilac: 'bg-purp-soft border-purp-line text-purp',
} as const

const DOT = {
  yellow: 'bg-amb-dot',
  mint: 'bg-mint-dot',
  coral: 'bg-rose-dot',
  sky: 'bg-sky-dot',
  lilac: 'bg-purp-dot',
} as const

export type Tone = keyof typeof HL

export function Chip({
  tone = 'yellow',
  dot = false,
  children,
  className = '',
}: {
  tone?: Tone
  dot?: boolean
  children: ReactNode
  className?: string
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 font-mono text-[11px] font-semibold uppercase tracking-wide ${HL[tone]} ${className}`}
    >
      {dot && (
        <span className="relative flex h-1.5 w-1.5">
          <span className={`absolute inline-flex h-full w-full rounded-full ${DOT[tone]} animate-ping-soft`} />
          <span className={`relative inline-flex h-1.5 w-1.5 rounded-full ${DOT[tone]}`} />
        </span>
      )}
      {children}
    </span>
  )
}

/** Neutral badge. */
export function Badge({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border border-edge bg-card px-2.5 py-0.5 font-mono text-[11px] font-medium text-mut ${className}`}
    >
      {children}
    </span>
  )
}

export function IndexCard({
  children,
  lift = false,
  overlay = false,
  className = '',
}: {
  children: ReactNode
  lift?: boolean
  overlay?: boolean
  className?: string
}) {
  const shadow = overlay ? 'index-card--overlay' : lift ? 'index-card--lift' : ''
  return <div className={`index-card ${shadow} ${className}`}>{children}</div>
}

/** Primary CTA — amber filled (constant across themes). */
export function InkButton({
  children,
  onClick,
  disabled = false,
  type = 'button',
  className = '',
}: {
  children: ReactNode
  onClick?: () => void
  disabled?: boolean
  type?: 'button' | 'submit'
  className?: string
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 rounded-xl bg-amber-400 px-5 py-2 text-sm font-bold text-slate-950 shadow-md shadow-amber-500/20 transition enabled:hover:brightness-110 enabled:active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    >
      {children}
    </button>
  )
}

export function GhostButton({
  children,
  onClick,
  disabled = false,
  className = '',
}: {
  children: ReactNode
  onClick?: () => void
  disabled?: boolean
  className?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center gap-2 rounded-xl border border-edge bg-card px-4 py-2 text-sm font-medium text-mut transition hover:border-amb-line hover:text-amb disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    >
      {children}
    </button>
  )
}

export function Spinner({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <span
      className={`inline-block animate-spin-slow rounded-full border-2 border-faint border-t-amb ${className}`}
      role="status"
      aria-label="working"
    />
  )
}

export function ProgressBar({ current, total }: { current: number; total: number }) {
  const pct = total > 0 ? Math.min(100, Math.round((current / total) * 100)) : 0
  return (
    <span className="inline-flex items-center gap-2 font-mono text-[11px] text-mut">
      <span className="relative h-1.5 w-24 overflow-hidden rounded-full bg-card2">
        <span
          className="absolute inset-y-0 left-0 rounded-full bg-amb-dot"
          style={{ width: `${pct}%` }}
        />
      </span>
      {current}/{total}
    </span>
  )
}

export function SectionLabel({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <span className={`font-mono text-[11px] font-semibold uppercase tracking-widest text-faint ${className}`}>
      {children}
    </span>
  )
}

export function PinnedNotice({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-xl border border-rose-line bg-rose-soft px-4 py-3 text-sm text-txt">
      {children}
    </div>
  )
}
