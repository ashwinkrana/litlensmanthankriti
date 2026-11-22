"""Pipeline orchestrator (DESIGN §3.8): wires the agents together and emits events.

Fail soft: a failed stage adds a warning; only "no papers at all" or an
unexpected crash ends the job with status "error".
"""

from __future__ import annotations

import logging
import time
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from app.agents.extractor import extract
from app.agents.indexer import index_papers
from app.agents.planner import plan
from app.agents.ranker import rank
from app.agents.searcher import search
from app.agents.synthesizer import synthesize
from app.agents.verifier import verify
from app.models.schemas import Stats
from app.pipeline.context import RunContext
from app.pipeline.jobs import Job
from app.pipeline.services import Services
from app.services.arxiv_client import ArxivUnavailableError

log = logging.getLogger("litlens.pipeline")


class _StageTimer:
    def __init__(self) -> None:
        self.stage_ms: dict[str, int] = {}

    @asynccontextmanager
    async def __call__(self, stage: str) -> AsyncIterator[None]:
        t0 = time.monotonic()
        try:
            yield
        finally:
            self.stage_ms[stage] = int((time.monotonic() - t0) * 1000)


async def run_review(job: Job, services: Services, *, index: bool = True) -> None:
    """Run the whole pipeline for one job. Never raises.

    `index=False` skips full-text indexing (used by the eval harness).
    """
    ctx = RunContext(
        settings=services.settings,
        router=services.router,
        arxiv=services.arxiv,
        embedder=services.embedder,
        emit_fn=job.publish,
        job_id=job.id,
    )
    async with services.pipeline_lock:
        ctx.started = time.monotonic()  # don't count time spent queued
        try:
            await _run(job, ctx, services)
        except Exception:
            log.exception("job %s crashed", job.id)
            job.result.status = "error"
            ctx.warn("Something went wrong while generating the review.")
            await ctx.emit(
                "error", "failed", "Something went wrong while generating the review."
            )
        finally:
            job.result.warnings = list(ctx.warnings)
            job.result.stats.total_ms = ctx.elapsed_ms()
            job.result.stats.tokens = dict(ctx.tokens)
            job.result.stats.providers_used = list(ctx.providers_used)
            services.jobs.save(job)

    # Background full-text indexing (FR-16): the review is already available;
    # the stream stays open until Q&A is ready. Runs outside the pipeline lock
    # so the next review can start meanwhile.
    if job.result.status == "done" and not index:
        await ctx.emit("indexing", "skipped", "Full-text indexing skipped")
    elif job.result.status == "done":
        try:
            ready = await index_papers(
                job.result.papers, ctx, fetcher=services.fetcher, store=services.vectors
            )
            job.result.qa_ready = ready
        except Exception:
            log.exception("indexing crashed for job %s", job.id)
            ctx.warn("Full-text indexing failed; Q&A is unavailable for this review.")
            await ctx.emit("indexing", "failed", "Full-text indexing failed")
        job.result.warnings = list(ctx.warnings)
    job.finish()
    services.jobs.save(job)


async def _run(job: Job, ctx: RunContext, services: Services) -> None:
    req, result = job.request, job.result
    timer = _StageTimer()
    result.stats = Stats()

    async with timer("planning"):
        result.queries = await plan(req.topic, ctx)

    async with timer("searching"):
        try:
            candidates = await search(result.queries, ctx)
        except ArxivUnavailableError:
            result.status = "error"
            ctx.warn(
                "arXiv could not be reached. Check the internet connection and try again."
            )
            await ctx.emit("error", "failed", "arXiv could not be reached")
            return
    result.stats.papers_considered = len(candidates)

    async with timer("ranking"):
        await ctx.emit("ranking", "started", "Ranking by semantic relevance")
        papers = await rank(
            req.topic,
            candidates,
            ctx.embedder,
            top_n=req.max_papers,
            year_from=req.year_from,
        )
        await ctx.emit(
            "ranking",
            "completed",
            f"Selected top {len(papers)} of {len(candidates)} papers",
        )
    result.papers = papers
    result.stats.papers_selected = len(papers)
    result.stats.stage_ms = timer.stage_ms

    if not papers:
        result.status = "error"
        ctx.warn("No papers found for this topic. Try a broader topic.")
        await ctx.emit("error", "failed", "No papers found for this topic")
        return

    async with timer("extracting"):
        result.extractions = await extract(papers, ctx)

    async with timer("synthesizing"):
        review_md = await synthesize(req.topic, papers, result.extractions, ctx)

    async with timer("verifying"):
        if review_md:
            await ctx.emit("verifying", "started", "Checking citations")
            review_md, verification = await verify(
                review_md,
                papers,
                result.extractions,
                ctx.embedder,
                threshold=ctx.settings.support_threshold,
            )
            result.verification = verification
            pct = round(verification.citation_validity * 100)
            n_weak = len(verification.weak_claims)
            await ctx.emit(
                "verifying",
                "completed",
                f"{pct}% valid citations, {n_weak} weakly supported "
                f"claim{'' if n_weak == 1 else 's'}",
            )
        else:
            await ctx.emit("verifying", "skipped", "No review to verify")

    result.review_md = review_md
    result.stats.stage_ms = timer.stage_ms
    result.status = "done"
    await ctx.emit("done", "completed", "Review ready")
