"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";

import { ProgressBar } from "@/components/ProgressBar";
import { StepIndicator } from "@/components/StepIndicator";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { uploadVideo } from "@/lib/api";
import { useAppStore } from "@/lib/store";
import { formatBytes, formatDuration } from "@/lib/utils";

type RecordingPhase = "instructions" | "recording" | "preview";

export default function RecordPage() {
  const router = useRouter();
  const setMode = useAppStore((state) => state.setMode);
  const setRawInput = useAppStore((state) => state.setRawInput);
  const setJobId = useAppStore((state) => state.setJobId);

  const [phase, setPhase] = useState<RecordingPhase>("instructions");
  const [error, setError] = useState<string | null>(null);
  const [recordingBlob, setRecordingBlob] = useState<Blob | null>(null);
  const [recordingUrl, setRecordingUrl] = useState<string | null>(null);
  const [timer, setTimer] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);

  useEffect(() => {
    setMode("record");
  }, [setMode]);

  useEffect(() => {
    if (phase !== "recording") {
      return;
    }
    const interval = window.setInterval(() => {
      setTimer((value) => value + 1);
    }, 1000);
    return () => window.clearInterval(interval);
  }, [phase]);

  const recordingMeta = useMemo(() => {
    if (!recordingBlob) {
      return null;
    }
    return {
      size: formatBytes(recordingBlob.size),
    };
  }, [recordingBlob]);

  const stopTracks = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);

  useEffect(() => {
    return () => {
      if (recordingUrl) {
        URL.revokeObjectURL(recordingUrl);
      }
      stopTracks();
    };
  }, [recordingUrl, stopTracks]);

  const handleStartRecording = async () => {
    setError(null);
    if (
      typeof window === "undefined" ||
      !("MediaRecorder" in window) ||
      !navigator.mediaDevices?.getDisplayMedia
    ) {
      setError("Screen recording is not supported in this browser.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      streamRef.current = stream;
      chunksRef.current = [];
      const recorder = new MediaRecorder(stream);
      recorderRef.current = recorder;
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "video/webm" });
        const url = URL.createObjectURL(blob);
        setRecordingBlob(blob);
        setRecordingUrl(url);
        setPhase("preview");
      };
      recorder.start();
      setTimer(0);
      setPhase("recording");
    } catch {
      setError("We could not access your screen. Please allow screen sharing and try again.");
    }
  };

  const handleStopRecording = () => {
    recorderRef.current?.stop();
    stopTracks();
  };

  const handleUseRecording = async () => {
    if (!recordingBlob) {
      return;
    }

    setIsUploading(true);
    try {
      const file = new File([recordingBlob], "screen-recording.webm", {
        type: "video/webm",
      });
      const response = await uploadVideo(file);
      setRawInput(file);
      setJobId(response.jobId);
      router.push("/build/processing");
    } finally {
      setIsUploading(false);
    }
  };

  const resetRecording = () => {
    if (recordingUrl) {
      URL.revokeObjectURL(recordingUrl);
    }
    setRecordingBlob(null);
    setRecordingUrl(null);
    setTimer(0);
    setPhase("instructions");
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
          {phase === "instructions" ? (
            <Card className="space-y-8 p-8 md:p-10">
              <div className="space-y-4">
                <h1 className="text-4xl font-bold tracking-tight text-white md:text-5xl">
                  Let&apos;s record your screen
                </h1>
                <p className="text-lg leading-8 text-[var(--muted)]">
                  Record the website you want to reference and we&apos;ll capture
                  its structure, motion, and style.
                </p>
              </div>
              <ol className="space-y-4 text-base text-white/85">
                {[
                  "Click 'Start Recording' below",
                  "Select the browser tab or window to share",
                  "Navigate to the website you want to clone",
                  "Scroll through the full page slowly",
                  "Come back here and click 'Stop Recording'",
                ].map((item, index) => (
                  <li key={item} className="flex items-start gap-4">
                    <span className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-sm">
                      {index + 1}
                    </span>
                    <span className="leading-7">{item}</span>
                  </li>
                ))}
              </ol>
              <div className="rounded-2xl border border-[var(--accent-orange)]/20 bg-[var(--accent-orange)]/10 px-5 py-4 text-sm leading-7 text-[var(--accent-orange)]">
                Make sure to scroll through ALL sections of the website for best
                results.
              </div>
              {error ? <p className="text-sm text-[var(--accent-red)]">{error}</p> : null}
              <Button
                size="lg"
                onClick={handleStartRecording}
                className="w-full animate-pulse bg-[var(--accent-green)] hover:bg-[#34d26c]"
              >
                Start Recording
              </Button>
            </Card>
          ) : null}

          {phase === "recording" ? (
            <Card className="space-y-8 p-8 md:p-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="flex h-3 w-3 rounded-full bg-[var(--accent-red)] animate-pulse" />
                  <span className="text-lg font-medium text-white">Recording...</span>
                </div>
                <span className="font-mono text-2xl text-white">{formatDuration(timer)}</span>
              </div>
              <div className="flex items-center justify-center py-10">
                <div className="flex items-end gap-2">
                  {Array.from({ length: 10 }, (_, index) => (
                    <motion.span
                      key={index}
                      animate={{ height: [12, 42, 18, 30, 14] }}
                      transition={{
                        duration: 1.2,
                        repeat: Number.POSITIVE_INFINITY,
                        delay: index * 0.08,
                      }}
                      className="w-2 rounded-full bg-[var(--accent-red)]"
                    />
                  ))}
                </div>
              </div>
              <Button variant="danger" size="lg" onClick={handleStopRecording} className="w-full">
                Stop Recording
              </Button>
            </Card>
          ) : null}

          {phase === "preview" ? (
            <Card className="space-y-6 p-8 md:p-10">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight text-white">Preview your recording</h1>
                <p className="text-base leading-7 text-[var(--muted)]">
                  Check the capture before we analyze it.
                </p>
              </div>
              {recordingUrl ? (
                <video
                  src={recordingUrl}
                  controls
                  className="w-full rounded-3xl border border-[var(--border)] bg-black"
                />
              ) : null}
              <div className="flex flex-wrap items-center gap-4 text-sm text-[var(--muted)]">
                <span>Duration: {formatDuration(timer)}</span>
                <span>File size: {recordingMeta?.size ?? "—"}</span>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                <Button variant="secondary" size="lg" onClick={resetRecording}>
                  Re-record
                </Button>
                <Button size="lg" onClick={handleUseRecording} disabled={isUploading}>
                  {isUploading ? "Preparing..." : "Use This Recording →"}
                </Button>
              </div>
            </Card>
          ) : null}
        </section>
      </motion.div>
    </main>
  );
}
