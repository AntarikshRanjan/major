import { NextRequest, NextResponse } from "next/server";

import { getGeneratedAssets } from "@/lib/mock-server";

export async function POST(request: NextRequest) {
  const body = (await request.json()) as { jobId?: string };
  if (!body.jobId) {
    return NextResponse.json({ error: "jobId is required." }, { status: 400 });
  }

  const generated = getGeneratedAssets(body.jobId);
  if (!generated) {
    return NextResponse.json({ error: "Job not found." }, { status: 404 });
  }

  return NextResponse.json(generated);
}
