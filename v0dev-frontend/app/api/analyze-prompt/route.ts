import { NextRequest, NextResponse } from "next/server";

import { createPromptJob } from "@/lib/mock-server";

export async function POST(request: NextRequest) {
  const body = (await request.json()) as { prompt?: string };
  const prompt = body.prompt?.trim();

  if (!prompt) {
    return NextResponse.json({ error: "Prompt is required." }, { status: 400 });
  }

  const job = createPromptJob(prompt);
  return NextResponse.json({
    jobId: job.id,
    spec: job.spec,
  });
}
