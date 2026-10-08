import json
import os
from pathlib import Path

from dotenv import load_dotenv
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from google import genai
from google.genai import types


# Load server-side secrets from services/api/.env
ENV_PATH = Path(__file__).resolve().parents[1] / ".env"
load_dotenv(ENV_PATH, override=True)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMMA_MODEL = os.getenv("GEMMA_MODEL", "gemma-4-26b-a4b-it")

router = APIRouter(prefix="/api/ai", tags=["ai"])


class ExplainRequest(BaseModel):
    zone_name: str
    status: str
    risk_probability: float = Field(ge=0, le=1)

    rainfall_6h_mm: float = Field(ge=0)
    antecedent_rainfall_mm: float = Field(ge=0)

    risk_6h: float = Field(ge=0, le=1)
    risk_12h: float = Field(ge=0, le=1)
    risk_24h: float = Field(ge=0, le=1)

    onset_hours: float = Field(ge=0)
    confidence: str

    top_drivers: list[str]


class ExplainResponse(BaseModel):
    summary: str
    why: list[str]
    uncertainty: str
    action: str


SYSTEM_RULES = """
You are the reasoning and communication layer of UNRAVEL AI.

UNRAVEL AI is a flood intelligence and decision-support platform.

You MUST follow these rules:

1. Never invent numerical flood probabilities.
2. Never change or reinterpret the supplied numerical prediction.
3. Never claim certainty when uncertainty exists.
4. Use ONLY the structured data supplied in the request.
5. Gemma explains the prediction. It does NOT generate the prediction.
6. Do not invent roads, shelters, locations, policies, emergency services or external facts.
7. Recommendations must be operationally cautious and grounded in the supplied context.
8. Return ONLY valid JSON.
9. Use exactly this JSON structure:

{
  "summary": "string",
  "why": ["string", "string"],
  "uncertainty": "string",
  "action": "string"
}
"""


def get_client() -> genai.Client:
    if not GEMINI_API_KEY:
        raise RuntimeError("GEMINI_API_KEY is not configured")

    return genai.Client(api_key=GEMINI_API_KEY)


def clean_json(text: str) -> dict:
    text = text.strip()

    if text.startswith("```"):
        text = text.replace("```json", "", 1)
        text = text.replace("```", "")
        text = text.strip()

    return json.loads(text)


@router.post("/explain", response_model=ExplainResponse)
def explain_forecast(payload: ExplainRequest) -> ExplainResponse:
    try:
        client = get_client()

        context = {
            "zone_name": payload.zone_name,
            "status": payload.status,
            "risk_probability": payload.risk_probability,
            "rainfall_6h_mm": payload.rainfall_6h_mm,
            "antecedent_rainfall_mm": payload.antecedent_rainfall_mm,
            "risk_6h": payload.risk_6h,
            "risk_12h": payload.risk_12h,
            "risk_24h": payload.risk_24h,
            "onset_hours": payload.onset_hours,
            "confidence": payload.confidence,
            "top_drivers": payload.top_drivers,
        }

        prompt = f"""
{SYSTEM_RULES}

Here is the authoritative flood prediction context:

{json.dumps(context, indent=2)}

Explain what the prediction means for an emergency-management operator.

The explanation should:
- summarize the current state
- identify the supplied drivers
- mention the uncertainty/confidence
- recommend a cautious operational next step

Do not create any new numbers.
Do not add any facts not present in the supplied context.
"""

        response = client.models.generate_content(
            model=GEMMA_MODEL,
            contents=prompt,
            config=types.GenerateContentConfig(
                temperature=0.2,
                max_output_tokens=1200,
                thinking_config=types.ThinkingConfig(
                    thinking_level="minimal"
                ),
            ),
        )

        if not response.text:
            raise RuntimeError("Gemma returned an empty response")

        parsed = clean_json(response.text)
        return ExplainResponse.model_validate(parsed)

    except Exception as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Gemma request failed: {str(exc)}",
        )
