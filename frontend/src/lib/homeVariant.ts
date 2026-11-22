import { useEffect, useState } from 'react'

/**
 * TEMPORARY: home-page variants to compare before the demo. All four share
 * the Threads background and the topic composer; each new one also re-themes
 * the whole app (palette + fonts) via `html[data-variant]` in index.css.
 * Pick one, then delete the others, VariantSwitcher and this file.
 *
 * - threads:     the chosen base (amber, Plus Jakarta Sans)
 * - proceedings: a bound conference-proceedings volume (ultramarine band)
 * - preprint:    the first page of a LaTeX preprint (hyperref green, STIX)
 * - cards:       every paper a collectible card (card stock, slab type)
 */
export type HomeVariant = 'threads' | 'proceedings' | 'preprint' | 'cards'

export const HOME_VARIANTS: { key: HomeVariant; label: string }[] = [
  { key: 'threads', label: 'Threads' },
  { key: 'proceedings', label: 'Proceedings' },
  { key: 'preprint', label: 'Preprint' },
  { key: 'cards', label: 'Cards' },
]

const KEY = 'litlens-home-variant'

function isVariant(v: unknown): v is HomeVariant {
  return HOME_VARIANTS.some((x) => x.key === v)
}

/** `?variant=preprint` in the URL wins (handy for sharing), then the saved choice. */
function initialVariant(): HomeVariant {
  if (typeof window === 'undefined') return 'threads'
  const fromUrl = new URLSearchParams(window.location.search).get('variant')
  if (isVariant(fromUrl)) return fromUrl
  try {
    const stored = window.localStorage.getItem(KEY)
    if (isVariant(stored)) return stored
  } catch {
    /* storage blocked: fall through */
  }
  return 'threads'
}

export function useHomeVariant(): [HomeVariant, (v: HomeVariant) => void] {
  const [variant, setVariant] = useState<HomeVariant>(initialVariant)
  useEffect(() => {
    document.documentElement.dataset.variant = variant
    try {
      window.localStorage.setItem(KEY, variant)
    } catch {
      /* non-fatal */
    }
  }, [variant])
  return [variant, setVariant]
}
