import { useEffect, useState } from 'react'
import { snapshot } from 'wobnimo'
import owl from '../../../mascots/owl'
import type { HootMood } from '../../lib/hootContext'

// One still render per mood and size, shared by every avatar on the page.
const cache = new Map<string, Promise<string>>()

function render(mood: HootMood, size: number): Promise<string> {
  const key = `${mood}:${size}`
  let p = cache.get(key)
  if (!p) {
    p = snapshot(owl, { state: mood, size, floor: 0, framing: 0.85 }).then((c) => c.toDataURL('image/png'))
    cache.set(key, p)
  }
  return p
}

/**
 * A still picture of Hoot (wobnimo `snapshot`), for small inline uses such
 * as chat answers and error notes, where a live 3D canvas per item is waste.
 */
export function HootAvatar({ mood, size = 32, className = '' }: { mood: HootMood; size?: number; className?: string }) {
  const [src, setSrc] = useState<string | null>(null)
  useEffect(() => {
    let alive = true
    render(mood, size * 2) // 2x for sharp edges on dense screens
      .then((url) => alive && setSrc(url))
      .catch(() => {
        /* no WebGL2: the placeholder circle stays */
      })
    return () => {
      alive = false
    }
  }, [mood, size])
  return (
    <span
      aria-hidden="true"
      className={`inline-block shrink-0 overflow-hidden rounded-full bg-amb-soft ring-1 ring-inset ring-amb-line ${className}`}
      style={{ width: size, height: size }}
    >
      {src && <img src={src} alt="" width={size} height={size} className="h-full w-full object-cover" />}
    </span>
  )
}
