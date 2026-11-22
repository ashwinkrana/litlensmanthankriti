"""Shared helpers for the CLI scripts: build real services and run one review."""

from __future__ import annotations

import logging
import sys
import time

from app.config import Settings, get_settings
from app.models.schemas import ReviewRequest, StageEvent
from app.net import use_system_trust_store
from app.pipeline.jobs import Job
from app.pipeline.orchestrator import run_review
from app.pipeline.services import Services, build_services


def setup(*, quiet: bool = False) -> tuple[Settings, Services]:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    logging.basicConfig(
        level=logging.WARNING, format="%(levelname)s %(name)s: %(message)s"
    )
    use_system_trust_store()
    settings = get_settings()
    if settings.demo_mode:
        sys.exit("DEMO_MODE=true in .env: set it to false to run live reviews.")
    if not settings.groq_configured and not settings.gemini_configured:
        sys.exit("No LLM key: set GROQ_API_KEY in .env (see .env.example).")
    services = build_services(settings)
    services.embedder.warm_up()  # type: ignore[attr-defined]
    return settings, services


async def print_event(e: StageEvent) -> None:
    tokens = f"  tokens={e.tokens}" if e.tokens else ""
    provider = f"  [{e.provider}]" if e.provider else ""
    print(
        f"  {e.elapsed_ms / 1000:6.1f}s  {e.stage:<12} {e.status:<9} "
        f"{e.message}{provider}{tokens}"
    )


async def run_one(
    services: Services,
    topic: str,
    *,
    max_papers: int = 8,
    index: bool = True,
    verbose: bool = True,
) -> tuple[Job, float]:
    job = services.jobs.create(ReviewRequest(topic=topic, max_papers=max_papers))
    if verbose:
        original = job.publish

        async def publish(e: StageEvent) -> None:
            await original(e)
            await print_event(e)

        job.publish = publish  # type: ignore[method-assign]
    t0 = time.monotonic()
    await run_review(job, services, index=index)
    return job, time.monotonic() - t0
