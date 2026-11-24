"""SentenceTransformerEmbedder loads the model on the CPU on every OS (Mac included).

A fake `sentence_transformers` module stands in for the real one, so no model
is downloaded or loaded.
"""

from __future__ import annotations

import sys
import types

import numpy as np
import pytest

from app.retrieval.embeddings import SentenceTransformerEmbedder


class _FakeModel:
    calls: list[tuple[str, dict]] = []

    def __init__(self, name: str, **kwargs: object) -> None:
        _FakeModel.calls.append((name, kwargs))
        if kwargs.get("local_files_only") and _FakeModel.missing_locally:
            raise OSError("not in the local Hugging Face cache")

    missing_locally = False

    def encode(self, texts: list[str], **_: object) -> np.ndarray:
        return np.ones((len(texts), 384), dtype=np.float32)


@pytest.fixture
def fake_st(monkeypatch: pytest.MonkeyPatch) -> type[_FakeModel]:
    module = types.ModuleType("sentence_transformers")
    module.SentenceTransformer = _FakeModel  # type: ignore[attr-defined]
    monkeypatch.setitem(sys.modules, "sentence_transformers", module)
    _FakeModel.calls = []
    _FakeModel.missing_locally = False
    return _FakeModel


def test_model_is_pinned_to_cpu(fake_st: type[_FakeModel]) -> None:
    vecs = SentenceTransformerEmbedder("m").embed(["a", "b"])
    assert vecs.shape == (2, 384)
    assert fake_st.calls == [("m", {"device": "cpu", "local_files_only": True})]


def test_download_fallback_is_also_cpu(fake_st: type[_FakeModel]) -> None:
    fake_st.missing_locally = True
    SentenceTransformerEmbedder("m").warm_up()
    assert [kw.get("device") for _, kw in fake_st.calls] == ["cpu", "cpu"]
