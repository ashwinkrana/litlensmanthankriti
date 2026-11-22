import type { CSSProperties } from 'react'
import type { Theme } from '../TopBar'

/*
 * Decoration for the home page, from the scene that is already there:
 *  - autumn-gold leaves drifting down from Hoot's branch (right side), and
 *  - in dark mode, dust motes floating in the amber "desk lamp" glow.
 * Pure CSS animation (index.css: leaf-fall / leaf-sway / mote-float), a
 * handful of elements, behind the content, ignores the pointer. The Motion
 * toggle stops it (html[data-motion='off'] collapses all animations).
 */

// Fixed "random" values so the scene is the same on every load.
const LEAVES = [
  { x: 92, size: 22, fall: 17, sway: 3.6, delay: -2, hue: '#d9962b' },
  { x: 84, size: 18, fall: 22, sway: 4.4, delay: -11, hue: '#e0a93c' },
  { x: 97, size: 25, fall: 19, sway: 3.1, delay: -7, hue: '#c9821f' },
  { x: 76, size: 17, fall: 25, sway: 4.9, delay: -16, hue: '#e3b04a' },
  { x: 88, size: 21, fall: 21, sway: 3.9, delay: -4, hue: '#d4902a' },
  { x: 68, size: 16, fall: 27, sway: 5.2, delay: -20, hue: '#dba343' },
]

const MOTES = Array.from({ length: 16 }, (_, i) => {
  const r = (n: number) => ((Math.sin(i * 12.9898 + n * 78.233) * 43758.5453) % 1 + 1) % 1
  return {
    x: 28 + r(1) * 44, // within the lamp pool over the hero (28%-72% across)
    y: 8 + r(2) * 38, // upper part of the page
    size: 1.5 + r(3) * 2,
    dur: 9 + r(4) * 10,
    delay: -r(5) * 12,
  }
})

function Leaf({ size, hue }: { size: number; hue: string }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
      <path d="M12 2c5 3 8 8 6 13-1.5 3.8-5 6-6 7-1-1-4.5-3.2-6-7C4 10 7 5 12 2Z" fill={hue} />
      <path d="M12 4v17M12 10l3-2M12 14l-3-2.5M12 17l3-2" stroke="#7a4b14" strokeWidth="0.9" strokeLinecap="round" opacity="0.55" />
    </svg>
  )
}

export function HomeAmbience({ theme }: { theme: Theme }) {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {theme === 'dark' &&
        MOTES.map((m, i) => (
          <span
            key={`m${i}`}
            className="lamp-mote absolute rounded-full"
            style={
              {
                left: `${m.x}%`,
                top: `${m.y}%`,
                width: m.size,
                height: m.size,
                animationDuration: `${m.dur}s`,
                animationDelay: `${m.delay}s`,
              } as CSSProperties
            }
          />
        ))}

      {LEAVES.map((l, i) => (
        <span
          key={`l${i}`}
          className="falling-leaf absolute top-0"
          style={
            {
              left: `${l.x}%`,
              animationDuration: `${l.fall}s`,
              animationDelay: `${l.delay}s`,
            } as CSSProperties
          }
        >
          <span
            className="leaf-sway block"
            style={{ animationDuration: `${l.sway}s`, animationDelay: `${l.delay}s` }}
          >
            <Leaf size={l.size} hue={l.hue} />
          </span>
        </span>
      ))}
    </div>
  )
}
