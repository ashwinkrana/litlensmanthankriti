"""Evaluation harness (SRS FR-60..62).

Runs every topic in eval/topics.yaml through the real pipeline (without PDF
indexing, which the metrics don't need) and writes eval/results.md and
eval/results.csv. Results are cached, so re-runs are free.

Run from backend/ with the venv active:
    python ../eval/run_eval.py
    python ../eval/run_eval.py --limit 3        # first 3 topics only
"""

from __future__ import annotations

import argparse
import asyncio
import csv
import statistics
import sys
from datetime import UTC, datetime
from pathlib import Path

import yaml

EVAL_DIR = Path(__file__).resolve().parent
BACKEND = EVAL_DIR.parent / "backend"
sys.path.insert(0, str(BACKEND))

from app.agents.verifier import split_sentences  # noqa: E402
from app.models.schemas import NOT_REPORTED, ReviewResult  # noqa: E402
from scripts._runner import run_one, setup  # noqa: E402

STAGES = ["planning", "searching", "ranking", "extracting", "synthesizing", "verifying"]
TEXT_FIELDS = ("problem", "method", "key_result", "limitations")


def completeness(r: ReviewResult) -> float:
    """Share of extraction fields that are not "Not reported" (lists: non-empty)."""
    total = filled = 0
    for e in r.extractions:
        for f in TEXT_FIELDS:
            total += 1
            filled += getattr(e, f) != NOT_REPORTED
        total += 2
        filled += bool(e.datasets) + bool(e.metrics)
    return filled / total if total else 0.0


def weak_share(r: ReviewResult) -> float:
    """Distinct weakly supported sentences / sentences that carry a citation."""
    if not r.verification or not r.review_md:
        return 0.0
    cited = [s for s in split_sentences(r.review_md) if s.refs]
    weak = {w.sentence for w in r.verification.weak_claims}
    return len(weak) / len(cited) if cited else 0.0


def row(topic: dict, r: ReviewResult, wall_s: float) -> dict[str, object]:
    v = r.verification
    out: dict[str, object] = {
        "topic": topic["topic"],
        "field": topic.get("field", ""),
        "status": r.status,
        "papers_selected": r.stats.papers_selected,
        "papers_considered": r.stats.papers_considered,
    }
    for s in STAGES:
        out[f"{s}_s"] = round(r.stats.stage_ms.get(s, 0) / 1000, 1)
    out["total_s"] = round(r.stats.total_ms / 1000, 1)
    out["wall_s"] = round(wall_s, 1)
    out["tokens_20b"] = r.stats.tokens.get("openai/gpt-oss-20b", 0)
    out["tokens_120b"] = r.stats.tokens.get("openai/gpt-oss-120b", 0)
    out["tokens_total"] = sum(r.stats.tokens.values())
    out["providers"] = "+".join(r.stats.providers_used)
    out["citation_validity_pct"] = round(v.citation_validity * 100, 1) if v else ""
    out["weak_claim_pct"] = round(weak_share(r) * 100, 1)
    out["uncited_sentences"] = v.uncited_sentences if v else ""
    out["extraction_completeness_pct"] = round(completeness(r) * 100, 1)
    out["warnings"] = len(r.warnings)
    out["human_relevance_1to5"] = ""  # FR-62: filled in by hand
    return out


def _mean(rows: list[dict[str, object]], key: str) -> str:
    vals = [float(r[key]) for r in rows if r[key] not in ("", None)]
    return f"{statistics.mean(vals):.1f}" if vals else "-"


def write_markdown(rows: list[dict[str, object]], path: Path) -> None:
    ok = [r for r in rows if r["status"] == "done"]
    # Cached re-runs report ~0 s and 0 tokens; time/token means use fresh runs only.
    fresh = [r for r in ok if float(r["tokens_total"] or 0) > 0] or ok
    lines = [
        "# LitLens evaluation results",
        "",
        f"_Generated {datetime.now(UTC):%Y-%m-%d %H:%M} UTC from `eval/topics.yaml` "
        f"({len(rows)} topics, {len(ok)} completed). Indexing excluded._",
        "",
        "## Summary",
        "",
        f"{len(fresh)} of {len(ok)} completed runs were fresh (not served from the cache); "
        "quality metrics use all runs, time and token means use fresh runs only.",
        "",
        "| Metric | Mean |",
        "|---|---|",
        f"| Papers selected | {_mean(ok, 'papers_selected')} |",
        f"| Review time (s), fresh runs | {_mean(fresh, 'total_s')} |",
        f"| Tokens per run, fresh runs | {_mean(fresh, 'tokens_total')} |",
        f"| Citation validity (%) | {_mean(ok, 'citation_validity_pct')} |",
        f"| Weakly supported claims (%) | {_mean(ok, 'weak_claim_pct')} |",
        f"| Extraction completeness (%) | {_mean(ok, 'extraction_completeness_pct')} |",
        "",
        "## Per topic",
        "",
        "| Topic | Status | Papers | Time (s) | Tokens 20b / 120b | Citations valid % "
        "| Weak % | Uncited | Completeness % | Human relevance (1-5) |",
        "|---|---|---|---|---|---|---|---|---|---|",
    ]
    for r in rows:
        lines.append(
            f"| {r['topic']} | {r['status']} | {r['papers_selected']}/{r['papers_considered']} "
            f"| {r['total_s']} | {r['tokens_20b']} / {r['tokens_120b']} "
            f"| {r['citation_validity_pct']} | {r['weak_claim_pct']} | {r['uncited_sentences']} "
            f"| {r['extraction_completeness_pct']} | |"
        )
    lines += [
        "",
        "## Stage latencies (s)",
        "",
        "| Topic | " + " | ".join(STAGES) + " |",
        "|---|" + "---|" * len(STAGES),
    ]
    for r in rows:
        lines.append(
            f"| {r['topic']} | " + " | ".join(str(r[f"{s}_s"]) for s in STAGES) + " |"
        )
    lines += [
        "",
        "## How metrics are computed",
        "",
        "- **Citation validity**: valid `[n]` markers / all markers, before invalid ones are removed.",
        "- **Weakly supported claims**: distinct cited sentences whose embedding similarity to the "
        "cited paper (abstract or extracted facts) is below `SUPPORT_THRESHOLD`, as a share of all "
        "cited sentences.",
        "- **Extraction completeness**: share of the 6 extracted fields per paper that are not "
        '"Not reported" (datasets/metrics: non-empty).',
        "- **Human relevance**: score each review 1-5 by hand (how relevant are the selected papers "
        "to the topic?).",
        "- Times exclude background PDF indexing. A cached re-run reports 0 tokens.",
        "- Topics run back to back, so later fresh runs wait for Groq's 8K tokens-per-minute "
        "limit (visible as long `extracting` times). A single run, as in a live demo, does not.",
    ]
    path.write_text("\n".join(lines) + "\n", encoding="utf-8")


def report_only() -> int:
    """Rebuild results.md from results.csv (no API calls)."""
    with (EVAL_DIR / "results.csv").open(encoding="utf-8") as f:
        rows: list[dict[str, object]] = list(csv.DictReader(f))
    write_markdown(rows, EVAL_DIR / "results.md")
    print(f"Rewrote {EVAL_DIR / 'results.md'} from results.csv")
    return 0


async def main(limit: int | None) -> int:
    topics = yaml.safe_load((EVAL_DIR / "topics.yaml").read_text("utf-8"))["topics"]
    if limit:
        topics = topics[:limit]
    _, services = setup()
    rows: list[dict[str, object]] = []
    for i, t in enumerate(topics, start=1):
        print(f"[{i}/{len(topics)}] {t['topic']}", flush=True)
        job, wall = await run_one(services, t["topic"], index=False, verbose=False)
        r = row(t, job.result, wall)
        rows.append(r)
        print(
            f"    {r['status']} | {r['papers_selected']} papers | {r['total_s']}s | "
            f"{r['tokens_total']} tokens | citations {r['citation_validity_pct']}% | "
            f"weak {r['weak_claim_pct']}% | complete {r['extraction_completeness_pct']}%",
            flush=True,
        )
    with (EVAL_DIR / "results.csv").open("w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=list(rows[0].keys()))
        w.writeheader()
        w.writerows(rows)
    write_markdown(rows, EVAL_DIR / "results.md")
    await services.fetcher.aclose()
    print(f"\nWrote {EVAL_DIR / 'results.md'} and results.csv")
    return 0 if all(r["status"] == "done" for r in rows) else 1


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Run the LitLens evaluation")
    parser.add_argument("--limit", type=int, default=None)
    parser.add_argument(
        "--report-only", action="store_true", help="rebuild results.md from results.csv"
    )
    args = parser.parse_args()
    if args.report_only:
        raise SystemExit(report_only())
    raise SystemExit(asyncio.run(main(args.limit)))
