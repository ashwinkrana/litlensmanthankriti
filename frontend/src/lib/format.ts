/** Small pure helpers shared across components. */

export function formatMs(ms: number): string {
  if (!Number.isFinite(ms) || ms < 0) return '—'
  if (ms < 1000) return `${Math.round(ms)} ms`
  const s = ms / 1000
  if (s < 60) return `${s.toFixed(1)} s`
  const m = Math.floor(s / 60)
  const r = s - m * 60
  return `${m}m ${r.toFixed(0)}s`
}

export function totalTokens(tokens?: Record<string, number>): number {
  if (!tokens) return 0
  return Object.values(tokens).reduce((a, b) => a + b, 0)
}

export function totalTokensByModel(tokens?: Record<string, number>): [string, number][] {
  if (!tokens) return []
  return Object.entries(tokens).sort((a, b) => b[1] - a[1])
}

/** "A. Sharma, R. Iyer" -> "Sharma et al." */
export function shortAuthors(authors: string[]): string {
  if (!authors || authors.length === 0) return 'Unknown'
  const first = authors[0]
  const surname = first.split(/[\s,]+/).pop() ?? first
  return authors.length > 1 ? `${surname} et al.` : first
}

export function percent01(x: number): string {
  if (!Number.isFinite(x)) return '—'
  return `${Math.round(x * 100)}%`
}

/** Strip light Markdown and return the first sentence or two for a callout. */
export function leadFinding(markdown: string, maxSentences = 2): string {
  const plain = markdown
    .replace(/^\s*#{1,6}\s.*$/gm, '') // drop headings like "## Overview"
    .replace(/[*`>~|]+/g, '')
    .replace(/\s*\[\d+\]/g, '') // citation markers plus the space before them
    .replace(/\s+/g, ' ')
    .trim()
  const sentences = plain.split(/(?<=[.!?])\s+/).filter(Boolean)
  const picked = sentences.slice(0, maxSentences).join(' ')
  return picked || 'Synthesis in progress…'
}

export function isValidCitationRef(ref: number, maxRef: number): boolean {
  return Number.isInteger(ref) && ref >= 1 && ref <= maxRef
}
