import { NextRequest, NextResponse } from "next/server";

import { mergeJobAnswers } from "@/lib/mock-server";

export async function POST(request: NextRequest) {
  const body = (await request.json()) as {
    jobId?: string;
    answers?: Record<string, string | string[]>;
  };

  if (!body.jobId || !body.answers) {
    return NextResponse.json({ error: "jobId and answers are required." }, { status: 400 });
  }

  const updatedSpec = mergeJobAnswers(body.jobId, body.answers);
  if (!updatedSpec) {
    return NextResponse.json({ error: "Job not found." }, { status: 404 });
  }

  return NextResponse.json({ updatedSpec });
}
