"""Health and other small endpoints (SRS §5.2)."""

from __future__ import annotations

from fastapi import APIRouter, Request

from app import __version__
from app.config import Settings
from app.models.schemas import DemoTopicsResponse, HealthResponse, ProvidersStatus

router = APIRouter(prefix="/api", tags=["misc"])


#  One-click chips on the home screen (SRS FR-4). M6 replaces this with pre-warmed topics.
DEFAULT_DEMO_TOPICS = [
    "crop disease detection using deep learning",
    "retrieval-augmented generation for question answering",
    "graph neural networks for drug discovery",
    "federated learning privacy attacks",
]


@router.get("/demo-topics", response_model=DemoTopicsResponse)
async def demo_topics(request: Request) -> DemoTopicsResponse:
    services = getattr(request.app.state, "services", None)
    prewarmed = services.demo.topics() if services is not None else []
    if request.app.state.settings.demo_mode:
        # Offline: only pre-warmed topics can run (FR-52).
        return DemoTopicsResponse(topics=prewarmed[:5])
    # Live: pre-warmed topics first (they're instant), then the defaults.
    topics = list(dict.fromkeys([*prewarmed, *DEFAULT_DEMO_TOPICS]))
    return DemoTopicsResponse(topics=topics[:5])


@router.get("/health", response_model=HealthResponse)
async def health(request: Request) -> HealthResponse:
    settings: Settings = request.app.state.settings
    return HealthResponse(
        version=__version__,
        env=settings.env,
        demo_mode=settings.demo_mode,
        providers=ProvidersStatus(
            groq=settings.groq_configured,
            gemini=settings.gemini_configured,
        ),
    )
