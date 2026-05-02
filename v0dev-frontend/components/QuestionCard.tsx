"use client";

import { motion } from "framer-motion";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Question, QuestionCategory } from "@/lib/types";

const categoryStyles: Record<QuestionCategory, string> = {
  animation: "border-[var(--accent-purple)]/30 bg-[var(--accent-purple)]/10 text-[var(--accent-purple)]",
  design: "border-[var(--accent-blue)]/30 bg-[var(--accent-blue)]/10 text-[var(--accent-blue)]",
  layout: "border-[var(--accent-green)]/30 bg-[var(--accent-green)]/10 text-[var(--accent-green)]",
  features: "border-[var(--accent-orange)]/30 bg-[var(--accent-orange)]/10 text-[var(--accent-orange)]",
};

interface QuestionCardProps {
  question: Question;
  answer: string | string[] | undefined;
  onAnswer: (value: string | string[]) => void;
}

export function QuestionCard({ question, answer, onAnswer }: QuestionCardProps) {
  const selectedValues = Array.isArray(answer) ? answer : answer ? [answer] : [];

  const handleSelect = (option: string) => {
    if (!question.multi) {
      onAnswer(option);
      return;
    }

    if (selectedValues.includes(option)) {
      onAnswer(selectedValues.filter((item) => item !== option));
      return;
    }

    onAnswer([...selectedValues, option]);
  };

  return (
    <motion.div
      key={question.id}
      initial={{ opacity: 0, x: 36 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -36 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      <Card className="space-y-6 p-8 md:p-10">
        <div className="space-y-4">
          <Badge className={categoryStyles[question.category]}>{question.category}</Badge>
          <h2 className="text-2xl font-semibold tracking-tight text-white md:text-3xl">
            {question.question}
          </h2>
          <p className="text-sm leading-7 text-[var(--muted)]">
            Why we&apos;re asking: {question.reason}
          </p>
        </div>
        <div className="grid gap-3">
          {question.options.map((option) => {
            const selected = selectedValues.includes(option);
            return (
              <button
                key={option}
                type="button"
                onClick={() => handleSelect(option)}
                className={cn(
                  "flex w-full items-center justify-between rounded-2xl border px-5 py-4 text-left text-sm transition-all duration-200 hover:scale-[1.01]",
                  selected
                    ? "border-[var(--accent-blue)] bg-[var(--accent-blue)]/10 text-white shadow-[0_0_0_1px_rgba(59,130,246,0.3)]"
                    : "border-white/10 bg-white/[0.02] text-white/80 hover:border-white/20 hover:bg-white/[0.04]",
                )}
              >
                <span>{option}</span>
                <span
                  className={cn(
                    "flex h-5 w-5 items-center justify-center rounded-full border text-[10px]",
                    selected ? "border-[var(--accent-blue)] bg-[var(--accent-blue)] text-white" : "border-white/20 text-transparent",
                  )}
                >
                  ✓
                </span>
              </button>
            );
          })}
        </div>
      </Card>
    </motion.div>
  );
}
