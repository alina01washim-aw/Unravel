import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const backendUrl =
      process.env.FASTAPI_BASE_URL || "http://127.0.0.1:8010";

    const response = await fetch(
      `${backendUrl}/api/ai/explain-scenario`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
        cache: "no-store",
      }
    );

    const data = await response.json();

    return NextResponse.json(data, {
      status: response.status,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        detail:
          error instanceof Error
            ? error.message
            : "Unable to connect to scenario service",
      },
      { status: 502 }
    );
  }
}