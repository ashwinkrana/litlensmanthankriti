"""Demo mode (SRS FR-50..52, DESIGN §7).

`scripts/prewarm.py` runs real reviews and records them in data/demo/index.json.
With DEMO_MODE=true, POST /api/reviews for a recorded topic *replays* that run:
the stored events are re-emitted with their original relative timing (capped at
1.5 s per gap, so a replay takes ~15-25 s and still looks live), and the stored
result is served. No network calls are made.
"""

from __future__ import annotations

import asyncio
import json
import logging
import threading
from pathlib import Path
from uuid import UUID

from app.pipeline.jobs import Job, JobRegistry

log = logging.getLogger("litlens.demo")

MAX_GAP_S = 1.5


def normalise_topic(topic: str) -> str:
    return " ".join(topic.lower().split())


class DemoIndex:
    """Pre-warmed topics -> the job that produced them. Small JSON file."""

    def __init__(self, path: Path) -> None:
        self._path = path
        self._lock = threading.Lock()

    def _load(self) -> dict[str, dict[str, str]]:
        try:
            data = json.loads(self._path.read_text("utf-8"))
            return data if isinstance(data, dict) else {}
        except OSError, ValueError:
            return {}

    def add(self, topic: str, job_id: UUID) -> None:
        with self._lock:
            data = self._load()
            data[normalise_topic(topic)] = {"topic": topic, "job_id": str(job_id)}
            self._path.parent.mkdir(parents=True, exist_ok=True)
            tmp = self._path.with_suffix(".tmp")
            tmp.write_text(json.dumps(data, indent=2, ensure_ascii=False), "utf-8")
            tmp.replace(self._path)

    def lookup(self, topic: str) -> UUID | None:
        entry = self._load().get(normalise_topic(topic))
        try:
            return UUID(entry["job_id"]) if entry else None
        except KeyError, ValueError:
            return None

    def topics(self) -> list[str]:
        return [v["topic"] for v in self._load().values() if "topic" in v]


async def replay(
    job: Job, source: Job, jobs: JobRegistry, *, max_gap_s: float | None = None
) -> None:
    """Re-emit `source`'s events as `job`, then serve a copy of its result. Never raises."""
    cap = MAX_GAP_S if max_gap_s is None else max_gap_s
    try:
        prev_ms = 0
        for event in source.events:
            gap_s = max(0, event.elapsed_ms - prev_ms) / 1000
            prev_ms = event.elapsed_ms
            if gap_s:
                await asyncio.sleep(min(gap_s, cap))
            if event.stage == "done":
                # The review is "ready" at this point in the replay.
                done = source.result.model_copy(deep=True)
                done.job_id = job.id
                done.created_at = job.result.created_at
                done.qa_ready = False
                job.result = done
            await job.publish(event.model_copy(update={"job_id": job.id}))
        job.result = source.result.model_copy(
            deep=True, update={"job_id": job.id, "created_at": job.result.created_at}
        )
        job.vectors_id = source.vectors_id  # Q&A uses the pre-warmed index
    except Exception:
        log.exception("demo replay failed for %s", job.id)
        job.result.status = "error"
    finally:
        job.finish()
        jobs.save(job)
