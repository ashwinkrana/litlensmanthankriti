"""Job registry: in-memory jobs + event history, persisted to data/reviews/ (DESIGN §3.8)."""

from __future__ import annotations

import asyncio
import json
import logging
from collections.abc import AsyncIterator
from datetime import UTC, datetime
from pathlib import Path
from uuid import UUID, uuid4

from pydantic import TypeAdapter

from app.models.schemas import ReviewRequest, ReviewResult, StageEvent

log = logging.getLogger("litlens.jobs")
_EVENTS = TypeAdapter(list[StageEvent])


class Job:
    def __init__(
        self, job_id: UUID, request: ReviewRequest, result: ReviewResult
    ) -> None:
        self.id = job_id
        self.request = request
        self.result = result
        self.events: list[StageEvent] = []
        self.finished = False  # True once the event stream has ended (after indexing)
        # Which job's full-text index answers Q&A. A demo replay reuses the
        # pre-warmed job's vectors instead of re-indexing (DESIGN §7).
        self.vectors_id: UUID = job_id
        self._subscribers: set[asyncio.Queue[StageEvent | None]] = set()

    async def publish(self, event: StageEvent) -> None:
        self.events.append(event)
        for q in list(self._subscribers):
            q.put_nowait(event)

    def finish(self) -> None:
        self.finished = True
        for q in list(self._subscribers):
            q.put_nowait(None)

    async def stream(self) -> AsyncIterator[StageEvent]:
        """Past events first (late subscribers catch up), then live ones until finished."""
        q: asyncio.Queue[StageEvent | None] = asyncio.Queue()
        history = list(self.events)
        live = not self.finished
        if live:
            self._subscribers.add(q)
        try:
            for e in history:
                yield e
            if not live:
                return
            # Drain the queue even if the job finished while we replayed history:
            # events published meanwhile (and the end marker) are already in it.
            while True:
                item = await q.get()
                if item is None:
                    return
                yield item
        finally:
            self._subscribers.discard(q)


class JobRegistry:
    def __init__(self, reviews_dir: Path) -> None:
        self._dir = reviews_dir.resolve()
        self._dir.mkdir(parents=True, exist_ok=True)
        self._jobs: dict[UUID, Job] = {}
        self._tasks: set[asyncio.Task[None]] = set()

    def create(self, request: ReviewRequest) -> Job:
        job_id = uuid4()
        result = ReviewResult(
            job_id=job_id,
            status="running",
            topic=request.topic,
            created_at=datetime.now(UTC).replace(microsecond=0),
        )
        job = Job(job_id, request, result)
        self._jobs[job_id] = job
        return job

    def track(self, task: asyncio.Task[None]) -> None:
        """Keep a reference so background tasks aren't garbage-collected."""
        self._tasks.add(task)
        task.add_done_callback(self._tasks.discard)

    def _paths(self, job_id: UUID) -> tuple[Path, Path, Path]:
        result = (self._dir / f"{job_id}.json").resolve()
        events = (self._dir / f"{job_id}.events.json").resolve()
        meta = (self._dir / f"{job_id}.meta.json").resolve()
        # SECURITY V-2/D-4: never leave the reviews folder.
        for p in (result, events, meta):
            if p.parent != self._dir:
                raise ValueError("unsafe path")
        return result, events, meta

    def get(self, job_id: UUID) -> Job | None:
        job = self._jobs.get(job_id)
        if job is not None:
            return job
        result_path, events_path, meta_path = self._paths(job_id)
        if not result_path.is_file():
            return None
        try:
            result = ReviewResult.model_validate_json(result_path.read_text("utf-8"))
            events = (
                _EVENTS.validate_json(events_path.read_text("utf-8"))
                if events_path.is_file()
                else []
            )
            meta = (
                json.loads(meta_path.read_text("utf-8")) if meta_path.is_file() else {}
            )
            vectors_id = UUID(meta["vectors_id"]) if "vectors_id" in meta else job_id
        except OSError, ValueError:
            log.warning("could not load saved review %s", job_id)
            return None
        job = Job(job_id, ReviewRequest(topic=result.topic), result)
        job.events = events
        job.finished = True
        job.vectors_id = vectors_id
        self._jobs[job_id] = job
        return job

    def save(self, job: Job) -> None:
        result_path, events_path, meta_path = self._paths(job.id)
        _atomic_write(result_path, job.result.model_dump_json(indent=2))
        if job.vectors_id != job.id:
            _atomic_write(meta_path, json.dumps({"vectors_id": str(job.vectors_id)}))
        _atomic_write(
            events_path,
            json.dumps(
                [e.model_dump(mode="json", exclude_none=True) for e in job.events],
                ensure_ascii=False,
            ),
        )


def _atomic_write(path: Path, text: str) -> None:
    tmp = path.with_suffix(path.suffix + ".tmp")
    tmp.write_text(text, encoding="utf-8")
    tmp.replace(path)
