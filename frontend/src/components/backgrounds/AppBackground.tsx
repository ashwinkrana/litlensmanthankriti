import { lazy, Suspense } from 'react'
import type { Theme } from '../TopBar'

// Loaded as its own chunk so the WebGL code never delays the first paint.
const Threads = lazy(() => import('./reactbits/Threads'))

// Slate threads with the app's amber as the accent, per theme.
const INK: Record<Theme, { color: string; accent: string; opacity: number }> = {
  light: { color: '#94a3b8', accent: '#ca8a04', opacity: 0.55 },
  dark: { color: '#3b4a63', accent: '#fbbf24', opacity: 0.7 },
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
