import json
import os
from pathlib import Path

from dotenv import load_dotenv
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from google import genai
from google.genai import types


ENV_PATH = Path(__file__).resolve().parents[1] / ".env"
load_dotenv(ENV_PATH, override=True)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMMA_MODEL = os.getenv("GEMMA_MODEL", "gemma-4-26b-a4b-it")

router = APIRouter(prefix="/api/ai", tags=["Gemma 4"])


class ScenarioRequest(BaseModel):
    zone_name: str
    baseline_risk: float
    baseline_rainfall_6h_mm: float
    scenario_rainfall_6h_mm: float
    baseline_risk_6h: float
    baseline_risk_12h: float
    baseline_risk_24h: float
    baseline_onset_hours: float
    confidence: str


class ScenarioResponse(BaseModel):
    success: bool
    model: str
    task: str
    scenario: dict
    result: dict


def get_client() -> genai.Client:
    if not GEMINI_API_KEY:
        raise RuntimeError("GEMINI_API_KEY is not configured")

    return genai.Client(api_key=GEMINI_API_KEY)


def parse_json(text: str) -> dict:
    text = text.strip()

    if text.startswith("```"):
        text = text.replace("```json", "", 1)
        text = text.replace("```", "")
        text = text.strip()

    return json.loads(text)


@router.post("/explain-scenario", response_model=ScenarioResponse)
def explain_scenario(payload: ScenarioRequest):
    try:
        rainfall_change = (
            payload.scenario_rainfall_6h_mm
            - payload.baseline_rainfall_6h_mm
        )

        rainfall_ratio = (
            rainfall_change / payload.baseline_rainfall_6h_mm
            if payload.baseline_rainfall_6h_mm > 0
            else 0
        )

        # Transparent demo scenario engine.
        # This is a scenario estimate, not the production flood predictor.
        scenario_risk_6h = min(
            0.99,
            payload.baseline_risk_6h + (0.10 * rainfall_ratio),
        )

        scenario_risk_12h = min(
            0.99,
            payload.baseline_risk_12h + (0.10 * rainfall_ratio),
        )

        scenario_risk_24h = min(
            0.99,
            payload.baseline_risk_24h + (0.08 * rainfall_ratio),
        )

        scenario_onset_hours = max(
            1,
            payload.baseline_onset_hours - (2 * rainfall_ratio),
        )

        risk_change = scenario_risk_12h - payload.baseline_risk

        scenario = {
            "zone_name": payload.zone_name,
            "baseline_rainfall_6h_mm": payload.baseline_rainfall_6h_mm,
            "scenario_rainfall_6h_mm": payload.scenario_rainfall_6h_mm,
            "rainfall_change_mm": round(rainfall_change, 2),
            "baseline_risk": payload.baseline_risk,
            "scenario_risk_6h": round(scenario_risk_6h, 3),
            "scenario_risk_12h": round(scenario_risk_12h, 3),
            "scenario_risk_24h": round(scenario_risk_24h, 3),
            "risk_change": round(risk_change, 3),
            "baseline_onset_hours": payload.baseline_onset_hours,
            "scenario_onset_hours": round(scenario_onset_hours, 1),
            "confidence": payload.confidence,
            "is_scenario": True,
        }

        prompt = f"""
You are the reasoning layer of UNRAVEL AI.

Explain the operational meaning of the following WHAT-IF scenario.

Important rules:
- Do not invent new numbers.
- Do not alter the supplied scenario values.
- The scenario engine produced the numerical values.
- You only explain their meaning.
- Clearly distinguish a scenario from a real forecast.
- Do not invent roads, shelters, policies, locations, or emergency services.
- Mention uncertainty.
- Return ONLY valid JSON.

Use exactly:

{{
  "summary": "string",
  "why": ["string", "string"],
  "uncertainty": "string",
  "action": "string"
}}

SCENARIO CONTEXT:

{json.dumps(scenario, indent=2)}
"""

        client = get_client()

        response = client.models.generate_content(
            model=GEMMA_MODEL,
            contents=prompt,
            config=types.GenerateContentConfig(
                temperature=0.3,
                max_output_tokens=1200,
                thinking_config=types.ThinkingConfig(
                    thinking_level="minimal"
                ),
            ),
        )

        if not response.text:
            raise RuntimeError("Gemma returned an empty response")

        result = parse_json(response.text)

        return {
            "success": True,
            "model": GEMMA_MODEL,
            "task": "scenario_reasoning",
            "scenario": scenario,
            "result": result,
        }

    except Exception as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Scenario reasoning failed: {str(exc)}",
        )
