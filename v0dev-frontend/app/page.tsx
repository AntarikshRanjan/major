"use client";

import { useRouter } from "next/navigation";
import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";

import { analyzePrompt, uploadVideo } from "@/lib/api";
import { useAppStore } from "@/lib/store";

const chips = [
  "SaaS landing page with dark theme...",
  "Luxury fashion e-commerce",
  "Creative agency portfolio",
  "AI startup homepage",
];

export default function HomePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);

  const reset = useAppStore((state) => state.reset);
  const setMode = useAppStore((state) => state.setMode);
  const setRawInput = useAppStore((state) => state.setRawInput);
  const setJobId = useAppStore((state) => state.setJobId);

  const [prompt, setPrompt] = useState("");
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [attachedSource, setAttachedSource] = useState<"upload" | "record" | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const element = textareaRef.current;
    if (!element) {
      return;
    }
    element.style.height = "auto";
    element.style.height = `${Math.max(element.scrollHeight, 56)}px`;
  }, [prompt]);

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  const attachedLabel = useMemo(() => {
    if (!attachedFile) {
      return null;
    }
    return attachedFile.name;
  }, [attachedFile]);

  const startRecording = async () => {
    setError(null);
    if (isRecording) {
      return;
    }
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
      recorder.ondataavailable = (event: BlobEvent) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "video/webm" });
        const file = new File([blob], "screen-recording.webm", { type: "video/webm" });
        setAttachedFile(file);
        setAttachedSource("record");
        setIsRecording(false);
        streamRef.current?.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      };
      recorder.start();
      setIsRecording(true);
    } catch {
      setError("We could not access your screen. Please allow screen sharing and try again.");
    }
  };

  const stopRecording = () => {
    recorderRef.current?.stop();
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextFile = event.target.files?.item(0) ?? null;
    if (!nextFile) {
      return;
    }
    setAttachedFile(nextFile);
    setAttachedSource("upload");
    setError(null);
  };

  const handleStart = async () => {
    if (isSubmitting) {
      return;
    }

    const trimmedPrompt = prompt.trim();
    const mode = trimmedPrompt ? "prompt" : attachedFile ? (attachedSource === "record" ? "record" : "upload") : null;
    if (!mode) {
      return;
    }

    setIsSubmitting(true);
    setError(null);
    reset();
    setMode(mode);

    try {
      if (mode === "prompt") {
        const response = await analyzePrompt(trimmedPrompt);
        setRawInput(trimmedPrompt);
        setJobId(response.jobId);
      } else if (attachedFile) {
        const response = await uploadVideo(attachedFile);
        setRawInput(attachedFile);
        setJobId(response.jobId);
      }
      router.push("/build/processing");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden text-white">
      <video
        src="/background.mp4"
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 w-full h-full object-cover -z-10"
      />
      <div className="absolute inset-0 bg-black/20 -z-10" />

      <header className="fixed inset-x-0 top-0 z-30 border-b border-white/10 bg-white/10 px-8 py-4 backdrop-blur-md">
        <div className="mx-auto flex w-full items-center justify-between">
          <p className="font-mono text-2xl font-bold text-white">v0dev</p>
          <div className="flex items-center gap-3">
            <button type="button" className="rounded-full px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10">
              Sign In
            </button>
            <button type="button" className="rounded-full bg-white px-5 py-2 text-sm font-semibold text-black transition hover:bg-white/90">
              Get Started
            </button>
          </div>
        </div>
      </header>

      {isRecording ? (
        <div className="fixed right-8 top-24 z-40 flex items-center gap-3 rounded-full border border-red-400/30 bg-black/70 px-4 py-2 backdrop-blur-md">
          <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-red-500" />
          <span className="text-sm text-white">Recording...</span>
          <button
            type="button"
            onClick={stopRecording}
            className="rounded-full bg-red-500 px-3 py-1 text-xs font-semibold text-white transition hover:bg-red-400"
          >
            Stop
          </button>
        </div>
      ) : null}

      <section className="relative z-20 flex h-full flex-col items-center justify-center px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="space-y-5"
        >
          <span className="inline-flex rounded-full bg-white/10 px-4 py-1 text-sm text-white">
            AI Website Builder
          </span>
          <h1 className="text-balance text-4xl font-bold tracking-tight text-white md:text-6xl">
            Describe it. Record it. Build it.
          </h1>
          <p className="mx-auto max-w-2xl text-base text-white/60 md:text-lg">
            Turn any idea or website into a production-ready app
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.5 }}
          className="mt-8 w-full max-w-2xl rounded-2xl border border-white/20 bg-black/50 p-4 backdrop-blur-md"
        >
          <textarea
            ref={textareaRef}
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            rows={2}
            placeholder="Describe your website..."
            className="w-full resize-none border-none bg-transparent text-white outline-none placeholder:text-white/40"
          />

          {attachedLabel ? (
            <p className="mt-2 rounded-full bg-white/10 px-3 py-1 text-left text-xs text-white/80">{attachedLabel}</p>
          ) : null}

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="rounded-full bg-white/10 px-3 py-2 text-sm text-white transition hover:bg-white/20"
              >
                📎
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <button
                type="button"
                disabled
                className="cursor-not-allowed rounded-full bg-white/5 px-3 py-2 text-sm text-white/50"
              >
                🎤
              </button>
              <button
                type="button"
                onClick={startRecording}
                disabled={isRecording}
                className="rounded-full bg-white/10 px-3 py-2 text-sm text-white transition hover:bg-white/20 disabled:opacity-50"
              >
                📹
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button type="button" className="rounded-full bg-white/10 px-3 py-2 text-sm text-white">
                Build ▾
              </button>
              <button type="button" className="rounded-full bg-white/10 px-3 py-2 text-sm text-white">
                Image and Video ▾
              </button>
            </div>

            <button
              type="button"
              onClick={handleStart}
              disabled={isSubmitting || (!prompt.trim() && !attachedFile)}
              className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-black transition hover:bg-white/90 disabled:opacity-50"
            >
              {isSubmitting ? "Starting..." : "Start →"}
            </button>
          </div>

          {error ? <p className="mt-3 text-left text-sm text-red-300">{error}</p> : null}
        </motion.div>

        <div className="mt-5 flex w-full max-w-3xl flex-wrap items-center justify-center gap-2">
          {chips.map((chip, index) => (
            <motion.button
              key={chip}
              type="button"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.6 + index * 0.1 }}
              onClick={() => setPrompt(chip)}
              className="rounded-full bg-white/10 px-4 py-2 text-sm text-white transition hover:bg-white/20"
            >
              {chip}
            </motion.button>
          ))}
        </div>
      </section>

      <div className="fixed inset-x-0 bottom-8 z-30 flex justify-center">
        <button
          type="button"
          onClick={startRecording}
          disabled={isRecording}
          className="rounded-full bg-white px-5 py-2 text-sm font-semibold text-black transition hover:bg-white/90 disabled:opacity-50"
        >
          🎬 Screen Recorder →
        </button>
      </div>
    </main>
  );
}
