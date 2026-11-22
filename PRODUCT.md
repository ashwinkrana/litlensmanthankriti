# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Two audiences, weighted equally:

- **Faculty evaluators** at a live demo. They type their own research topics on a projector and judge, within minutes, whether the output can be trusted.
- **Students and researchers** writing a literature review (thesis chapter, survey, related-work section) who need a fast, honest starting point from recent papers.

## Product Purpose

LitLens turns a research topic into a cited literature review. A pipeline of agents plans arXiv searches, ranks candidate papers with local embeddings, extracts structured facts (problem, method, datasets, metrics, limitations), writes a review with numbered citations, verifies those citations, and indexes the full-text PDFs so users can ask follow-up questions. Success: a user trusts the review enough to keep working from it.

## Positioning

The citations are real. Every paper comes from arXiv, every `[n]` in the review maps to one of those papers, and a verifier checks each cited sentence against the paper it cites, flagging weak support and removing invalid references. Answers in Q&A cite the PDF page they came from. A generic chatbot cannot truthfully make this claim.

## Operating Context

- Live faculty demo on a laptop (Windows for development, MacBook for the demo), often on a projector.
- One review takes a short wait while the agents work; progress streams live, stage by stage.
- Outputs are read on the results page and exported as Markdown and BibTeX into users' own notes and reference managers.

## Capabilities and Constraints

- Sources: arXiv only (abstracts for extraction, full-text PDFs only via retrieved chunks for Q&A).
- Paper counts: 4, 8 or 12 per review.
- Review sections: Overview, Key Themes, Methods & Results Comparison, Research Gaps, Conclusion.
- LLMs: Groq free tier (gpt-oss-20b / 120b) with Gemini fallback; strict rate limits; responses cached; a demo mode replays cached runs.
- Must degrade gracefully on partial failures; never show a crash.
- Must run on Windows and macOS.

## Brand Commitments

- Name: **LitLens**.
- Mascot: **Hoot**, the animated owl companion, stays in every design.
- Everything else (palette, type, badges, decorative motifs) is open.

## Evidence on Hand

- Real recorded runs in `data/reviews/` and mock fixtures in `frontend/src/mocks/` (a recorded event stream and a sample review).
- Evaluation harness output in `eval/results.md`.
- No testimonials, users, institutions or benchmarks exist; none may be invented.

## Product Principles

1. Prove trust, don't claim it: show the citations and their checks.
2. Real papers only; never imply sources LitLens did not read.
3. Calm under a live demo: every state has a clear, graceful outcome.
4. The user's topic is the start of every flow; nothing stands between them and it.

## Accessibility & Inclusion

Readable on a projector: strong contrast in both light and dark themes, keyboard operable, respects reduced-motion (with an in-app Motion toggle).
