import { useEffect, useState } from 'react'

/**
 * TEMPORARY: three home-page variants to compare before the demo.
 * Pick one, then delete the other two, VariantSwitcher and this file.
 *
 * - desk:    refined current design, interactive dot-grid background
 * - ruled:   impeccable pass, ruled-notebook background
 * - threads: taste-skill pass, split hero with live pipeline preview
 */
export type HomeVariant = 'desk' | 'ruled' | 'threads'

export const HOME_VARIANTS: { key: HomeVariant; label: string }[] = [
  { key: 'desk', label: 'Desk' },
  { key: 'ruled', label: 'Ruled' },
  { key: 'threads', label: 'Threads' },
]

const KEY = 'litlens-home-variant'

function isVariant(v: unknown): v is HomeVariant {
  return v === 'desk' || v === 'ruled' || v === 'threads'
}

/** `?variant=ruled` in the URL wins (handy for sharing), then the saved choice. */
function initialVariant(): HomeVariant {
  if (typeof window === 'undefined') return 'desk'
  const fromUrl = new URLSearchParams(window.location.search).get('variant')
  if (isVariant(fromUrl)) return fromUrl
  try {
    const stored = window.localStorage.getItem(KEY)
    if (isVariant(stored)) return stored
  } catch {
    /* storage blocked: fall through */
  }
  return 'desk'
}

export function useHomeVariant(): [HomeVariant, (v: HomeVariant) => void] {
  const [variant, setVariant] = useState<HomeVariant>(initialVariant)
  useEffect(() => {
    try {
      window.localStorage.setItem(KEY, variant)
    } catch {
      /* non-fatal */
    }
  }, [variant])
  return [variant, setVariant]
}
