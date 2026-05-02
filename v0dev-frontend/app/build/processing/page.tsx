"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";

import { ProcessingStep } from "@/components/ProcessingStep";
import { Card } from "@/components/ui/card";
import { getCreativeSpec, getJobStatus, getMcqQuestions } from "@/lib/api";
import { rotatingMessages } from "@/lib/mock-data";
import { useAppStore } from "@/lib/store";
import type { ProcessingStepItem } from "@/lib/types";

const promptSteps = [
  "Parsing your description...",
  "Identifying sections and components...",
  "Building your CreativeSpec...",
  "Generating clarification questions...",
];

const videoSteps = [
  "Extracting video frames...",
  "Analyzing UI components...",
  "Detecting sections and layout...",
  "Identifying animations...",
  "Building your CreativeSpec...",
  "Generating clarification questions...",
];

export default function ProcessingPage() {
  const router = useRouter();
  const mode = useAppStore((state) => state.mode);
  const jobId = useAppStore((state) => state.jobId);
  const setSpec = useAppStore((state) => state.setSpec);
  const setQuestions = useAppStore((state) => state.setQuestions);
  const setCurrentQuestion = useAppStore((state) => state.setCurrentQuestion);

  const [progress, setProgress] = useState(6);
  const [activeStep, setActiveStep] = useState("");
  const [messageIndex, setMessageIndex] = useState(0);
  const [isCompleting, setIsCompleting] = useState(false);

  const steps = mode === "prompt" ? promptSteps : videoSteps;

  useEffect(() => {
    if (!mode || !jobId) {
      router.replace("/");
    }
  }, [jobId, mode, router]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setMessageIndex((value) => (value + 1) % rotatingMessages.length);
    }, 3000);

    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!jobId || isCompleting) {
      return;
    }

    const poll = async () => {
      const status = await getJobStatus(jobId);
      setProgress(status.progress);
      setActiveStep(status.step);

      if (status.status === "completed") {
        setIsCompleting(true);
        const [spec, mcq] = await Promise.all([
          getCreativeSpec(jobId),
          getMcqQuestions(jobId),
        ]);
        setSpec(spec);
        setQuestions(mcq.questions);
        setCurrentQuestion(0);
        window.setTimeout(() => {
          router.push("/build/mcq");
        }, 800);
      }
    };

    void poll();
    const interval = window.setInterval(() => {
      void poll();
    }, 1200);

    return () => window.clearInterval(interval);
  }, [isCompleting, jobId, router, setCurrentQuestion, setQuestions, setSpec]);

  const stepItems = useMemo<ProcessingStepItem[]>(() => {
    const activeIndex = Math.max(0, steps.findIndex((step) => step === activeStep));
    return steps.map((step, index) => ({
      id: `${index}-${step}`,
      label: step,
      status:
        progress >= 100
          ? "done"
          : index < activeIndex
            ? "done"
            : index === activeIndex
              ? "active"
              : "pending",
    }));
  }, [activeStep, progress, steps]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--background)] px-6 py-12 md:px-10">
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-3xl"
      >
        <Card className="space-y-10 p-8 md:p-10">
          <div className="space-y-3 text-center">
            <p className="font-mono text-sm uppercase tracking-[0.28em] text-[var(--accent-blue)]">
              v0dev analysis
            </p>
            <h1 className="text-4xl font-bold tracking-tight text-white md:text-5xl">
              Processing your input
            </h1>
          </div>

          <div className="space-y-5">
            {stepItems.map((step) => (
              <ProcessingStep key={step.id} label={step.label} status={step.status} />
            ))}
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm text-[var(--muted)]">
              <span>Progress</span>
              <span>{progress}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white/5">
              <motion.div
                className="h-full rounded-full bg-[var(--accent-blue)]"
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.35 }}
              />
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.03] px-5 py-4 text-center text-sm text-[var(--muted)]">
            {rotatingMessages[messageIndex]}
          </div>
        </Card>
      </motion.div>
    </main>
  );
}
