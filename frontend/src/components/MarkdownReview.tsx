import { Children, cloneElement, isValidElement, useMemo, type ReactElement, type ReactNode } from 'react'
import ReactMarkdown, { type Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { Paper } from '../api/types'
import { CitationChip } from './CitationChip'

const CITATION_RE = /\[(\d+)(?:,\s*p\.?\s*(\d+))?\]/g

function isArxivLink(href: string | undefined): boolean {
  if (!href) return false
  try {
    const u = new URL(href)
    return u.protocol === 'https:' && u.hostname === 'arxiv.org' && u.port === ''
  } catch {
    return false
  }
}

/** Split a text node into literal runs and citation chips. */
function splitText(text: string, papers: Map<number, Paper>): ReactNode[] {
  const out: ReactNode[] = []
  let last = 0
  let key = 0
  let m: RegExpExecArray | null
  CITATION_RE.lastIndex = 0
  while ((m = CITATION_RE.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index))
    const ref = Number(m[1])
    out.push(<CitationChip key={key++} ref={ref} paper={papers.get(ref)} />)
    last = m.index + m[0].length
  }
  if (last < text.length) out.push(text.slice(last))
  return out
}

/** Recursively walk inline children so citations become chips even inside bold/em. */
function splice(children: ReactNode, papers: Map<number, Paper>): ReactNode[] {
  return Children.toArray(children).flatMap((child): ReactNode[] => {
    if (typeof child === 'string' || typeof child === 'number') {
      return splitText(String(child), papers)
    }
    if (isValidElement(child)) {
      const el = child as ReactElement<{ children?: ReactNode }>
      const kids = el.props?.children
      if (Array.isArray(kids) || typeof kids === 'string' || typeof kids === 'number') {
        return [cloneElement(el, { children: splice(kids as ReactNode, papers) })]
      }
      return [el]
    }
    return [child]
  })
}

function buildComponents(papers: Map<number, Paper>): Components {
  const inline = (children: ReactNode) => splice(children, papers)
  return {
    p: ({ children }) => <p className="my-0 leading-relaxed text-txt">{inline(children)}</p>,
    li: ({ children }) => <li className="leading-relaxed text-txt">{inline(children)}</li>,
    h1: ({ children }) => (
      <h1 className="mb-2 mt-0 text-2xl font-extrabold tracking-tight text-ink">{inline(children)}</h1>
    ),
    h2: ({ children }) => (
      <h2 className="mb-2 mt-5 text-lg font-bold tracking-tight text-ink">{inline(children)}</h2>
    ),
    h3: ({ children }) => (
      <h3 className="mb-1.5 mt-4 text-base font-bold text-ink">{inline(children)}</h3>
    ),
    strong: ({ children }) => <strong className="font-bold text-ink">{inline(children)}</strong>,
    em: ({ children }) => <em className="italic">{inline(children)}</em>,
    // SECURITY R-2: LLM/paper text may contain links; only https://arxiv.org links
    // are clickable, anything else renders as plain text.
    a: ({ href, children }) =>
      isArxivLink(href) ? (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-amb underline decoration-dotted underline-offset-2 hover:text-ink"
        >
          {inline(children)}
        </a>
      ) : (
        <span>{inline(children)}</span>
      ),
    ul: ({ children }) => <ul className="my-2 list-disc space-y-1 pl-5">{children}</ul>,
    ol: ({ children }) => <ol className="my-2 list-decimal space-y-1 pl-5">{children}</ol>,
    blockquote: ({ children }) => (
      <blockquote className="my-3 border-l-4 border-rose-line bg-rose-soft px-4 py-2 text-txt">
        {children}
      </blockquote>
    ),
    table: ({ children }) => (
      <div className="my-4 overflow-x-auto">
        <table className="w-full border-collapse text-sm">{children}</table>
      </div>
    ),
    thead: ({ children }) => <thead className="border-b-2 border-edge">{children}</thead>,
    th: ({ children }) => (
      <th className="px-3 py-2 text-left font-mono text-[11px] font-semibold uppercase tracking-wider text-faint">
        {inline(children)}
      </th>
    ),
    td: ({ children }) => <td className="border-t border-edge2 px-3 py-2 align-top">{inline(children)}</td>,
    code: ({ children }) => (
      <code className="rounded bg-card2 px-1.5 py-0.5 font-mono text-[12px] text-amb">{children}</code>
    ),
    pre: ({ children }) => (
      <pre className="my-3 overflow-x-auto rounded-lg bg-app p-3 font-mono text-xs text-txt">
        {children}
      </pre>
    ),
    hr: () => <hr className="my-5 border-dashed border-edge" />,
  }
}

export function MarkdownReview({ markdown, papers }: { markdown: string; papers: Paper[] }) {
  const map = useMemo(() => new Map(papers.map((p) => [p.ref, p])), [papers])
  const components = useMemo(() => buildComponents(map), [map])
  return (
    <div className="space-y-4">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {markdown}
      </ReactMarkdown>
    </div>
  )
}
