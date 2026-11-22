"""One real end-to-end run with stage timings (DESIGN §10). Uses API quota.

From backend/ with the venv active:
    python -m scripts.smoke "some topic"
    python -m scripts.smoke "some topic" --no-index
"""

from __future__ import annotations

import argparse
import asyncio

from scripts._runner import run_one, setup


async def main(topic: str, index: bool) -> int:
    _, services = setup()
    print(f"Smoke test: {topic!r}")
    job, secs = await run_one(services, topic, index=index)
    r = job.result
    v = r.verification
    print()
    print(f"status          {r.status}")
    print(f"papers          {r.stats.papers_selected}/{r.stats.papers_considered}")
    print(
        f"review time     {r.stats.total_ms / 1000:.1f}s (wall incl. indexing {secs:.1f}s)"
    )
    print(f"stage ms        {r.stats.stage_ms}")
    print(f"tokens          {r.stats.tokens}")
    print(f"providers       {r.stats.providers_used}")
    if v:
        print(
            f"citations       {v.citation_validity:.0%} valid, "
            f"{len(v.weak_claims)} weak, {v.uncited_sentences} uncited"
        )
    print(f"qa_ready        {r.qa_ready}")
    for w in r.warnings:
        print(f"WARNING         {w}")
    await services.fetcher.aclose()
    return 0 if r.status == "done" else 1


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="LitLens smoke test")
    parser.add_argument("topic")
    parser.add_argument("--no-index", action="store_true", help="skip PDF indexing")
    args = parser.parse_args()
    raise SystemExit(asyncio.run(main(args.topic, not args.no_index)))
