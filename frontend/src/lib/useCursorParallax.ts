import { useEffect, type RefObject } from 'react'

/**
 * Subtle cursor parallax. Writes the eased cursor position (-1..1 across the
 * window) into `--px` / `--py` on the element; children with the `.parallax`
 * class move by `--depth` px times that (see index.css). Mouse only, no React
 * re-renders, and off (reset to 0) when `enabled` is false (Motion toggle).
 */
export function useCursorParallax(ref: RefObject<HTMLElement | null>, enabled: boolean): void {
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const reset = () => {
      el.style.setProperty('--px', '0')
      el.style.setProperty('--py', '0')
    }
    if (!enabled) {
      reset()
      return
    }

    let tx = 0
    let ty = 0
    let x = 0
    let y = 0
    let raf = 0

    const tick = () => {
      // ease toward the target so the motion feels weighty, not twitchy
      x += (tx - x) * 0.08
      y += (ty - y) * 0.08
      el.style.setProperty('--px', x.toFixed(4))
      el.style.setProperty('--py', y.toFixed(4))
      raf = Math.abs(tx - x) > 0.001 || Math.abs(ty - y) > 0.001 ? requestAnimationFrame(tick) : 0
    }
    const wake = () => {
      if (!raf) raf = requestAnimationFrame(tick)
    }
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return
      tx = (e.clientX / window.innerWidth) * 2 - 1
      ty = (e.clientY / window.innerHeight) * 2 - 1
      wake()
    }
    const onLeave = () => {
      tx = 0
      ty = 0
      wake()
    }

    window.addEventListener('pointermove', onMove, { passive: true })
    document.documentElement.addEventListener('pointerleave', onLeave)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('pointermove', onMove)
      document.documentElement.removeEventListener('pointerleave', onLeave)
      reset()
    }
  }, [ref, enabled])
}
