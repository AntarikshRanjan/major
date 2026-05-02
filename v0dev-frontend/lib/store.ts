"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import type { CreativeSpec, InputMode, Question } from "@/lib/types";

interface AppState {
  mode: InputMode | null;
  jobId: string | null;
  rawInput: string | File | null;
  spec: CreativeSpec | null;
  questions: Question[] | null;
  answers: Record<string, string | string[]>;
  currentQuestion: number;
  generatedPreviewUrl: string | null;
  generatedDownloadUrl: string | null;
  setMode: (mode: InputMode | null) => void;
  setJobId: (id: string | null) => void;
  setRawInput: (input: string | File | null) => void;
  setSpec: (spec: CreativeSpec | null) => void;
  setQuestions: (questions: Question[] | null) => void;
  setAnswer: (id: string, answer: string | string[]) => void;
  setCurrentQuestion: (index: number) => void;
  setGeneratedPreviewUrl: (url: string | null) => void;
  setGeneratedDownloadUrl: (url: string | null) => void;
  reset: () => void;
}

const initialState = {
  mode: null,
  jobId: null,
  rawInput: null,
  spec: null,
  questions: null,
  answers: {},
  currentQuestion: 0,
  generatedPreviewUrl: null,
  generatedDownloadUrl: null,
};

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      ...initialState,
      setMode: (mode) => set({ mode }),
      setJobId: (jobId) => set({ jobId }),
      setRawInput: (rawInput) => set({ rawInput }),
      setSpec: (spec) => set({ spec }),
      setQuestions: (questions) => set({ questions }),
      setAnswer: (id, answer) =>
        set((state) => ({
          answers: {
            ...state.answers,
            [id]: answer,
          },
        })),
      setCurrentQuestion: (currentQuestion) => set({ currentQuestion }),
      setGeneratedPreviewUrl: (generatedPreviewUrl) => set({ generatedPreviewUrl }),
      setGeneratedDownloadUrl: (generatedDownloadUrl) => set({ generatedDownloadUrl }),
      reset: () => set(initialState),
    }),
    {
      name: "v0dev-app-store",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        mode: state.mode,
        jobId: state.jobId,
        spec: state.spec,
        questions: state.questions,
        answers: state.answers,
        currentQuestion: state.currentQuestion,
        generatedPreviewUrl: state.generatedPreviewUrl,
        generatedDownloadUrl: state.generatedDownloadUrl,
      }),
    },
  ),
);
