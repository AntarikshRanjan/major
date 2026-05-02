"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { motion } from "framer-motion";

import { ProgressBar } from "@/components/ProgressBar";
import { StepIndicator } from "@/components/StepIndicator";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { analyzePrompt, enhancePrompt } from "@/lib/api";
import { examplePrompts } from "@/lib/mock-data";
import { useAppStore } from "@/lib/store";

interface PromptFormValues {
  prompt: string;
}

function computeAddedLines(previousValue: string, nextValue: string): string[] {
  const previous = new Set(previousValue.split("\n").map((line) => line.trim()).filter(Boolean));
  return nextValue
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !previous.has(line));
}

export default function PromptPage() {
  const router = useRouter();
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const rawInput = useAppStore((state) => state.rawInput);
  const setMode = useAppStore((state) => state.setMode);
  const setRawInput = useAppStore((state) => state.setRawInput);
  const setJobId = useAppStore((state) => state.setJobId);
  const setSpec = useAppStore((state) => state.setSpec);
  const setQuestions = useAppStore((state) => state.setQuestions);
  const setCurrentQuestion = useAppStore((state) => state.setCurrentQuestion);
  const setGeneratedPreviewUrl = useAppStore((state) => state.setGeneratedPreviewUrl);
  const setGeneratedDownloadUrl = useAppStore((state) => state.setGeneratedDownloadUrl);

  const [isEnhancing, setIsEnhancing] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [addedLines, setAddedLines] = useState<string[]>([]);

  const { control, register, setValue, handleSubmit } = useForm<PromptFormValues>({
    defaultValues: {
      prompt: typeof rawInput === "string" ? rawInput : "",
    },
  });

  const promptValue = useWatch({
    control,
    name: "prompt",
    defaultValue: typeof rawInput === "string" ? rawInput : "",
  });
  const characterCount = promptValue.length;
  const registerResult = register("prompt", { required: true });

  useEffect(() => {
    setMode("prompt");
  }, [setMode]);

  useEffect(() => {
    const element = textareaRef.current;
    if (!element) {
      return;
    }
    element.style.height = "0px";
    element.style.height = `${Math.max(element.scrollHeight, 220)}px`;
  }, [promptValue]);

  const enhancementPreview = useMemo(
    () => addedLines.filter((line) => line.length > 0),
    [addedLines],
  );

  const handleEnhance = async () => {
    if (!promptValue.trim()) {
      return;
    }

    setIsEnhancing(true);
    try {
      const previous = promptValue;
      const response = await enhancePrompt(promptValue);
      setValue("prompt", response.enhanced, { shouldDirty: true });
      setAddedLines(computeAddedLines(previous, response.enhanced));
    } finally {
      setIsEnhancing(false);
    }
  };

  const onSubmit = handleSubmit(async ({ prompt }) => {
    setIsAnalyzing(true);
    try {
      const response = await analyzePrompt(prompt);
      setRawInput(prompt);
      setJobId(response.jobId);
      setSpec(response.spec);
      setQuestions(null);
      setCurrentQuestion(0);
      setGeneratedPreviewUrl(null);
      setGeneratedDownloadUrl(null);
      router.push("/build/processing");
    } finally {
      setIsAnalyzing(false);
    }
  });

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

        <section className="mx-auto mt-12 flex w-full max-w-4xl flex-1 flex-col">
          <div className="space-y-4 text-center md:text-left">
            <h1 className="text-4xl font-bold tracking-tight text-white md:text-5xl">
              Describe your website
            </h1>
            <p className="text-lg leading-8 text-[var(--muted)]">
              Be as detailed as possible. Include sections, colors, features,
              and style preferences.
            </p>
          </div>

          <form onSubmit={onSubmit} className="mt-8 space-y-8">
            <div className="space-y-3">
              <Textarea
                {...registerResult}
                ref={(element) => {
                  registerResult.ref(element);
                  textareaRef.current = element;
                }}
                placeholder="e.g. Build me a SaaS landing page with a dark theme. Include a hero section with a headline and CTA button, a 3-column features section, a pricing table with 3 tiers, testimonials, and a footer. Use purple and blue accent colors with smooth scroll animations..."
                className="min-h-[220px]"
              />
              <div className="flex items-center justify-between text-sm text-[var(--muted)]">
                <button
                  type="button"
                  onClick={handleEnhance}
                  disabled={isEnhancing || !promptValue.trim()}
                  className="text-[var(--accent-blue)] transition hover:text-white disabled:opacity-40"
                >
                  {isEnhancing ? "Enhancing..." : "Enhance my prompt"}
                </button>
                <span>{characterCount} characters</span>
              </div>
            </div>

            {enhancementPreview.length > 0 ? (
              <Card className="space-y-3 p-5">
                <div>
                  <p className="text-sm font-medium text-white">AI enhancements</p>
                  <p className="mt-1 text-sm text-[var(--muted)]">
                    New details added to strengthen the generation brief.
                  </p>
                </div>
                <div className="space-y-2">
                  {enhancementPreview.map((line) => (
                    <div
                      key={line}
                      className="rounded-2xl border border-[var(--accent-green)]/25 bg-[var(--accent-green)]/10 px-4 py-3 text-sm text-[var(--accent-green)]"
                    >
                      + {line}
                    </div>
                  ))}
                </div>
              </Card>
            ) : null}

            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-white">Need inspiration?</h2>
              <div className="flex flex-wrap gap-3">
                {examplePrompts.map((example) => (
                  <button
                    key={example.label}
                    type="button"
                    onClick={() => setValue("prompt", example.prompt, { shouldDirty: true })}
                    className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-white/80 transition hover:border-[var(--accent-blue)] hover:text-white"
                  >
                    {example.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end">
              <Button type="submit" size="lg" disabled={!promptValue.trim() || isAnalyzing}>
                {isAnalyzing ? "Analyzing..." : "Analyze Prompt →"}
              </Button>
            </div>
          </form>
        </section>
      </motion.div>
    </main>
  );
}
