import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    const response = await fetch(
      "http://127.0.0.1:8010/api/ai/analyze-flood-image",
      {
        method: "POST",
        body: formData,
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
            : "Vision service unavailable",
      },
      { status: 502 }
    );
  }
}
