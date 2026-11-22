import { lazy, Suspense } from 'react'
import type { HomeVariant } from '../../lib/homeVariant'
import type { Theme } from '../TopBar'

// Each background is its own chunk, loaded only for the active variant.
const DotGrid = lazy(() => import('./reactbits/DotGrid'))
const Waves = lazy(() => import('./reactbits/Waves'))
const Threads = lazy(() => import('./reactbits/Threads'))

// Colours mirror the theme tokens in index.css.
const INK = {
  light: { faint: '#cbd5e1', line: '#bfdbfe', thread: '#94a3b8', accent: '#ca8a04' },
  dark: { faint: '#2b3a52', line: '#24344d', thread: '#3b4a63', accent: '#fbbf24' },
} as const

function Scene({ variant, theme, paused }: { variant: HomeVariant; theme: Theme; paused: boolean }) {
  const c = INK[theme]
  switch (variant) {
    case 'desk':
      // The study-desk dot grid, now alive: dots swell amber near the cursor.
      return (
        <DotGrid
          dotSize={2.6}
          gap={18}
          baseColor={c.faint}
          activeColor={c.accent}
          proximity={160}
          swell={1}
          glow={0.45}
          shockStrength={3}
          paused={paused}
        />
      )
    case 'ruled':
      // Ruled notebook paper; the lines bend where the pointer presses.
      return (
        <>
          <Waves
            lineColor={c.line}
            accentColor={c.accent}
            rotation={90}
            spacing={30}
            amplitude={7}
            scale={0.55}
            speed={0.35}
            mouseRadius={150}
            lightMode={theme === 'light'}
            paused={paused}
          />
          {/* the notebook margin rule */}
          <div className="absolute inset-y-0 left-[6vw] w-px bg-rose-line/60" />
        </>
      )
    case 'threads':
      // Threads of research drifting across the page.
      return (
        <Threads
          color={c.thread}
          accentColor={c.accent}
          lineCount={70}
          amplitude={1.3}
          speed={0.35}
          enableMouseInteraction
          opacity={theme === 'light' ? 0.55 : 0.7}
          paused={paused}
        />
      )
  }
}

/** Fixed, non-interactive page background for the active home variant. */
export function AppBackground({ variant, theme, animate }: { variant: HomeVariant; theme: Theme; animate: boolean }) {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 bg-app">
      <Suspense fallback={null}>
        {/* key: remount on variant/theme so each scene starts clean with its colours */}
        <Scene key={`${variant}-${theme}`} variant={variant} theme={theme} paused={!animate} />
      </Suspense>
    </div>
  )
}
