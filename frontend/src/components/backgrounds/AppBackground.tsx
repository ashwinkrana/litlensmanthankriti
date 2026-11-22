import { lazy, Suspense } from 'react'
import type { Theme } from '../TopBar'

// Loaded as its own chunk so the WebGL code never delays the first paint.
const Threads = lazy(() => import('./reactbits/Threads'))

// Thread colours from the Proceedings palette (faint over the cover stock).
const INK: Record<Theme, { color: string; accent: string; opacity: number }> = {
  light: { color: '#a3abd0', accent: '#2338c9', opacity: 0.5 },
  dark: { color: '#2b3472', accent: '#7d8bff', opacity: 0.75 },
}

/** Fixed, non-interactive page background: threads of research drifting behind the app. */
export function AppBackground({ theme, animate }: { theme: Theme; animate: boolean }) {
  const ink = INK[theme]
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 bg-app">
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
