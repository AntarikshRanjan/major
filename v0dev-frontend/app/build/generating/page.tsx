"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";

import { ProgressBar } from "@/components/ProgressBar";
import { TerminalLog } from "@/components/TerminalLog";
import { Card } from "@/components/ui/card";
import { generateWebsite } from "@/lib/api";
import { generationMessages } from "@/lib/mock-data";
import { useAppStore } from "@/lib/store";

export default function GeneratingPage() {
  const router = useRouter();
  const jobId = useAppStore((state) => state.jobId);
  const setGeneratedPreviewUrl = useAppStore((state) => state.setGeneratedPreviewUrl);
  const setGeneratedDownloadUrl = useAppStore((state) => state.setGeneratedDownloadUrl);

  const [messages, setMessages] = useState<string[]>([]);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!jobId) {
      router.replace("/");
      return;
    }

    let cancelled = false;
    const start = async () => {
      const assetPromise = generateWebsite(jobId);
      for (let index = 0; index < generationMessages.length; index += 1) {
        await new Promise((resolve) => window.setTimeout(resolve, 900));
        if (cancelled) {
          return;
        }
        setMessages((previous) => [...previous, generationMessages[index]]);
        setProgress(Math.round(((index + 1) / generationMessages.length) * 100));
      }

      const assets = await assetPromise;
      if (cancelled) {
        return;
      }
      setGeneratedPreviewUrl(assets.previewUrl);
      setGeneratedDownloadUrl(assets.downloadUrl);
      window.setTimeout(() => {
        router.push("/build/preview");
      }, 800);
    };

    void start();

    return () => {
      cancelled = true;
    };
  }, [jobId, router, setGeneratedDownloadUrl, setGeneratedPreviewUrl]);

  const pulseBars = useMemo(
    () => Array.from({ length: 8 }, (_, index) => index),
    [],
  );

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--background)] px-6 py-10 md:px-10">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-4xl"
      >
        <Card className="space-y-8 p-8 md:p-10">
          <div className="space-y-3 text-center">
            <h1 className="text-4xl font-bold tracking-tight text-white md:text-5xl">
              Building your website...
            </h1>
            <p className="text-lg leading-8 text-[var(--muted)]">
              This usually takes 30-60 seconds
            </p>
          </div>

          <div className="flex items-center justify-center py-4">
            <div className="flex items-end gap-3">
              {pulseBars.map((bar) => (
                <motion.span
                  key={bar}
                  animate={{ height: [18, 44, 24, 56, 20] }}
                  transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY, delay: bar * 0.08 }}
                  className="w-3 rounded-full bg-[var(--accent-blue)]"
                />
              ))}
            </div>
          </div>

          <TerminalLog messages={messages} />

          <ProgressBar step={progress} total={100} label="Generation progress" />
        </Card>
      </motion.div>
    </main>
  );
}
