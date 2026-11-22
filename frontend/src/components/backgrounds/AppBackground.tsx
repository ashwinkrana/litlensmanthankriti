import { lazy, Suspense } from 'react'
import type { HomeVariant } from '../../lib/homeVariant'
import type { Theme } from '../TopBar'

// Loaded as its own chunk so the WebGL code never delays the first paint.
const Threads = lazy(() => import('./reactbits/Threads'))

type ThreadInk = { color: string; accent: string; opacity: number }

// Thread colours per variant and theme, taken from each variant's palette.
const INK: Record<HomeVariant, Record<Theme, ThreadInk>> = {
  threads: {
    light: { color: '#94a3b8', accent: '#ca8a04', opacity: 0.55 },
    dark: { color: '#3b4a63', accent: '#fbbf24', opacity: 0.7 },
  },
  proceedings: {
    light: { color: '#a3abd0', accent: '#2338c9', opacity: 0.5 },
    dark: { color: '#2b3472', accent: '#7d8bff', opacity: 0.75 },
  },
  preprint: {
    light: { color: '#b9bab4', accent: '#138a36', opacity: 0.45 },
    dark: { color: '#3a3c40', accent: '#4cc46d', opacity: 0.65 },
  },
  cards: {
    light: { color: '#a9ada3', accent: '#1d5fd1', opacity: 0.5 },
    dark: { color: '#3a3d44', accent: '#5b95ff', opacity: 0.7 },
  },
}

/** Fixed, non-interactive page background: threads of research drifting behind the app. */
export function AppBackground({ variant, theme, animate }: { variant: HomeVariant; theme: Theme; animate: boolean }) {
  const ink = INK[variant][theme]
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 bg-app">
      <Suspense fallback={null}>
        {/* key: remount on variant/theme so each scene starts clean with its colours */}
        <Threads
          key={`${variant}-${theme}`}
          color={ink.color}
          accentColor={ink.accent}
          lineCount={70}
          amplitude={1.3}
          speed={0.35}
          enableMouseInteraction
          opacity={ink.opacity}
          paused={!animate}
        />
      </Suspense>
    </div>
  )
}
