"""Local sentence embeddings (SRS C4). Model loads lazily on first use."""

from __future__ import annotations

import asyncio
import logging
import threading
from typing import Protocol

import numpy as np

log = logging.getLogger("litlens.embeddings")

MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"

# Always CPU. On Apple Silicon, sentence-transformers would otherwise pick the
# GPU ("mps") by itself: rankings would differ slightly from Windows (so demo
# data pre-warmed on one laptop would not match the other), and MPS is less
# reliable when called from worker threads (we embed in asyncio.to_thread).
# MiniLM is small; CPU is fast enough on both machines.
DEVICE = "cpu"


class Embedder(Protocol):
    def embed(self, texts: list[str]) -> np.ndarray:
        """Return an (n, d) float32 array of L2-normalised vectors."""
        ...


class SentenceTransformerEmbedder:
    """Loads from the local Hugging Face cache first (no network at run time).

    Only if the model is missing, and `allow_download` is true, does it fetch it
    once from huggingface.co (setup-time exception to SECURITY D-1).
    """

    def __init__(
        self, model_name: str = MODEL_NAME, *, allow_download: bool = True
    ) -> None:
        self._model_name = model_name
        self._allow_download = allow_download
        self._model = None
        self._lock = threading.Lock()

    def _load(self):
        with self._lock:
            if self._model is None:
                from sentence_transformers import SentenceTransformer

                try:
                    self._model = SentenceTransformer(
                        self._model_name, device=DEVICE, local_files_only=True
                    )
                except Exception:
                    if not self._allow_download:
                        raise
                    log.warning(
                        "Embedding model not cached; downloading once from huggingface.co"
                    )
                    self._model = SentenceTransformer(self._model_name, device=DEVICE)
            return self._model

    def warm_up(self) -> None:
        """Load the model now (call at startup so the first review isn't slow)."""
        self._load()

    def embed(self, texts: list[str]) -> np.ndarray:
        if not texts:
            return np.zeros((0, 384), dtype=np.float32)
        vecs = self._load().encode(
            texts,
            batch_size=32,
            normalize_embeddings=True,
            convert_to_numpy=True,
            show_progress_bar=False,
        )
        return np.asarray(vecs, dtype=np.float32)


async def aembed(embedder: Embedder, texts: list[str]) -> np.ndarray:
    """Embedding is CPU-bound: keep it off the event loop."""
    return await asyncio.to_thread(embedder.embed, texts)
