"""M6: demo-mode replay, forced-429 fallback switch, eval metrics."""

from __future__ import annotations

import importlib.util
import json
import time
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app.config import REPO_ROOT
from app.llm.base import Message, RateLimitedError
from app.llm.router import ForcedRateLimitProvider, build_router
from app.main import create_app
from app.models.schemas import Extraction, Metric, ReviewRequest
from app.pipeline.demo import DemoIndex, normalise_topic
from app.pipeline.orchestrator import run_review
from app.services.cache import Cache
from tests.fakes import FakeProvider, make_router, make_services, make_settings
from tests.test_api_reviews import CANDS, REVIEW, TOPIC, AnyQueryArxiv, _extractions


def _live_services(tmp_path: Path):  # noqa: ANN202
    groq = FakeProvider(
        "groq",
        [
            json.dumps({"queries": ["crop disease CNN"]}),
            _extractions([1, 2, 3, 4]),
            REVIEW,
        ],
    )
    return make_services(
        tmp_path, groq=groq, arxiv=AnyQueryArxiv(), settings=make_settings(tmp_path)
    )


# ---------------- demo index ----------------


def test_demo_index_roundtrip(tmp_path: Path) -> None:
    from uuid import uuid4

    idx = DemoIndex(tmp_path / "demo" / "index.json")
    assert idx.topics() == [] and idx.lookup("x") is None
    jid = uuid4()
    idx.add("Crop  Disease Detection", jid)
    assert idx.lookup("crop disease   detection") == jid
    assert idx.topics() == ["Crop  Disease Detection"]
    assert normalise_topic("  A  B ") == "a b"


# ---------------- pipeline index flag ----------------


async def test_run_review_without_indexing(tmp_path: Path) -> None:
    services = _live_services(tmp_path)
    job = services.jobs.create(ReviewRequest(topic=TOPIC, max_papers=4))
    await run_review(job, services, index=False)
    assert job.result.status == "done" and job.result.qa_ready is False
    assert (job.events[-1].stage, job.events[-1].status) == ("indexing", "skipped")
    assert services.fetcher.requested == []  # type: ignore[attr-defined]


# ---------------- demo replay through the API ----------------


async def _prewarm(tmp_path: Path):  # noqa: ANN202
    """Run one fake 'live' review and record it, like scripts/prewarm.py."""
    live = _live_services(tmp_path)
    job = live.jobs.create(ReviewRequest(topic=TOPIC, max_papers=4))
    await run_review(job, live)
    assert job.result.status == "done" and job.result.qa_ready
    live.demo.add(TOPIC, job.id)
    return job


async def test_demo_mode_replays_offline(tmp_path: Path) -> None:
    source = await _prewarm(tmp_path)

    # A fresh "offline" server over the same data folder, with NO usable providers.
    settings = make_settings(tmp_path, demo_mode=True)
    offline = make_services(
        tmp_path,
        groq=FakeProvider("groq", []),  # any call would raise AssertionError
        settings=settings,
    )
    offline.arxiv.fail = True  # type: ignore[attr-defined]
    import app.pipeline.demo as demo_mod

    demo_mod.MAX_GAP_S = 0.01  # fast replay for the test
    try:
        with TestClient(create_app(settings, offline)) as c:
            assert c.get("/api/demo-topics").json()["topics"] == [TOPIC]
            bad = c.post("/api/reviews", json={"topic": "something else entirely"})
            assert bad.status_code == 422
            assert "demo topics" in bad.json()["error"]["message"]

            r = c.post("/api/reviews", json={"topic": TOPIC.upper()})
            assert r.status_code == 202
            jid = r.json()["job_id"]
            assert jid != str(source.id)
            events = []
            with c.stream("GET", f"/api/reviews/{jid}/events") as s:
                for line in s.iter_lines():
                    if line.startswith("data:"):
                        events.append(json.loads(line[5:]))
            assert [e["stage"] for e in events] == [e.stage for e in source.events]
            assert all(e["job_id"] == jid for e in events)
            body = c.get(f"/api/reviews/{jid}").json()
            assert body["job_id"] == jid and body["status"] == "done"
            assert body["review_md"] == source.result.review_md and body["qa_ready"]

            # Q&A uses the pre-warmed index; an unseen question can't reach an LLM
            ask = c.post(
                f"/api/reviews/{jid}/ask", json={"question": "crop disease CNN?"}
            )
            assert ask.status_code == 503
            assert "Offline demo mode" in ask.json()["error"]["message"]
    finally:
        demo_mod.MAX_GAP_S = 1.5

    # the replayed job remembers which index to use, even after a restart
    again = make_services(tmp_path, settings=settings)
    reloaded = again.jobs.get(__import__("uuid").UUID(jid))
    assert reloaded is not None and reloaded.vectors_id == source.id


# ---------------- forced 429 ----------------


async def test_forced_429_falls_back_to_gemini(tmp_path: Path) -> None:
    gemini = FakeProvider("gemini", ["from gemini"])
    router = make_router(
        tmp_path, groq=ForcedRateLimitProvider(FakeProvider("groq", [])), gemini=gemini
    )
    r = await router.complete(
        "plan", [Message("user", "hi")], prompt_version="v", max_tokens=10
    )
    assert (r.provider, r.text) == ("gemini", "from gemini")


async def test_forced_429_provider_raises() -> None:
    with pytest.raises(RateLimitedError):
        await ForcedRateLimitProvider(FakeProvider("groq", [])).complete()


def test_force_switch_only_in_dev(tmp_path: Path) -> None:
    cache = Cache(tmp_path / "c.sqlite")
    dev = make_settings(tmp_path, debug_force_groq_429=True, env="dev")
    prod = make_settings(tmp_path, debug_force_groq_429=True, env="prod")
    assert isinstance(build_router(dev, cache)._groq, ForcedRateLimitProvider)
    assert not isinstance(build_router(prod, cache)._groq, ForcedRateLimitProvider)


# ---------------- eval metrics ----------------


def _load_eval():  # noqa: ANN202
    spec = importlib.util.spec_from_file_location(
        "run_eval", REPO_ROOT / "eval" / "run_eval.py"
    )
    mod = importlib.util.module_from_spec(spec)  # type: ignore[arg-type]
    spec.loader.exec_module(mod)  # type: ignore[union-attr]
    return mod


def test_eval_topics_file_has_ten_topics() -> None:
    import yaml

    topics = yaml.safe_load((REPO_ROOT / "eval" / "topics.yaml").read_text("utf-8"))
    assert len(topics["topics"]) >= 10
    assert len({t["field"] for t in topics["topics"]}) >= 8


async def test_eval_metrics_and_report(tmp_path: Path) -> None:
    ev = _load_eval()
    services = _live_services(tmp_path)
    job = services.jobs.create(ReviewRequest(topic=TOPIC, max_papers=4))
    await run_review(job, services, index=False)
    r = job.result
    r.extractions[0] = Extraction(
        ref=1, method="CNN", datasets=["PV"], metrics=[Metric(name="Acc", value="9")]
    )
    assert 0 < ev.completeness(r) <= 1
    assert 0 <= ev.weak_share(r) <= 1
    row = ev.row({"topic": TOPIC, "field": "CV"}, r, 1.0)
    assert row["human_relevance_1to5"] == "" and row["status"] == "done"
    assert row["citation_validity_pct"] < 100  # REVIEW contains an invalid [42]
    out = tmp_path / "results.md"
    ev.write_markdown([row], out)
    text = out.read_text("utf-8")
    assert "Human relevance (1-5)" in text and TOPIC in text
    time.sleep(0)
    assert CANDS  # fixtures imported
