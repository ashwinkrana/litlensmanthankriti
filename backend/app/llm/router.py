"""LLM router: task -> model, cache, rate limits, retries and provider fallback (DESIGN §5).

Policy per call:
1. Cache hit on any route -> return it (provider "cache", 0 tokens).
2. Offline/demo mode and no cache -> fail.
3. Try routes in order (Groq, then Gemini):
   - 429 with retry-after <= 10 s: wait and retry once; otherwise next route.
   - 5xx / timeout: retry once, then next route.
   - other errors: next route.
"""

from __future__ import annotations

import asyncio
import json
import logging
from collections.abc import Awaitable, Callable
from dataclasses import dataclass
from typing import Any, Literal

from app.config import Settings
from app.llm.base import (
    InvalidOutputError,
    LLMError,
    LLMProvider,
    LLMResult,
    Message,
    PermanentError,
    RateLimitedError,
    TransientError,
)
from app.llm.ratelimit import RateLimiter, estimate_tokens
from app.services.cache import Cache, make_key

log = logging.getLogger("litlens.llm")

Task = Literal["plan", "extract", "synthesize", "answer"]
MAX_RETRY_AFTER_S = 10.0


class NoProviderError(LLMError):
    """No provider configured (or offline with a cache miss)."""


@dataclass(frozen=True)
class Route:
    provider: LLMProvider
    model: str


class LLMRouter:
    def __init__(
        self,
        settings: Settings,
        cache: Cache,
        *,
        groq: LLMProvider | None,
        gemini: LLMProvider | None,
        limiter: RateLimiter | None = None,
        offline: bool = False,
        sleep: Callable[[float], Awaitable[None]] = asyncio.sleep,
    ) -> None:
        self._settings = settings
        self._cache = cache
        self._groq = groq
        self._gemini = gemini if settings.gemini_model.strip() else None
        self._limiter = limiter or RateLimiter(settings.groq_tpm, settings.groq_rpm)
        self._offline = offline
        self._sleep = sleep

    @property
    def fallback_available(self) -> bool:
        return self._gemini is not None

    def model_for(self, task: Task) -> str:
        s = self._settings
        return s.groq_fast_model if task in ("plan", "extract") else s.groq_smart_model

    def routes(self, task: Task, *, fallback_only: bool = False) -> list[Route]:
        out: list[Route] = []
        if self._groq is not None and not fallback_only:
            out.append(Route(self._groq, self.model_for(task)))
        if self._gemini is not None:
            out.append(Route(self._gemini, self._settings.gemini_model.strip()))
        return out

    @staticmethod
    def cache_key(
        route: Route,
        prompt_version: str,
        messages: list[Message],
        schema: dict[str, Any] | None,
        max_tokens: int,
    ) -> str:
        return make_key(
            route.provider.name,
            route.model,
            prompt_version,
            [m.as_dict() for m in messages],
            schema,
            max_tokens,
        )

    async def complete(
        self,
        task: Task,
        messages: list[Message],
        *,
        prompt_version: str,
        max_tokens: int,
        json_schema: dict[str, Any] | None = None,
        schema_name: str = "output",
        fallback_only: bool = False,
    ) -> LLMResult:
        routes = self.routes(task, fallback_only=fallback_only)
        if not routes:
            raise NoProviderError("No LLM provider configured")

        keys = [
            self.cache_key(r, prompt_version, messages, json_schema, max_tokens)
            for r in routes
        ]
        for route, key in zip(routes, keys, strict=True):
            hit = self._cache.get_llm(key)
            if hit is not None:
                return LLMResult(hit.text, 0, 0, "cache", route.model)
        if self._offline:
            raise NoProviderError("Offline demo mode: response not in cache")

        prompt_chars = len(json.dumps([m.as_dict() for m in messages]))
        if json_schema is not None:
            prompt_chars += len(json.dumps(json_schema))
        last_error: LLMError | None = None

        for route, key in zip(routes, keys, strict=True):
            try:
                result = await self._call_with_retry(
                    route, messages, max_tokens, json_schema, schema_name, prompt_chars
                )
            except LLMError as e:
                log.warning(
                    "task=%s provider=%s model=%s failed: %s",
                    task,
                    route.provider.name,
                    route.model,
                    e,
                )
                last_error = e
                continue
            self._cache.set_llm(key, result.text, result.tokens_in, result.tokens_out)
            log.info(
                "task=%s provider=%s model=%s tokens_in=%d tokens_out=%d",
                task,
                result.provider,
                result.model,
                result.tokens_in,
                result.tokens_out,
            )
            return result

        raise last_error or LLMError("All providers failed")

    async def _call_with_retry(
        self,
        route: Route,
        messages: list[Message],
        max_tokens: int,
        json_schema: dict[str, Any] | None,
        schema_name: str,
        prompt_chars: int,
    ) -> LLMResult:
        retried = False
        while True:
            reservation = None
            if route.provider.name == "groq":
                est = estimate_tokens(prompt_chars, max_tokens)
                reservation = await self._limiter.acquire(route.model, est)
            try:
                result = await route.provider.complete(
                    messages,
                    route.model,
                    max_tokens=max_tokens,
                    json_schema=json_schema,
                    schema_name=schema_name,
                )
            except RateLimitedError as e:
                # A 429 was rejected, so it used no tokens.
                if reservation is not None:
                    self._limiter.reconcile(reservation, 0)
                wait = e.retry_after
                if retried or wait is None or wait > MAX_RETRY_AFTER_S:
                    raise
                retried = True
                await self._sleep(wait)
                continue
            except TransientError as e:
                # Keep the estimate if the server may have processed it (timeout/5xx).
                if reservation is not None and not e.reached_server:
                    self._limiter.reconcile(reservation, 0)
                if retried:
                    raise
                retried = True
                continue
            except InvalidOutputError:
                raise  # the model DID generate: keep the token estimate reserved
            except PermanentError:
                if reservation is not None:
                    self._limiter.reconcile(reservation, 0)
                raise
            if reservation is not None:
                self._limiter.reconcile(reservation, result.tokens)
            return result


class ForcedRateLimitProvider:
    """Wraps a provider and fails every call with a long 429 (fallback testing)."""

    def __init__(self, inner: LLMProvider) -> None:
        self.name = inner.name

    async def complete(self, *args: Any, **kwargs: Any) -> LLMResult:
        raise RateLimitedError("forced 429 (DEBUG_FORCE_GROQ_429)", retry_after=60)


def build_router(settings: Settings, cache: Cache) -> LLMRouter:
    """Create providers from settings. Imports are local so tests never need keys."""
    groq_p: LLMProvider | None = None
    gemini_p: LLMProvider | None = None
    if settings.groq_api_key is not None:
        from app.llm.groq_provider import GroqProvider

        groq_p = GroqProvider(
            settings.groq_api_key.get_secret_value(),
            reasoning_effort=settings.groq_reasoning_effort,
            timeout_s=settings.llm_timeout_s,
        )
        if settings.debug_force_groq_429 and settings.is_dev:
            log.warning(
                "DEBUG_FORCE_GROQ_429 is on: every Groq call will fail with 429"
            )
            groq_p = ForcedRateLimitProvider(groq_p)
    if settings.gemini_configured and settings.gemini_api_key is not None:
        from app.llm.gemini_provider import GeminiProvider

        gemini_p = GeminiProvider(
            settings.gemini_api_key.get_secret_value(),
            thinking_level=settings.gemini_thinking_level,
            timeout_s=settings.llm_timeout_s,
        )
    return LLMRouter(
        settings, cache, groq=groq_p, gemini=gemini_p, offline=settings.demo_mode
    )
