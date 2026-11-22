"""Test doubles: no network, no real models, no keys."""

from __future__ import annotations

import hashlib
import re
from datetime import date
from pathlib import Path
from typing import Any

import numpy as np

from app.config import Settings
from app.llm.base import LLMResult, Message
from app.llm.ratelimit import RateLimiter
from app.llm.router import LLMRouter
from app.models.internal import Candidate
from app.models.schemas import Paper, StageEvent
from app.pipeline.context import RunContext
from app.services.arxiv_client import ArxivClient
from app.services.cache import Cache


class FakeProvider:
    """Replays scripted outcomes: a str is returned as text, an Exception is raised."""

    def __init__(self, name: str, script: list[str | Exception]) -> None:
        self.name = name
        self.script = list(script)
        self.calls: list[dict[str, Any]] = []

    async def complete(
        self,
        messages: list[Message],
        model: str,
        *,
        max_tokens: int,
        json_schema: dict[str, Any] | None = None,
        schema_name: str = "output",
    ) -> LLMResult:
        self.calls.append({"messages": messages, "model": model, "schema": json_schema})
        if not self.script:
            raise AssertionError(f"{self.name}: unexpected extra call")
        item = self.script.pop(0)
        if isinstance(item, Exception):
            raise item
        return LLMResult(item, 100, 50, self.name, model)


class StubEmbedder:
    """Deterministic bag-of-words vectors: shared words -> higher cosine."""

    DIM = 64

    def embed(self, texts: list[str]) -> np.ndarray:
        out = np.zeros((len(texts), self.DIM), dtype=np.float32)
        for i, t in enumerate(texts):
            for w in re.findall(r"[a-z0-9]+", t.lower()):
                h = int(hashlib.md5(w.encode()).hexdigest(), 16)  # noqa: S324
                out[i, h % self.DIM] += 1.0
            n = np.linalg.norm(out[i])
            if n:
                out[i] /= n
        return out


class FakeArxiv:
    def __init__(self, results: dict[str, list[Candidate]] | None = None) -> None:
        self.results = results or {}
        self.queries: list[str] = []
        self.fail = False

    async def search(self, query: str, max_results: int = 10) -> list[Candidate]:
        from app.services.arxiv_client import ArxivUnavailableError

        self.queries.append(query)
        if self.fail:
            raise ArxivUnavailableError("down")
        return self.results.get(query, [])[:max_results]


async def _no_sleep(_: float) -> None:
    return None


def make_settings(tmp_path: Path, **overrides: Any) -> Settings:
    base: dict[str, Any] = {
        "_env_file": None,
        "groq_api_key": "test-key",
        "data_dir": tmp_path / "data",
    }
    base.update(overrides)
    return Settings(**base)


def make_router(
    tmp_path: Path,
    *,
    groq: FakeProvider | None = None,
    gemini: FakeProvider | None = None,
    offline: bool = False,
    cache: Cache | None = None,
) -> LLMRouter:
    settings = make_settings(
        tmp_path, gemini_model="gemini-test" if gemini else "", gemini_api_key="k"
    )
    cache = cache or Cache(tmp_path / "cache.sqlite")
    return LLMRouter(
        settings,
        cache,
        groq=groq,
        gemini=gemini,
        limiter=RateLimiter(100_000, 1000, sleep=_no_sleep),
        offline=offline,
        sleep=_no_sleep,
    )


def make_ctx(
    tmp_path: Path,
    router: LLMRouter,
    arxiv: FakeArxiv | ArxivClient | None = None,
) -> tuple[RunContext, list[StageEvent]]:
    events: list[StageEvent] = []

    async def emit(e: StageEvent) -> None:
        events.append(e)

    ctx = RunContext(
        settings=make_settings(tmp_path),
        router=router,
        arxiv=arxiv or FakeArxiv(),  # type: ignore[arg-type]
        embedder=StubEmbedder(),
        emit_fn=emit,
    )
    return ctx, events


class FakeFetcher:
    """arxiv_id -> local PDF path; anything else fails like a broken download."""

    def __init__(self, pdfs: dict[str, Path]) -> None:
        self.pdfs = pdfs
        self.requested: list[str] = []

    async def fetch(self, arxiv_id: str) -> Path:
        from app.retrieval.pdf import PdfError

        self.requested.append(arxiv_id)
        if arxiv_id not in self.pdfs:
            raise PdfError("download failed")
        return self.pdfs[arxiv_id]


def make_pdf(path: Path, pages: list[str]) -> Path:
    """Write a real (tiny) PDF with one text block per page."""
    import pymupdf

    doc = pymupdf.open()
    for text in pages:
        page = doc.new_page()
        page.insert_textbox(pymupdf.Rect(50, 50, 550, 800), text, fontsize=9)
    doc.save(path)
    doc.close()
    return path


def make_services(
    tmp_path: Path,
    *,
    groq: FakeProvider | None = None,
    gemini: FakeProvider | None = None,
    arxiv: FakeArxiv | None = None,
    settings: Settings | None = None,
    fetcher: FakeFetcher | None = None,
):  # -> Services (import kept local to avoid cycles)
    from app.pipeline.demo import DemoIndex
    from app.pipeline.jobs import JobRegistry
    from app.pipeline.services import Services
    from app.retrieval.vectorstore import NumpyStore

    cache = Cache(tmp_path / "svc-cache.sqlite")
    s = settings or make_settings(tmp_path)
    router = make_router(
        tmp_path, groq=groq, gemini=gemini, cache=cache, offline=s.demo_mode
    )
    return Services(
        settings=s,
        cache=cache,
        router=router,
        arxiv=arxiv or FakeArxiv(),  # type: ignore[arg-type]
        embedder=StubEmbedder(),
        jobs=JobRegistry(tmp_path / "reviews"),
        fetcher=fetcher or FakeFetcher({}),  # type: ignore[arg-type]
        vectors=NumpyStore(tmp_path / "vectors"),
        demo=DemoIndex(tmp_path / "demo" / "index.json"),
    )


def candidate(
    arxiv_id: str, title: str, abstract: str = "", year: int = 2024
) -> Candidate:
    return Candidate(
        arxiv_id=arxiv_id,
        title=title,
        authors=["A. Author"],
        published=date(year, 1, 2),
        primary_category="cs.LG",
        abstract=abstract or title,
    )


def paper(ref: int, title: str = "Title", abstract: str = "Abstract") -> Paper:
    aid = f"2401.{ref:05d}"
    return Paper(
        ref=ref,
        arxiv_id=aid,
        title=title,
        authors=["A"],
        year=2024,
        published=date(2024, 1, 1),
        primary_category="cs.LG",
        abstract=abstract,
        url_abs=f"https://arxiv.org/abs/{aid}",
        url_pdf=f"https://arxiv.org/pdf/{aid}",
        relevance=0.5,
    )
