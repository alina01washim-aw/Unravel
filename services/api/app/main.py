from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.ai import router as ai_router
from app.scenario import router as scenario_router
from app.vision import router as vision_router

app = FastAPI(
    title="UNRAVEL AI API",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(ai_router)
app.include_router(scenario_router)
app.include_router(vision_router)


@app.get("/health")
def health() -> dict[str, str]:
    return {
        "status": "healthy",
        "service": "unravel-api",
    }
