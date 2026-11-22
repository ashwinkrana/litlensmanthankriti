import { useMemo } from 'react'
import { Particles, ParticlesProvider } from '@tsparticles/react'
import { loadSlim } from '@tsparticles/slim'
import type { Engine, ISourceOptions } from '@tsparticles/engine'
import type { Theme } from './TopBar'

// Colours mirror the theme tokens in index.css (faint ink + amber dot).
const COLORS: Record<Theme, { node: string; accent: string; link: string; linkOpacity: number }> = {
  light: { node: '#64748b', accent: '#ca8a04', link: '#64748b', linkOpacity: 0.3 },
  dark: { node: '#94a3b8', accent: '#fbbf24', link: '#94a3b8', linkOpacity: 0.22 },
}

async function init(engine: Engine) {
  await loadSlim(engine)
}

/**
 * Ambient "citation network" behind the app: slow-drifting nodes (papers)
 * joined by faint links (citations). Hovering pulls nearby nodes' links
 * toward the pointer. Rendered on a fixed, non-interactive canvas behind
 * the content. Loaded lazily and only while animations are on.
 */
export default function BackgroundNetwork({ theme }: { theme: Theme }) {
  const c = COLORS[theme]

  const options = useMemo<ISourceOptions>(
    () => ({
      fullScreen: { enable: true, zIndex: 0 },
      background: { color: { value: 'transparent' } },
      fpsLimit: 60,
      detectRetina: true,
      pauseOnBlur: true,
      particles: {
        number: { value: 70, density: { enable: true, width: 1400, height: 900 } },
        paint: {
          fill: {
            enable: true,
            color: { value: [c.node, c.node, c.node, c.accent] },
            opacity: { min: 0.5, max: 0.95 },
          },
        },
        shape: { type: 'circle' },
        size: { value: { min: 1.2, max: 3 } },
        move: { enable: true, speed: 0.35, direction: 'none', random: true, outModes: { default: 'out' } },
        links: { enable: true, distance: 150, color: { value: c.link }, opacity: c.linkOpacity, width: 1 },
      },
      interactivity: {
        detectsOn: 'window',
        events: { onHover: { enable: true, mode: 'grab' } },
        modes: { grab: { distance: 170, links: { opacity: 0.5, color: c.accent } } },
      },
    }),
    [c],
  )

  return (
    <ParticlesProvider init={init}>
      {/* key: rebuild the scene when the theme changes so colours update */}
      <Particles key={theme} id="litlens-network" options={options} />
    </ParticlesProvider>
  )
}
