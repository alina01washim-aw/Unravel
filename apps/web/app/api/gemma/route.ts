import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const response = await fetch(
      "http://127.0.0.1:8010/api/ai/explain",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body.context),
        cache: "no-store",
      }
    );

    const data = await response.json();

    return NextResponse.json(
      {
        success: response.ok,
        model: "gemma-4-26b-a4b-it",
        task: "forecast_explanation",
        result: data,
      },
      { status: response.status }
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        detail:
          error instanceof Error
            ? error.message
            : "Unable to connect to UNRAVEL AI backend",
      },
      { status: 502 }
    );
  }
}
