"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { DragEvent, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";

import { ProgressBar } from "@/components/ProgressBar";
import { StepIndicator } from "@/components/StepIndicator";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { uploadVideo } from "@/lib/api";
import { useAppStore } from "@/lib/store";
import { formatBytes, formatDuration } from "@/lib/utils";

type VideoMeta = {
  duration: number | null;
  previewUrl: string | null;
};

export default function UploadPage() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const setMode = useAppStore((state) => state.setMode);
  const setRawInput = useAppStore((state) => state.setRawInput);
  const setJobId = useAppStore((state) => state.setJobId);

  const [file, setFile] = useState<File | null>(null);
  const [meta, setMeta] = useState<VideoMeta>({ duration: null, previewUrl: null });
  const [dragging, setDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    setMode("upload");
  }, [setMode]);

  useEffect(() => {
    if (!file) {
      return;
    }

    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.preload = "metadata";
    video.src = url;
    video.onloadedmetadata = () => {
      setMeta({ duration: video.duration, previewUrl: url });
    };

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [file]);

  const canAnalyze = file !== null && !isUploading;

  const handleFile = (selectedFile: File | null) => {
    if (!selectedFile) {
      return;
    }
    setFile(selectedFile);
    setMeta({ duration: null, previewUrl: null });
    setUploadProgress(0);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);
    handleFile(event.dataTransfer.files.item(0));
  };

  const fileDetails = useMemo(() => {
    if (!file) {
      return [];
    }
    return [
      `Size: ${formatBytes(file.size)}`,
      `Duration: ${meta.duration ? formatDuration(meta.duration) : "—"}`,
    ];
  }, [file, meta.duration]);

  const handleAnalyze = async () => {
    if (!file) {
      return;
    }
    setIsUploading(true);
    setUploadProgress(8);
    const timer = window.setInterval(() => {
      setUploadProgress((value) => (value >= 90 ? value : value + 12));
    }, 180);

    try {
      const response = await uploadVideo(file);
      setUploadProgress(100);
      setRawInput(file);
      setJobId(response.jobId);
      router.push("/build/processing");
    } finally {
      window.clearInterval(timer);
      setIsUploading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[var(--background)] px-6 py-8 md:px-10">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-5xl flex-col"
      >
        <div className="flex items-center justify-between">
          <Link href="/" className="text-sm text-[var(--muted)] transition hover:text-white">
            ← Back
          </Link>
          <StepIndicator total={4} currentStep={1} />
        </div>
        <div className="mt-6">
          <ProgressBar step={1} total={4} label="Step 1 of 4" />
        </div>

        <section className="mx-auto flex w-full max-w-4xl flex-1 flex-col justify-center py-10">
          <div className="space-y-4 text-center md:text-left">
            <h1 className="text-4xl font-bold tracking-tight text-white md:text-5xl">
              Upload your video
            </h1>
            <p className="text-lg leading-8 text-[var(--muted)]">
              Drop in an existing screen recording and we&apos;ll analyze it end
              to end.
            </p>
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
            <Card
              onDragOver={(event) => {
                event.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              className={`flex min-h-[320px] flex-col items-center justify-center rounded-[32px] border-2 border-dashed p-8 text-center transition ${
                dragging ? "border-[var(--accent-purple)] bg-[var(--accent-purple)]/10" : "border-white/12"
              }`}
            >
              <div className="space-y-4">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-white/10 bg-white/5">
                  <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M12 16V5" strokeLinecap="round" />
                    <path d="m7 10 5-5 5 5" strokeLinecap="round" strokeLinejoin="round" />
                    <rect x="4" y="16" width="16" height="4" rx="2" />
                  </svg>
                </div>
                <div>
                  <p className="text-xl font-semibold text-white">Drag &amp; drop your video here</p>
                  <p className="mt-2 text-sm text-[var(--muted)]">or click to browse</p>
                </div>
                <p className="text-xs uppercase tracking-[0.22em] text-[var(--muted)]">
                  MP4, MOV, WEBM — max 500MB
                </p>
              </div>
              <input
                ref={inputRef}
                type="file"
                accept="video/mp4,video/quicktime,video/webm"
                className="hidden"
                onChange={(event) => handleFile(event.target.files?.item(0) ?? null)}
              />
              <Button variant="secondary" className="mt-8" onClick={() => inputRef.current?.click()}>
                Browse Files
              </Button>
            </Card>

            <Card className="space-y-5 p-6">
              <div>
                <h2 className="text-lg font-semibold text-white">For best results</h2>
                <ul className="mt-4 space-y-3 text-sm leading-7 text-[var(--muted)]">
                  <li>• Record the full page by scrolling slowly</li>
                  <li>• Keep the recording under 2 minutes</li>
                  <li>• Make sure the website is fully loaded before scrolling</li>
                </ul>
              </div>
              {file ? (
                <div className="space-y-4 rounded-3xl border border-white/10 bg-white/[0.03] p-4">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-white">{file.name}</p>
                    <div className="flex flex-wrap gap-3 text-xs text-[var(--muted)]">
                      {fileDetails.map((item) => (
                        <span key={item}>{item}</span>
                      ))}
                    </div>
                  </div>
                  {meta.previewUrl ? (
                    <video src={meta.previewUrl} controls className="w-full rounded-2xl border border-white/10 bg-black" />
                  ) : (
                    <div className="h-40 animate-pulse rounded-2xl bg-white/5" />
                  )}
                </div>
              ) : (
                <div className="h-56 animate-pulse rounded-3xl bg-white/[0.03]" />
              )}
            </Card>
          </div>

          {isUploading ? (
            <div className="mt-6">
              <ProgressBar step={uploadProgress} total={100} label="Uploading and preparing your video" />
            </div>
          ) : null}

          <div className="mt-8 flex justify-end">
            <Button size="lg" disabled={!canAnalyze} onClick={handleAnalyze}>
              Analyze Video →
            </Button>
          </div>
        </section>
      </motion.div>
    </main>
  );
}
