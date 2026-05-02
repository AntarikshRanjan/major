"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";

import { ProgressBar } from "@/components/ProgressBar";
import { QuestionCard } from "@/components/QuestionCard";
import { StepIndicator } from "@/components/StepIndicator";
import { Button } from "@/components/ui/button";
import { mergeAnswers } from "@/lib/api";
import { useAppStore } from "@/lib/store";

export default function McqPage() {
  const router = useRouter();
  const jobId = useAppStore((state) => state.jobId);
  const questions = useAppStore((state) => state.questions);
  const answers = useAppStore((state) => state.answers);
  const currentQuestion = useAppStore((state) => state.currentQuestion);
  const setCurrentQuestion = useAppStore((state) => state.setCurrentQuestion);
  const setAnswer = useAppStore((state) => state.setAnswer);
  const setSpec = useAppStore((state) => state.setSpec);

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!jobId || !questions || questions.length === 0) {
      router.replace("/build/processing");
    }
  }, [jobId, questions, router]);

  const current = questions?.[currentQuestion] ?? null;
  const total = questions?.length ?? 0;
  const currentAnswer = current ? answers[current.id] : undefined;

  const canAdvance = useMemo(() => {
    if (!current) {
      return false;
    }
    if (Array.isArray(currentAnswer)) {
      return currentAnswer.length > 0;
    }
    return typeof currentAnswer === "string" && currentAnswer.length > 0;
  }, [current, currentAnswer]);

  const handleNext = async () => {
    if (!questions || !current || !jobId) {
      return;
    }

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await mergeAnswers(jobId, answers);
      setSpec(response.updatedSpec);
      router.push("/build/generating");
    } finally {
      setIsSubmitting(false);
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
          <Link href="/build/processing" className="text-sm text-[var(--muted)] transition hover:text-white">
            Processing
          </Link>
          <StepIndicator total={4} currentStep={3} />
        </div>
        <div className="mt-6">
          <ProgressBar step={3} total={4} label="Step 3 of 4" />
        </div>

        <section className="mx-auto flex w-full max-w-4xl flex-1 flex-col justify-center py-10">
          <div className="space-y-3 text-center">
            <h1 className="text-4xl font-bold tracking-tight text-white md:text-5xl">
              Let&apos;s clarify a few things
            </h1>
            <p className="text-lg leading-8 text-[var(--muted)]">
              Answer these questions so we can build exactly what you want.
            </p>
            <p className="text-sm uppercase tracking-[0.22em] text-[var(--muted)]">
              Question {currentQuestion + 1} of {total}
            </p>
          </div>

          <div className="mt-10">
            {current ? (
              <AnimatePresence mode="wait">
                <QuestionCard
                  key={current.id}
                  question={current}
                  answer={currentAnswer}
                  onAnswer={(value) => setAnswer(current.id, value)}
                />
              </AnimatePresence>
            ) : (
              <div className="h-[360px] animate-pulse rounded-3xl bg-white/[0.04]" />
            )}
          </div>

          <div className="mt-8 flex items-center justify-between gap-4">
            <Button
              variant="secondary"
              size="lg"
              disabled={currentQuestion === 0}
              onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
            >
              ← Back
            </Button>
            <Button size="lg" disabled={!canAdvance || isSubmitting} onClick={handleNext}>
              {isSubmitting
                ? "Merging..."
                : currentQuestion === total - 1
                  ? "Generate My Website →"
                  : "Next →"}
            </Button>
          </div>

          <div className="mt-6 flex justify-center gap-2">
            {questions?.map((question, index) => (
              <div
                key={question.id}
                className={`h-2 rounded-full transition-all ${index === currentQuestion ? "w-8 bg-[var(--accent-blue)]" : "w-2 bg-white/10"}`}
              />
            ))}
          </div>
        </section>
      </motion.div>
    </main>
  );
}
