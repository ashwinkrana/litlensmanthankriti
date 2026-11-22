"""Pre-warm topics for the demo (SRS FR-51, DESIGN §7).

Runs the full pipeline (including PDF indexing) for each topic with real APIs,
then records it so DEMO_MODE=true can replay it offline. Optionally caches
answers to a few questions per topic so Q&A also works offline.

From backend/ with the venv active:
    python -m scripts.prewarm "topic one" "topic two"
    python -m scripts.prewarm "topic one" --ask "Which datasets are used?"

Uses API quota (about 6-10K tokens per topic). Don't run it on demo morning.
"""

from __future__ import annotations

import argparse
import asyncio

from app.agents.qa import QAUnavailableError, answer
from scripts._runner import run_one, setup


async def main(topics: list[str], questions: list[str], max_papers: int) -> int:
    _, services = setup()
    failed = 0
    for i, topic in enumerate(topics, start=1):
        print(f"\n[{i}/{len(topics)}] {topic}")
        job, secs = await run_one(services, topic, max_papers=max_papers)
        r = job.result
        if r.status != "done" or not r.review_md:
            print(f"  !! not recorded: status={r.status} warnings={r.warnings}")
            failed += 1
            continue
        services.demo.add(topic, job.id)
        print(
            f"  recorded job {job.id} | {len(r.papers)} papers | "
            f"qa_ready={r.qa_ready} | {secs:.0f}s"
        )
        if r.qa_ready:
            for q in questions:
                try:
                    a = await answer(
                        job.vectors_id,
                        q,
                        embedder=services.embedder,
                        store=services.vectors,
                        router=services.router,
                    )
                    print(f"  cached answer: {q!r} -> {a.answer_md[:70]!r}")
                except QAUnavailableError:
                    print(f"  !! could not answer {q!r}")
    await services.fetcher.aclose()
    print(f"\nDemo topics now: {services.demo.topics()}")
    print("Set DEMO_MODE=true in .env and restart the backend to replay them offline.")
    return 1 if failed else 0


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Pre-warm demo topics")
    parser.add_argument("topics", nargs="+")
    parser.add_argument(
        "--ask", action="append", default=[], help="question to pre-answer (repeatable)"
    )
    parser.add_argument("--papers", type=int, default=8, help="4-12 (default 8)")
    args = parser.parse_args()
    raise SystemExit(asyncio.run(main(args.topics, args.ask, args.papers)))
