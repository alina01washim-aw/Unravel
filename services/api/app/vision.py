import base64
import json
import os
from pathlib import Path

import cv2
import numpy as np
from dotenv import load_dotenv
from fastapi import APIRouter, File, HTTPException, UploadFile
from google import genai
from google.genai import types


ENV_PATH = Path(__file__).resolve().parents[1] / ".env"
load_dotenv(ENV_PATH, override=True)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMMA_MODEL = os.getenv("GEMMA_MODEL", "gemma-4-26b-a4b-it")

router = APIRouter(prefix="/api/ai", tags=["Gemma 4 Vision"])


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


def analyze_with_opencv(image_bytes: bytes) -> dict:
    array = np.frombuffer(image_bytes, dtype=np.uint8)
    image = cv2.imdecode(array, cv2.IMREAD_COLOR)

    if image is None:
        raise ValueError("Invalid image")

    original_h, original_w = image.shape[:2]

    # Resize for fast processing while preserving aspect ratio.
    max_width = 1280

    if original_w > max_width:
        scale = max_width / original_w
        image = cv2.resize(
            image,
            (int(original_w * scale), int(original_h * scale)),
            interpolation=cv2.INTER_AREA,
        )

    h, w = image.shape[:2]

    hsv = cv2.cvtColor(image, cv2.COLOR_BGR2HSV)

    # Blue/cyan water candidates.
    blue_mask = cv2.inRange(
        hsv,
        np.array([80, 35, 40], dtype=np.uint8),
        np.array([140, 255, 255], dtype=np.uint8),
    )

    # Lower image area is weighted because road/ground flooding is
    # operationally more useful than sky/background pixels.
    lower_start = int(h * 0.35)
    lower_mask = np.zeros_like(blue_mask)
    lower_mask[lower_start:, :] = 255

    lower_blue = cv2.bitwise_and(blue_mask, lower_mask)

    kernel = np.ones((5, 5), np.uint8)
    cleaned = cv2.morphologyEx(
        lower_blue,
        cv2.MORPH_OPEN,
        kernel,
        iterations=1,
    )
    cleaned = cv2.morphologyEx(
        cleaned,
        cv2.MORPH_CLOSE,
        kernel,
        iterations=2,
    )

    total_pixels = h * w
    lower_pixels = int(np.count_nonzero(lower_mask))

    water_candidate_percent = (
        float(np.count_nonzero(cleaned)) / total_pixels * 100
    )

    lower_candidate_percent = (
        float(np.count_nonzero(cleaned)) / lower_pixels * 100
        if lower_pixels
        else 0.0
    )

    # Largest connected region gives us a useful spatial continuity signal.
    num_labels, labels, stats, _ = cv2.connectedComponentsWithStats(
        cleaned,
        connectivity=8,
    )

    largest_component_percent = 0.0

    if num_labels > 1:
        largest_area = int(stats[1:, cv2.CC_STAT_AREA].max())
        largest_component_percent = (
            largest_area / total_pixels * 100
        )

    # Edge density is used only as a supporting visual-texture feature.
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    edges = cv2.Canny(gray, 80, 160)

    edge_density = float(np.count_nonzero(edges)) / total_pixels

    # Conservative evidence screening.
    if (
        lower_candidate_percent >= 12
        and largest_component_percent >= 4
    ):
        evidence_level = "HIGH"
    elif (
        lower_candidate_percent >= 5
        or largest_component_percent >= 2
    ):
        evidence_level = "MEDIUM"
    else:
        evidence_level = "LOW"

    return {
        "width": w,
        "height": h,
        "water_candidate_percent": round(
            water_candidate_percent, 2
        ),
        "lower_area_candidate_percent": round(
            lower_candidate_percent, 2
        ),
        "largest_connected_candidate_percent": round(
            largest_component_percent, 2
        ),
        "edge_density": round(edge_density, 4),
        "opencv_evidence_level": evidence_level,
    }


@router.post("/analyze-flood-image")
async def analyze_flood_image(
    image: UploadFile = File(...),
):
    try:
        if image.content_type not in {
            "image/jpeg",
            "image/png",
            "image/webp",
        }:
            raise HTTPException(
                status_code=415,
                detail="Upload a JPG, PNG or WEBP image",
            )

        image_bytes = await image.read()

        if len(image_bytes) > 8 * 1024 * 1024:
            raise HTTPException(
                status_code=413,
                detail="Image must be smaller than 8 MB",
            )

        cv_result = analyze_with_opencv(image_bytes)

        prompt = f"""
You are the visual reasoning layer of UNRAVEL AI.

Analyze the uploaded image as flood-response evidence.

OpenCV has already performed a visual screening pass.

OpenCV evidence:
{json.dumps(cv_result, indent=2)}

Rules:
1. The image is evidence, NOT ground truth.
2. OpenCV metrics are supporting evidence, not a flood probability.
3. Never invent a numerical flood probability.
4. Do not claim certainty from a single image.
5. Distinguish visible flooding from ambiguous wet surfaces, reflections,
   puddles, shadows or ordinary water.
6. Do not invent roads, shelters, locations, policies or emergency services.
7. Give an operationally useful but cautious interpretation.
8. Return ONLY valid JSON.

Return exactly:

{{
  "classification": "HIGH|MEDIUM|LOW",
  "summary": "string",
  "visual_cues": ["string", "string"],
  "uncertainty": "string",
  "action": "string"
}}

Interpret the image together with the OpenCV evidence.
"""

        client = get_client()

        response = client.models.generate_content(
            model=GEMMA_MODEL,
            contents=[
                types.Part.from_bytes(
                    data=image_bytes,
                    mime_type=image.content_type,
                ),
                prompt,
            ],
            config=types.GenerateContentConfig(
                temperature=0.2,
                max_output_tokens=800,
                thinking_config=types.ThinkingConfig(
                    thinking_level="minimal",
                ),
            ),
        )

        if not response.text:
            raise RuntimeError("Gemma returned an empty response")

        gemma_result = parse_json(response.text)

        return {
            "success": True,
            "model": GEMMA_MODEL,
            "task": "flood_visual_analysis",
            "opencv": cv_result,
            "gemma": gemma_result,
        }

    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Flood image analysis failed: {str(exc)}",
        )
