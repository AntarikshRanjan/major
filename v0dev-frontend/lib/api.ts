import axios from "axios";

import type {
  AnalyzePromptResponse,
  CreativeSpec,
  EnhancePromptResponse,
  GenerateResponse,
  JobStatusResponse,
  McqResponse,
  MergeAnswersResponse,
  UploadVideoResponse,
} from "@/lib/types";

const api = axios.create({
  baseURL: "/api",
});

export async function enhancePrompt(prompt: string): Promise<EnhancePromptResponse> {
  const { data } = await api.post<EnhancePromptResponse>("/enhance-prompt", { prompt });
  return data;
}

export async function analyzePrompt(prompt: string): Promise<AnalyzePromptResponse> {
  const { data } = await api.post<AnalyzePromptResponse>("/analyze-prompt", { prompt });
  return data;
}

export async function uploadVideo(file: File): Promise<UploadVideoResponse> {
  const formData = new FormData();
  formData.append("video", file);
  const { data } = await api.post<UploadVideoResponse>("/upload-video", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return data;
}

export async function getJobStatus(jobId: string): Promise<JobStatusResponse> {
  const { data } = await api.get<JobStatusResponse>(`/job-status/${jobId}`);
  return data;
}

export async function getCreativeSpec(jobId: string): Promise<CreativeSpec> {
  const { data } = await api.get<CreativeSpec>(`/creative-spec/${jobId}`);
  return data;
}

export async function getMcqQuestions(jobId: string): Promise<McqResponse> {
  const { data } = await api.get<McqResponse>(`/mcq-questions/${jobId}`);
  return data;
}

export async function mergeAnswers(
  jobId: string,
  answers: Record<string, string | string[]>,
): Promise<MergeAnswersResponse> {
  const { data } = await api.post<MergeAnswersResponse>("/merge-answers", { jobId, answers });
  return data;
}

export async function generateWebsite(jobId: string): Promise<GenerateResponse> {
  const { data } = await api.post<GenerateResponse>("/generate", { jobId });
  return data;
}
