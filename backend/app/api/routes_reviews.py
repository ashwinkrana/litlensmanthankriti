"""Review endpoints (SRS §5.2, DESIGN §4)."""

from __future__ import annotations

import asyncio
import re
from collections.abc import AsyncIterator
from enum import StrEnum
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Query, Request
from fastapi.responses import Response
from sse_starlette.sse import EventSourceResponse

from app.agents.qa import QAUnavailableError, answer
from app.api.errors import AppError
from app.api.ratelimit import client_limiter
from app.models.schemas import (
    AskRequest,
    AskResponse,
    JobCreated,
    ReviewRequest,
    ReviewResult,
)
from app.pipeline.demo import replay
from app.pipeline.jobs import Job
from app.pipeline.orchestrator import run_review
from app.pipeline.services import Services
from app.services.export import to_bibtex, to_markdown

router = APIRouter(prefix="/api/reviews", tags=["reviews"])


class ExportFormat(StrEnum):
    md = "md"
    bib = "bib"


def _services(request: Request) -> Services:
    return request.app.state.services


def _job(request: Request, job_id: str) -> Job:
    """SECURITY V-2: anything that isn't a UUID is simply 'not found'."""
    try:
        uid = UUID(job_id)
    except ValueError:
        raise AppError(404, "NOT_FOUND", "Review not found.") from None
    job = _services(request).jobs.get(uid)
    if job is None:
        raise AppError(404, "NOT_FOUND", "Review not found.")
    return job


@router.post("", status_code=202, response_model=JobCreated)
async def create_review(body: ReviewRequest, request: Request) -> JobCreated:
    client_limiter(request).check(request, "reviews")
    services = _services(request)
    if services.settings.demo_mode:
        # FR-52: offline replay of a pre-warmed topic; no network calls at all.
        source_id = services.demo.lookup(body.topic)
        source = services.jobs.get(source_id) if source_id else None
        if source is None or source.result.status != "done":
            raise AppError(
                422,
                "VALIDATION_ERROR",
                "Offline demo mode: choose one of the demo topics.",
            )
        job = services.jobs.create(body)
        services.jobs.track(asyncio.create_task(replay(job, source, services.jobs)))
        return JobCreated(job_id=job.id)
    job = services.jobs.create(body)
    services.jobs.track(asyncio.create_task(run_review(job, services)))
    return JobCreated(job_id=job.id)


@router.get("/{job_id}", response_model=ReviewResult)
async def get_review(job_id: str, request: Request) -> ReviewResult:
    return _job(request, job_id).result


@router.get("/{job_id}/events")
async def review_events(job_id: str, request: Request) -> EventSourceResponse:
    job = _job(request, job_id)

    async def gen() -> AsyncIterator[dict[str, str]]:
        # sse-starlette stops this generator when the client disconnects; the job
        # keeps running and its history replays on reconnect.
        async for event in job.stream():
            yield {
                "event": "stage",
                "data": event.model_dump_json(exclude_none=True),
            }

    return EventSourceResponse(gen(), ping=15)


@router.post("/{job_id}/ask", response_model=AskResponse)
async def ask(job_id: str, body: AskRequest, request: Request) -> AskResponse:
    client_limiter(request).check(request, "ask")
    job = _job(request, job_id)
    if not job.result.qa_ready:
        raise AppError(
            409, "NOT_READY", "Full-text Q&A is not ready for this review yet."
        )
    services = _services(request)
    try:
        return await answer(
            job.vectors_id,
            body.question,
            embedder=services.embedder,
            store=services.vectors,
            router=services.router,
        )
    except QAUnavailableError:
        if services.settings.demo_mode:
            raise AppError(
                503,
                "UPSTREAM_ERROR",
                "Offline demo mode: only pre-warmed questions can be answered.",
            ) from None
        raise AppError(
            503, "UPSTREAM_ERROR", "The AI service is busy. Please try again shortly."
        ) from None


def _filename(topic: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", topic.lower()).strip("-")[:50]
    return slug or "review"


@router.get("/{job_id}/export")
async def export(
    job_id: str, request: Request, format: Annotated[ExportFormat, Query()]
) -> Response:
    job = _job(request, job_id)
    if job.result.status == "running":
        raise AppError(409, "NOT_READY", "The review is still being generated.")
    name = _filename(job.result.topic)
    if format is ExportFormat.md:
        body, media, ext = to_markdown(job.result), "text/markdown", "md"
    else:
        body, media, ext = to_bibtex(job.result.papers), "application/x-bibtex", "bib"
    return Response(
        content=body.encode("utf-8"),
        media_type=f"{media}; charset=utf-8",
        headers={"Content-Disposition": f'attachment; filename="litlens-{name}.{ext}"'},
    )
