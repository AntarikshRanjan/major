import { NextRequest, NextResponse } from "next/server";

import { createUploadJob } from "@/lib/mock-server";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get("video");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Video file is required." }, { status: 400 });
  }

  const job = createUploadJob(file.name);
  return NextResponse.json({ jobId: job.id });
}
