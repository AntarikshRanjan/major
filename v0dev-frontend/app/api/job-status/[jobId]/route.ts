import { NextResponse } from "next/server";

import { getJobStatus } from "@/lib/mock-server";

interface RouteContext {
  params: Promise<{ jobId: string }>;
}

export async function GET(_: Request, context: RouteContext) {
  const { jobId } = await context.params;
  const status = getJobStatus(jobId);

  if (!status) {
    return NextResponse.json({ error: "Job not found." }, { status: 404 });
  }

  return NextResponse.json(status);
}
