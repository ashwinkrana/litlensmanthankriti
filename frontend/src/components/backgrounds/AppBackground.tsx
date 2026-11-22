import { lazy, Suspense } from 'react'
import type { Theme } from '../TopBar'

// Loaded as its own chunk so the WebGL code never delays the first paint.
const Threads = lazy(() => import('./reactbits/Threads'))

// Slate threads with the app's amber as the accent, per theme. In dark mode
// the threads are lifted so they read as light catching on them.
const INK: Record<Theme, { color: string; accent: string; opacity: number }> = {
  light: { color: '#94a3b8', accent: '#ca8a04', opacity: 0.55 },
  dark: { color: '#5b6b86', accent: '#fbbf24', opacity: 0.85 },
}

/*
 * Dark mode only: light in the room. A warm "desk lamp" pool of amber over
 * the hero, a faint cool light top-right and a faint warm one bottom-left, so
 * the page has depth instead of one flat near-black. Static (no animation),
 * drawn under the threads.
 */
const DARK_LIGHT = [
  'radial-gradient(62% 52% at 50% 22%, rgba(251, 191, 36, 0.16), transparent 70%)',
  'radial-gradient(38% 34% at 88% 14%, rgba(125, 211, 252, 0.08), transparent 70%)',
  'radial-gradient(45% 40% at 10% 92%, rgba(251, 146, 60, 0.08), transparent 70%)',
].join(', ')

/** Fixed, non-interactive page background: threads of research drifting behind the app. */
export function AppBackground({ theme, animate }: { theme: Theme; animate: boolean }) {
  const ink = INK[theme]
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 bg-app">
      {theme === 'dark' && <div className="absolute inset-0" style={{ background: DARK_LIGHT }} />}
      <Suspense fallback={null}>
        {/* key: remount on theme change so the scene picks up its new colours */}
        <Threads
          key={theme}
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
