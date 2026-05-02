import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const body = (await request.json()) as { prompt?: string };
  const prompt = body.prompt?.trim();

  if (!prompt) {
    return NextResponse.json({ error: "Prompt is required." }, { status: 400 });
  }

  const enhanced = `${prompt}

Please also:
- define a clear visual hierarchy for each section
- specify primary CTAs and their desired labels
- include responsive behavior expectations for mobile and tablet
- note preferred animation pacing and hover interactions
- call out any must-have product features or integrations`;

  return NextResponse.json({ enhanced });
}
